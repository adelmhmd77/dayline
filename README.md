# Dayline

لوحة تحكم لإدارة أكتر من حساب سوشيال ميديا، مع جدول أفكار بوستات يومي لكل حساب.

**الستاك:** HTML + CSS + JS + Firebase

## هيكل الملفات

```
index.html         الهوم: شبكة الحسابات (الشخص 1)
account.html       صفحة الحساب: البيانات والتقويم (الشخص 2)
css/shared.css     الألوان والأزرار والمودال (مشترك)
js/home.js         الشخص 1
js/account.js      الشخص 2
js/firebase.js     طبقة البيانات (حالياً نسخة مؤقتة على localStorage)
```

## قواعد الشغل

- الألوان من `shared.css` بس: استخدم `var(--primary)` وأخواتها، ومحدش يكتب كود لون مباشرة.
- الانتقال بين الصفحتين: `account.html?id=ACCOUNT_ID`.
- أي تعديل في `shared.css` يتم الاتفاق عليه بين الاتنين الأول.
- لازم يتشغل المشروع من سيرفر محلي (مش بفتح الملف مباشرة) عشان ES modules: `npx serve .` أو `python3 -m http.server`.

## دوال البيانات (`js/firebase.js`)

| الدالة | الوظيفة |
|---|---|
| `getAccounts()` | قائمة الحسابات |
| `addAccount(data)` | إضافة حساب وترجع الـ id |
| `getAccount(id)` | بيانات حساب واحد |
| `updateFollowers(id, n)` | تحديث الفولورز |
| `getIdeas(id, "YYYY-MM")` | أفكار الشهر (Map بالتاريخ) |
| `saveIdea(id, idea)` | حفظ أو تعديل فكرة يوم |
| `importIdeasCSV(id, rows)` | رفع الشهر كله دفعة واحدة |

## شكل البيانات

```
accounts/{id}: name, url, username, password, niche, followers, createdAt
accounts/{id}/ideas/{YYYY-MM-DD}: date, title, description, prompt, type (image|video), keywords, music
```

## أعمدة ملف CSV

```
date,title,description,prompt,type,keywords,music
2026-11-01,فكرة 1,وصف...,برومبت...,video,"كلمة1, كلمة2",اسم الأغنية
```

## ربط Firebase

- `js/firebase.js`: تهيئة Firebase ودوال Firestore بنفس الأسماء. مفيش تسجيل دخول.
- `firestore.rules`: القواعد (مفتوحة حالياً، شوف التحذير تحت).
- نشر القواعد: `firebase deploy --only firestore:rules` (أو انسخ `firestore.rules` في Console ← Firestore ← Rules).

> تحذير: من غير تسجيل دخول، أي حد يعرف إعدادات المشروع (ظاهرة في كود الموقع) يقدر يقرا ويكتب البيانات، ومنها الباسوردات.
