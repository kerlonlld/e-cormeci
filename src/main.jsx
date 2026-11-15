import { StrictMode, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db, googleProvider, hasFirebaseConfig } from "./firebase";
import {
  assignOrderToDelivery, completeDelivery, createOrder, subscribeAdminOrders,
  subscribeClientDeliveryCodes, subscribeClientOrders, subscribeDeliveryOrders,
  subscribeIntegrators, updateOrderStatus
} from "./services/store";
import "../styles.css";
import "./checkout.css";

const products = [
  { id: 1, name: "Cesta de frutas frescas", meta: "Hortifruti · 1 unidade", price: 24.9, old: 29.9, image: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=700&q=85", promo: true },
  { id: 2, name: "Pão artesanal integral", meta: "Padaria · 500g", price: 12.5, image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=700&q=85" },
  { id: 3, name: "Café especial torrado", meta: "Mercearia · 250g", price: 18.9, old: 22.9, image: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=700&q=85", promo: true },
  { id: 4, name: "Suco de laranja natural", meta: "Bebidas · 1 litro", price: 9.9, image: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=700&q=85" },
  { id: 5, name: "Queijo minas frescal", meta: "Laticínios · 400g", price: 26.9, image: "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=700&q=85" },
  { id: 6, name: "Granola premium", meta: "Mercearia · 300g", price: 16.5, old: 19.9, image: "https://images.unsplash.com/photo-1517093728432-a0440f8d45af?auto=format&fit=crop&w=700&q=85", promo: true },
  { id: 7, name: "Ovos caipiras", meta: "Frios · 12 unidades", price: 14.9, image: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=700&q=85" },
  { id: 8, name: "Chocolate 70% cacau", meta: "Doces · 100g", price: 11.9, image: "https://images.unsplash.com/photo-1548907040-4d42fcaa2c93?auto=format&fit=crop&w=700&q=85" }
];

const categories = [
  ["Todos", "🛒"], ["Hortifruti", "🥬"], ["Padaria", "🥖"], ["Bebidas", "🥤"],
  ["Laticínios", "🧀"], ["Mercearia", "🛍️"], ["Frios", "🥚"], ["Doces", "🍫"],
];

const money = (value) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const viewPaths = {
  shop: "/", cart: "/carrinho", checkout: "/finalizar-compra",
  orders: "/pedidos", admin: "/admim", delivery: "/entregador",
};
const pathViews = {
  ...Object.fromEntries(Object.entries(viewPaths).map(([view, path]) => [path, view])),
  "/admin": "admin",
  "/entregas": "delivery",
};

function ProductCard({ product, onAdd }) {
  return <article className="product-card">
    <span className="badge">{product.promo ? "OFERTA" : "FRESCO HOJE"}</span>
    <div className="product-image"><img src={product.image} alt={product.name} /></div>
    <div className="product-info">
      <p className="product-name">{product.name}</p>
      <span className="product-meta">{product.meta}</span>
      <div className="price-row"><div><span className="price">{money(product.price)}</span>{product.old && <span className="old-price">{money(product.old)}</span>}</div><button className="add-button" onClick={() => onAdd(product.id)} aria-label={`Adicionar ${product.name}`}>+</button></div>
    </div>
  </article>;
}

function Shop({ cart, onAdd, onToast, search, user, onViewCart }) {
  const [filter, setFilter] = useState(search);
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  useEffect(() => setFilter(search), [search]);
  const filtered = products.filter((product) => {
    const matchesSearch = `${product.name} ${product.meta}`.toLowerCase().includes(filter.trim().toLowerCase());
    const matchesCategory = selectedCategory === "Todos" || product.meta.split("·")[0].trim() === selectedCategory;
    return matchesSearch && matchesCategory;
  });
  return <><div className="page-heading"><div><p>Mercado Express</p><h1>{user?.displayName ? `Olá, ${user.displayName.split(" ")[0]}` : "Bem-vindo(a)"} 👋</h1><p>Encontre tudo o que precisa, sem sair de casa.</p></div><button className="orange-button" onClick={onViewCart}>🛒 Carrinho ({cart.length})</button></div>
    <section className="hero"><div><span className="eyebrow" style={{ margin: 0, color: "var(--orange)" }}>OFERTA DA SEMANA</span><h2>Mais sabor, menos<br />preço na sua mesa.</h2><p>Produtos selecionados com até 30% de desconto.</p><button className="orange-button" onClick={() => { setSelectedCategory("Todos"); setFilter("café"); }}>Ver ofertas <b>→</b></button></div><div className="hero-art"><img src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=700&q=85" alt="Produtos frescos no mercado" /></div></section>
    <div className="section-title"><h2>Compre por categoria</h2></div><div className="categories">{categories.map(([category, icon]) => <button key={category} className={`category ${selectedCategory === category ? "active" : ""}`} aria-pressed={selectedCategory === category} onClick={() => setSelectedCategory(category)}><span>{icon}</span>{category}</button>)}</div>
    <div className="section-title"><h2>{filter ? "Resultados da busca" : selectedCategory === "Todos" ? "Mais pedidos da semana" : selectedCategory}</h2></div><div className="product-grid">{filtered.length ? filtered.map((product) => <ProductCard key={product.id} product={product} onAdd={onAdd} />) : <div className="empty" style={{ gridColumn: "1/-1" }}>Nenhum produto encontrado{selectedCategory !== "Todos" ? ` em ${selectedCategory}` : ""}.</div>}</div>
  </>;
}

function Orders({ user, lastOrder }) {
  const [orders, setOrders] = useState([]);
  const [deliveryCodes, setDeliveryCodes] = useState({});
  const [error, setError] = useState("");
  useEffect(() => subscribeClientOrders(user.uid, setOrders, (cause) => {
    console.error("Falha ao carregar pedidos do cliente:", cause);
    setError("Não foi possível carregar seus pedidos.");
  }), [user.uid]);
  useEffect(() => subscribeClientDeliveryCodes(user.uid, setDeliveryCodes, (cause) => {
    console.error("Falha ao carregar códigos de entrega:", cause);
    setError("Não foi possível carregar os códigos de confirmação.");
  }), [user.uid]);
  return <><PageHeading eyebrow="Área do cliente" title="Meus pedidos" subtitle="Acompanhe seus pedidos recentes." />{lastOrder && <div className="order-confirmation" role="status"><strong>Pedido #{lastOrder.id.slice(0, 8).toUpperCase()} recebido.</strong><span>Seu PIN de entrega é <b>{lastOrder.verificationCode}</b>. Compartilhe-o com o entregador ao receber.</span></div>}{error ? <div className="empty" role="alert">{error}</div> : orders.length ? <div className="panel"><table className="table"><thead><tr><th>PEDIDO</th><th>DATA</th><th>ITENS</th><th>TOTAL</th><th>STATUS / PIN</th></tr></thead><tbody>{orders.map((order) => {
    const status = { pending: "Recebido", preparing: "Em preparo", ready_for_delivery: "Aguardando entrega", delivering: "Em entrega", completed: "Concluído" }[order.status] || order.status;
    const date = order.createdAt?.toDate?.().toLocaleString("pt-BR") || "—";
    return <tr key={order.id}><td><strong>#{order.id.slice(0, 8).toUpperCase()}</strong></td><td>{date}</td><td>{order.items?.reduce((total, item) => total + (item.quantity || 0), 0) || 0} itens</td><td>{money(order.total || 0)}</td><td><span className={`status ${order.status === "completed" ? "green" : ""}`}>{status}</span>{deliveryCodes[order.id] && order.status !== "completed" && <div className="order-pin">PIN: <strong>{deliveryCodes[order.id]}</strong></div>}</td></tr>;
  })}</tbody></table></div> : <div className="empty">Você ainda não fez pedidos.</div>}</>;
}

function PageHeading({ eyebrow, title, subtitle, action }) {
  return <div className="page-heading"><div><p>{eyebrow}</p><h1>{title}</h1><p>{subtitle}</p></div>{action}</div>;
}

function AccessGate({ role, requiredRole, configured, onSignIn }) {
  const panelName = requiredRole === "admin" ? "Administração" : "Entregas";
  const roleName = requiredRole === "admin" ? "admin" : "integrator";
  return <div className="empty" role="status">
    <h2>{panelName}</h2>
    {!configured
      ? <p>O Firebase ainda não está configurado. Preencha as credenciais no arquivo .env.local.</p>
      : role === "guest"
        ? <><p>Entre com a conta autorizada para acessar este painel.</p><button className="orange-button" onClick={onSignIn}>Entrar com Google</button></>
        : <p>Esta área é restrita ao perfil “{roleName}”. A conta atual tem perfil “{role || "não identificado"}”.</p>}
  </div>;
}

function Cart({ items, onQuantityChange, onCheckout, onShop }) {
  const subtotal = items.reduce((total, item) => total + item.product.price * item.quantity, 0);
  return <><PageHeading eyebrow="Sua compra" title="Carrinho" subtitle="Confira os produtos antes de finalizar." />
    {!items.length ? <div className="empty">Seu carrinho está vazio.<p><button className="orange-button" onClick={onShop}>Voltar às compras</button></p></div> : <>
      <div className="panel cart-list">{items.map(({ product, quantity }) => <div className="cart-row" key={product.id}>
        <img src={product.image} alt="" /><div className="cart-product"><strong>{product.name}</strong><span>{money(product.price)} cada</span></div>
        <div className="quantity-control"><button aria-label={`Remover uma unidade de ${product.name}`} onClick={() => onQuantityChange(product.id, -1)}>−</button><span>{quantity}</span><button aria-label={`Adicionar uma unidade de ${product.name}`} onClick={() => onQuantityChange(product.id, 1)}>+</button></div>
        <strong>{money(product.price * quantity)}</strong>
      </div>)}</div>
      <div className="checkout-summary"><span>Subtotal</span><strong>{money(subtotal)}</strong><button className="orange-button" onClick={onCheckout}>Continuar para endereço</button></div>
    </>}
  </>;
}

function Checkout({ items, user, role, onSignIn, onBack, onPlaceOrder }) {
  const [address, setAddress] = useState({
    recipientName: user?.displayName || "",
    phone: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    zipCode: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const subtotal = items.reduce((total, item) => total + item.product.price * item.quantity, 0);
  const updateAddress = (event) => setAddress((current) => ({ ...current, [event.target.name]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onPlaceOrder({ address, paymentMethod, subtotal });
    } catch (cause) {
      console.error("Falha ao criar o pedido:", cause);
      setError("Não foi possível registrar o pedido. Confira sua conexão e tente novamente.");
    } finally {
      setSaving(false);
    }
  };
  if (!user) return <><PageHeading eyebrow="Finalizar compra" title="Entre para continuar" subtitle="Entre com sua conta para salvar o pedido e o endereço." /><div className="empty"><button className="orange-button" onClick={onSignIn}>Entrar com Google</button></div></>;
  if (role !== "client") return <div className="empty">Somente contas de cliente podem finalizar uma compra.</div>;
  if (!items.length) return <div className="empty">Seu carrinho está vazio.<p><button className="orange-button" onClick={onBack}>Voltar às compras</button></p></div>;
  return <><PageHeading eyebrow="Finalizar compra" title="Endereço e pagamento" subtitle="O endereço será enviado ao entregador atribuído e os dados do pedido à Administração." />
    <form className="checkout-layout" onSubmit={submit}>
      <div className="panel checkout-form">
        <h2>Endereço de entrega</h2>
        <div className="form-grid">
          <label>Nome de quem recebe<input name="recipientName" autoComplete="name" required value={address.recipientName} onChange={updateAddress} /></label>
          <label>Telefone<input name="phone" type="tel" autoComplete="tel" required value={address.phone} onChange={updateAddress} /></label>
          <label className="form-wide">Rua / avenida<input name="street" autoComplete="street-address" required value={address.street} onChange={updateAddress} /></label>
          <label>Número<input name="number" required value={address.number} onChange={updateAddress} /></label>
          <label>Complemento (opcional)<input name="complement" value={address.complement} onChange={updateAddress} /></label>
          <label>Bairro<input name="neighborhood" required value={address.neighborhood} onChange={updateAddress} /></label>
          <label>CEP<input name="zipCode" autoComplete="postal-code" required value={address.zipCode} onChange={updateAddress} /></label>
          <label>Cidade<input name="city" autoComplete="address-level2" required value={address.city} onChange={updateAddress} /></label>
          <label>Estado<input name="state" autoComplete="address-level1" maxLength="2" required value={address.state} onChange={updateAddress} /></label>
        </div>
        <h2>Pagamento na entrega</h2>
        <div className="payment-options">
          {[["pix", "PIX"], ["card", "Cartão"], ["cash", "Dinheiro"]].map(([value, label]) => <label key={value}><input type="radio" name="paymentMethod" value={value} checked={paymentMethod === value} onChange={() => setPaymentMethod(value)} />{label}</label>)}
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
      </div>
      <aside className="panel order-summary"><h2>Resumo do pedido</h2>{items.map(({ product, quantity }) => <p key={product.id}>{product.name} × {quantity}<strong>{money(product.price * quantity)}</strong></p>)}<p>Subtotal<strong>{money(subtotal)}</strong></p><p>Entrega<strong>{money(10)}</strong></p><p className="summary-total">Total<strong>{money(subtotal + 10)}</strong></p><button className="orange-button" type="submit" disabled={saving}>{saving ? "Enviando pedido..." : "Confirmar pedido"}</button></aside>
    </form>
  </>;
}

function Addresses({ onToast }) {
  return <><PageHeading eyebrow="Área do cliente" title="Meus endereços" subtitle="Gerencie seus endereços de entrega." action={<button className="orange-button" onClick={() => onToast("Cadastro de endereços ainda não configurado")}>＋ Adicionar endereço</button>} /><div className="empty">Nenhum endereço cadastrado.</div></>;
}

function Admin({ onToast }) {
  const [orders, setOrders] = useState([]);
  const [integrators, setIntegrators] = useState([]);
  const [selectedIntegrators, setSelectedIntegrators] = useState({});
  const [error, setError] = useState("");
  useEffect(() => subscribeAdminOrders(setOrders, (cause) => {
    console.error("Falha ao carregar pedidos administrativos:", cause);
    setError("Não foi possível carregar os pedidos.");
  }), []);
  useEffect(() => subscribeIntegrators(setIntegrators, (cause) => {
    console.error("Falha ao carregar entregadores:", cause);
    setError("Não foi possível carregar a lista de entregadores.");
  }), []);
  const totalSales = orders.reduce((sum, order) => sum + (order.total || 0), 0);
  const avgOrder = orders.length ? totalSales / orders.length : 0;
  const activeDeliveries = orders.filter((order) => ["ready_for_delivery", "delivering"].includes(order.status)).length;
  const changeOrderStatus = async (orderId, status) => {
    try {
      await updateOrderStatus(orderId, status);
      onToast("Pedido atualizado.");
    } catch (cause) {
      console.error("Falha ao atualizar pedido:", cause);
      onToast("Não foi possível atualizar o pedido.");
    }
  };
  const assignOrder = async (orderId) => {
    const uid = selectedIntegrators[orderId];
    if (!uid) {
      onToast("Selecione um entregador.");
      return;
    }
    try {
      await assignOrderToDelivery(orderId, uid);
      onToast("Pedido enviado ao entregador.");
    } catch (cause) {
      console.error("Falha ao atribuir pedido:", cause);
      onToast("Não foi possível atribuir o pedido.");
    }
  };
  return <><PageHeading eyebrow="Painel administrativo" title="Visão geral" subtitle="Gerencie sua operação em um só lugar." action={<button className="orange-button" onClick={() => onToast("Cadastro de produtos ainda não configurado")}>＋ Novo produto</button>} /><div className="stats">{[["Vendas registradas", money(totalSales)], ["Pedidos", String(orders.length)], ["Ticket médio", money(avgOrder)], ["Em entrega", String(activeDeliveries)]].map(([label, value]) => <div className="stat-card" key={label}><small>{label}</small><strong>{value}</strong></div>)}</div><div className="panel"><div className="section-title"><h2>Pedidos</h2></div>{error ? <div role="alert">{error}</div> : orders.length ? <table className="table"><thead><tr><th>PEDIDO / PRODUTOS</th><th>CLIENTE / ENTREGA</th><th>TOTAL / PAGAMENTO</th><th>STATUS / AÇÃO</th><th>DATA</th></tr></thead><tbody>{orders.map((order) => {
    const status = { pending: "Recebido", preparing: "Em preparo", ready_for_delivery: "Aguardando entrega", delivering: "Em entrega", completed: "Concluído" }[order.status] || order.status;
    const date = order.createdAt?.toDate?.().toLocaleString("pt-BR") || "—";
    const integrator = integrators.find((item) => item.id === order.assignedTo);
    return <tr key={order.id}>
      <td><strong>#{order.id.slice(0, 8).toUpperCase()}</strong><div className="order-detail">{order.items?.map((item) => `${item.name} × ${item.quantity}`).join(", ")}</div></td>
      <td><strong>{order.clientName}</strong><div className="order-detail">{order.clientPhone} · {order.clientEmail}</div><div className="order-detail">{order.deliveryAddress}</div></td>
      <td>{money(order.total || 0)}<div className="order-detail">Pagamento na entrega: {{ cash: "Dinheiro", pix: "PIX", card: "Cartão" }[order.paymentMethod] || "—"}</div></td>
      <td><span className={`status ${order.status === "completed" ? "green" : ""}`}>{status}</span>
        {order.status === "pending" && <button className="small-action" onClick={() => changeOrderStatus(order.id, "preparing")}>Confirmar pedido</button>}
        {order.status === "preparing" && <div className="assign-controls"><select aria-label="Selecionar entregador" value={selectedIntegrators[order.id] || ""} onChange={(event) => setSelectedIntegrators((current) => ({ ...current, [order.id]: event.target.value }))}><option value="">Entregador...</option>{integrators.map((item) => <option key={item.id} value={item.id}>{item.displayName || item.email || item.id}</option>)}</select><button className="small-action" disabled={!integrators.length} onClick={() => assignOrder(order.id)}>Enviar</button></div>}
        {order.assignedTo && <div className="order-detail">Entregador: {integrator?.displayName || integrator?.email || order.assignedTo}</div>}
      </td><td>{date}</td>
    </tr>;
  })}</tbody></table> : <div className="empty">Nenhum pedido registrado.</div>}</div></>;
}

function Delivery({ onToast, user }) {
  const [deliveries, setDeliveries] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => subscribeDeliveryOrders(user.uid, setDeliveries, (cause) => {
    console.error("Falha ao carregar entregas atribuídas:", cause);
    setError("Não foi possível carregar suas entregas.");
  }), [user.uid]);
  const handleDeliveryAction = async (order, code) => {
    try {
      if (order.status === "ready_for_delivery") {
        await updateOrderStatus(order.id, "delivering");
        onToast("Entrega iniciada.");
      } else {
        await completeDelivery(order.id, code);
        onToast("Entrega confirmada.");
      }
    } catch (cause) {
      console.error("Falha ao atualizar a entrega:", cause);
      onToast("Não foi possível atualizar a entrega. Verifique o status e o código.");
    }
  };
  return <><PageHeading eyebrow="Painel do entregador" title="Fila de entregas" subtitle={`Olá, ${user.displayName || "entregador"}. Você tem ${deliveries.length} entrega(s) pendente(s).`} action={<span className="status green">● Online</span>} />{error ? <div className="empty" role="alert">{error}</div> : deliveries.length ? deliveries.map((order) => <DeliveryCard key={order.id} order={order} onAction={(code) => handleDeliveryAction(order, code)} />) : <div className="empty">Nenhuma entrega atribuída.</div>}</>;
}

function DeliveryCard({ order, onAction }) {
  const [enteredPin, setEnteredPin] = useState("");
  const isReady = order.status === "ready_for_delivery";
  return <div className="delivery-card"><div className="order-icon">🛍️</div><div><h3>#{order.id.slice(0, 8).toUpperCase()} · {order.clientName || "Cliente"}</h3><p>⌖ {order.deliveryAddress}</p><p>☎ {order.clientPhone}</p><p style={{ marginTop: 6 }}>{order.items?.reduce((total, item) => total + item.quantity, 0) || 0} itens · {money(order.total || 0)}</p></div><div className="delivery-actions">{isReady ? <button className="orange-button" onClick={() => onAction("")}>Iniciar entrega</button> : <><input className="pin-input" maxLength="4" inputMode="numeric" placeholder="PIN" value={enteredPin} onChange={(e) => setEnteredPin(e.target.value.replace(/\D/g, ""))} aria-label="PIN de entrega" /><button className="orange-button" onClick={() => onAction(enteredPin)}>Confirmar</button></>}</div></div>;
}

function App() {
  const [view, setView] = useState(() => pathViews[window.location.pathname] || "shop");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem("express-cart") || "[]"));
  const [lastOrder, setLastOrder] = useState(null);
  const [message, setMessage] = useState("");
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(auth ? null : "guest");
  const [authReady, setAuthReady] = useState(!auth || !db);
  const onToast = (text) => { setMessage(text); window.setTimeout(() => setMessage(""), 2600); };
  const saveCart = (next) => {
    setCart(next);
    localStorage.setItem("express-cart", JSON.stringify(next));
  };
  const addToCart = (id) => { saveCart([...cart, id]); onToast("Produto adicionado ao carrinho"); };
  const changeCartQuantity = (id, amount) => {
    if (amount > 0) {
      saveCart([...cart, id]);
      return;
    }
    const index = cart.indexOf(id);
    if (index >= 0) saveCart(cart.filter((_, itemIndex) => itemIndex !== index));
  };
  const cartItems = useMemo(() => {
    const quantities = cart.reduce((result, id) => ({ ...result, [id]: (result[id] || 0) + 1 }), {});
    return Object.entries(quantities).map(([id, quantity]) => ({
      product: products.find((item) => item.id === Number(id)),
      quantity,
    })).filter((item) => item.product);
  }, [cart]);
  useEffect(() => {
    if (!auth || !db) return undefined;
    let activeUid = null;
    return onAuthStateChanged(auth, (currentUser) => {
      activeUid = currentUser?.uid || null;
      setUser(currentUser);
      if (!currentUser) {
        setRole("guest");
        setAuthReady(true);
        return;
      }
      setAuthReady(false);
      void (async () => {
        const profileRef = doc(db, "users", currentUser.uid);
        let profile = await getDoc(profileRef);
        if (!profile.exists()) {
          await setDoc(profileRef, {
            role: "client",
            displayName: currentUser.displayName || "",
            email: currentUser.email || "",
          });
          profile = await getDoc(profileRef);
        }
        if (activeUid !== currentUser.uid) return;
        setRole(profile.data()?.role || null);
      })().catch((error) => {
        if (activeUid !== currentUser.uid) return;
        console.error("Falha ao carregar o perfil de acesso:", error);
        setRole(null);
        onToast("Não foi possível verificar seu perfil de acesso.");
      }).finally(() => {
        if (activeUid === currentUser.uid) setAuthReady(true);
      });
    });
  }, []);
  const handleSignIn = async () => {
    if (!auth) return;
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Falha ao entrar com Google:", error);
      onToast("Não foi possível entrar. Tente novamente.");
    }
  };
  const handleSignOut = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      setView("shop");
    } catch (error) {
      console.error("Falha ao sair da conta:", error);
      onToast("Não foi possível sair da conta.");
    }
  };
  const placeOrder = async ({ address, paymentMethod, subtotal }) => {
    if (!user || role !== "client") throw new Error("É necessário entrar com uma conta de cliente.");
    const orderItems = cartItems.map(({ product, quantity }) => ({ ...product, quantity }));
    const order = await createOrder({ user, items: orderItems, address, paymentMethod, subtotal });
    saveCart([]);
    setLastOrder(order);
    navigateTo("orders");
    onToast(`Pedido criado. Informe o PIN ${order.verificationCode} ao entregador.`);
  };
  const availableViews = role === "admin"
    ? ["shop", "cart", "checkout", "admin"]
    : role === "integrator"
      ? ["shop", "cart", "checkout", "delivery"]
      : role === "client"
        ? ["shop", "cart", "checkout", "orders"]
        : ["shop", "cart", "checkout"];
  const navigateTo = (nextView) => {
    if (!availableViews.includes(nextView)) {
      onToast("Você não tem permissão para acessar esta área.");
      return;
    }
    const path = viewPaths[nextView] || "/";
    if (window.location.pathname !== path) window.history.pushState({}, "", path);
    setView(nextView);
  };
  useEffect(() => {
    const handlePopState = () => setView(pathViews[window.location.pathname] || "shop");
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);
  useEffect(() => { if (view === "shop") document.title = "Mercado Express"; }, [view]);
  const content = useMemo(() => {
    if (!availableViews.includes(view)) {
      if (view === "admin" || view === "delivery") {
        return <AccessGate
          role={role}
          requiredRole={view === "admin" ? "admin" : "integrator"}
          configured={hasFirebaseConfig}
          onSignIn={handleSignIn}
        />;
      }
      return <div className="empty">Acesso não autorizado.</div>;
    }
    return {
      shop: <Shop cart={cart} onAdd={addToCart} onToast={onToast} search={search} user={user} onViewCart={() => navigateTo("cart")} />,
      cart: <Cart items={cartItems} onQuantityChange={changeCartQuantity} onCheckout={() => navigateTo("checkout")} onShop={() => navigateTo("shop")} />,
      checkout: <Checkout items={cartItems} user={user} role={role} onSignIn={handleSignIn} onBack={() => navigateTo("cart")} onPlaceOrder={placeOrder} />,
      orders: <Orders user={user} lastOrder={lastOrder} />,
      addresses: <Addresses onToast={onToast} />,
      admin: <Admin onToast={onToast} />,
      delivery: <Delivery onToast={onToast} user={user} />,
      favorites: <div className="empty">Você ainda não adicionou favoritos.</div>,
    }[view];
  }, [view, cart, cartItems, search, role, user, lastOrder]);
  const customerItems = [["shop", "▦", "Comprar"], ["cart", "🛒", `Carrinho (${cart.length})`]];
  if (role === "client") customerItems.push(["orders", "◷", "Meus pedidos"]);
  const roleItems = role === "admin"
    ? [["admin", "▤", "Administração"]]
    : role === "integrator"
      ? [["delivery", "♧", "Entregas"]]
      : [];
  return <><header className="topbar"><button className="brand" onClick={() => navigateTo("shop")}><span className="brand-mark">↗</span><span>mercado<span>express</span></span></button><label className="search"><span>⌕</span><input type="search" placeholder="O que você está procurando?" value={search} onChange={(e) => { setSearch(e.target.value); navigateTo("shop"); }} /></label><div className="top-actions">{user ? <><span className="profile-name">Olá, {user.displayName || user.email}</span><button className="outline-button" onClick={handleSignOut}>Sair</button></> : <button className="orange-button" disabled={!hasFirebaseConfig || !authReady} onClick={handleSignIn} title={!hasFirebaseConfig ? "Configure o Firebase para habilitar o acesso" : ""}>Entrar</button>}</div></header><div className="layout"><aside className="sidebar"><p className="eyebrow">MENU PRINCIPAL</p><NavGroup view={view} setView={navigateTo} items={customerItems} />{roleItems.length > 0 && <><p className="eyebrow workspace-label">{role === "admin" ? "ADMINISTRAÇÃO" : "ENTREGAS"}</p><NavGroup view={view} setView={navigateTo} items={roleItems} /></>}<div className="sidebar-help"><strong>Precisa de ajuda?</strong><span>Fale com nosso suporte<br />todos os dias.</span><button onClick={() => onToast("Suporte online em breve")}>Conversar com suporte <b>→</b></button></div><div className="sidebar-footer"><span>© 2024 Mercado Express</span><span>Termos · Privacidade</span></div></aside><main>{authReady ? content : <div className="empty">Verificando seu acesso…</div>}</main></div><div className={`toast ${message ? "show" : ""}`} role="status">{message}</div></>;
}

function NavGroup({ items, view, setView }) {
  return <nav>{items.map(([id, icon, label]) => <button key={id} className={`nav-item ${view === id ? "active" : ""}`} onClick={() => setView(id)}><span>{icon}</span>{label}</button>)}</nav>;
}

createRoot(document.getElementById("root")).render(<StrictMode><App /></StrictMode>);
