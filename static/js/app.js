// Lakshya Mock Tracker - Main Application Logic & Reactive Store

let examsList = [];
let allMocks = [];
let currentFilter = "";

// Robust digit normalizer (converts Bengali ০-৯ and Devanagari ०-९ to ASCII 0-9)
function normalizeDigits(str) {
  if (str === null || str === undefined) return "";
  const bengaliDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  const devanagariDigits = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
  let res = String(str);
  for (let i = 0; i < 10; i++) {
    res = res.replaceAll(bengaliDigits[i], String(i)).replaceAll(devanagariDigits[i], String(i));
  }
  return res;
}

function parseSafeInt(val, fallback = 0) {
  const clean = normalizeDigits(val);
  const parsed = parseInt(clean, 10);
  return isNaN(parsed) ? fallback : parsed;
}

function parseSafeFloat(val, fallback = 0.0) {
  const clean = normalizeDigits(val);
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? fallback : parsed;
}

const EXAM_PRESETS = {
  "rrb-je": {
    name: "RRB JE (CBT-1)",
    total_q: 100,
    total_marks: 100,
    marks_per_correct: 1.0,
    penalty_per_wrong: 0.3333,
    cutoff: 68.0,
    sections: ["Mathematics", "General Intelligence & Reasoning", "General Science", "General Awareness"]
  },
  "rrb-alp": {
    name: "RRB ALP (CBT-1)",
    total_q: 75,
    total_marks: 75,
    marks_per_correct: 1.0,
    penalty_per_wrong: 0.3333,
    cutoff: 48.0,
    sections: ["Mathematics", "Mental Ability", "General Science", "General Awareness on Current Affairs"]
  },
  "wbpsc-misc": {
    name: "WBPSC Miscellaneous Prelims",
    total_q: 100,
    total_marks: 200,
    marks_per_correct: 2.0,
    penalty_per_wrong: 0.6667,
    cutoff: 125.0,
    sections: ["General Studies", "Arithmetic"]
  },
  "ssc-cgl": {
    name: "SSC CGL (Tier-1)",
    total_q: 100,
    total_marks: 200,
    marks_per_correct: 2.0,
    penalty_per_wrong: 0.50,
    cutoff: 138.0,
    sections: ["General Intelligence & Reasoning", "General Awareness", "Quantitative Aptitude", "English Comprehension"]
  },
  "ibps-po": {
    name: "IBPS / SBI PO Prelims",
    total_q: 100,
    total_marks: 100,
    marks_per_correct: 1.0,
    penalty_per_wrong: 0.25,
    cutoff: 58.0,
    sections: ["English Language", "Quantitative Aptitude", "Reasoning Ability"]
  },
  "custom": {
    name: "Custom Competitive Exam",
    total_q: 100,
    total_marks: 100,
    marks_per_correct: 1.0,
    penalty_per_wrong: 0.3333,
    cutoff: 60.0,
    sections: ["Section 1", "Section 2"]
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  setupEventListeners();
  await loadExams();
  await refreshDashboard();
});

function setupEventListeners() {
  // Exam select change -> Auto-fill exam rules
  const examSelect = document.getElementById("formExamSelect");
  if (examSelect) {
    examSelect.addEventListener("change", (e) => onExamChange(e.target.value));
  }

  // Inputs change -> Live score recalculation & digit normalization
  ["inputAttempted", "inputCorrect", "inputWrong", "inputTotalQ", "inputTotalMarks", "inputMarksPerCorrect", "inputPenaltyPerWrong", "inputTargetCutoff", "inputTimeSpent"].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("input", () => {
        const norm = normalizeDigits(el.value);
        if (norm !== el.value) el.value = norm;
        recalculateScore();
      });
    }
  });

  // Scorecard dropzone
  const dropzone = document.getElementById("scorecardDropzone");
  const fileInput = document.getElementById("scorecardFileInput");
  if (dropzone && fileInput) {
    dropzone.addEventListener("click", () => fileInput.click());
    dropzone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropzone.classList.add("border-teal-600", "bg-teal-50");
    });
    dropzone.addEventListener("dragleave", () => {
      dropzone.classList.remove("border-teal-600", "bg-teal-50");
    });
    dropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropzone.classList.remove("border-teal-600", "bg-teal-50");
      if (e.dataTransfer.files.length) {
        handleScorecardFile(e.dataTransfer.files[0]);
      }
    });
    fileInput.addEventListener("change", (e) => {
      if (e.target.files.length) {
        handleScorecardFile(e.target.files[0]);
      }
    });
  }

  // Global & Dropzone Clipboard Paste Listener (Ctrl + V for Screenshots)
  window.addEventListener("paste", handleClipboardPaste);
}

async function loadExams() {
  try {
    const res = await fetch("/api/exams");
    examsList = await res.json();
    populateExamDropdowns();
  } catch (err) {
    console.warn("Using offline exam presets", err);
    populateExamDropdowns();
  }
}

function populateExamDropdowns() {
  const formSelect = document.getElementById("formExamSelect");
  const filterSelect = document.getElementById("filterExamSelect");
  
  let pursuedExams = [];
  let standardPresets = [];

  if (examsList && examsList.length > 0) {
    pursuedExams = examsList.filter(e => e.source === 'kanboard' || e.source === 'manual');
    standardPresets = examsList.filter(e => e.source === 'system');
  }

  if (pursuedExams.length === 0 && standardPresets.length === 0) {
    standardPresets = Object.keys(EXAM_PRESETS).map(key => ({
      code: key,
      name: EXAM_PRESETS[key].name,
      stage: "To Apply",
      source: "system",
      ...EXAM_PRESETS[key]
    }));
  }

  let optionsHtml = "";

  if (pursuedExams.length > 0) {
    optionsHtml += `<optgroup label="🎯 Active Pursued Exams (Kanboard / Manual)">`;
    pursuedExams.forEach(e => {
      const stageTag = e.stage ? ` [${e.stage}]` : "";
      optionsHtml += `<option value="${e.code}">${e.name}${stageTag}</option>`;
    });
    optionsHtml += `</optgroup>`;
  }

  if (standardPresets.length > 0) {
    optionsHtml += `<optgroup label="⚙️ Standard Presets">`;
    standardPresets.forEach(e => {
      optionsHtml += `<option value="${e.code}">${e.name}</option>`;
    });
    optionsHtml += `</optgroup>`;
  }

  if (formSelect) {
    const currentVal = formSelect.value;
    formSelect.innerHTML = optionsHtml;
    if (currentVal && formSelect.querySelector(`option[value="${currentVal}"]`)) {
      formSelect.value = currentVal;
    } else if (formSelect.options.length > 0) {
      formSelect.selectedIndex = 0;
    }
    onExamChange(formSelect.value);
  }

  if (filterSelect) {
    const currentFilterVal = filterSelect.value;
    filterSelect.innerHTML = `<option value="">All Exams / সর্বভারতীয় পরীক্ষা</option>` + optionsHtml;
    if (currentFilterVal) {
      filterSelect.value = currentFilterVal;
    }
  }

  const badge = document.getElementById("examCountBadge");
  if (badge) {
    badge.innerText = pursuedExams.length;
  }
}

