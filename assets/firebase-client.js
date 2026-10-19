import { initializeApp } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDR17Fcn5zrCFNgij4-TQKmMVNiM1kDccc",
  authDomain: "reviews-7a447.firebaseapp.com",
  projectId: "reviews-7a447",
  storageBucket: "reviews-7a447.firebasestorage.app",
  messagingSenderId: "673426204562",
  appId: "1:673426204562:web:e96f4821467a2efb92834b"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
