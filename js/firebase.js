// نسخة مؤقتة: بتخزّن في localStorage بنفس أسماء وأشكال دوال Firebase الحقيقي.
// لما يتم الربط الحقيقي هيتبدل الملف ده وباقي الكود يشتغل من غير تعديل.

const KEY = "dayline_db";

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || { accounts: {} };
  } catch {
    return { accounts: {} };
  }
}

function save(db) {
  localStorage.setItem(KEY, JSON.stringify(db));
}

export async function getAccounts() {
  const db = load();
  return Object.entries(db.accounts).map(([id, a]) => ({ id, ...a, ideas: undefined }));
}

export async function addAccount(data) {
  const db = load();
  const id = "acc_" + Date.now().toString(36);
  db.accounts[id] = {
    name: data.name,
    url: data.url,
    username: data.username,
    password: data.password,
    niche: data.niche,
    followers: 0,
    createdAt: Date.now(),
    ideas: {},
  };
  save(db);
  return id;
}

export async function getAccount(id) {
  const a = load().accounts[id];
  return a ? { id, ...a, ideas: undefined } : null;
}

export async function updateFollowers(id, n) {
  const db = load();
  if (!db.accounts[id]) throw new Error("الحساب غير موجود");
  db.accounts[id].followers = Number(n) || 0;
  save(db);
}

// يرجّع Map: { "2026-11-05": idea, ... } لأفكار الشهر (month = "YYYY-MM")
export async function getIdeas(id, month) {
  const ideas = load().accounts[id]?.ideas || {};
  const result = {};
  for (const [date, idea] of Object.entries(ideas)) {
    if (date.startsWith(month)) result[date] = idea;
  }
  return result;
}

// idea = { date, title, description, prompt, type: "image"|"video", keywords, music }
export async function saveIdea(id, idea) {
  const db = load();
  if (!db.accounts[id]) throw new Error("الحساب غير موجود");
  db.accounts[id].ideas[idea.date] = idea;
  save(db);
}

// rows = مصفوفة أفكار بنفس شكل saveIdea. نفس التاريخ يتحدّث بدل ما يتكرر.
export async function importIdeasCSV(id, rows) {
  const db = load();
  if (!db.accounts[id]) throw new Error("الحساب غير موجود");
  for (const row of rows) db.accounts[id].ideas[row.date] = row;
  save(db);
}