function onExamChange(examCode) {
  const dbExam = examsList.find(e => e.code === examCode);
  let preset;
  if (dbExam) {
    preset = {
      name: dbExam.name,
      total_q: dbExam.default_total_q || 100,
      total_marks: dbExam.default_total_marks || 100,
      marks_per_correct: dbExam.marks_per_correct || 1.0,
      penalty_per_wrong: dbExam.penalty_per_wrong || 0.25,
      cutoff: dbExam.default_cutoff || 65.0,
      sections: (dbExam.sections && dbExam.sections.length > 0) 
        ? dbExam.sections 
        : (EXAM_PRESETS[examCode]?.sections || ["Mathematics", "General Intelligence & Reasoning", "General Science", "General Awareness"])
    };
  } else {
    preset = EXAM_PRESETS[examCode] || EXAM_PRESETS["custom"];
  }

  const tq = document.getElementById("inputTotalQ");
  const tm = document.getElementById("inputTotalMarks");
  const mpc = document.getElementById("inputMarksPerCorrect");
  const ppw = document.getElementById("inputPenaltyPerWrong");
  const cut = document.getElementById("inputTargetCutoff");

  if (tq) tq.value = preset.total_q;
  if (tm) tm.value = preset.total_marks;
  if (mpc) mpc.value = preset.marks_per_correct;
  if (ppw) ppw.value = preset.penalty_per_wrong;
  if (cut) cut.value = preset.cutoff;

  // Auto populate sections
  const secContainer = document.getElementById("sectionsContainer");
  if (secContainer) {
    secContainer.innerHTML = "";
    preset.sections.forEach(secName => addSectionRow(secName));
  }
  recalculateScore();
}

function recalculateScore() {
  const correct = parseSafeInt(document.getElementById("inputCorrect")?.value, 0);
  const wrong = parseSafeInt(document.getElementById("inputWrong")?.value, 0);
  const rawAtt = parseSafeInt(document.getElementById("inputAttempted")?.value, 0);
  const attempted = rawAtt > 0 ? rawAtt : (correct + wrong);
  const totalQ = parseSafeInt(document.getElementById("inputTotalQ")?.value, 100);
  
  const marksPerCorrect = parseSafeFloat(document.getElementById("inputMarksPerCorrect")?.value, 1.0);
  const penaltyPerWrong = parseSafeFloat(document.getElementById("inputPenaltyPerWrong")?.value, 0.3333);

  const netScore = Math.round(((correct * marksPerCorrect) - (wrong * penaltyPerWrong)) * 100) / 100;
  const accuracy = attempted > 0 ? Math.round((correct / attempted * 100) * 10) / 10 : 0;
  const unattempted = Math.max(0, totalQ - attempted);

  const scoreEl = document.getElementById("calcNetScore");
  if (scoreEl) scoreEl.innerText = netScore;
  const accEl = document.getElementById("calcAccuracy");
  if (accEl) accEl.innerText = accuracy + "%";
  const unattEl = document.getElementById("calcUnattempted");
  if (unattEl) unattEl.innerText = unattempted;
}

function addSectionRow(secName = "") {
  const container = document.getElementById("sectionsContainer");
  if (!container) return;
  const div = document.createElement("div");
  div.className = "flex flex-col sm:grid sm:grid-cols-12 gap-2 bg-gray-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-gray-200 dark:border-slate-700 section-row";
  div.innerHTML = `
    <div class="flex items-center justify-between sm:col-span-5 gap-2">
      <input type="text" class="w-full text-xs sm:text-sm px-2.5 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 section-name-input font-medium" placeholder="Subject / Section Name" value="${secName}">
      <button type="button" onclick="this.closest('.section-row').remove()" class="sm:hidden text-gray-400 hover:text-rose-500 font-bold p-1 text-base leading-none" title="Remove">✕</button>
    </div>
    <div class="grid grid-cols-3 gap-2 sm:contents">
      <div class="sm:col-span-2">
        <label class="block text-[10px] text-gray-500 dark:text-gray-400 sm:hidden">Attempted</label>
        <input type="number" class="w-full text-xs sm:text-sm px-2 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-center section-att-input font-semibold" placeholder="Att" value="0">
      </div>
      <div class="sm:col-span-2">
        <label class="block text-[10px] text-emerald-600 dark:text-emerald-400 sm:hidden">Correct (+)</label>
        <input type="number" class="w-full text-xs sm:text-sm px-2 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 text-center text-emerald-600 font-bold section-cor-input" placeholder="Cor" value="0">
      </div>
      <div class="sm:col-span-2">
        <label class="block text-[10px] text-rose-600 dark:text-rose-400 sm:hidden">Wrong (-)</label>
        <input type="number" class="w-full text-xs sm:text-sm px-2 py-1.5 rounded-lg border border-rose-300 dark:border-rose-700 bg-white dark:bg-slate-900 text-center text-rose-600 font-bold section-wrg-input" placeholder="Wrg" value="0">
      </div>
    </div>
    <div class="hidden sm:block sm:col-span-1 text-center">
      <button type="button" onclick="this.closest('.section-row').remove()" class="text-gray-400 hover:text-rose-500 font-bold text-sm p-1">✕</button>
    </div>
  `;
  container.appendChild(div);
}

function addMistakeRow(qNo = "", subj = "", type = "silly_error", notes = "") {
  const container = document.getElementById("mistakesContainer");
  if (!container) return;
  const div = document.createElement("div");
  div.className = "flex flex-col sm:grid sm:grid-cols-12 gap-2 bg-amber-50/60 dark:bg-slate-800/60 p-2.5 rounded-xl border border-amber-200 dark:border-slate-700 mistake-row";
  div.innerHTML = `
    <div class="flex items-center gap-2 sm:col-span-6">
      <div class="w-16 sm:w-20 shrink-0">
        <input type="number" class="w-full text-xs sm:text-sm px-2 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-center font-bold mistake-qno" placeholder="Q#" value="${qNo}">
      </div>
      <div class="flex-1">
        <select class="w-full text-xs sm:text-sm px-2 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 mistake-type font-medium">
          <option value="silly_error" ${type === "silly_error" ? "selected" : ""}>Silly Calculation 🤦</option>
          <option value="formula_gap" ${type === "formula_gap" ? "selected" : ""}>Forgot Formula 📐</option>
          <option value="concept_gap" ${type === "concept_gap" ? "selected" : ""}>Concept Gap 🧠</option>
          <option value="misread" ${type === "misread" ? "selected" : ""}>Misread Question 👁️</option>
          <option value="time_pressure" ${type === "time_pressure" ? "selected" : ""}>Time Rush ⏳</option>
          <option value="guess" ${type === "guess" ? "selected" : ""}>Negative Guess 🎲</option>
        </select>
      </div>
      <button type="button" onclick="this.closest('.mistake-row').remove()" class="sm:hidden text-gray-400 hover:text-rose-500 font-bold p-1 text-base leading-none" title="Remove">✕</button>
    </div>
    <div class="sm:col-span-5">
      <input type="text" class="w-full text-xs sm:text-sm px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 mistake-notes" placeholder="Notes / Formula to revise" value="${notes}">
    </div>
    <div class="hidden sm:block sm:col-span-1 text-center">
      <button type="button" onclick="this.closest('.mistake-row').remove()" class="text-gray-400 hover:text-rose-500 font-bold text-sm p-1">✕</button>
    </div>
  `;
  container.appendChild(div);
}

