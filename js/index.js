// Firebase Cloud Function (Gen 2): بتجيب عدد متابعين أي حساب انستجرام Business/Creator عام.
// بتستخدم Instagram Graph API (business_discovery) بحساب Business واحد بتاعك وتوكن واحد.
//
// الإعداد:
//   firebase functions:secrets:set IG_ACCESS_TOKEN   (توكن طويل المدى)
//   firebase functions:secrets:set IG_USER_ID        (ID حساب الـ Business بتاعك)
//   firebase deploy --only functions
//
// ملاحظات:
// - business_discovery بيشتغل فقط على حسابات Business/Creator العامة.
//   الحسابات الشخصية هترجّع خطأ.
// - راجع وثائق Meta الحالية لأن الصلاحيات ونسخة الـ API (v21.0 هنا) بتتغير.
const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");

const IG_ACCESS_TOKEN = defineSecret("IG_ACCESS_TOKEN");
const IG_USER_ID = defineSecret("IG_USER_ID");

const API_VERSION = "v21.0";
const CACHE_MS = 60 * 60 * 1000; // ساعة
const cache = new Map(); // username -> { followers, at }

exports.getFollowers = onRequest(
  { secrets: [IG_ACCESS_TOKEN, IG_USER_ID], cors: true, region: "europe-west1" },
  async (req, res) => {
    const username = String(req.query.username || "")
      .replace(/^@/, "")
      .trim()
      .toLowerCase();

    if (!/^[a-z0-9._]{1,30}$/.test(username)) {
      res.status(400).json({ error: "username غير صحيح" });
      return;
    }

    const hit = cache.get(username);
    if (hit && Date.now() - hit.at < CACHE_MS) {
      res.json({ followers: hit.followers, cached: true });
      return;
    }

    const fields = encodeURIComponent(`business_discovery.username(${username}){followers_count}`);
    const url =
      `https://graph.facebook.com/${API_VERSION}/${IG_USER_ID.value()}` +
      `?fields=${fields}&access_token=${IG_ACCESS_TOKEN.value()}`;

    try {
      const r = await fetch(url);
      const data = await r.json();
      if (!r.ok || !data.business_discovery) {
        res.status(502).json({ error: data?.error?.message || "فشل الطلب من انستجرام" });
        return;
      }
      const followers = data.business_discovery.followers_count;
      cache.set(username, { followers, at: Date.now() });
      res.json({ followers, cached: false });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "خطأ في السيرفر" });
    }
  }
);