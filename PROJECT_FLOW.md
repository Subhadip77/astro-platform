# ASTRO PLATFORM — PROJECT FLOW

> Web + PWA first. Vedic, KP, Lal Kitab, Numerology, Panchang, Muhurta.
> Languages: English, Hindi, Bengali. Consultations via astrologers.
> Calculations come from AstrologyAPI. Nothing is calculated by us (and no LLM does chart math).

---

## 0. THE GOLDEN RULE (agents must obey)

**No step starts until the owner types `YES <STEP-ID>`.**
Silence, "ok", "continue" or "maybe" = NOT approved.

- Owner approves:  `YES S10`
- Owner rejects:   `NO S10 <reason>`
- Owner pauses:    `HOLD S10`
- Only ONE step may be 🔵 IN PROGRESS at a time (unless owner says `YES S10 S11 parallel`).
- After finishing, the agent sets the step to 🟢 DONE, writes a short summary, and WAITS for the next `YES`.
- If blocked, set 🔴 BLOCKED and explain. Never guess or skip.

---

## 1. STATUS CODES

| Code | Color | Meaning | Who can set it |
|------|-------|---------|----------------|
| ⚪ `LOCKED`   | White  | Not approved. Do nothing. | default |
| 🟡 `READY`    | Yellow | Plan reviewed, waiting for owner `YES` | agent |
| 🔵 `ACTIVE`   | Blue   | Approved and being built | agent, after `YES` |
| 🟣 `REVIEW`   | Purple | Built, owner must test and accept | agent |
| 🟢 `DONE`     | Green  | Owner accepted | owner / agent after owner says OK |
| 🔴 `BLOCKED`  | Red    | Needs input, key, decision or fix | agent |
| ⚫ `PARKED`   | Black  | Intentionally postponed (later phase) | owner |

Flow: ⚪ → 🟡 → (YES) → 🔵 → 🟣 → 🟢   (any → 🔴 or ⚫)

---

## 2. STEP BOARD (single source of truth — update here)

### PHASE 0 — Setup
| ID | Step | Status | Output |
|----|------|--------|--------|
| S00 | Repo, folders, `AGENTS.md`, `.gitignore`, `.env.example` | 🟣 REVIEW | repo skeleton |
| S01 | Secrets and config (API keys in `.env` only) | ⚪ LOCKED | config loader |
| S02 | AstrologyAPI smoke test (1 call per endpoint family) | ⚪ LOCKED | `docs/api-notes.md` |

### PHASE 1 — Core (free tools = lead magnets)
| ID | Step | Status | Output |
|----|------|--------|--------|
| S10 | MySQL 8 schema (utf8mb4) + migrations | ⚪ LOCKED | `db/migrations` |
| S11 | Backend skeleton (Express, JWT, validation, rate limit) | ⚪ LOCKED | `/backend` |
| S12 | Astrology service layer + Redis/DB cache | ⚪ LOCKED | `services/astro` |
| S13 | Free tool endpoints: kundli, panchang, Rahu Kaal, matching, numerology | ⚪ LOCKED | REST APIs |
| S14 | Next.js app + i18n (en, hi, bn) | ⚪ LOCKED | `/frontend` |
| S15 | PWA (manifest, service worker, install prompt, push-ready) | ⚪ LOCKED | installable app |
| S16 | Lead capture + consent (name, DOB, TOB, place, WhatsApp) | ⚪ LOCKED | `leads` table + form |

### PHASE 2 — Money
| ID | Step | Status | Output |
|----|------|--------|--------|
| S20 | Razorpay orders + webhooks | ⚪ LOCKED | checkout |
| S21 | Paid PDF reports (kundli, Varshphal, matching, numerology) | ⚪ LOCKED | report flow |
| S22 | Email delivery (SendGrid) + download links | ⚪ LOCKED | delivery |

### PHASE 3 — Consultations
| ID | Step | Status | Output |
|----|------|--------|--------|
| S30 | Astrologer profiles + verification flag | ⚪ LOCKED | profiles |
| S31 | Booking (slots, pay upfront, Meet/phone link) | ⚪ LOCKED | bookings |
| S32 | Configurable commission + payout ledger | ⚪ LOCKED | ledger |
| S33 | Admin panel (orders, bookings, astrologers, leads) | ⚪ LOCKED | `/admin` |

### PHASE 4 — Marketing
| ID | Step | Status | Output |
|----|------|--------|--------|
| S40 | Blog system (MDX, per-language URLs) | ⚪ LOCKED | `/blog` |
| S41 | SEO: sitemap, hreflang, schema.org, OG tags | ⚪ LOCKED | SEO pack |
| S42 | CTA blocks (free kundli, mini report, book call) | ⚪ LOCKED | components |
| S43 | Analytics + funnel events | ⚪ LOCKED | dashboard |