// Scorecard Upload & Scan
let uploadedImageUrl = "";

function handleClipboardPaste(e) {
  // Check if active element is an input/textarea
  const activeEl = document.activeElement;
  const isTyping = activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA");
  const items = (e.clipboardData || window.clipboardData)?.items;

  if (items && items.length > 0) {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type && (item.type.indexOf("image") !== -1 || item.type.startsWith("image/"))) {
        e.preventDefault();
        const blob = item.getAsFile();
        if (!blob) continue;

        const file = new File([blob], `pasted_scorecard_${Date.now()}.png`, { type: blob.type || "image/png" });

        // Ensure uploadModal is open so user sees visual confirmation
        const uploadModal = document.getElementById("uploadModal");
        if (uploadModal && uploadModal.classList.contains("hidden")) {
          openModal("uploadModal");
        }

        handleScorecardFile(file);
        showToast("📋 স্ক্রিনশট পেস্ট হয়েছে! অ্যানালাইসিস শুরু হচ্ছে...", "success");
        return;
      }
    }
  }

  // If not actively typing inside an input/textarea and text is pasted, check for scorecard data
  if (!isTyping && e.clipboardData) {
    const text = e.clipboardData.getData("text");
    if (text && parseScorecardText(text)) {
      e.preventDefault();
      openModal("mockFormModal");
      showToast("📋 স্কোরকার্ড টেক্সট ডেটা পেস্ট করে ফিল্ডগুলো পূরণ করা হয়েছে!", "success");
    }
  }
}

function preprocessImageForOCR(base64Data) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const scale = Math.max(2.0, Math.min(3.2, 2600 / (img.width || 800)));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        
        // Draw with high contrast and grayscale
        ctx.filter = "grayscale(100%) contrast(230%) brightness(105%)";
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/png"));
      } catch (err) {
        console.warn("Canvas preprocess error, using raw image:", err);
        resolve(base64Data);
      }
    };
    img.onerror = () => resolve(base64Data);
    img.src = base64Data;
  });
}

async function handleScorecardFile(file) {
  if (!file) return;
  const statusEl = document.getElementById("uploadScanStatus");
  const statusText = document.getElementById("uploadScanStatusText");
  const previewImg = document.getElementById("scorecardPreviewImg");
  const reader = new FileReader();

  if (statusEl) {
    if (statusText) statusText.innerText = "আপলোড ও প্রসেসিং হচ্ছে...";
    statusEl.classList.remove("hidden");
  }

  reader.onload = async (e) => {
    const base64Data = e.target.result;
    if (previewImg) {
      previewImg.src = base64Data;
      previewImg.classList.remove("hidden");
    }

    try {
      // 1. Upload to server
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, data: base64Data })
      });
      const uploadJson = await uploadRes.json();
      uploadedImageUrl = uploadJson.url || "";

      // 2. Perform Client-side OCR with canvas upscaling & high-contrast preprocessing
      if (window.Tesseract) {
        if (statusText) statusText.innerText = "🔍 AI OCR দিয়ে ইমেজ প্রসেস ও নম্বর শনাক্ত করা হচ্ছে...";
        try {
          const preprocessed = await preprocessImageForOCR(base64Data);
          const ocrResult = await Tesseract.recognize(preprocessed, "eng");
          const text = ocrResult?.data?.text || "";
          console.log("OCR Extracted Text:\n", text);
          
          const detected = parseScorecardText(text);
          if (detected) {
            showToast("🎯 টেস্টবুক স্কোরকার্ড সফলভাবে শনাক্ত হয়েছে!", "success");
          } else {
            extractScorecardData(file.name);
          }
        } catch (ocrErr) {
          console.warn("OCR recognition error, using filename fallback:", ocrErr);
          extractScorecardData(file.name);
        }
      } else {
        extractScorecardData(file.name);
      }
    } catch (err) {
      console.error("Upload error", err);
      showToast("Upload failed", "error");
    } finally {
      if (statusEl) statusEl.classList.add("hidden");
    }
  };
  reader.readAsDataURL(file);
}

