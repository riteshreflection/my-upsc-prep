// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAOVGpH8tXJf1kgZ_0RLA9KnkaPichGmT8",
  authDomain: "the-campus-web.firebaseapp.com",
  projectId: "the-campus-web",
  storageBucket: "the-campus-web.firebasestorage.app",
  messagingSenderId: "598884422911",
  appId: "1:598884422911:web:ca241968647813fde4e8ca",
  databaseURL: "https://the-campus-web-default-rtdb.asia-southeast1.firebasedatabase.app/"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const db = getDatabase(app);

export default app; 