<div align="center">

# 🎯 Lakshya Mock & Marks Tracker | লক্ষ্য ট্র্যাকার
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
  │  ├── 📊 Score vs Cutoff Trend Line Charts (Chart.js)                   │
  │  ├── 🕸️ Subject Mastery Radar (Pinpoint Strong vs Weak Areas)         │
  │  ├── 🚨 Critical Weakness Badges (Actionable Revision Focus)           │
  │  ├── 📖 Cognitive Error Diary (Silly vs Concept vs Time Pressure)      │
  │  ├── 📸 Scorecard Screenshot OCR / Ctrl+V Clipboard Upload            │
  │  ├── 🌐 12 Indian Languages i18n Switcher                              │
  │  └── 💾 1-Click JSON Backup & Full Database Restore                    │
  └────────────────────────────────────────────────────────────────────────┘
```

1. **Automated Penalty Engine**: Negative marks are computed mathematically based on exact official notification rules for each examination.
2. **Cognitive Mistake Taxonomy**: Tag each mistake by category:
   - `Silly Error` (Calculation slip, missed question nuance)
   - `Formula Gap` (Forgot formula or constant)
   - `Concept Gap` (Theoretical topic unlearned)
   - `Time Pressure` (Rushed during last 10 minutes)
   - `Blind Guess` (Negative mark gamble)
3. **Smart Radar Breakdown**: Visualizes your balance across Quantitative Aptitude, Reasoning, General Science, Technical Core, and General Awareness.
4. **Scorecard Image Upload**: Upload screenshot images or paste directly from clipboard (`Ctrl + V`).
5. **Optional Kanboard Integration**: Seamlessly syncs syllabus tasks, stage milestones, and exam targets from self-hosted Kanboard.

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