### PHASE 5 — Launch
| ID | Step | Status | Output |
|----|------|--------|--------|
| S50 | Accuracy check (5–10 charts vs trusted software/astrologer) | ⚪ LOCKED | `docs/accuracy.md` |
| S51 | Test with 20–30 users, collect feedback | ⚪ LOCKED | `docs/feedback.md` |
| S52 | Deploy (Vercel + VPS), backups, monitoring | ⚪ LOCKED | live site |
| S53 | Soft launch + approach 2–3 astrologers | ⚪ LOCKED | first partners |

### PHASE 6 — Later
| ID | Step | Status |
|----|------|--------|
| S60 | WhatsApp Business API | ⚫ PARKED |
| S61 | Wallet + per-minute chat/call | ⚫ PARKED |
| S62 | Native app (Flutter) | ⚫ PARKED |
| S63 | AI agents (explanations, chat) | ⚫ PARKED |
| S64 | More languages (Tamil, Telugu, Marathi, Gujarati, Kannada) | ⚫ PARKED |

---

## 3. ARCHITECTURE

```
 User (Web / PWA)
        |
   Next.js (SSR/SSG, i18n: en | hi | bn)
        |  HTTPS
   Express API  ──────────────►  Razorpay (payments, webhooks)
        |                  └───►  SendGrid (email)
        |
   Astro Service Layer  (ONLY place that talks to AstrologyAPI)
        |        |
      Redis    MySQL 8 (utf8mb4)
      cache    users, leads, birth_profiles, api_cache,
               orders, reports, astrologers, bookings,
               commissions, blog_meta
        |
   AstrologyAPI (kundli, panchang, muhurta, matching, KP, Lal Kitab, PDF)
```

**Rules**
1. Frontend never calls AstrologyAPI. Only the Astro Service Layer does.
2. Every API result is cached. Key = hash(endpoint + DOB + TOB + lat/lng + language + ayanamsa).
3. Default ayanamsa: Lahiri. User may switch.
4. Birth data is personal data: consent checkbox, encrypt sensitive fields, daily backups.
5. Commission % is configurable per astrologer (never hard-coded).
6. All UI text lives in language JSON files (`/locales/en|hi|bn`). No hard-coded strings.
7. Wrap the provider so it can be swapped later.

**Folder layout**
```
/astro-platform
  AGENTS.md
  PROJECT_FLOW.md
  /backend   (src/routes, controllers, services/astro, services/payments, models, middleware)
  /frontend  (app/[locale]/..., components, locales, content/blog)
  /db        (migrations, seeds)
  /docs      (api-notes.md, accuracy.md, feedback.md)
  .env.example
```

---

## 4. HOW TO USE ANTIGRAVITY FOR THIS PROJECT

1. Install Google Antigravity, sign in, open the `/astro-platform` folder as the workspace.
2. Put this file and `AGENTS.md` in the repo root. Antigravity reads `AGENTS.md` automatically (newer versions). Rules can also live in `.agents/rules/` (or `.agent/rules/` on some versions). Keep each file under ~12,000 characters.
3. Settings: set the **Review Policy to ask for review** (do NOT use "Always proceed"). Keep terminal commands on an allow/ask list.
4. Use **Agent Manager** for a step, **Editor view** for manual edits.
5. Start each task with this prompt (replace the ID):

```
Read PROJECT_FLOW.md and AGENTS.md.
I approve: YES S10.
Do only step S10. Show a plan first, then build.
When done, set status to REVIEW, list files changed, how I test it, and STOP.
```

6. Review the Artifacts (plan, task list, diff, test output) before accepting.
7. Say `YES S11` only after you accept S10. Commit to Git after every accepted step.
8. Never paste real API keys into chat. Keep them in `.env`.

### AGENTS.md (paste into repo root)

```markdown
# AGENTS.md — Astro Platform

## Approval gate (highest priority)
- Read PROJECT_FLOW.md before any work.
- Start a step ONLY after the owner writes "YES <STEP-ID>".
- Work on one step at a time. Never begin the next step on your own.
- When finished: set status to REVIEW, summarize, list how to test, then STOP.
- If something is unclear or blocked, set BLOCKED and ask. Do not guess.

## Stack
- Frontend: Next.js (App Router), Tailwind, next-intl, PWA.
- Backend: Node.js + Express, JWT, Joi/Zod validation.
- DB: MySQL 8, utf8mb4_unicode_ci. Migrations only; no manual schema edits.
- Cache: Redis. Payments: Razorpay. Email: SendGrid.

## Hard rules
- Never commit secrets. Use .env; keep .env.example updated.
- Only the astro service layer may call AstrologyAPI. Always cache results.
- No hard-coded UI strings; use locale files (en, hi, bn).
- Parameterized queries only. Validate all input. Rate-limit public endpoints.
- Encrypt sensitive birth data fields. Ask consent before storing.
- Astrology copy: no guaranteed outcomes, no fear-based selling, no death/illness/legal predictions.
- Write at least basic tests for each endpoint you add.
- Small commits with clear messages.
```

