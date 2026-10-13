// الشخص 2: صفحة الحساب
// الدوال المتاحة من firebase.js:
// getAccount(id), updateFollowers(id, n), getIdeas(id, "YYYY-MM"),
// saveIdea(id, idea), importIdeasCSV(id, rows)
import {
  getAccount,
  updateFollowers,
  getIdeas,
  saveIdea,
  importIdeasCSV,
} from "./firebase.js";

const accountId = new URLSearchParams(location.search).get("id");
if (!accountId) location.href = "index.html";

// TODO 2.1: كارت بيانات الحساب + الفولورز
// TODO 2.2: جدول الشهر (التقويم)
// TODO 2.3: مودال تفاصيل اليوم
// TODO 2.4: رفع CSV
