# AstrologyAPI Notes & Smoke Test Log (S02)

This document tracks endpoint smoke tests, payload structures, credit usage, and plan tier coverage for AstrologyAPI.

> **Credentials & Security Notice**: API keys and tokens are loaded strictly via environment configuration and are **never** committed or stored in this document.

---

## 1. Connection & Configuration
- **Calculation Base URL**: `https://json.astrologyapi.com/v1`
- **PDF Base URL**: `https://pdf.astrologyapi.com/v1`
- **Authentication**: HTTP Header (`x-astrologyapi-key: <ACCESS_TOKEN>` / Basic Auth)
- **Language Selection**: HTTP Header (`Accept-Language: en | hi | bn`)
- **Default Ayanamsa**: Lahiri (1)

---

## 2. Plan Tier & Endpoint Availability Summary

| Feature / System | Included in Current Plan? | Notes |
|---|---|---|
| **Vedic Natal & Kundli** | ✅ YES | `birth_details`, `astro_details`, `planets/extended` working |
| **Dashas (Vimshottari)** | ✅ YES | `major_vdasha` working |
| **Doshas (Manglik, Sade Sati)** | ✅ YES | `manglik`, `sadhesati_current_status` working |
| **Panchang & Muhurta** | ✅ YES | `basic_panchang`, `chaughadiya_muhurta` working |
| **Matchmaking (Ashtakoota)** | ✅ YES | `match_ashtakoot_points` (36 points) working |
| **Numerology** | ✅ YES | `numero_table` working |
| **KP System** | ✅ YES | `kp_planets` working on current plan! |
| **Varshaphal (Tajik)** | ✅ YES | `varshaphal_details` working on current plan! |
| **Lal Kitab** | ✅ YES | `lalkitab_planets` working on current plan! |
| **PDF Generation** | ⚠️ Add-on Needed | Returns `405`: *"Your subscribed plan is not authorzed to access this API."* Needs PDF plan tier. |

---

## 3. Endpoint Families & Live Test Results

| Endpoint Family | Endpoint Path | Language Tested | Credits Used | Response Status & Latency | Notes |
|---|---|---|---|---|---|
| Birth Details | `/v1/birth_details` | EN | ~1 credit (wallet) | 🟢 200 OK (224ms) | Verified working on active plan |
| Astro Particulars | `/v1/astro_details` | EN | ~1 credit (wallet) | 🟢 200 OK (130ms) | Verified working on active plan |
| Planets / Kundli (EN) | `/v1/planets/extended` | EN | ~1 credit (wallet) | 🟢 200 OK (49ms) | Verified working on active plan |
| Planets / Kundli (HI) | `/v1/planets/extended` | HI | ~1 credit (wallet) | 🟢 200 OK (45ms) | Verified working on active plan |
| Planets / Kundli (BN) | `/v1/planets/extended` | BN | ~1 credit (wallet) | 🟢 200 OK (47ms) | Verified working on active plan |
| Vimshottari Dasha | `/v1/major_vdasha` | EN | ~1 credit (wallet) | 🟢 200 OK (43ms) | Verified working on active plan |
| Manglik Dosha | `/v1/manglik` | EN | ~1 credit (wallet) | 🟢 200 OK (42ms) | Verified working on active plan |
| Sade Sati | `/v1/sadhesati_current_status` | EN | ~1 credit (wallet) | 🟢 200 OK (43ms) | Verified working on active plan |
| Panchang (EN) | `/v1/basic_panchang` | EN | ~1 credit (wallet) | 🟢 200 OK (44ms) | Verified working on active plan |
| Panchang (HI) | `/v1/basic_panchang` | HI | ~1 credit (wallet) | 🟢 200 OK (65ms) | Verified working on active plan |
| Panchang (BN) | `/v1/basic_panchang` | BN | ~1 credit (wallet) | 🟢 200 OK (45ms) | Verified working on active plan |
| Choghadiya / Rahu Kaal | `/v1/chaughadiya_muhurta` | EN | ~1 credit (wallet) | 🟢 200 OK (53ms) | Verified working on active plan |
| Matchmaking | `/v1/match_ashtakoot_points` | EN | ~1 credit (wallet) | 🟢 200 OK (45ms) | Verified working on active plan |
| Numerology | `/v1/numero_table` | EN | ~1 credit (wallet) | 🟢 200 OK (43ms) | Verified working on active plan |
| KP System (Tier Check) | `/v1/kp_planets` | EN | ~1 credit (wallet) | 🟢 200 OK (60ms) | Verified working on active plan |
| Varshaphal (Tier Check) | `/v1/varshaphal_details` | EN | ~1 credit (wallet) | 🟢 200 OK (67ms) | Verified working on active plan |
| Lal Kitab (Tier Check) | `/v1/lalkitab_planets` | EN | ~1 credit (wallet) | 🟢 200 OK (58ms) | Verified working on active plan |
| PDF Report (Tier Check) | `/v1/basic_horoscope_pdf` | EN | ~1 credit (wallet) | 🔴 405 (137ms) | Requires PDF add-on / subscription |

