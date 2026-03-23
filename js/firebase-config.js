// ============================================================
// NUTS SHOP – Firebase Configuration
// Replace the values below with your own Firebase project config
// Firebase Console → Project Settings → Your apps → SDK setup
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyAJYFlveeju-QT8Xw03-J5usOQkJs-PNjg",
  authDomain: "cvx-student.firebaseapp.com",
  databaseURL: "https://cvx-student-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "cvx-student",
  storageBucket: "cvx-student.firebasestorage.app",
  messagingSenderId: "735872444918",
  appId: "1:735872444918:web:0e4532e4dd4f2db863ffd7",
  measurementId: "G-VV82QGK6BL"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// ============================================================
// Razorpay Test Key – replace with your live key for production
// ============================================================
export const RAZORPAY_KEY = "rzp_test_YourKeyHere";

// ============================================================
// Shop settings defaults
// ============================================================
export const SHOP_NAME = "NutriNuts – Premium Dry Fruits";
export const SHOP_WHATSAPP = "919999999999"; // country code + number