---

## 5. ASTROLOGYAPI — TESTING PLAN (S02)

- Use your purchased small plan or the free credits only for testing.
- Read the official docs first. Do not guess endpoint names, auth method or parameters.
- Test one endpoint per family and save raw JSON samples in `docs/api-notes.md`:
  birth details, planets, Vimshottari dasha, Manglik, Sade Sati, panchang, Choghadiya/Rahu Kaal, matching, numerology, and one PDF.
- Check language output (hi, bn) and timezone/DST handling.
- Log credits used per call so you can calculate cost per user.
- Confirm that KP, Varshaphal and Lalkitab are included in your plan before promising them on the site.

---

## 6. BLOG PLAN (S40–S43) — attract people, then give them an option

### Goal
Each post answers one real search, then leads the reader to a free tool, then a paid option.

### Language rules
- Write **natively** in English, Hindi and Bengali (Bengali is a launch language, not "later"). Do not just machine-translate.
- Separate URLs: `/en/blog/<slug>`, `/hi/blog/<slug>`, `/bn/blog/<slug>`. Add `hreflang` links between them.
- Keep key terms consistent (Mahadasha, Sade Sati, Mangal Dosh, Kundli).
- Tone: calm, helpful, story-driven. Never scare the reader.

### Post template (same in every language)
1. Hook: a relatable question or story (2–3 lines).
2. Simple answer in the first paragraph (good for Google snippets).
3. Explanation with 3–5 short sections.
4. What to do next (practical, no fear).
5. **Option box** (CTA):
   - 🆓 Get your free Kundli
   - 📄 Get a detailed report (from ₹49)
   - 📞 Talk to an astrologer
6. Short disclaimer.

### CTA block copy (reuse)
- **EN:** "Want to see this in your own chart? Get your free Kundli in 1 minute."
- **HI:** "अपनी कुंडली में इसे देखना चाहते हैं? 1 मिनट में फ्री कुंडली पाएँ।"
- **BN:** "নিজের কুষ্ঠিতে এটি দেখতে চান? ১ মিনিটে বিনামূল্যে কুষ্ঠি দেখুন।"
- Second option: "Need guidance? Book a call with a verified astrologer."

### Disclaimer (EN / HI)
- **EN:** "Astrology is a traditional guidance system, not a guarantee. For health, legal or financial decisions, consult a qualified professional."
- **HI:** "ज्योतिष एक पारंपरिक मार्गदर्शन प्रणाली है, गारंटी नहीं। स्वास्थ्य, कानूनी या आर्थिक निर्णयों के लिए योग्य विशेषज्ञ से सलाह लें।"
- **BN:** "জ্যোতিষ একটি ঐতিহ্যবাহী দিকনির্দেশনা ব্যবস্থা, কোনো গ্যারান্টি নয়। স্বাস্থ্য, আইনি বা আর্থিক সিদ্ধান্তের জন্য যোগ্য বিশেষজ্ঞের পরামর্শ নিন।"

### First 12 post ideas (bilingual)
1. What is Sade Sati? (and why you need not panic)
2. How to read your Kundli as a beginner
3. Mangal Dosh: myths vs facts
4. Rahu Kaal: what it means and how to use it daily
5. What is Vimshottari Dasha?
6. Kundli matching (Ashtakoota) explained simply
7. Vedic vs KP astrology: what is the difference?
8. What is Lal Kitab? Simple remedies explained
9. Your Moolank and Bhagyank: numerology basics
10. Best muhurta basics for a new beginning
11. What is Varshphal (yearly chart) and how to read it
12. Which gemstone? Why you should not buy one blindly

Publish 2–3 posts a week. Reuse each post as a Reel/Short and a WhatsApp channel update.

### Sample post — English (short)

**Title:** What Is Sade Sati? A Calm Guide (No Panic Needed)

If someone told you "Shani's Sade Sati has started", you probably felt worried. Take a breath.

**Short answer:** Sade Sati is the roughly 7.5-year period when Saturn moves through the sign before your Moon sign, your Moon sign, and the sign after it.

**What it usually means**
- It is a time linked with discipline, patience and responsibility.
- Results depend on your full chart, not Saturn alone.
- Many people also report growth and stability during this period.

