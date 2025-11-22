
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCKR2KyLhJoB_qdMBpoJN5raBWDCRDEonE",
  authDomain: "earning-7bc45.firebaseapp.com",
  databaseURL: "https://earning-7bc45-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "earning-7bc45",
  storageBucket: "earning-7bc45.firebasestorage.app",
  messagingSenderId: "94413359022",
  appId: "1:94413359022:web:db5b84117334175c7f2a3f"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