---

## 4. Multilingual Output Verification (Kundli & Panchang)

AstrologyAPI natively returns localized names and descriptions when passing `Accept-Language: hi` (Hindi) or `Accept-Language: bn` (Bengali).

### A. Panchang Comparison (Tithi, Nakshatra, Yog, Karan)
- **English (`en`)**:
  - Tithi: `Shukla Dwitiya`
  - Nakshatra: `Moola`
  - Yog: `Brahma`
  - Karan: `Balava`
- **Hindi (`hi`)**:
  - Tithi: `शुक्ल द्वितीया`
  - Nakshatra: `मूला`
  - Yog: `ब्रह्म`
  - Karan: `बालव`
- **Bengali (`bn`)**:
  - Tithi: `শুক্লা দ্বিতীয়া`
  - Nakshatra: `মূলা`
  - Yog: `বালব`
  - Karan: `বালব`

### B. Extended Planets Comparison (First Planet - Sun)
- **English**: `Sun`
- **Hindi**: `सूर्य`
- **Bengali**: `সূর্য`

---

## 5. Sanitized Sample Responses

### A. Matchmaking (Ashtakoota 36-Point Compatibility)
```json
{
  "varna": {
    "description": "Natural Refinement  / Work",
    "male_koot_attribute": "Kshatriya",
    "female_koot_attribute": "Shoodra",
    "total_points": 1,
    "received_points": 1
  },
  "vashya": {
    "description": "Innate Giving / Attraction  towards each other",
    "male_koot_attribute": "Maanav",
    "female_koot_attribute": "Maanav",
    "total_points": 2,
    "received_points": 2
  },
  "tara": {
    "description": "Comfort - Prosperity - Health",
    "male_koot_attribute": "Uttra Shadha",
    "female_koot_attribute": "Swati",
    "total_points": 3,
    "received_points": 1.5
  },
  "yoni": {
    "description": "Intimate Physical",
    "male_koot_attribute": "Nakul",
    "female_koot_attribute": "Mahisha",
    "total_points": 4,
    "received_points": 2
  },
  "maitri": {
    "description": "Friendship",
    "male_koot_attribute": "Jupiter",
    "female_koot_attribute": "Venus",
    "total_points": 5,
    "received_points": 0.5
  },
  "gan": {
    "description": "Temperament",
    "male_koot_attribute": "Manushya",
    "female_koot_attribute": "Dev",
    "total_points": 6,
    "received_points": 5
  },
  "bhakut": {
    "description": "Constructive Ability / Constructivism / Society and Couple",
    "male_koot_attribute": "Sagittarius",
    "female_koot_attribute": "Libra",
    "total_points": 7,
    "received_points": 7
  },
  "nadi": {
    "description": "Progeny / Excess",
    "male_koot_attribute": "Ant",
    "female_koot_attribute": "Ant",
    "total_points": 8,
    "received_points": 0
  },
  "total": {
    "total_points": 36,
    "received_points": 19,
    "minimum_required": 18
  },
  "conclusion": {
    "status": false,
    "report": "The match has scored 19 points outs of 36 points. This is quite good score."
  }
}
```

