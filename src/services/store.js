import {
  addDoc, collection, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc,
  where, writeBatch
} from "firebase/firestore";
import { db } from "../firebase";

const requireDb = () => {
  if (!db) throw new Error("Firebase não configurado. Copie .env.example para .env.local e preencha as credenciais.");
  return db;
};

export function subscribeProducts(setProducts, setError) {
  const productsQuery = query(collection(requireDb(), "products"), orderBy("name"));
  return onSnapshot(productsQuery, (snapshot) => {
    setProducts(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
  }, setError);
}

export function subscribeClientOrders(uid, setOrders, setError) {
  const ordersQuery = query(collection(requireDb(), "orders"), where("clientId", "==", uid), orderBy("createdAt", "desc"));
  return onSnapshot(ordersQuery, (snapshot) => {
    setOrders(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
  }, setError);
}

export function subscribeClientDeliveryCodes(uid, setCodes, setError) {
  const codesQuery = query(collection(requireDb(), "deliveryCodes"), where("clientId", "==", uid));
  return onSnapshot(codesQuery, (snapshot) => {
    setCodes(Object.fromEntries(snapshot.docs.map((item) => [item.id, item.data().code])));
  }, setError);
}

export function subscribeIntegrators(setIntegrators, setError) {
  const integratorsQuery = query(collection(requireDb(), "users"), where("role", "==", "integrator"));
  return onSnapshot(integratorsQuery, (snapshot) => {
    setIntegrators(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
  }, setError);
}

export function subscribeDeliveryOrders(uid, setOrders, setError) {
  const ordersQuery = query(
    collection(requireDb(), "orders"),
    where("assignedTo", "==", uid),
    where("status", "in", ["ready_for_delivery", "delivering"]),
    orderBy("createdAt", "asc")
  );
  return onSnapshot(ordersQuery, (snapshot) => {
    setOrders(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
  }, setError);
}

export function subscribeAdminOrders(setOrders, setError) {
  const ordersQuery = query(collection(requireDb(), "orders"), orderBy("createdAt", "desc"));
  return onSnapshot(ordersQuery, (snapshot) => {
    setOrders(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
  }, setError);
}

export async function createOrder({ user, items, address, paymentMethod, subtotal, shippingFee = 10 }) {
  const firestore = requireDb();
  const orderRef = doc(collection(firestore, "orders"));
  const codeRef = doc(firestore, "deliveryCodes", orderRef.id);
  const randomValues = new Uint32Array(1);
  crypto.getRandomValues(randomValues);
  const verificationCode = String(1000 + (randomValues[0] % 9000));
  const deliveryAddress = [
    `${address.street}, ${address.number}`,
    address.complement,
    address.neighborhood,
    `${address.city}, ${address.state} ${address.zipCode}`,
  ].filter(Boolean).join(" · ");
  const batch = writeBatch(firestore);
  batch.set(orderRef, {
    clientId: user.uid,
    clientName: address.recipientName,
    clientEmail: user.email || "",
    clientPhone: address.phone,
    items: items.map(({ id, name, price, quantity, image }) => ({ productId: id, name, price, quantity, image })),
    addressDetails: address,
    deliveryAddress,
    paymentMethod,
    subtotal,
    shippingFee,
    total: subtotal + shippingFee,
    status: "pending",
    createdAt: serverTimestamp(),
  });
  batch.set(codeRef, { clientId: user.uid, code: verificationCode });
  await batch.commit();
  return { id: orderRef.id, verificationCode };
}

export function updateOrderStatus(orderId, status) {
  return updateDoc(doc(requireDb(), "orders", orderId), { status, updatedAt: serverTimestamp() });
}

export function assignOrderToDelivery(orderId, uid) {
  return updateDoc(doc(requireDb(), "orders", orderId), {
    assignedTo: uid,
    status: "ready_for_delivery",
    updatedAt: serverTimestamp(),
  });
}

export function completeDelivery(orderId, enteredCode) {
  return updateDoc(doc(requireDb(), "orders", orderId), {
    status: "completed",
    completedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    deliveryCodeValidated: enteredCode,
  });
}
