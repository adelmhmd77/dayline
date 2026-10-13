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

/* ---------- helpers ---------- */
const $ = (id) => document.getElementById(id);
const pad = (n) => String(n).padStart(2, "0");
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

const accountId = new URLSearchParams(location.search).get("id");

// رابط الـ Cloud Function اللي بتجيب الفولورز (انظر functions/index.js). فاضي = الزرار مقفول.
const FOLLOWERS_ENDPOINT = "";

let account = null;
let year = new Date().getFullYear();
let month = new Date().getMonth(); // 0-11
let ideasMap = new Map();
let currentDate = null;
let currentIdea = null;
let loadToken = 0;

/* ---------- toast + copy ---------- */
let toastTimer;
function showToast(msg = "تم النسخ") {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 1800);
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }
  showToast("تم النسخ");
}

/* ---------- generic modal ---------- */
function openModal(id) {
  const m = $(id);
  m.classList.add("open");
  m.setAttribute("aria-hidden", "false");
}
function closeModal(id) {
  const m = $(id);
  m.classList.remove("open");
  m.setAttribute("aria-hidden", "true");
}
document.querySelectorAll(".modal-backdrop").forEach((m) => {
  m.addEventListener("click", (e) => {
    if (e.target === m || e.target.closest("[data-close]")) closeModal(m.id);
  });
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") document.querySelectorAll(".modal-backdrop.open").forEach((m) => closeModal(m.id));
});

/* =========================================================
   2.1 بيانات الحساب
   ========================================================= */
function showProblem(msg) {
  $("accountInfo").innerHTML = `<p class="csv-errors">${esc(msg)}</p>`;
  $("calendar").classList.add("hidden");
  $("uploadCsvBtn").classList.add("hidden");
}

// مؤقتاً: يسمح بفتح الصفحة من غير id أثناء التطوير. اقفلها (false) قبل التسليم.
const DEV_ALLOW_NO_ID = true;

async function loadAccount() {
  if (!accountId) {
    if (DEV_ALLOW_NO_ID) return true; // يكمل ويعرض التقويم من غير بيانات حساب
    showProblem("مفيش id في الرابط.");
    return false;
  }
  try {
    account = await getAccount(accountId);
  } catch (err) {
    console.error(err);
    showProblem("حصلت مشكلة وأنا بحمّل الحساب.");
    return false;
  }
  if (!account) {
    showProblem("الحساب ده مش موجود.");
    return false;
  }

  $("accName").textContent = account.name ?? "—";
  const link = $("accLink");
  link.textContent = account.url ?? "—";
  link.href = account.url || "#";
  $("accUser").textContent = account.username ?? "—";
  $("accNiche").textContent = account.niche ?? "—";
  $("accFollowers").textContent = Number(account.followers ?? 0).toLocaleString("en-US");
  return true;
}

function setupPassword() {
  let shown = false;
  const el = $("accPass");
  $("togglePassBtn").addEventListener("click", () => {
    shown = !shown;
    el.textContent = shown ? (account?.password ?? "") : "••••••";
  });
  $("copyPassBtn").addEventListener("click", () => {
    if (account?.password) copyText(account.password);
  });
}