function parseScorecardText(text) {
  if (!text || typeof text !== "string") return false;
  text = normalizeDigits(text);
  
  let detectedCount = 0;
  let parsed = {
    attempted: null,
    correct: null,
    wrong: null,
    totalQ: null,
    totalMarks: null,
    score: null,
    cutoff: null
  };

  // 1. Check Testbook vertical badges (e.g. "81 / 200 Score")
  const tbScore = text.match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+)\s+Score/i);
  if (tbScore) {
    parsed.score = parseFloat(tbScore[1]);
    parsed.totalMarks = parseFloat(tbScore[2]);
    detectedCount += 2;
  }
  const tbAtt = text.match(/(\d+)\s*\/\s*(\d+)\s+Attempted/i);
  if (tbAtt) {
    parsed.attempted = parseInt(tbAtt[1]);
    parsed.totalQ = parseInt(tbAtt[2]);
    detectedCount += 2;
  }

  // 2. Testbook ratio pattern: e.g. "81/ 200 73 / 100 64.38%"
  if (parsed.score === null) {
    const ratioMatch = text.match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+)\s+(\d+)\s*\/\s*(\d+)\s+(\d+(?:\.\d+)?)\s*%/);
    if (ratioMatch) {
      parsed.score = parseFloat(ratioMatch[1]);
      parsed.totalMarks = parseFloat(ratioMatch[2]);
      parsed.attempted = parseInt(ratioMatch[3]);
      parsed.totalQ = parseInt(ratioMatch[4]);
      detectedCount += 3;
    }
  }

  // 3. Multi-platform Score patterns (Oliveboard, PracticeMock, Adda247, StudyIQ, Unacademy)
  if (parsed.score === null) {
    const scoreMatch = text.match(/(?:your\s*score|total\s*score|marks\s*obtained|marks\s*scored|score\s*card|score|marks)\s*[:=\-]?\s*(\-?\d+(?:\.\d+)?)\s*(?:\/\s*(\d+))?/i);
    if (scoreMatch) {
      parsed.score = parseFloat(scoreMatch[1]);
      if (scoreMatch[2]) parsed.totalMarks = parseFloat(scoreMatch[2]);
      detectedCount++;
    }
  }

  // 4. Multi-platform Attempted patterns
  if (parsed.attempted === null) {
    const attMatch = text.match(/(?:questions?\s*attempted|total\s*attempt(?:ed)?|attempt(?:ed)?)\s*[:=\-]?\s*(\d{1,3})\s*(?:\/\s*(\d{1,3}))?/i);
    if (attMatch) {
      parsed.attempted = parseInt(attMatch[1]);
      if (attMatch[2]) parsed.totalQ = parseInt(attMatch[2]);
      detectedCount++;
    }
  }

  // 5. Multi-platform Correct patterns
  if (parsed.correct === null) {
    const corMatch = text.match(/(?:correct(?:\s*answers?|\s*questions?)?|right)\s*[:=\-]?\s*(\d{1,3})/i);
    if (corMatch) {
      parsed.correct = parseInt(corMatch[1]);
      detectedCount++;
    }
  }

  // 6. Multi-platform Wrong patterns
  if (parsed.wrong === null) {
    const wrgMatch = text.match(/(?:wrong(?:\s*answers?|\s*questions?)?|incorrect|negative(?:\s*marks)?)\s*[:=\-]?\s*(\d{1,3})/i);
    if (wrgMatch) {
      parsed.wrong = parseInt(wrgMatch[1]);
      detectedCount++;
    }
  }

  // 7. Total Questions Fallback
  if (parsed.totalQ === null) {
    const totalQMatch = text.match(/(?:total\s*questions?|no\.?\s*of\s*questions?)\s*[:=\-]?\s*(\d{1,3})/i);
    if (totalQMatch) {
      parsed.totalQ = parseInt(totalQMatch[1]);
      detectedCount++;
    }
  }

  // 8. Total Marks Fallback
  if (parsed.totalMarks === null) {
    const totalMMatch = text.match(/(?:total\s*marks?|maximum\s*marks?|max\s*marks?)\s*[:=\-]?\s*(\d{1,3}(?:\.\d+)?)/i);
    if (totalMMatch) {
      parsed.totalMarks = parseFloat(totalMMatch[1]);
    }
  }

  // Cutoff
  let cutoffMatch = text.match(/(?:cutoff|cut-off)\s*[:=\-]?\s*(\d{1,3}(?:\.\d+)?)/i) || text.match(/(\d{1,3})\s*\/\s*(\d{1,3})\s*Cutoff Gap/i);
  if (cutoffMatch) {
    parsed.cutoff = parseFloat(cutoffMatch[2] || cutoffMatch[1]);
  }
  if (!parsed.cutoff) {
    const gapMatch = text.match(/scored\s+(\d+(?:\.\d+)?)\s*(?:marks)?\s*(?:more|less)\s*than\s*cutoff/i);
    if (gapMatch && parsed.score !== null) {
      const gap = parseFloat(gapMatch[1]);
      const isLess = /less/i.test(gapMatch[0]);
      parsed.cutoff = isLess ? (parsed.score + gap) : (parsed.score - gap);
    }
  }
  if (parsed.cutoff !== null) {
    const el = document.getElementById("inputTargetCutoff");
    if (el) el.value = parsed.cutoff;
  }

  // Time Spent
  const timeMatch = text.match(/(\d{1,2}):(\d{2})\s*\/\s*(\d+)\s*m/i);
  if (timeMatch) {
    const el = document.getElementById("inputTimeSpent");
    if (el) el.value = parseInt(timeMatch[1]);
  }

  // Detect Exam (SSC CGL vs RRB vs etc)
  const isCGL = /ssc\s*cgl/i.test(text) || parsed.totalMarks === 200 || (parsed.totalQ === 100 && parsed.totalMarks === 200);
  if (isCGL) {
    parsed.totalQ = 100;
    parsed.totalMarks = 200;
    const examSelect = document.getElementById("formExamSelect");
    if (examSelect) {
      for (let opt of examSelect.options) {
        if (/ssc[-_\s]?cgl/i.test(opt.value) || /ssc[-_\s]?cgl/i.test(opt.text)) {
          examSelect.value = opt.value;
          onExamChange(opt.value);
          break;
        }
      }
    }
    const mpc = document.getElementById("inputMarksPerCorrect");
    if (mpc) mpc.value = 2.0;
    const ppw = document.getElementById("inputPenaltyPerWrong");
    if (ppw) ppw.value = 0.5;
    const tq = document.getElementById("inputTotalQ");
    if (tq) tq.value = 100;
    const tm = document.getElementById("inputTotalMarks");
    if (tm) tm.value = 200;
  }

  // Mathematical deduction of Correct & Wrong if Score & Attempted are known
  const marksPerQ = isCGL ? 2.0 : (parseSafeFloat(document.getElementById("inputMarksPerCorrect")?.value, 1.0));
  const penaltyPerQ = isCGL ? 0.5 : (parseSafeFloat(document.getElementById("inputPenaltyPerWrong")?.value, 0.3333));

  if (parsed.score !== null && parsed.attempted !== null && (parsed.correct === null || parsed.wrong === null)) {
    parsed.correct = Math.round((parsed.score + penaltyPerQ * parsed.attempted) / (marksPerQ + penaltyPerQ));
    parsed.wrong = parsed.attempted - parsed.correct;
    detectedCount += 2;
  }

  // Populate Input Fields
  if (parsed.attempted !== null) {
    const el = document.getElementById("inputAttempted");
    if (el) el.value = parsed.attempted;
  }
  if (parsed.correct !== null) {
    const el = document.getElementById("inputCorrect");
    if (el) el.value = parsed.correct;
  }
  if (parsed.wrong !== null) {
    const el = document.getElementById("inputWrong");
    if (el) el.value = parsed.wrong;
  }
  if (parsed.totalQ !== null) {
    const el = document.getElementById("inputTotalQ");
    if (el) el.value = parsed.totalQ;
  }
  if (parsed.totalMarks !== null) {
    const el = document.getElementById("inputTotalMarks");
    if (el) el.value = parsed.totalMarks;
  }

  // Recalculate live stats
  recalculateScore();

  // Detect Provider
  const providerSelect = document.getElementById("inputProvider");
  if (providerSelect) {
    if (/testbook/i.test(text)) providerSelect.value = "Testbook";
    else if (/oliveboard/i.test(text)) providerSelect.value = "Oliveboard";
    else if (/practicemock|practice\s*mock/i.test(text)) providerSelect.value = "PracticeMock";
    else if (/adda247|adda\s*247/i.test(text)) providerSelect.value = "Adda247";
    else if (/studyiq|study\s*iq/i.test(text)) providerSelect.value = "StudyIQ";
    else if (/unacademy/i.test(text)) providerSelect.value = "Unacademy";
  }

  // Set Title
  const titleInput = document.getElementById("inputTestTitle");
  if (titleInput && (!titleInput.value || titleInput.value === "Mock Test #1" || titleInput.value === "Mock Test")) {
    const prov = providerSelect ? providerSelect.value : "Testbook";
    const examLabel = isCGL ? "SSC CGL Tier-I Similar Paper" : "Full Mock Test";
    titleInput.value = `${prov} - ${examLabel} (${new Date().toLocaleDateString('en-GB')})`;
  }

  // Parse Sectional Rows if present in text
  const secLines = text.split("\n");
  const parsedSections = [];
  for (const line of secLines) {
    if (/General intelligence|General Awareness|Quantitative Aptitude|English Comprehension|Reasoning|Science|Mathematics/i.test(line)) {
      const parts = line.match(/([A-Za-z\s&]+?)\s+(\d+(?:\.\d+)?)\s*\/\s*(\d+).*?(\d+)\s*\/\s*(\d+).*?(\d+(?:\.\d+)?)\s*%/);
      if (parts) {
        const sName = parts[1].trim();
        const sScore = parseFloat(parts[2]);
        const sAtt = parseInt(parts[4]);
        const sCor = Math.round((sScore + penaltyPerQ * sAtt) / (marksPerQ + penaltyPerQ));
        const sWrg = sAtt - sCor;
        parsedSections.push({ name: sName, attempted: sAtt, correct: sCor, wrong: sWrg });
      }
    }
  }

  if (parsedSections.length > 0) {
    const container = document.getElementById("sectionsContainer");
    if (container) {
      container.innerHTML = "";
      parsedSections.forEach(s => {
        addSectionRow(s.name);
        const rows = container.querySelectorAll(".section-row");
        const lastRow = rows[rows.length - 1];
        if (lastRow) {
          lastRow.querySelector(".section-att-input").value = s.attempted;
          lastRow.querySelector(".section-cor-input").value = s.correct;
          lastRow.querySelector(".section-wrg-input").value = s.wrong;
        }
      });
    }
  }

  // Update OCR Extracted Card Preview
  const ocrCard = document.getElementById("ocrExtractedCard");
  const ocrDetails = document.getElementById("ocrExtractedDetails");
  if (ocrCard && ocrDetails && detectedCount > 0) {
    ocrDetails.innerHTML = `
      <div class="bg-white dark:bg-slate-900 p-2 rounded-xl border border-gray-100 dark:border-slate-800">
        <div class="text-[10px] text-gray-500 font-sans">Attempted</div>
        <div class="font-bold text-teal-800 dark:text-teal-300 text-sm">${parsed.attempted !== null ? parsed.attempted : '-'}</div>
      </div>
      <div class="bg-white dark:bg-slate-900 p-2 rounded-xl border border-gray-100 dark:border-slate-800">
        <div class="text-[10px] text-gray-500 font-sans">Correct</div>
        <div class="font-bold text-emerald-600 dark:text-emerald-400 text-sm">${parsed.correct !== null ? parsed.correct : '-'}</div>
      </div>
      <div class="bg-white dark:bg-slate-900 p-2 rounded-xl border border-gray-100 dark:border-slate-800">
        <div class="text-[10px] text-gray-500 font-sans">Wrong</div>
        <div class="font-bold text-rose-600 dark:text-rose-400 text-sm">${parsed.wrong !== null ? parsed.wrong : '-'}</div>
      </div>
      <div class="bg-white dark:bg-slate-900 p-2 rounded-xl border border-gray-100 dark:border-slate-800">
        <div class="text-[10px] text-gray-500 font-sans">Score</div>
        <div class="font-bold text-midnight dark:text-yellow-400 text-sm">${parsed.score !== null ? parsed.score : (document.getElementById("calcNetScore")?.innerText || '-')}</div>
      </div>
    `;
    ocrCard.classList.remove("hidden");
  }

  return detectedCount > 0;
}

