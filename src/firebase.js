// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // ✅ أضف هذا

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAiCeslxRZUDcebC_uUwXCcbBrrjpaJiaU",
  authDomain: "baddel-li.firebaseapp.com",
  projectId: "baddel-li",
  storageBucket: "baddel-li.firebasestorage.app",
  messagingSenderId: "540588126330",
  appId: "1:540588126330:web:349073d639c672efd00bc3",
  measurementId: "G-PQP0LFXPKK",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app); // ✅ صدّر storage
