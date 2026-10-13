// طبقة البيانات الحقيقية (Firestore). نفس أسماء وأشكال الدوال اللي الفرونت بيستخدمها.
//
// الهيكل في Firestore:
//   accounts/{accountId}              name, url, username, password, niche, followers, createdAt
//   accounts/{accountId}/ideas/{date} date, title, description, prompt, type, keywords, music
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  documentId,
  writeBatch,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyByjpjFaCLPla9lyxuxr7R47ZU8JEXeWQ8",
  authDomain: "dayline-118d2.firebaseapp.com",
  projectId: "dayline-118d2",
  storageBucket: "dayline-118d2.firebasestorage.app",
  messagingSenderId: "580397961252",
  appId: "1:580397961252:web:ca19fb3d21464c8f4a88b1",
  measurementId: "G-MZQ0NWKLWN",
};

const db = getFirestore(initializeApp(firebaseConfig));

const accountsCol = collection(db, "accounts");
const accountRef = (id) => doc(db, "accounts", id);
const ideasCol = (id) => collection(db, "accounts", id, "ideas");

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_RE = /^\d{4}-\d{2}$/;

// Timestamp -> milliseconds عشان الفرونت يتعامل مع أرقام عادية
function plain(snap) {
  const data = snap.data();
  for (const k of ["createdAt", "updatedAt"]) {
    if (data[k]?.toMillis) data[k] = data[k].toMillis();
  }
  return { id: snap.id, ...data };
}

/* ---------------- الحسابات ---------------- */

export async function getAccounts() {
  const snap = await getDocs(query(accountsCol, orderBy("createdAt", "asc")));
  return snap.docs.map(plain);
}

export async function addAccount(data) {
  const ref = await addDoc(accountsCol, {
    name: String(data.name ?? "").trim(),
    url: String(data.url ?? "").trim(),
    username: String(data.username ?? "").trim(),
    password: String(data.password ?? ""),
    niche: String(data.niche ?? "").trim(),
    followers: 0,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getAccount(id) {
  const snap = await getDoc(accountRef(id));
  return snap.exists() ? plain(snap) : null;
}

export async function updateFollowers(id, n) {
  const followers = Number(n);
  if (!Number.isFinite(followers) || followers < 0) throw new Error("عدد المتابعين غير صحيح");
  await updateDoc(accountRef(id), { followers, followersUpdatedAt: serverTimestamp() });
}

/* ---------------- الأفكار ---------------- */

// بيرجّع Map: التاريخ "YYYY-MM-DD" -> الفكرة، لشهر واحد (month = "YYYY-MM")
export async function getIdeas(id, month) {
  if (!MONTH_RE.test(month)) throw new Error("صيغة الشهر لازم تكون YYYY-MM");
  const q = query(
    ideasCol(id),
    where(documentId(), ">=", `${month}-01`),
    where(documentId(), "<=", `${month}-31`)
  );
  const snap = await getDocs(q);
  const map = new Map();
  snap.forEach((d) => map.set(d.id, plain(d)));
  return map;
}

function cleanIdea(idea) {
  if (!DATE_RE.test(String(idea?.date))) throw new Error("تاريخ الفكرة غير صحيح: " + idea?.date);
  return {
    date: idea.date,
    title: String(idea.title ?? "").trim(),
    description: String(idea.description ?? ""),
    prompt: String(idea.prompt ?? ""),
    type: idea.type === "video" ? "video" : "image",
    keywords: String(idea.keywords ?? ""),
    music: String(idea.music ?? ""),
    updatedAt: serverTimestamp(),
  };
}

// التاريخ هو معرّف الفكرة، فحفظ نفس اليوم تاني بيعدّل الفكرة القديمة
export async function saveIdea(id, idea) {
  const clean = cleanIdea(idea);
  await setDoc(doc(ideasCol(id), clean.date), clean);
}

// رفع كذا فكرة مرة واحدة (Firestore بيسمح بـ 500 عملية في الـ batch، فبنقسّم لـ 400)
export async function importIdeasCSV(id, rows) {
  const ideas = rows.map(cleanIdea); // أي صف غلط يوقف العملية قبل ما يتكتب أي حاجة
  for (let i = 0; i < ideas.length; i += 400) {
    const batch = writeBatch(db);
    for (const idea of ideas.slice(i, i + 400)) batch.set(doc(ideasCol(id), idea.date), idea);
    await batch.commit();
  }
  return ideas.length;
}