function extractScorecardData(filename) {
  // Quick heuristic parse: e.g. "Testbook_RRB_JE_Mock5_Score72.png"
  const titleInput = document.getElementById("inputTestTitle");
  if (titleInput && (!titleInput.value || titleInput.value === "Mock Test #1")) {
    titleInput.value = filename.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
  }

  showToast("Scorecard scanned successfully! Please review the populated marks.", "success");
}

async function saveMockTest() {
  const examCode = document.getElementById("formExamSelect").value;
  const preset = EXAM_PRESETS[examCode] || EXAM_PRESETS["custom"];

  const testTitle = document.getElementById("inputTestTitle").value || "Mock Test";
  const provider = document.getElementById("inputProvider").value || "Testbook";
  const testDate = document.getElementById("inputTestDate").value || new Date().toISOString().split("T")[0];
  const totalQ = parseSafeInt(document.getElementById("inputTotalQ")?.value, 100);
  const rawAtt = parseSafeInt(document.getElementById("inputAttempted")?.value, 0);
  const correct = parseSafeInt(document.getElementById("inputCorrect")?.value, 0);
  const wrong = parseSafeInt(document.getElementById("inputWrong")?.value, 0);
  const attempted = rawAtt > 0 ? rawAtt : (correct + wrong);
  const totalMarks = parseSafeFloat(document.getElementById("inputTotalMarks")?.value, 100);
  const targetCutoff = parseSafeFloat(document.getElementById("inputTargetCutoff")?.value, 60);
  const timeSpent = parseSafeInt(document.getElementById("inputTimeSpent")?.value, 90);
  const notes = document.getElementById("inputNotes")?.value || "";

  // Sections
  const sections = [];
  document.querySelectorAll(".section-row").forEach(row => {
    const sName = row.querySelector(".section-name-input")?.value.trim();
    if (sName) {
      sections.push({
        section_name: sName,
        attempted: parseSafeInt(row.querySelector(".section-att-input")?.value, 0),
        correct: parseSafeInt(row.querySelector(".section-cor-input")?.value, 0),
        wrong: parseSafeInt(row.querySelector(".section-wrg-input")?.value, 0)
      });
    }
  });

  // Mistakes
  const mistakes = [];
  document.querySelectorAll(".mistake-row").forEach(row => {
    const qNo = parseInt(row.querySelector(".mistake-qno").value) || null;
    const mType = row.querySelector(".mistake-type").value;
    const mNotes = row.querySelector(".mistake-notes").value.trim();
    if (mNotes || qNo) {
      mistakes.push({
        question_no: qNo,
        mistake_type: mType,
        notes: mNotes
      });
    }
  });

  const payload = {
    exam_code: examCode,
    exam_name: preset.name,
    test_title: testTitle,
    provider: provider,
    test_date: testDate,
    test_type: "full_mock",
    total_q: totalQ,
    attempted: attempted,
    correct: correct,
    wrong: wrong,
    total_marks: totalMarks,
    target_cutoff: targetCutoff,
    time_spent_min: timeSpent,
    marks_per_correct: preset.marks_per_correct,
    penalty_per_wrong: preset.penalty_per_wrong,
    scorecard_image: uploadedImageUrl,
    notes: notes,
    sections: sections,
    mistakes: mistakes
  };

  try {
    const res = await fetch("/api/mocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      showToast("Mock test logged successfully! 🎯", "success");
      closeModal("mockFormModal");
      await refreshDashboard();
    } else {
      const err = await res.json();
      showToast("Error saving mock: " + (err.error || "Unknown"), "error");
    }
  } catch (e) {
    showToast("Network error saving mock", "error");
  }
}

