<div align="center">

# 🎯 Lakshya Mock & Marks Tracker | লক্ষ্য ট্র্যাকার | लक्ष्य ट्रैकर | லக்ஷ்யா
### The Privacy-First, Self-Hosted Exam Performance & Marks Analytics Engine

[![Docker Pulls](https://img.shields.io/docker/pulls/saman514/mock-tracker?logo=docker&logoColor=white&color=0F3D3E)](https://hub.docker.com/r/saman514/mock-tracker)
[![Docker Image Version](https://img.shields.io/docker/v/saman514/mock-tracker/latest?logo=docker&logoColor=white&color=C59B27)](https://hub.docker.com/r/saman514/mock-tracker)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.12+](https://img.shields.io/badge/Python-3.12+-blue.svg?logo=python&logoColor=white)](https://www.python.org/)
[![PWA Ready](https://img.shields.io/badge/PWA-100%25%20Offline%20Capable-emerald.svg?logo=pwa&logoColor=white)](#-mobile-pwa-installation)
[![SQLite WAL](https://img.shields.io/badge/Database-SQLite%20WAL-lightgrey.svg?logo=sqlite&logoColor=white)](https://www.sqlite.org/)

**A zero-bloat, privacy-respecting, self-hosted web app and PWA designed for competitive examination aspirants in India and worldwide.**  
Track mock scores, calculate exact negative marking penalties, diagnose subject-wise weak points with visual radars, and log error patterns—all with **zero cloud dependencies** and **zero recurring subscriptions**.

[Quick Start](#-quick-start-in-60-seconds) • [Supported Exams](#-supported-exam-domains) • [Mobile & Network Setup](#-device-and-network-access-guide) • [Docker Deployment](#-docker-deployment) • [Environment Variables](#-configuration--environment-variables)

</div>

---

## 🌐 Multilingual Overview | বহুভাষিক বিবরণ | बहुभाषी विवरण | பன்மொழி கண்ணோட்டம்

<details open>
<summary><b>🇮🇳 বাংলা (Bengali Description)</b></summary>

> **লক্ষ্য ট্র্যাকার (Lakshya Marks Tracker)** হলো ভারতীয় প্রতিযোগিতামূলক পরীক্ষার (রেলওয়ে RRB JE/ALP/NTPC, এসএসসি SSC CGL/CHSL/JE, ব্যাংকিং IBPS/SBI, গেট GATE এবং রাজ্য পিএসসি) জন্য একটি সম্পূর্ণ নিজস্ব ও ফ্রি মক টেস্ট ও স্কোর অ্যানালিটিক্স ইঞ্জিন।
> 
> - **মূল সুবিধা:** স্বয়ংক্রিয় নেগেটিভ মার্কিং হিসাব, ভুলের প্যাটার্ন ডায়েরি (সিলি মিসটেক বনাম কনসেপ্ট গ্যাপ), দুর্বল বিষয় শনাক্ত করার রাডার চার্ট এবং ১০০% অফলাইন পিডব্লিউএ (PWA) অ্যাপ সুবিধা।
> - **যেকোনো ডিভাইসে:** আপনার রাস্পবেরি পাই, হোমসার্ভার বা সাধারণ ল্যাপটপে ১টি ডকার কমান্ডেই চালু করা যায়।

</details>

<details open>
<summary><b>🇮🇳 हिन्दी (Hindi Description)</b></summary>

> **लक्ष्य ट्रैकर (Lakshya Marks Tracker)** भारतीय प्रतियोगी परीक्षाओं (रेलवे RRB JE/ALP/NTPC, एसएससी SSC CGL/CHSL/JE, बैंकिंग IBPS/SBI, गेट GATE, यूपीएससी एवं राज्य पीएससी) के लिए एक प्राइवेसी-फर्स्ट, सेल्फ-होस्टेड और पूरी तरह मुफ़्त मॉक टेस्ट और मार्क्स एनालिटिक्स इंजन है।
> 
> - **प्रमुख विशेषताएं:** ऑटोमेटेड नेगेटिव मार्किंग कैलकुलेशन, गलतियों की डायरी (सिली मिस्टेक बनाम कॉन्सेप्ट गैप), सब्जेक्ट मास्टरी रडार चार्ट, और कमजोर इंटरनेट में भी 100ms में खुलने वाला ऑफलाइन PWA ऐप।
> - **सरल सेटअप:** किसी भी कंप्यूटर, रास्पबेरी पाई या होम सर्वर पर सिर्फ एक डॉकर (Docker) कमांड से तुरंत शुरू करें।

</details>

<details open>
<summary><b>🇮🇳 தமிழ் (Tamil Description)</b></summary>

> **லக்ஷ்யா மார்க்ஸ் டிராக்கர் (Lakshya Marks Tracker)** என்பது இந்திய போட்டித் தேர்வுகளுக்கான (ரயில்வே RRB JE/ALP/NTPC, SSC CGL/CHSL/JE, வங்கி தேர்வுகள் IBPS/SBI, GATE மற்றும் TNPSC / மாநில PSC) பிரைவசி-சார்ந்த, சுய-ஹோஸ்டிங் மற்றும் முற்றிலும் இலவச மாதிரி தேர்வு பகுப்பாய்வு தளமாகும்.
> 
> - **முக்கிய அம்சங்கள்:** துல்லியமான நெகட்டிவ் மார்க் கணக்கீடு (-0.33, -0.25, -0.50), தவறு வகைப்பாடு டைரி (கவனக்குறைவு தவறு vs கருத்து இடைவெளி), பலவீனமான பாடங்களை கண்டறியும் ரேடார் விளக்கப்படம் மற்றும் ஆஃப்லைன் PWA மொபைல் வசதி.
> - **எளிய நிறுவல்:** உங்கள் சொந்த கணினி, ராஸ்பெர்ரி பை அல்லது ஹோம் சர்வரில் ஒரே ஒரு டாக்கர் (Docker) கட்டளை மூலம் உடனடியாக இயக்கலாம்.

</details>

---

## 💡 Why Lakshya?

Commercial test portals (Testbook, Oliveboard, Adda247) trap your test history in closed silos, bombard you with subscription upsells, and offer superficial score breakdowns.

**Lakshya** changes that:
- 🔒 **100% Data Ownership**: Your test marks, scorecards, and mistake logs stay in a local SQLite database on your Raspberry Pi, home server, NAS, or personal laptop.
- 📉 **Exact Negative Marking Math**: Pre-configured penalty rules (1/3rd, 1/4th, 0.66, 0.50, custom) prevent calculation mistakes.
- 🧠 **Cognitive Error Classification**: Differentiates between *Silly Mistakes*, *Formula Gaps*, *Concept Gaps*, *Time Panic*, and *Blind Guesses*.
- 🌐 **Device & Network Agnostic**: Run on any Linux, Windows, macOS machine, or Docker container. Open on your phone via local Wi-Fi or remote VPN (Tailscale).
- 📱 **Native Mobile Feel (PWA)**: Installable to your phone's home screen with instant 100ms loading and offline caching.
- 🗣️ **Multilingual**: Native support for **12 Indian languages** (বাংলা, हिन्दी, English, தமிழ், తెలుగు, मराठी, etc.).

---

## 🎯 Supported Exam Domains

Lakshya comes pre-seeded with marking formulas, default sectional splits, and target cutoffs for all major competitive examinations:

| Category | Supported Examinations | Marking Scheme | Default Penalty |
| :--- | :--- | :--- | :--- |
| 🚆 **Railways (RRB)** | **RRB JE** (CBT-1 & CBT-2 Mechanical/Electrical/Civil)<br>**RRB ALP** (Technician CBT-1 & CBT-2)<br>**RRB NTPC** (Graduate & Undergraduate CBT-1/2)<br>**RRB Group D** (RRC Level-1) | 100 Q (100 Marks)<br>75 Q (75 Marks)<br>120 Q (120 Marks) | **-0.3333** (1/3rd negative) |
| 🏛️ **Staff Selection (SSC)** | **SSC CGL** (Tier-1 & Tier-2)<br>**SSC CHSL** (Tier-1)<br>**SSC JE** (Paper-1 Mechanical/Civil/Electrical)<br>**SSC MTS** & Havaldar<br>**SSC CPO** (Sub-Inspector) | 100 Q (200 Marks)<br>200 Q (200 Marks)<br>90 Q (270 Marks) | **-0.50** (1/4th of 2 marks)<br>**-0.25** (1/4th of 1 mark)<br>**-1.00** (for MTS) |
| 🏦 **Banking & Insurance** | **IBPS PO / Clerk / SO**<br>**SBI PO / Clerk**<br>**RBI Grade B / Assistant**<br>**LIC AAO / ADO** | 100 Q (100 Marks) | **-0.25** (1/4th negative) |
| 📜 **Civil Services & PSC** | **UPSC CSE Prelims** (GS Paper-1)<br>**WBPSC Miscellaneous** Prelims<br>**WBCS** Executive Prelims<br>**WBPSC Clerkship / Food SI**<br>**BPSC, UPPSC, MPSC, TNPSC** | 100 Q (200 Marks)<br>200 Q (200 Marks)<br>100 Q (100 Marks) | **-0.6667** (1/3rd of 2 marks)<br>**-0.3333** (1/3rd of 1 mark) |
| ⚙️ **Engineering & PSUs** | **GATE** (ME, CE, EE, ECE, CS, IN)<br>**State AE/JE** (PWD, Irrigation, Power)<br>**PSU Recruitment** (ISRO, BARC, DRDO, Coal India, BEL) | 65 Q (100 Marks)<br>100 Q (100 Marks) | **-0.3333** (1/3rd for 1-mark Qs)<br>**-0.6667** (1/3rd for 2-mark Qs) |
| 🛠️ **Universal Custom Exam** | **Any Competitive Exam** | *Configurable* | *Customizable (0 to -1.0)* |

> 💡 **Custom Exams**: You can add any custom examination with your own marks-per-question, negative penalty, and sections straight from the web interface without touching SQL!

---

## 🚀 Quick Start in 60 Seconds

### Option A: Single Docker Run Command (Recommended)

Run the pre-built, production-ready container from Docker Hub:

```bash
docker run -d \
  --name mock-tracker \
  -p 8856:8856 \
  -v mock_tracker_data:/app/data \
  --restart unless-stopped \
  saman514/mock-tracker:latest
```

Open your browser and navigate to:  
👉 **`http://localhost:8856`**

---

### Option B: Docker Compose

1. Create a `docker-compose.yml` file:

```yaml
services:
  mock-tracker:
    image: saman514/mock-tracker:latest
    container_name: mock-tracker
    restart: unless-stopped
    ports:
      - "${PORT:-8856}:8856"
    volumes:
      - mock_tracker_data:/app/data
    environment:
      - PORT=8856
      # Optional: Self-Hosted Kanboard Sync
      # - KANBOARD_URL=http://your-kanboard:80/jsonrpc.php
      # - KANBOARD_USER=ai
      # - KANBOARD_TOKEN=your_token_here
      # - KANBOARD_PROJECT_ID=4
    deploy:
      resources:
        limits:
          memory: 64M

volumes:
  mock_tracker_data:
    name: mock_tracker_data
```

2. Start the container:
```bash
docker compose up -d
```

---

### Option C: Bare-Metal Python (Zero Dependencies)

Lakshya is built purely using Python's standard library (`http.server`, `sqlite3`, `json`, `urllib`). No `pip install` or external Python packages are required!

```bash
# 1. Clone the repository
git clone https://github.com/Kanad590/mock-tracker.git
cd mock-tracker

# 2. Start the application
python3 app.py
```
Visit `http://localhost:8856`.

---

## 📱 Device and Network Access Guide

Lakshya dynamically adapts to your network without hardcoding any IP addresses.

### 🏠 Connecting from Phone on Home Wi-Fi (LAN)
1. Find your host computer's local IP:
   - **Linux / Raspberry Pi**: `hostname -I` (e.g. `192.168.1.45`)
   - **Windows**: Run `ipconfig` in Command Prompt (look for *IPv4 Address*)
   - **macOS**: System Settings > Network > Wi-Fi > Details
2. On your phone (connected to the same Wi-Fi router), open Chrome or Safari:
   ```
   http://<YOUR-HOST-IP>:8856
   ```

### 🚀 Accessing from Outside / Mobile Data (Travel)
- **Option 1 (Tailscale Mesh VPN - Zero Port Forwarding)**:  
  Install [Tailscale](https://tailscale.com) on your host machine and your mobile phone. Connect both to your private tailnet and open `http://<tailscale-ip>:8856` or `http://<machine-name>:8856` on 4G/5G mobile data.
- **Option 2 (Cloudflare Tunnel / Reverse Proxy)**:  
  Expose port `8856` securely behind Cloudflare Tunnel, Caddy, or Nginx with a free Let's Encrypt SSL certificate (e.g. `https://tracker.yourdomain.com`).

### 📲 Mobile PWA Installation
- **Android (Chrome)**: Tap the 3 dots (`⋮`) in the top right corner -> Tap **"Install app"** or **"Add to Home screen"**.
- **iOS (Safari)**: Tap the Share button (`⎋`) -> Tap **"Add to Home Screen (+)"** -> Tap **"Add"**.

---

## ✨ Core Features & Highlights

```
  ┌────────────────────────────────────────────────────────────────────────┐
  │  🎯 Lakshya Analytics Engine                                           │
  │  ├── ⚡ 1-Click Testbook & Portal Bookmarklet (Zero Typing Auto-Sync)   │
  │  ├── 📊 Score vs Cutoff Trend Line Charts (Chart.js)                   │
  │  ├── 🕸️ Subject Mastery Radar (Pinpoint Strong vs Weak Areas)         │
  │  ├── 🚨 Critical Weakness Badges (Actionable Revision Focus)           │
  │  ├── 📖 Cognitive Error Diary (Silly vs Concept vs Time Pressure)      │
  │  ├── 📸 Scorecard Screenshot OCR / Ctrl+V Clipboard Upload            │
  │  ├── 🌐 12 Indian Languages i18n Switcher                              │
  │  └── 💾 1-Click JSON Backup & Full Database Restore                    │
  └────────────────────────────────────────────────────────────────────────┘
```

1. **⚡ 1-Click Universal Testbook Bookmarklet**: Sync your test scores directly from Testbook or Oliveboard result pages with a single click in your browser bookmarks bar—zero manual score entry required!
2. **Automated Penalty Engine**: Negative marks are computed mathematically based on exact official notification rules for each examination.
3. **Cognitive Mistake Taxonomy**: Tag each mistake by category:
   - `Silly Error` (Calculation slip, missed question nuance)
   - `Formula Gap` (Forgot formula or constant)
   - `Concept Gap` (Theoretical topic unlearned)
   - `Time Pressure` (Rushed during last 10 minutes)
   - `Blind Guess` (Negative mark gamble)
4. **Smart Radar Breakdown**: Visualizes your balance across Quantitative Aptitude, Reasoning, General Science, Technical Core, and General Awareness.
5. **Scorecard Image Upload**: Upload screenshot images or paste directly from clipboard (`Ctrl + V`).
6. **Optional Kanboard Integration**: Seamlessly syncs syllabus tasks, stage milestones, and exam targets from self-hosted Kanboard.

---

### ⚡ 1-Click Testbook Bookmarklet (Zero Typing Mock Sync)

Lakshya includes a smart browser bookmarklet that extracts your scores, attempted counts, and target cutoff directly from any Testbook analysis page and syncs it to your database in less than 1 second.

- 🇬🇧 **English:** Open any Testbook mock test analysis page, click **"⚡ Sync to Lakshya"** in your bookmarks bar, and your score, penalty calculation, and accuracy are stored automatically!
- 🇮🇳 **বাংলা:** টেস্টবুক বা অন্য পোর্টালে মক টেস্টের রেজাল্ট পেইজে থাকা অবস্থায় ব্রাউজারের বুকমার্কস বারে রাখা **"⚡ Sync to Lakshya"** বোতামে ১টি ক্লিক করলেই আপনার প্রাপ্ত নম্বর, কাটঅফ ও নির্ভুলতা লক্ষ্য ট্র্যাকারে সেভ হয়ে যাবে।
- 🇮🇳 **हिन्दी:** टेस्टबुक के रिजल्ट / एनालिसिस पेज पर रहते हुए बस अपने बुकमार्क बार में **"⚡ Sync to Lakshya"** पर क्लिक करें। आपका स्कोर, सही/गलत प्रश्न और एक्यूरेसी तुरंत लक्ष्य ट्रैकर में सिंक हो जाएगी।
- 🇮🇳 **தமிழ்:** டெஸ்ட்புக் (Testbook) முடிவு பக்கத்தில் இருக்கும்போது உங்கள் உலாவி புக்மார்க் பாரில் உள்ள **"⚡ Sync to Lakshya"** பொத்தானை ஒருமுறை கிளிக் செய்தால் போதும், உங்கள் மதிப்பெண்கள் தானாகவே சேமிக்கப்படும்.

#### 📌 Bookmarklet Code (Pre-configured)
To create it manually in your browser, create a new bookmark, name it `⚡ Sync to Lakshya`, and set the URL to:
```javascript
javascript:(function(){const t=document.body.innerText;const isCGL=/ssc\s*cgl/i.test(t);const isCHSL=/ssc\s*chsl/i.test(t);const isJE_SSC=/ssc\s*je/i.test(t);const isRRB_JE=/rrb\s*je|junior\s*engineer/i.test(t);const isALP=/alp|assistant\s*loco/i.test(t);const isNTPC=/ntpc/i.test(t);const isWBPSC=/wbpsc|wbcs|miscellaneous/i.test(t);const isBanking=/ibps|sbi|po\s*prelim/i.test(t);const isGATE=/gate/i.test(t);const title=(document.querySelector('h1, [class*="testTitle"], [class*="test-title"]')?.innerText||document.title||'Testbook Mock').substring(0,50).trim();const scoreM=t.match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+)\s+Score/i)||t.match(/Score\s*[:=\-]?\s*(\d+(?:\.\d+)?)/i);const attM=t.match(/(\d+)\s*\/\s*(\d+)\s+Attempted/i)||t.match(/Attempted\s*[:=\-]?\s*(\d+)/i);const accM=t.match(/(\d+(?:\.\d+)?)\s*%\s+Accuracy/i);const cutoffM=t.match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)\s*Cutoff Gap/i);let exam_code='custom';let exam_name='Competitive Mock Test';let m=1.0;let p=0.3333;let totalM=100;let totalQ=100;let defaultCutoff=65;if(isCGL){exam_code='ssc-cgl';exam_name='SSC CGL (Tier-1)';m=2.0;p=0.50;totalM=200;totalQ=100;defaultCutoff=138;}else if(isCHSL){exam_code='ssc-chsl';exam_name='SSC CHSL (Tier-1)';m=2.0;p=0.50;totalM=200;totalQ=100;defaultCutoff=142;}else if(isJE_SSC){exam_code='ssc-je';exam_name='SSC JE Paper-1';m=1.0;p=0.25;totalM=200;totalQ=200;defaultCutoff=132;}else if(isRRB_JE){exam_code='rrb-je';exam_name='RRB JE (CBT-1)';m=1.0;p=0.3333;totalM=100;totalQ=100;defaultCutoff=68;}else if(isALP){exam_code='rrb-alp';exam_name='RRB ALP (CBT-1)';m=1.0;p=0.3333;totalM=75;totalQ=75;defaultCutoff=48;}else if(isNTPC){exam_code='rrb-ntpc';exam_name='RRB NTPC (CBT-1)';m=1.0;p=0.3333;totalM=100;totalQ=100;defaultCutoff=74;}else if(isWBPSC){exam_code='wbpsc-misc';exam_name='WBPSC Miscellaneous';m=2.0;p=0.6667;totalM=200;totalQ=100;defaultCutoff=125;}else if(isBanking){exam_code='ibps-po';exam_name='IBPS / SBI PO Prelims';m=1.0;p=0.25;totalM=100;totalQ=100;defaultCutoff=58;}else if(isGATE){exam_code='gate-eng';exam_name='GATE Engineering';m=1.0;p=0.3333;totalM=100;totalQ=65;defaultCutoff=35;}const score=scoreM?parseFloat(scoreM[1]):0;if(scoreM&&scoreM[2])totalM=parseFloat(scoreM[2]);const att=attM?parseInt(attM[1]):0;if(attM&&attM[2])totalQ=parseInt(attM[2]);const cutoff=cutoffM?parseFloat(cutoffM[2]||cutoffM[1]):defaultCutoff;const cor=Math.round((score+p*att)/(m+p));const wrg=Math.max(0,att-cor);fetch('http://<YOUR-SERVER-IP>:8856/api/mocks',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({exam_code:exam_code,exam_name:exam_name,test_title:title,provider:'Testbook',test_date:new Date().toISOString().split('T')[0],test_type:'full_mock',total_q:totalQ,total_marks:totalM,attempted:att,correct:cor,wrong:wrg,target_cutoff:cutoff,time_spent_min:60,marks_per_correct:m,penalty_per_wrong:p,notes:'Synced via 1-Click Bookmarklet from Testbook Analysis page.'})}).then(r=>r.json()).then(d=>{alert('🎯 Lakshya Tracker Sync Successful!\n\nExam: '+exam_name+'\nScore: '+score+' / '+totalM+'\nAttempted: '+att+' (Correct: '+cor+', Wrong: '+wrg+')\nAccuracy: '+(accM?accM[1]:'')+'%');}).catch(e=>alert('❌ Sync Error: '+e));})();
```
*(Tip: In the Lakshya web UI, open the **📖 Setup Guide** and simply drag the ready-to-use **⚡ Sync to Lakshya** button straight to your bookmarks bar — it will automatically detect and bind to your exact server address!)*

---

## ⚙️ Configuration & Environment Variables

All settings can be configured via environment variables or a `.env` file:

| Variable | Default | Description |
| :--- | :--- | :--- |
| `PORT` | `8856` | HTTP listening port for the web service. |
| `HOST` | `0.0.0.0` | Host IP interface binding. |
| `DATA_DIR` | `/app/data` | Directory where SQLite database and scorecard uploads are stored. |
| `KANBOARD_URL` | *(None / Optional)* | JSON-RPC endpoint of your Kanboard instance (e.g. `http://kanboard:80/jsonrpc.php`). |
| `KANBOARD_USER` | `ai` | Username for Kanboard JSON-RPC authentication. |
| `KANBOARD_TOKEN` | *(None / Optional)* | API token for Kanboard JSON-RPC. |
| `KANBOARD_PROJECT_ID`| `4` | Project ID for exam tracking board in Kanboard. |

---

## 🛠️ Technology Stack

- **Backend**: Python 3.12 Standard Library (`http.server`, `sqlite3`, `urllib`, `hashlib`) — *zero third-party dependencies*.
- **Database**: SQLite 3 with Write-Ahead Logging (`WAL` mode) and Foreign Key integrity.
- **Frontend**: Responsive HTML5, Tailwind CSS, Vanilla JavaScript (ES6+), Chart.js.
- **PWA**: Custom Service Worker (`sw.js`) with cache-first strategy for sub-100ms offline starts.
- **Container**: Minimal Alpine Linux Docker image (~18 MB compressed).

---

## 📄 License

This project is open-source and released under the **[MIT License](LICENSE)**. Free for personal, educational, and commercial use.

<div align="center">
  <b>Built for dedicated aspirants aiming for 100% mastery. 🎯</b>
</div>
