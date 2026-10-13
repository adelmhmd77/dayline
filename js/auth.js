// تهيئة Firebase + تسجيل الدخول. مفيش حد يستورد من Firebase مباشرة غير الملف ده.
// بنستخدم روابط الـ CDN لأن المشروع من غير bundler (HTML عادي).
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyByjpjFaCLPla9lyxuxr7R47ZU8JEXeWQ8",
  authDomain: "dayline-118d2.firebaseapp.com",
  projectId: "dayline-118d2",
  storageBucket: "dayline-118d2.firebasestorage.app",
  messagingSenderId: "580397961252",
  appId: "1:580397961252:web:ca19fb3d21464c8f4a88b1",
  measurementId: "G-MZQ0NWKLWN",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// بيرجّع المستخدم الحالي (أو null) بعد ما Firebase يخلص يقرا الجلسة المحفوظة.
export function waitForUser() {
  return new Promise((resolve) => {
    const off = onAuthStateChanged(auth, (user) => {
      off();
      resolve(user);
    });
  });
}

export const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
export const register = (email, password) => createUserWithEmailAndPassword(auth, email, password);

export async function logout() {
  await signOut(auth);
  location.href = "login.html";
}