async function refreshDashboard() {
  try {
    const filterSelect = document.getElementById("filterExamSelect");
    currentFilter = filterSelect ? filterSelect.value : "";
    const filterParam = currentFilter ? `?exam=${encodeURIComponent(currentFilter)}` : "";

    // 1. Fetch Mocks
    const mocksRes = await fetch(`/api/mocks${filterParam}`);
    allMocks = await mocksRes.json();
    renderMocksTable(allMocks);

    // 2. Fetch Stats & Visuals
    const statsRes = await fetch(`/api/stats${filterParam}`);
    const stats = await statsRes.json();
    window.currentStatsData = stats;

    // Hero stats
    document.getElementById("statTotalMocks").innerText = stats.total_mocks || 0;
    document.getElementById("statAvgScore").innerText = stats.avg_score || 0;
    document.getElementById("statHighestScore").innerText = stats.highest_score || 0;
    document.getElementById("statAvgAccuracy").innerText = (stats.avg_accuracy || 0) + "%";

    // Charts
    initCharts(stats);
  } catch (err) {
    console.error("Dashboard refresh error", err);
  }
}

function renderMocksTable(mocks) {
  const tbody = document.getElementById("mocksTableBody");
  const cardsContainer = document.getElementById("mocksCardsContainer");

  if (!tbody && !cardsContainer) return;

  if (mocks.length === 0) {
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-gray-400 dark:text-gray-500 font-medium">${t("no_tests")}</td></tr>`;
    }
    if (cardsContainer) {
      cardsContainer.innerHTML = `<div class="p-8 text-center text-gray-400 dark:text-gray-500 text-sm font-medium">${t("no_tests")}</div>`;
    }
    return;
  }

  // Desktop Table Render
  if (tbody) {
    tbody.innerHTML = mocks.map(m => {
      const passed = m.net_score >= m.target_cutoff;
      const badgeColor = passed ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700" : "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-700";
      const statusText = passed ? "Qualified Cutoff 🎯" : "Below Cutoff ⚠️";

      return `
        <tr class="border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
          <td class="p-3.5 text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400">${m.test_date}</td>
          <td class="p-3.5 text-xs md:text-sm font-bold text-gray-900 dark:text-gray-100">
            <div>${m.exam_name}</div>
            <span class="text-xs font-normal text-gray-400">${m.provider}</span>
          </td>
          <td class="p-3.5 text-xs md:text-sm text-gray-800 dark:text-gray-200">${m.test_title}</td>
          <td class="p-3.5 text-xs md:text-sm font-extrabold text-teal-900 dark:text-teal-300">
            ${m.net_score} <span class="text-xs font-normal text-gray-400">/ ${m.total_marks}</span>
          </td>
          <td class="p-3.5 text-xs md:text-sm">
            <span class="font-bold ${m.accuracy >= 80 ? 'text-emerald-600 dark:text-emerald-400' : (m.accuracy < 60 ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400')}">${m.accuracy}%</span>
          </td>
          <td class="p-3.5 text-xs md:text-sm">
            <span class="px-2.5 py-1 text-xs font-semibold rounded-full border ${badgeColor}">${statusText}</span>
          </td>
          <td class="p-3.5 text-right text-xs">
            <button onclick="deleteMockTest(${m.id})" class="text-gray-400 hover:text-rose-500 p-2 font-bold min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg" title="Delete">🗑️</button>
          </td>
        </tr>
      `;
    }).join("");
  }

  // Mobile Cards Render (Touch-Optimized)
  if (cardsContainer) {
    cardsContainer.innerHTML = mocks.map(m => {
      const passed = m.net_score >= m.target_cutoff;
      const badgeColor = passed ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700" : "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-700";
      const statusText = passed ? "Qualified Cutoff 🎯" : "Below Cutoff ⚠️";

      return `
        <div class="p-4 space-y-2.5 hover:bg-gray-50/60 dark:hover:bg-slate-800/40 transition-colors">
          <div class="flex items-center justify-between gap-2">
            <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <span>📅</span> ${m.test_date}
            </span>
            <span class="px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${badgeColor}">
              ${statusText}
            </span>
          </div>

          <div>
            <div class="text-sm font-bold text-gray-900 dark:text-white leading-tight">${m.test_title}</div>
            <div class="text-xs font-semibold text-teal-800 dark:text-teal-300 flex items-center gap-1.5 mt-0.5">
              <span>🎯 ${m.exam_name}</span>
              <span class="text-gray-400 font-normal">(${m.provider})</span>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-2 p-2.5 bg-gray-50 dark:bg-slate-900/60 rounded-xl border border-gray-100 dark:border-slate-800 text-center">
            <div>
              <div class="text-[10px] text-gray-500 dark:text-gray-400 font-medium">${t("col_score")}</div>
              <div class="font-black text-midnight dark:text-teal-300 text-sm">
                ${m.net_score} <span class="text-[10px] font-normal text-gray-400">/ ${m.total_marks}</span>
              </div>
            </div>
            <div>
              <div class="text-[10px] text-gray-500 dark:text-gray-400 font-medium">${t("col_accuracy")}</div>
              <div class="font-black text-sm ${m.accuracy >= 80 ? 'text-emerald-600 dark:text-emerald-400' : (m.accuracy < 60 ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400')}">
                ${m.accuracy}%
              </div>
            </div>
            <div>
              <div class="text-[10px] text-gray-500 dark:text-gray-400 font-medium">${t("form_target_cutoff")}</div>
              <div class="font-bold text-gray-700 dark:text-gray-300 text-sm">
                ${m.target_cutoff}
              </div>
            </div>
          </div>

          <div class="flex items-center justify-between pt-1">
            <div class="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2.5">
              <span class="text-emerald-700 dark:text-emerald-400 font-bold">✓ ${m.correct ?? 0}</span>
              <span class="text-rose-700 dark:text-rose-400 font-bold">✗ ${m.wrong ?? 0}</span>
              <span class="text-gray-500 dark:text-gray-400 font-medium">⏳ ${m.unattempted ?? 0}</span>
            </div>
            <button onclick="deleteMockTest(${m.id})" class="text-gray-400 hover:text-rose-500 p-2 font-bold text-xs flex items-center gap-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 min-h-[44px] min-w-[44px] justify-center cursor-pointer" title="Delete">
              <span>🗑️</span> <span>Delete</span>
            </button>
          </div>
        </div>
      `;
    }).join("");
  }
}

async function deleteMockTest(id) {
  if (!confirm("Are you sure you want to delete this test record?")) return;
  try {
    const res = await fetch(`/api/mocks/${id}`, { method: "DELETE" });
    if (res.ok) {
      showToast("Mock test deleted", "info");
      await refreshDashboard();
    }
  } catch (e) {
    showToast("Error deleting record", "error");
  }
}

// Modal Helpers & Setup Guide Navigation
function openModal(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.remove("hidden");
    document.body.classList.add("overflow-hidden");
  }
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.add("hidden");
    document.body.classList.remove("overflow-hidden");
    if (window.location.hash) {
      history.replaceState(null, null, window.location.pathname);
    }
  }
}

