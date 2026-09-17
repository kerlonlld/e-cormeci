import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAZPOEqoUOKztz5XQz3ElFOhirfTWk6f_4',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'e-cormeci-83c59.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'e-cormeci-83c59',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'e-cormeci-83c59.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '478057417488',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:478057417488:web:d0292f1f04c69a384db395',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-ZHW6G7JV2T',
}

const firebaseApp = initializeApp(firebaseConfig)
export const auth = getAuth(firebaseApp)