function setupFollowers() {
  const editBox = $("followersEdit");
  const input = $("followersInput");

  $("editFollowersBtn").addEventListener("click", () => {
    input.value = Number(account?.followers ?? 0);
    editBox.classList.remove("hidden");
    input.focus();
  });
  $("cancelFollowersBtn").addEventListener("click", () => editBox.classList.add("hidden"));

  // تحديث الفولورز من انستجرام عن طريق الـ Cloud Function
  $("refreshFollowersBtn").addEventListener("click", async () => {
    if (!FOLLOWERS_ENDPOINT) {
      showToast("حط رابط الـ Cloud Function في FOLLOWERS_ENDPOINT");
      return;
    }
    const username = String(account?.username ?? "").replace(/^@/, "").trim();
    if (!username) {
      showToast("اسم المستخدم مفقود");
      return;
    }
    const btn = $("refreshFollowersBtn");
    btn.disabled = true;
    try {
      const res = await fetch(`${FOLLOWERS_ENDPOINT}?username=${encodeURIComponent(username)}`);
      const data = await res.json();
      if (!res.ok || typeof data.followers !== "number") {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      await updateFollowers(accountId, data.followers);
      account.followers = data.followers;
      $("accFollowers").textContent = data.followers.toLocaleString("en-US");
      $("followersMeta").textContent = `آخر تحديث: ${new Date().toLocaleString("ar-EG")}`;
      showToast("تم تحديث المتابعين");
    } catch (err) {
      console.error(err);
      showToast("فشل التحديث من انستجرام");
    } finally {
      btn.disabled = false;
    }
  });

  $("saveFollowersBtn").addEventListener("click", async () => {
    const n = Number(input.value);
    if (!Number.isFinite(n) || n < 0 || input.value === "") {
      showToast("اكتب رقم صحيح");
      return;
    }
    try {
      await updateFollowers(accountId, n);
      account.followers = n;
      $("accFollowers").textContent = n.toLocaleString("en-US");
      editBox.classList.add("hidden");
      showToast("تم الحفظ");
    } catch (err) {
      console.error(err);
      showToast("فشل الحفظ");
    }
  });
}

/* =========================================================
   2.2 جدول الشهر
   ========================================================= */
function drawGrid() {
  const key = `${year}-${pad(month + 1)}`;
  const firstDay = new Date(year, month, 1).getDay(); // 0 = الأحد
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const now = new Date();
  const todayKey = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  $("calTitle").textContent = `${monthNames[month]} ${year}`;

  let html = "";
  for (let i = 0; i < firstDay; i++) html += `<div class="day empty"></div>`;

  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${key}-${pad(d)}`;
    const idea = ideasMap.get(date);
    const cls = ["day", idea && "filled", date === todayKey && "today"].filter(Boolean).join(" ");
    const short = idea ? String(idea.title || "").trim().split(/\s+/).slice(0, 2).join(" ") : "";
    const icon = idea ? (idea.type === "video" ? "🎬" : "🖼️") : "";
    html += `<div class="${cls}" data-date="${date}">
      <span class="num">${d}</span>
      ${idea ? `<small>${esc(short)} ${icon}</small>` : ""}
    </div>`;
  }
  $("calGrid").innerHTML = html;
}

async function loadMonth() {
  const token = ++loadToken;
  const key = `${year}-${pad(month + 1)}`;
  let result;
  try {
    result = await getIdeas(accountId, key);
  } catch (err) {
    console.error(err);
    result = new Map();
    showToast("فشل تحميل الأفكار");
  }
  if (token !== loadToken) return; // المستخدم غيّر الشهر في الأثناء
  ideasMap = result instanceof Map ? result : new Map(Object.entries(result || {}));
  drawGrid();
}

function changeMonth(delta) {
  month += delta;
  if (month < 0) { month = 11; year--; }
  if (month > 11) { month = 0; year++; }
  loadMonth();
}

function setupCalendar() {
  $("prevMonth").addEventListener("click", () => changeMonth(-1));
  $("nextMonth").addEventListener("click", () => changeMonth(1));
  $("calGrid").addEventListener("click", (e) => {
    const cell = e.target.closest(".day[data-date]");
    if (cell) openDayModal(cell.dataset.date);
  });
}

/* =========================================================
   2.3 مودال تفاصيل اليوم
   ========================================================= */
function parseKeywords(k) {
  if (Array.isArray(k)) return k.map((x) => String(x).trim()).filter(Boolean);
  return String(k ?? "").split(/[,،]/).map((x) => x.trim()).filter(Boolean);
}

function openDayModal(date) {
  currentDate = date;
  currentIdea = ideasMap.get(date) || null;
  if (currentIdea) showView();
  else showForm();
  openModal("dayModal");
}

function showView() {
  const idea = currentIdea;
  $("dayView").classList.remove("hidden");
  $("dayForm").classList.add("hidden");

  $("dayModalTitle").textContent = idea.title || "";
  $("viewDate").textContent = currentDate;
  $("viewDescription").textContent = idea.description || "—";
  $("viewPrompt").textContent = idea.prompt || "—";
  $("viewType").textContent = idea.type === "video" ? "فيديو 🎬" : "صورة 🖼️";

  const isVideo = idea.type === "video";
  $("videoSection").classList.toggle("hidden", !isVideo);
  if (isVideo) {
    const tags = parseKeywords(idea.keywords);
    $("viewKeywords").innerHTML = tags.length
      ? tags.map((t) => `<span class="tag">${esc(t)}</span>`).join("")
      : "—";
    $("viewMusic").textContent = idea.music || "—";
  }
}

function toggleVideoFields() {
  $("formVideoFields").classList.toggle("hidden", $("formType").value !== "video");
}

function showForm() {
  const idea = currentIdea;
  $("dayView").classList.add("hidden");
  $("dayForm").classList.remove("hidden");

  $("formHeading").textContent = idea ? "تعديل الفكرة" : "إضافة فكرة";
  $("formDate").value = currentDate;
  $("formTitle").value = idea?.title ?? "";
  $("formDescription").value = idea?.description ?? "";
  $("formPrompt").value = idea?.prompt ?? "";
  $("formType").value = idea?.type === "video" ? "video" : "image";
  $("formKeywords").value = parseKeywords(idea?.keywords).join(", ");
  $("formMusic").value = idea?.music ?? "";
  $("formError").textContent = "";
  toggleVideoFields();
}

function setupDayModal() {
  $("copyPromptBtn").addEventListener("click", () => {
    if (currentIdea?.prompt) copyText(currentIdea.prompt);
  });
  $("editIdeaBtn").addEventListener("click", showForm);
  $("formType").addEventListener("change", toggleVideoFields);

  $("cancelFormBtn").addEventListener("click", () => {
    if (currentIdea) showView();
    else closeModal("dayModal");
  });

  $("dayForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = $("formTitle").value.trim();
    const date = $("formDate").value;
    const type = $("formType").value;

    if (!title) { $("formError").textContent = "اسم الفكرة مطلوب."; return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { $("formError").textContent = "التاريخ غير صحيح."; return; }
    if (type !== "image" && type !== "video") { $("formError").textContent = "اختار نوع المحتوى."; return; }

    const idea = {
      date,
      title,
      description: $("formDescription").value.trim(),
      prompt: $("formPrompt").value.trim(),
      type,
      keywords: type === "video" ? parseKeywords($("formKeywords").value).join(", ") : "",
      music: type === "video" ? $("formMusic").value.trim() : "",
    };

    try {
      await saveIdea(accountId, idea);
    } catch (err) {
      console.error(err);
      $("formError").textContent = "فشل الحفظ، جرّب تاني.";
      return;
    }
    ideasMap.set(date, idea);
    currentIdea = idea;
    drawGrid();
    showView();
    showToast("تم الحفظ");
  });
}

/* =========================================================
   2.4 رفع CSV
   ========================================================= */
const CSV_COLUMNS = ["date", "title", "description", "prompt", "type", "keywords", "music"];
let csvRows = [];

function isRealDate(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

function validateRow(row) {
  const errors = [];
  if (!row.date) errors.push("التاريخ مفقود");
  else if (!/^\d{4}-\d{2}-\d{2}$/.test(row.date)) errors.push("صيغة التاريخ لازم تكون YYYY-MM-DD");
  else if (!isRealDate(row.date)) errors.push("التاريخ ده مش موجود في التقويم");
  if (!row.title) errors.push("العنوان مفقود");
  if (row.type !== "image" && row.type !== "video") errors.push("النوع لازم يكون image أو video");
  return errors;
}

function normalizeRow(raw) {
  const row = {};
  CSV_COLUMNS.forEach((c) => (row[c] = String(raw[c] ?? "").trim()));
  row.type = row.type.toLowerCase();
  return row;
}

function resetCsvModal() {
  csvRows = [];
  $("csvFileInput").value = "";
  $("csvPreview").classList.add("hidden");
  $("csvPreviewTable").innerHTML = "";
  $("csvErrors").innerHTML = "";
  $("csvCount").textContent = "";
  $("confirmCsvBtn").disabled = true;
}

function renderCsvPreview() {
  const results = csvRows.map((r) => ({ row: r, errors: validateRow(r) }));
  const bad = results.filter((x) => x.errors.length);

  $("csvPreview").classList.remove("hidden");
  $("csvCount").textContent = `عدد الصفوف الكلي: ${csvRows.length}`;

  const head = `<tr><th>#</th>${CSV_COLUMNS.map((c) => `<th>${c}</th>`).join("")}</tr>`;
  const body = results.slice(0, 5).map((x, i) => {
    const cls = x.errors.length ? ' class="row-error"' : "";
    const cells = CSV_COLUMNS.map((c) => `<td>${esc(x.row[c])}</td>`).join("");
    return `<tr${cls}><td>${i + 1}</td>${cells}</tr>`;
  }).join("");
  $("csvPreviewTable").innerHTML = head + body;

  $("csvErrors").innerHTML = bad.length
    ? `<strong>صفوف فيها أخطاء (${bad.length}):</strong><br>` +
      bad.map((x) => `صف ${results.indexOf(x) + 1}: ${esc(x.errors.join("، "))}`).join("<br>")
    : "";

  $("confirmCsvBtn").disabled = csvRows.length === 0 || bad.length > 0;
}

function setupCsv() {
  $("uploadCsvBtn").addEventListener("click", () => {
    resetCsvModal();
    openModal("csvModal");
  });

  $("downloadSampleLink").addEventListener("click", (e) => {
    e.preventDefault();
    const csv =
      CSV_COLUMNS.join(",") + "\n" +
      '2026-11-05,فكرة تجريبية,وصف قصير,"اكتب هنا البرومبت",video,"كلمة1, كلمة2",اسم الأغنية\n' +
      '2026-11-06,فكرة صورة,وصف قصير,"اكتب هنا البرومبت",image,,\n';
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dayline-sample.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  $("csvFileInput").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: "UTF-8",
      transformHeader: (h) => h.replace(/^\uFEFF/, "").trim().toLowerCase(),
      complete: (res) => {
        csvRows = res.data.map(normalizeRow);
        renderCsvPreview();
      },
      error: (err) => {
        console.error(err);
        showToast("مقدرتش أقرا الملف");
      },
    });
  });

  $("confirmCsvBtn").addEventListener("click", async () => {
    const btn = $("confirmCsvBtn");
    if (!accountId) {
      showToast("افتح الصفحة بـ ?id=... عشان الرفع يشتغل");
      return;
    }
    btn.disabled = true;
    try {
      await importIdeasCSV(accountId, csvRows);
    } catch (err) {
      console.error(err);
      showToast(`فشل الرفع: ${err?.message || "خطأ غير معروف"}`);
      btn.disabled = false;
      return;
    }
    const [y, m] = csvRows[0].date.split("-").map(Number);
    year = y;
    month = m - 1;
    closeModal("csvModal");
    await loadMonth();
    showToast("تم الرفع");
  });
}

/* ---------- init ---------- */
(async function init() {
  setupPassword();
  setupFollowers();
  setupCalendar();
  setupDayModal();
  setupCsv();

  const ok = await loadAccount();
  if (!ok) return;
  await loadMonth();
})();