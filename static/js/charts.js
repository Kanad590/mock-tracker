// Lakshya Mock Tracker - Advanced Analytics & Chart.js Engine

let scoreTrendChart = null;
let radarMasteryChart = null;
let mistakeDonutChart = null;
let sectionalBarChart = null;

function initCharts(statsData) {
  renderScoreTrend(statsData.score_trend || []);
  renderRadarMastery(statsData.subject_stats || {});
  renderMistakeDonut(statsData.mistake_stats || {});
  renderSectionalBar(statsData.subject_stats || {});
  renderWeakStrongBadges(statsData.weak_areas || [], statsData.strong_areas || []);
}

function renderScoreTrend(trendData) {
  const ctx = document.getElementById("scoreTrendCanvas");
  if (!ctx) return;
  
  if (scoreTrendChart) {
    scoreTrendChart.destroy();
  }

  const labels = trendData.map((d, idx) => d.title || `Mock #${idx + 1}`);
  const scores = trendData.map(d => d.net_score);
  const cutoffs = trendData.map(d => d.target_cutoff);

  scoreTrendChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels.length ? labels : ["Mock 1", "Mock 2", "Mock 3"],
      datasets: [
        {
          label: t("legend_net_score"),
          data: scores.length ? scores : [62, 68, 74],
          borderColor: "#0F3D3E", // Deep Teal
          backgroundColor: "rgba(15, 61, 62, 0.12)",
          borderWidth: 3,
          pointBackgroundColor: "#C59B27", // Champagne Gold
          pointBorderColor: "#FFFFFF",
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8,
          fill: true,
          tension: 0.35
        },
        {
          label: t("legend_cutoff"),
          data: cutoffs.length ? cutoffs : [65, 65, 65],
          borderColor: "#B84A39", // Muted Terracotta
          borderWidth: 2,
          borderDash: [6, 6],
          pointRadius: 0,
          fill: false,
          tension: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top",
          labels: { font: { family: "'Plus Jakarta Sans', sans-serif", weight: "600" } }
        },
        tooltip: {
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            footer: (items) => {
              const idx = items[0].dataIndex;
              if (trendData[idx]) {
                return `Date: ${trendData[idx].date} | Accuracy: ${trendData[idx].accuracy}%`;
              }
              return "";
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: "rgba(0, 0, 0, 0.05)" }
        },
        x: {
          grid: { display: false }
        }
      }
    }
  });
}

function renderRadarMastery(subjStats) {
  const ctx = document.getElementById("radarMasteryCanvas");
  if (!ctx) return;
  
  if (radarMasteryChart) {
    radarMasteryChart.destroy();
  }

  const subjects = Object.keys(subjStats);
  const accuracies = subjects.map(s => subjStats[s].accuracy);

  const fallbackSubjs = ["Mathematics", "Reasoning", "General Science", "General Awareness", "Technical"];
  const fallbackAccs = [78, 85, 62, 54, 82];

  radarMasteryChart = new Chart(ctx, {
    type: "radar",
    data: {
      labels: subjects.length ? subjects : fallbackSubjs,
      datasets: [{
        label: t("legend_accuracy"),
        data: accuracies.length ? accuracies : fallbackAccs,
        backgroundColor: "rgba(197, 155, 39, 0.25)", // Champagne Gold translucent
        borderColor: "#C59B27",
        borderWidth: 2.5,
        pointBackgroundColor: "#0F3D3E",
        pointBorderColor: "#fff",
        pointRadius: 5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          suggestedMin: 0,
          suggestedMax: 100,
          ticks: { stepSize: 20 },
          pointLabels: {
            font: { family: "'Plus Jakarta Sans', sans-serif", size: 12, weight: "bold" }
          }
        }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });
}

function renderSectionalBar(subjStats) {
  const ctx = document.getElementById("sectionalBarCanvas");
  if (!ctx) return;

  if (sectionalBarChart) {
    sectionalBarChart.destroy();
  }

  const subjects = Object.keys(subjStats);
  const accuracies = subjects.map(s => subjStats[s].accuracy);
  const wrongs = subjects.map(s => subjStats[s].total_wrong || 0);

  const bgColors = accuracies.map(acc => {
    if (acc >= 80) return "#2E6F5E"; // Soft Sage
    if (acc < 60) return "#B84A39"; // Terracotta
    return "#C59B27"; // Warm Gold
  });

  sectionalBarChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: subjects.length ? subjects : ["Math", "Reasoning", "Science", "GK"],
      datasets: [
        {
          label: t("legend_accuracy") + " %",
          data: accuracies.length ? accuracies : [82, 88, 55, 50],
          backgroundColor: bgColors,
          borderRadius: 6
        }
      ]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            afterBody: (context) => {
              const idx = context[0].dataIndex;
              const sub = subjects[idx];
              if (subjStats[sub]) {
                return `Total Wrong: ${subjStats[sub].total_wrong} | Total Correct: ${subjStats[sub].total_correct}`;
              }
              return "";
            }
          }
        }
      },
      scales: {
        x: {
          suggestedMin: 0,
          suggestedMax: 100,
          ticks: { callback: v => v + "%" }
        }
      }
    }
  });
}