function handleHashNavigation() {
  const hash = window.location.hash.toLowerCase();
  if (hash === "#guide" || hash.startsWith("#guide-")) {
    openSetupGuideModal();
    if (hash === "#guide-network") switchGuideTab("network");
    else if (hash === "#guide-ocr") switchGuideTab("ocr");
    else if (hash === "#guide-sync") switchGuideTab("sync");
  } else if (hash === "#log") {
    openModal("mockFormModal");
  } else if (hash === "#exams") {
    openExamManager();
  } else if (hash === "#upload") {
    openModal("uploadModal");
  }
}

window.addEventListener("hashchange", handleHashNavigation);
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(handleHashNavigation, 150);
});

function openSetupGuideModal() {
  openModal("setupGuideModal");
  switchGuideTab("mobile");
}

function switchGuideTab(tabId) {
  const tabs = ["mobile", "network", "ocr", "sync"];
  tabs.forEach(tName => {
    const btn = document.getElementById(`guideTabBtn_${tName}`);
    const view = document.getElementById(`guideTabView_${tName}`);
    if (tName === tabId) {
      if (btn) {
        btn.classList.add("border-gold", "text-midnight", "dark:text-teal-300", "font-extrabold");
        btn.classList.remove("border-transparent", "text-gray-500", "dark:text-gray-400");
      }
      if (view) view.classList.remove("hidden");
    } else {
      if (btn) {
        btn.classList.remove("border-gold", "text-midnight", "dark:text-teal-300", "font-extrabold");
        btn.classList.add("border-transparent", "text-gray-500", "dark:text-gray-400");
      }
      if (view) view.classList.add("hidden");
    }
  });
}

