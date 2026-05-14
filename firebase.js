import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAzLjPbJsMdKWj0kctPXioVQPFYcDR46-g",
  authDomain: "mobil-soru.firebaseapp.com",
  projectId: "mobil-soru",
  storageBucket: "mobil-soru.firebasestorage.app",
  messagingSenderId: "844021041289",
  appId: "1:844021041289:web:92955c8f24fa606f729e58"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