function renderMistakeDonut(mistakeStats) {
  const ctx = document.getElementById("mistakeDonutCanvas");
  if (!ctx) return;

  if (mistakeDonutChart) {
    mistakeDonutChart.destroy();
  }

  const typeLabels = {
    "silly_error": "Silly Error 🤦",
    "formula_gap": "Formula Gap 📐",
    "concept_gap": "Concept Gap 🧠",
    "misread": "Misread / Trap 👁️",
    "time_pressure": "Time Rush ⏳",
    "guess": "Wild Guess 🎲"
  };

  const keys = Object.keys(mistakeStats);
  const labels = keys.map(k => typeLabels[k] || k);
  const counts = keys.map(k => mistakeStats[k]);

  const fallbackLabels = ["Silly Error 🤦", "Formula Gap 📐", "Concept Gap 🧠", "Time Rush ⏳"];
  const fallbackCounts = [14, 8, 12, 6];

  mistakeDonutChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: labels.length ? labels : fallbackLabels,
      datasets: [{
        data: counts.length ? counts : fallbackCounts,
        backgroundColor: [
          "#B84A39", // Terracotta
          "#C59B27", // Gold
          "#0F3D3E", // Deep Teal
          "#2E6F5E", // Sage
          "#4A5568", // Slate
          "#E53E3E"  // Red
        ],
        borderWidth: 2,
        borderColor: "#FFFFFF"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "68%",
      plugins: {
        legend: {
          position: "bottom",
          labels: { boxWidth: 14, font: { size: 11, family: "'Plus Jakarta Sans', sans-serif" } }
        }
      }
    }
  });
}

function renderWeakStrongBadges(weakList, strongList) {
  const weakContainer = document.getElementById("weakAreasList");
  const strongContainer = document.getElementById("strongAreasList");

  if (weakContainer) {
    if (weakList.length === 0) {
      weakContainer.innerHTML = `<div class="p-4 bg-emerald-50 text-emerald-800 rounded-xl text-sm border border-emerald-200">
        🎉 <strong>Awesome!</strong> No critical weak areas detected. Maintain your high accuracy across all subjects!
      </div>`;
    } else {
      weakContainer.innerHTML = weakList.map(w => `
        <div class="flex items-center justify-between p-3.5 bg-rose-50 border border-rose-200 rounded-xl shadow-xs">
          <div>
            <div class="font-bold text-rose-900 flex items-center gap-1.5 text-sm md:text-base">
              <span>⚠️ ${w.subject}</span>
              <span class="text-xs px-2 py-0.5 bg-rose-200 text-rose-800 rounded-full font-medium">Needs Attention</span>
            </div>
            <div class="text-xs text-rose-700 mt-0.5">Accuracy: <span class="font-bold">${w.accuracy}%</span> | Negative Penalty Incurred: <strong>${w.total_wrong} wrong</strong></div>
          </div>
          <div class="text-right">
            <span class="text-sm font-extrabold text-rose-900">${w.accuracy}%</span>
          </div>
        </div>
      `).join("");
    }
  }

  if (strongContainer) {
    if (strongList.length === 0) {
      strongContainer.innerHTML = `<div class="p-4 bg-gray-50 text-gray-600 rounded-xl text-sm border border-gray-200">
        Log more mocks to establish subject mastery thresholds.
      </div>`;
    } else {
      strongContainer.innerHTML = strongList.map(s => `
        <div class="flex items-center justify-between p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl shadow-xs">
          <div>
            <div class="font-bold text-emerald-900 flex items-center gap-1.5 text-sm md:text-base">
              <span>🏆 ${s.subject}</span>
              <span class="text-xs px-2 py-0.5 bg-emerald-200 text-emerald-800 rounded-full font-medium">High Mastery</span>
            </div>
            <div class="text-xs text-emerald-700 mt-0.5">Accuracy: <span class="font-bold">${s.accuracy}%</span> | Correct: <strong>${s.total_correct}</strong></div>
          </div>
          <div class="text-right">
            <span class="text-sm font-extrabold text-emerald-900">${s.accuracy}%</span>
          </div>
        </div>
      `).join("");
    }
  }
}

window.renderAllCharts = function() {
  if (window.currentStatsData) {
    initCharts(window.currentStatsData);
  }
};
