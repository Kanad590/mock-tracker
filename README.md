# 🎯 Lakshya Mock & Marks Tracker (লক্ষ্য ট্র্যাকার)

> **Ultra-lightweight self-hosted Mock Test & Marks Analytics Engine for Indian Competitive Exams**  
> *(RRB JE, WBPSC, SSC CGL/CHSL, Banking, GATE, and State PSCs)*

[![Docker Pulls](https://img.shields.io/docker/pulls/saman514/mock-tracker.svg)](https://hub.docker.com/r/saman514/mock-tracker)
[![Docker Image Size](https://img.shields.io/docker/image-size/saman514/mock-tracker/latest)](https://hub.docker.com/r/saman514/mock-tracker)
[![GitHub License](https://img.shields.io/github/license/Kanad590/mock-tracker)](https://github.com/Kanad590/mock-tracker/blob/main/LICENSE)
[![RAM Usage](https://img.shields.io/badge/RAM%20Footprint-%3C%2025%20MB-emerald)](#)

---

## 🌟 Key Features

- **📱 100% Mobile-Friendly & Native PWA**: Optimized for iPhone, iPad, and Android with bottom navigation dock, finger-friendly touch targets, and full offline caching via service workers (`sw.js`).
- **📊 Real-time Scoring & Negative Penalty Engine**: Pre-configured penalty schemes (1/3rd, 1/4th, 0.25, 0.3333) with instant accuracy and net score calculations.
- **📈 Visual Analytics**: Score progression vs target cutoff line chart, subject mastery radar, and mistake distribution breakdown powered by Chart.js.
- **⚡ Weak vs Strong Point Radar**: Automatically identifies critical weak chapters and high-mastery areas with negative marks impact tracking.
- **📷 Scorecard OCR Screenshot Scanning**: Client-side WASM OCR allows uploading screenshots from Testbook, Oliveboard, or Adda247, or simply pressing `Ctrl + V` to auto-extract marks.
- **🔄 Kanboard 2-Way Sync**: Synchronizes active pursued exams and target cutoffs directly with self-hosted Kanboard instances.
- **🌐 12 Indian Languages + English**: Instant reactive internationalization (`en`, `bn`, `hi`, `ta`, `te`, `mr`, `gu`, `kn`, `ml`, `pa`, `or`, `as`).
- **💾 Zero External Database Dependencies**: Pure Python 3 + SQLite3 WAL mode running in a lightweight Alpine container consuming < 25 MB RAM (perfect for Raspberry Pi 3B+ / home servers).

---

## 🚀 Quick Start with Docker

### Option 1: Run with Docker CLI
```bash
docker run -d \
  --name mock-tracker \
  --restart unless-stopped \
  -p 8856:8856 \
  -v $(pwd)/data:/app/data \
  saman514/mock-tracker:latest
```

Open your browser at `http://localhost:8856` (or `http://<your-server-ip>:8856`).

### Option 2: Run with Docker Compose
Create a `docker-compose.yml`:
```yaml
services:
  mock-tracker:
    image: saman514/mock-tracker:latest
    container_name: mock-tracker
    restart: always
    ports:
      - "8856:8856"
    volumes:
      - ./data:/app/data
    deploy:
      resources:
        limits:
          memory: 48M
```
Then run:
```bash
docker compose up -d
```

---

## 📱 Mobile Setup & Remote Access

1. **At Home (Local Wi-Fi)**: Access directly at `http://<LAN_IP>:8856` (e.g. `http://192.168.29.2:8856`).
2. **Outside / On Mobile Data (Tailscale VPN)**: Connect your phone to Tailscale and open `http://<TAILSCALE_IP>:8856` (e.g. `http://100.80.199.101:8856`).
3. **Install as App (1-Tap PWA)**:
   - **Android (Chrome)**: Tap `⋮` (menu) -> **"Install app"** or **"Add to Home screen"**.
   - **iPhone (Safari)**: Tap Share button `⎋` -> **"Add to Home Screen (+)"**.

---

## 🛠️ Tech Stack

- **Backend**: Python 3.12 (Standard Library `http.server` & `sqlite3`), zero bloated frameworks.
- **Frontend**: Vanilla JavaScript (ES6+), Tailwind CSS CDN, Chart.js, Tesseract.js WASM OCR.
- **Storage**: SQLite3 with Write-Ahead Logging (WAL) and foreign keys enabled.
- **Base Image**: `python:3.12-alpine` (< 60 MB uncompressed image size).

---

## 📄 License

MIT License. Designed and developed with ❤️ for competitive exam aspirants.