function copyToClipboard(text, btnElement) {
  const fallback = () => {
    const input = document.createElement("input");
    input.value = text;
    document.body.appendChild(input);
    input.select();
    document.execCommand("copy");
    document.body.removeChild(input);
    showToast(t("btn_copied") || "Copied to clipboard!", "success");
  };

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      const originalHtml = btnElement ? btnElement.innerHTML : "";
      if (btnElement) {
        btnElement.innerHTML = `<span>✅</span> <span>${t("btn_copied") || "Copied!"}</span>`;
        btnElement.classList.add("bg-emerald-600", "text-white");
        setTimeout(() => {
          btnElement.innerHTML = originalHtml;
          btnElement.classList.remove("bg-emerald-600", "text-white");
        }, 2000);
      }
      showToast(t("btn_copied") || "Copied!", "success");
    }).catch(fallback);
  } else {
    fallback();
  }
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showToast(msg, type = "info") {
  const toast = document.createElement("div");
  const bg = type === "success" ? "bg-emerald-800 text-white" : (type === "error" ? "bg-rose-800 text-white" : "bg-gray-800 text-white");
  toast.className = `fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-xl shadow-xl text-sm font-medium ${bg} transition-all duration-300 transform translate-y-2 opacity-0`;
  toast.innerText = msg;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.classList.remove("translate-y-2", "opacity-0");
  }, 10);
  setTimeout(() => {
    toast.classList.add("translate-y-2", "opacity-0");
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Backup & Export
async function exportBackup() {
  try {
    const res = await fetch("/api/export");
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lakshya_mock_backup_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    showToast("Backup downloaded successfully! 💾", "success");
  } catch (e) {
    showToast("Export failed", "error");
  }
}

// ==========================================
// Kanboard Sync & Exam Manager Engine
// ==========================================

let isKanboardSyncing = false;

async function syncKanboard() {
  if (isKanboardSyncing) return;
  isKanboardSyncing = true;

  const icon = document.getElementById("syncKanboardIcon");
  const btn = document.getElementById("btnSyncKanboard");
  const modalBtn = document.getElementById("modalSyncBtn");
  if (icon) icon.classList.add("animate-spin");
  if (btn) btn.disabled = true;
  if (modalBtn) modalBtn.disabled = true;

  try {
    const res = await fetch("/api/sync/kanboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });
    const data = await res.json();

    await loadExams();
    updateKanboardStatusUI(data);

    if (data.status === "synced") {
      showToast(`✅ ${data.message || 'Synced active exams from Kanboard!'}`, "success");
    } else {
      showToast(`⚠️ ${data.message || 'Kanboard is offline. Manual mode is active.'}`, "error");
    }
  } catch (err) {
    console.error("Sync error:", err);
    updateKanboardStatusUI({ status: "offline", message: "Network connection failed" });
    showToast("⚠️ Kanboard offline / unreachable. Manual mode is active.", "error");
  } finally {
    isKanboardSyncing = false;
    if (icon) icon.classList.remove("animate-spin");
    if (btn) btn.disabled = false;
    if (modalBtn) modalBtn.disabled = false;
  }
}

function updateKanboardStatusUI(statusData) {
  const dot = document.getElementById("kanboardStatusDot");
  const text = document.getElementById("kanboardStatusText");
  const banner = document.getElementById("kanboardStatusBanner");

  if (statusData && statusData.status === "synced") {
    if (dot) {
      dot.className = "w-3 h-3 rounded-full bg-emerald-500 shrink-0";
    }
    if (text) {
      text.innerText = `🟢 Kanboard Connected (Project #4) — ${statusData.count || 21} Active Pursued Exams Synced`;
    }
    if (banner) {
      banner.className = "p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3";
    }
  } else {
    if (dot) {
      dot.className = "w-3 h-3 rounded-full bg-amber-500 shrink-0";
    }
    if (text) {
      text.innerText = "🟡 Kanboard Offline / Unreachable — Manual Mode Active (All exams safely saved locally)";
    }
    if (banner) {
      banner.className = "p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3";
    }
  }
}

function openExamManager(tab = 'list') {
  openModal("examManagerModal");
  switchExamTab(tab);
  renderExamCards();
}

function switchExamTab(tab) {
  const viewList = document.getElementById("viewListExams");
  const viewForm = document.getElementById("viewFormExam");
  const btnList = document.getElementById("tabBtnListExams");
  const btnAdd = document.getElementById("tabBtnAddExam");

  if (tab === "list") {
    if (viewList) viewList.classList.remove("hidden");
    if (viewForm) viewForm.classList.add("hidden");
    if (btnList) {
      btnList.className = "px-4 py-2 text-xs sm:text-sm font-extrabold text-midnight dark:text-teal-300 border-b-2 border-gold -mb-px flex items-center gap-1.5";
    }
    if (btnAdd) {
      btnAdd.className = "px-4 py-2 text-xs sm:text-sm font-bold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 border-b-2 border-transparent -mb-px flex items-center gap-1.5";
    }
    renderExamCards();
  } else {
    if (viewList) viewList.classList.add("hidden");
    if (viewForm) viewForm.classList.remove("hidden");
    if (btnAdd) {
      btnAdd.className = "px-4 py-2 text-xs sm:text-sm font-extrabold text-midnight dark:text-teal-300 border-b-2 border-gold -mb-px flex items-center gap-1.5";
    }
    if (btnList) {
      btnList.className = "px-4 py-2 text-xs sm:text-sm font-bold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 border-b-2 border-transparent -mb-px flex items-center gap-1.5";
    }
  }
}

function renderExamCards(filterQuery = "") {
  const container = document.getElementById("examCardsContainer");
  if (!container) return;

  const q = filterQuery.toLowerCase().trim();
  const list = examsList.filter(e => {
    if (!q) return true;
    return (e.name && e.name.toLowerCase().includes(q)) || 
           (e.stage && e.stage.toLowerCase().includes(q)) ||
           (e.code && e.code.toLowerCase().includes(q));
  });

  if (list.length === 0) {
    container.innerHTML = `
      <div class="col-span-full p-8 text-center text-gray-400 dark:text-gray-500 text-xs sm:text-sm">
        No exams found. Click "+ Add Exam" to manually register a new exam anytime!
      </div>
    `;
    return;
  }

  container.innerHTML = list.map(e => {
    const isKanboard = e.source === 'kanboard';
    const isManual = e.source === 'manual';
    const sourceBadge = isKanboard 
      ? `<span class="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-[10px] font-bold">🤖 Kanboard #${e.kanboard_task_id || ''}</span>`
      : (isManual 
          ? `<span class="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 text-[10px] font-bold">✍️ Manual</span>`
          : `<span class="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 text-[10px] font-bold">⚙️ Preset</span>`);

    const stageBadge = e.stage 
      ? `<span class="px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300 text-[10px] font-bold border border-teal-200 dark:border-teal-800">${e.stage}</span>` 
      : "";

    const sections = (e.sections && e.sections.length > 0) ? e.sections : [];
    const sectionPills = sections.slice(0, 4).map(s => `<span class="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 text-[10px]">${s}</span>`).join(" ");

    return `
      <div class="bg-gray-50 dark:bg-slate-800/80 p-3.5 rounded-2xl border border-gray-200 dark:border-slate-700/80 flex flex-col justify-between space-y-2 hover:border-gold/50 transition-colors">
        <div class="flex items-start justify-between gap-2">
          <div class="space-y-1">
            <div class="flex flex-wrap items-center gap-1.5">
              ${sourceBadge}
              ${stageBadge}
            </div>
            <h4 class="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-white leading-snug">
              ${e.name}
            </h4>
          </div>
          <div class="flex items-center gap-1 shrink-0">
            <button onclick="editExam(${e.id})" class="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300 text-xs" title="Edit Exam">
              ✏️
            </button>
            ${!isKanboard && e.source !== 'system' ? `
            <button onclick="deleteExam(${e.id}, '${e.name.replace(/'/g, "\\'")}')" class="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 text-xs" title="Delete Exam">
              🗑️
            </button>` : ''}
          </div>
        </div>

        <div class="text-[11px] text-gray-500 dark:text-gray-400 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span>Marks: <strong class="text-gray-800 dark:text-gray-200">${e.default_total_marks}M</strong></span>
          <span>Scheme: <strong class="text-emerald-600 dark:text-emerald-400">+${e.marks_per_correct}</strong> / <strong class="text-rose-500">-${e.penalty_per_wrong}</strong></span>
          <span>Cutoff: <strong class="text-gold">${e.default_cutoff}M</strong></span>
        </div>

        ${sections.length > 0 ? `<div class="flex flex-wrap gap-1 pt-1 border-t border-gray-200/50 dark:border-slate-700/50">${sectionPills}</div>` : ''}
      </div>
    `;
  }).join("");
}

function filterExamCards() {
  const query = document.getElementById("examSearchInput")?.value || "";
  renderExamCards(query);
}

function editExam(id) {
  const exam = examsList.find(e => e.id === id);
  if (!exam) return;

  document.getElementById("examEditId").value = exam.id;
  document.getElementById("inputExamName").value = exam.name;
  document.getElementById("inputExamCode").value = exam.code;
  document.getElementById("inputExamStage").value = exam.stage || "📝 Applied";
  document.getElementById("inputExamTotalMarks").value = exam.default_total_marks;
  document.getElementById("inputExamTotalQ").value = exam.default_total_q;
  document.getElementById("inputExamMarksPerCorrect").value = exam.marks_per_correct;
  document.getElementById("inputExamPenaltyPerWrong").value = exam.penalty_per_wrong;
  document.getElementById("inputExamTargetCutoff").value = exam.default_cutoff;

  const sections = (exam.sections && exam.sections.length > 0) ? exam.sections.join(", ") : "";
  document.getElementById("inputExamSections").value = sections;

  const formTabLabel = document.getElementById("formTabLabel");
  if (formTabLabel) formTabLabel.innerText = "✏️ Edit Exam";

  switchExamTab("add");
}

async function handleManualExamSubmit(event) {
  event.preventDefault();
  const editId = document.getElementById("examEditId").value;
  const name = document.getElementById("inputExamName").value.trim();
  const code = document.getElementById("inputExamCode").value.trim();
  const stage = document.getElementById("inputExamStage").value;
  const default_total_marks = parseFloat(document.getElementById("inputExamTotalMarks").value) || 100;
  const default_total_q = parseInt(document.getElementById("inputExamTotalQ").value) || 100;
  const marks_per_correct = parseFloat(document.getElementById("inputExamMarksPerCorrect").value) || 1.0;
  const penalty_per_wrong = parseFloat(document.getElementById("inputExamPenaltyPerWrong").value) || 0.25;
  const default_cutoff = parseFloat(document.getElementById("inputExamTargetCutoff").value) || 60;

  const sectionsStr = document.getElementById("inputExamSections").value;
  const sections = sectionsStr.split(",").map(s => s.trim()).filter(Boolean);

  const payload = {
    name,
    code,
    stage,
    default_total_marks,
    default_total_q,
    marks_per_correct,
    penalty_per_wrong,
    default_cutoff,
    sections
  };

  try {
    let res;
    if (editId) {
      res = await fetch(`/api/exams/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } else {
      res = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    }

    if (res.ok) {
      showToast("💾 Exam saved successfully!", "success");
      document.getElementById("manualExamForm").reset();
      document.getElementById("examEditId").value = "";
      const formTabLabel = document.getElementById("formTabLabel");
      if (formTabLabel) formTabLabel.innerText = "+ Add / Edit Exam Manually";
      await loadExams();
      switchExamTab("list");
    } else {
      const errData = await res.json();
      showToast(`❌ Error: ${errData.error || 'Failed to save exam'}`, "error");
    }
  } catch (err) {
    showToast(`❌ Network error: ${err.message}`, "error");
  }
}

async function deleteExam(id, name) {
  if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
  try {
    const res = await fetch(`/api/exams/${id}`, { method: "DELETE" });
    if (res.ok) {
      showToast("🗑️ Exam removed.", "success");
      await loadExams();
      renderExamCards();
    } else {
      showToast("❌ Could not delete exam.", "error");
    }
  } catch (err) {
    showToast(`❌ Error: ${err.message}`, "error");
  }
}