**What you can do**
- Keep routines and finances steady.
- Avoid big impulsive decisions.
- Check your own chart for the real picture.

**Your options**
- 🆓 Check your free Kundli
- 📄 Get a detailed report from ₹49
- 📞 Speak with a verified astrologer

*Astrology is guidance, not a guarantee.*

### Sample post — Hindi (short)

**शीर्षक:** साढ़ेसाती क्या है? डरने की नहीं, समझने की ज़रूरत है

अगर किसी ने कहा कि "शनि की साढ़ेसाती शुरू हो गई", तो चिंता होना स्वाभाविक है। पर पहले इसे समझ लेते हैं।

**सीधा जवाब:** साढ़ेसाती लगभग साढ़े सात साल का समय है, जब शनि आपकी चंद्र राशि से पिछली राशि, चंद्र राशि और अगली राशि से गुज़रता है।

**इसका आम मतलब**
- यह अनुशासन, धैर्य और ज़िम्मेदारी का समय माना जाता है।
- परिणाम पूरी कुंडली पर निर्भर करते हैं, सिर्फ़ शनि पर नहीं।
- कई लोगों के लिए यह समय मज़बूती और विकास भी लाता है।

**आप क्या कर सकते हैं**
- अपनी दिनचर्या और खर्च संतुलित रखें।
- जल्दबाज़ी में बड़े फ़ैसले न लें।
- अपनी कुंडली देखकर सही तस्वीर समझें।

**आपके विकल्प**
- 🆓 अपनी फ्री कुंडली देखें
- 📄 विस्तृत रिपोर्ट पाएँ (₹49 से)
- 📞 वेरिफ़ाइड ज्योतिषी से बात करें

*ज्योतिष मार्गदर्शन है, गारंटी नहीं।*

### Sample post — Bengali (short)

**শিরোনাম:** শনির সাড়ে সাতি কী? ভয় নয়, বুঝে নেওয়াই ভালো

কেউ যদি বলে "আপনার শনির সাড়ে সাতি শুরু হয়েছে", চিন্তা হওয়াই স্বাভাবিক। আগে একটু শান্ত হয়ে বুঝে নেওয়া যাক।

**সংক্ষিপ্ত উত্তর:** সাড়ে সাতি হলো প্রায় সাড়ে সাত বছরের সময়, যখন শনি আপনার চন্দ্ররাশির আগের রাশি, চন্দ্ররাশি এবং তার পরের রাশি দিয়ে অতিক্রম করে।

**সাধারণত এর মানে কী**
- শৃঙ্খলা, ধৈর্য ও দায়িত্বের সময় বলে মনে করা হয়।
- ফল নির্ভর করে পুরো কুষ্ঠির উপর, শুধু শনির উপর নয়।
- অনেকে এই সময়ে নিজেকে গড়ে তোলেন এবং স্থিতিশীলতা পান।

**আপনি কী করতে পারেন**
- রুটিন ও খরচ স্থির রাখুন।
- হঠাৎ বড় সিদ্ধান্ত এড়িয়ে চলুন।
- নিজের কুষ্ঠি দেখে আসল চিত্রটা বুঝুন।

**আপনার বিকল্প**
- 🆓 বিনামূল্যে কুষ্ঠি দেখুন
- 📄 বিস্তারিত রিপোর্ট নিন (₹৪৯ থেকে)
- 📞 যাচাইকৃত জ্যোতিষীর সঙ্গে কথা বলুন

*জ্যোতিষ দিকনির্দেশনা, গ্যারান্টি নয়।*

### Blog tech notes
- MDX files in `/frontend/content/blog/<locale>/<slug>.mdx` with frontmatter: title, description, date, locale, slug, translationOf, cta.
- Auto-generate sitemap with all locales, canonical URLs, and `hreflang`.
- Add `Article` schema.org JSON-LD and Open Graph images.
- Track events: `blog_view`, `cta_click_free_kundli`, `lead_submit`, `report_purchase`, `booking_start`.

---

## 7. COST CHECK (keep the budget small)

- Cache every result. Never call the API per page view.
- Track credits used per user, per tool, per report.
- Price reports well above API cost. Example: if a pro PDF costs you about ₹60, sell it well above that.
- Upgrade the API plan only when real traffic or sales justify it.

---

## 8. APPROVAL LOG

| Date | Step | Decision | Note |
|------|------|----------|------|
| 2026-10-26 | S00 | YES | Approved by owner. Repo initialized, folder skeleton, .gitignore, and .env.example created. Set to REVIEW. |

---

## 9. START HERE

Next suggested step: **S00**. Reply: `YES S00` to begin.
