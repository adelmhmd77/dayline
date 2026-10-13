import { login, register, waitForUser } from "./auth.js";

const $ = (id) => document.getElementById(id);
let mode = "login"; // "login" | "register"

// لو مسجّل دخول بالفعل، روح للهوم على طول
if (await waitForUser()) location.replace("index.html");

const messages = {
  "auth/invalid-credential": "الإيميل أو كلمة المرور غلط.",
  "auth/invalid-email": "الإيميل غير صحيح.",
  "auth/email-already-in-use": "الإيميل ده مسجّل قبل كده.",
  "auth/weak-password": "كلمة المرور ضعيفة، لازم 6 حروف على الأقل.",
  "auth/too-many-requests": "محاولات كتير، استنى شوية وجرّب تاني.",
  "auth/network-request-failed": "مفيش اتصال بالإنترنت.",
  "auth/operation-not-allowed": "تسجيل الدخول بالإيميل مش مفعّل في Firebase Console.",
};

$("switchBtn").addEventListener("click", () => {
  mode = mode === "login" ? "register" : "login";
  $("submitBtn").textContent = mode === "login" ? "دخول" : "إنشاء حساب";
  $("switchBtn").textContent = mode === "login" ? "إنشاء حساب جديد" : "عندي حساب بالفعل";
  $("password").autocomplete = mode === "login" ? "current-password" : "new-password";
  $("loginError").textContent = "";
});

$("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = $("email").value.trim();
  const password = $("password").value;
  if (!email || !password) {
    $("loginError").textContent = "اكتب الإيميل وكلمة المرور.";
    return;
  }
  $("submitBtn").disabled = true;
  $("loginError").textContent = "";
  try {
    await (mode === "login" ? login(email, password) : register(email, password));
    location.replace("index.html");
  } catch (err) {
    console.error(err);
    $("loginError").textContent = messages[err.code] || "حصلت مشكلة، جرّب تاني.";
    $("submitBtn").disabled = false;
  }
});