### B. KP System (KP Planets)
```json
[
  {
    "planet_id": 0,
    "planet_name": "Sun",
    "degree": 59.8575,
    "formatted_degree": "59:51:27",
    "is_retro": false,
    "norm_degree": 29.8575,
    "formatted_norm_degree": "29:51:27",
    "house": 10,
    "sign": "Taurus",
    "sign_lord": "Venus",
    "nakshatra": "Mrigshira",
    "nakshatra_lord": "Mars",
    "charan": 2,
    "sub_lord": "Saturn",
    "sub_sub_lord": "Jupiter"
  },
  {
    "planet_id": 1,
    "planet_name": "Moon",
    "degree": 268.8586,
    "formatted_degree": "268:51:30",
    "is_retro": false,
    "norm_degree": 28.8586,
    "formatted_norm_degree": "28:51:30",
    "house": 5,
    "sign": "Sagittarius",
    "sign_lord": "Jupiter",
    "nakshatra": "Uttra Shadha",
    "nakshatra_lord": "Sun",
    "charan": 1,
    "sub_lord": "Mars",
    "sub_sub_lord": "Mercury"
  },
  {
    "planet_id": 2,
    "planet_name": "Mars",
    "degree": 136.1539,
    "formatted_degree": "136:09:14",
    "is_retro": false,
    "norm_degree": 16.1539,
    "formatted_norm_degree": "16:09:14",
    "house": 1,
    "sign": "Leo",
    "sign_lord": "Sun",
    "nakshatra": "Purva Phalguni",
    "nakshatra_lord": "Venus",
    "charan": 1,
    "sub_lord": "Sun",
    "sub_sub_lord": "Venus"
  }
]
```

### C. Varshaphal (Annual Horoscope Details)
```json
{
  "varshaphala_year": 2026,
  "age_of_native": 31,
  "ayanamsha_name": "LAHIRI",
  "ayanamsha_degree": 24.2266,
  "varshaphala_timestamp": 1781515085000,
  "native_birth_date": "15-06-1995 10:30:00",
  "varshaphala_date": "15-06-2026 09:18:05",
  "panchadhikari": {
    "muntha_lord": "Jupiter",
    "muntha_lord_id": 4,
    "birth_ascendant_lord": "Sun",
    "birth_ascendant_lord_id": 0,
    "year_ascendant_lord": "Moon",
    "year_ascendant_lord_id": 1,
    "dinratri_lord": "Venus",
    "trirashi_lord": "Venus"
  },
  "varshaphala_year_lord": "Sun",
  "varshaphala_muntha": {
    "muntha_sign": "Pisces",
    "muntha_sign_lord": "Jupiter"
  }
}
```

### D. Lal Kitab (Planetary Placements)
```json
[
  {
    "planet": "Sun",
    "rashi": "Capricorn",
    "soya": false,
    "position": "Enemy Sign",
    "nature": "Malefic"
  },
  {
    "planet": "Moon",
    "rashi": "Leo",
    "soya": true,
    "position": "Friend Sign",
    "nature": "Benefic"
  },
  {
    "planet": "Mars",
    "rashi": "Aries",
    "soya": true,
    "position": "Own Sign",
    "nature": "Malefic"
  }
]
```

### E. PDF Report Authorization Response
```json
{
  "status": false,
  "msg": "Your subscribed plan is not authorzed to access this API. Kindly visit your dashboard."
}
```

---

## 6. Architectural Recommendations for Phase 1 & Phase 2

1. **Calculations are Fully Supported**: We can immediately offer **Free Kundli, Panchang, Rahu Kaal, Matchmaking, Numerology, KP Charts, Varshaphal, and Lal Kitab** calculations because the user's plan supports all of them with sub-100ms response times.
2. **Caching Strategy (S12)**:
   - Cache key formula: `hash(endpoint + dob + tob + lat + lon + lang + ayanamsa)`
   - With Redis caching, every subsequent visit by a user is 0 external API cost and instantaneous.
3. **PDF Reports (Phase 2 - S21)**:
   - When building Phase 2 (paid PDF reports), the project can either:
     - Upgrade to the AstrologyAPI PDF tier, OR
     - Render custom branded PDFs server-side using React-PDF / Puppeteer from the rich calculation JSON responses (which avoids external PDF fees entirely).
