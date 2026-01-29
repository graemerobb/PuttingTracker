const DASH = {
  summary: {
    grossScore: 77,
    grossRank: "4th",
    oddsText: "1 in 200",
    handicapValue: 4,
    parStreakLine: "6 hole par streak - 3th through 9th",
    friendLine1: "You beat Bryan by 6 shots on hole 3. He got an 8.",
    friendLine2: "You had the most birdies today.",
    targets: [
      { text: "No doubles", status: "Pass", ok: true },
      { text: "No 3 putts", status: "Fail", ok: false },
      { text: "No bogies on par 5s", status: "Pass", ok: true }
    ]
  },

  sgModes: {
    gross: {
      gained: [
        { value: "+1.1", hole: "14th" },
        { value: "+1.5", hole: "10th" },
        { value: "+2.1", hole: "18th" }
      ],
      lost: [{ value: "-0.3", hole: "12th" }],
      flow: [ 0.2,-0.4, 1.0, 0.1,-0.2, 0.3,-0.6, 0.0, 0.4, 1.0,-0.1,-1.0, 0.2, 1.0,-0.3, 0.1, 0.5, 1.0 ]
    },
    handicap: {
      gained: [
        { value: "+0.6", hole: "10th" },
        { value: "+0.9", hole: "14th" },
        { value: "+1.4", hole: "18th" }
      ],
      lost: [{ value: "-0.7", hole: "12th" }],
      flow: [ 0.4,-0.2, 0.8, 0.3, 0.0, 0.2,-0.3, 0.1, 0.5, 0.9, 0.0,-0.8, 0.3, 0.9,-0.2, 0.2, 0.6, 0.9 ]
    },
    selected: {
      gained: [
        { value: "+0.8", hole: "14th" },
        { value: "+1.2", hole: "10th" },
        { value: "+1.9", hole: "18th" }
      ],
      lost: [{ value: "-0.4", hole: "12th" }],
      flow: [ 0.1,-0.5, 1.2,-0.1,-0.3, 0.4,-0.7,-0.1, 0.3, 0.8,-0.2,-1.2, 0.1, 0.8,-0.4, 0.0, 0.4, 0.8 ]
    }
  },

  performance: {
    last20: {
      avgGross: "79.4",
      varRange: "72–87",
      distribution: {
        min: 72,
        max: 87,
        mean: 78,
        // intentionally left-skewed (worse low tail)
        points: [
    0.32,
    0.38,
    0.44,
    0.52,
    0.62,
    0.74,
    0.86,
    0.96,
    1.00,  // peak starts earlier
    0.98,  // flat-ish top
    0.92,
    0.82,
    0.68,
    0.54,
    0.42,
    0.34,
    0.28,
    0.24,
    0.21,
    0.19,
    0.17   // tail still fat at the end
  ]
        //points: [0.10,0.13,0.18,0.25,0.34,0.46,0.60,0.76,0.90,1.00,0.92,0.78,0.60,0.44,0.32,0.24,0.18,0.14,0.11,0.09,0.08]
      },
      badHoles: [
        { hole: "6th", desc: "average 4.2", sg: "-1.2", note: "for 4 handicap" },
        { hole: "8th", desc: "average 5.9", sg: "-0.8", note: "" },
        { hole: "9th", desc: "390m, average 4.5", sg: "-0.2", note: "for that distance" }
      ],
      goodHoles: [
        { hole: "3rd", desc: "average 3.7", sg: "+0.6", note: "" },
        { hole: "14th", desc: "average 4.0", sg: "+0.9", note: "for 4 handicap" },
        { hole: "18th", desc: "average 4.3", sg: "+0.4", note: "" }
      ],
      dblAvg: "2.2",
      dblTarget: "1.2",
      birdAvg: "1.1",
      birdTarget: "1.6",
      badStarts: { n: 3, outOf: 20, desc: "+6 through 3" },
      afterDbl: "+0.3",
      streaks: {
        birdie: { len: 3 },
        bogey: { len: 5, occ: 5 }
      }
    },
    last10: {
      avgGross: "80.1",
      varRange: "72–87",
      distribution: { min: 72, max: 87, mean: 78, points: [0.12,0.16,0.22,0.30,0.41,0.55,0.70,0.84,0.95,1.00,0.90,0.74,0.55,0.40,0.30,0.22,0.17,0.13,0.10,0.08,0.07] },
      badHoles: [
        { hole: "8th", desc: "average 6.1", sg: "-0.9", note: "" },
        { hole: "12th", desc: "average 5.4", sg: "-0.6", note: "" }
      ],
      goodHoles: [
        { hole: "10th", desc: "average 4.0", sg: "+0.5", note: "" },
        { hole: "14th", desc: "average 3.9", sg: "+0.8", note: "" }
      ],
      dblAvg: "2.4",
      dblTarget: "1.2",
      birdAvg: "0.9",
      birdTarget: "1.6",
      badStarts: { n: 2, outOf: 10, desc: "+6 through 3" },
      afterDbl: "+0.4",
      streaks: {
        birdie: { len: 2 },
        bogey: { len: 4, occ: 3 }
      }
    },
    last50: {
      avgGross: "78.9",
      varRange: "72–87",
      distribution: { min: 72, max: 87, mean: 78, points: [0.08,0.10,0.13,0.18,0.26,0.38,0.55,0.72,0.88,1.00,0.94,0.82,0.66,0.50,0.38,0.28,0.21,0.16,0.12,0.10,0.09] },
      badHoles: [
        { hole: "6th", desc: "average 4.2", sg: "-1.1", note: "" },
        { hole: "8th", desc: "average 5.8", sg: "-0.7", note: "" },
        { hole: "12th", desc: "average 5.5", sg: "-0.6", note: "" }
      ],
      goodHoles: [
        { hole: "3rd", desc: "average 3.6", sg: "+0.7", note: "" },
        { hole: "14th", desc: "average 3.9", sg: "+1.0", note: "" }
      ],
      dblAvg: "2.1",
      dblTarget: "1.2",
      birdAvg: "1.2",
      birdTarget: "1.6",
      badStarts: { n: 6, outOf: 50, desc: "+6 through 3" },
      afterDbl: "+0.3",
      streaks: {
        birdie: { len: 3 },
        bogey: { len: 5, occ: 6 }
      }
    }
  }
};

// ---- Sections
const sectionSelect = document.getElementById("sectionSelect");
const sections = {
  today: document.getElementById("sec-today"),
  performance: document.getElementById("sec-performance"),
  group: document.getElementById("sec-group"),
  workouts: document.getElementById("sec-workouts")
};

sectionSelect.onchange = () => {
  Object.values(sections).forEach(s => s.classList.remove("active"));
  sections[sectionSelect.value].classList.add("active");
  if (sectionSelect.value === "today") renderToday(currentMode);
  if (sectionSelect.value === "performance") renderPerformance(currentPerfKey);
};

// ---- Today DOM
const grossScoreEl = document.getElementById("grossScore");
const grossRankEl = document.getElementById("grossRank");
const oddsTextEl = document.getElementById("oddsText");
const handicapValueEl = document.getElementById("handicapValue");
const parStreakEl = document.getElementById("parStreakLine");
const friendLine1El = document.getElementById("friendLine1");
const friendLine2El = document.getElementById("friendLine2");
const targetsWrap = document.getElementById("targetsWrap");

const gainedWrap = document.getElementById("sgGainedChips");
const lostWrap = document.getElementById("sgLostChips");
const sgModeSelect = document.getElementById("sgModeSelect");

// Tooltip (today)
const sgInfoBtn = document.getElementById("sgInfoBtn");
const sgInfoBtn2 = document.getElementById("sgInfoBtn2");
const sgTooltip = document.getElementById("sgTooltip");

// Friends modal
const addFriendBtn = document.getElementById("addFriendBtn");
const friendModal = document.getElementById("friendModal");
const friendNameInput = document.getElementById("friendNameInput");
const friendCancelBtn = document.getElementById("friendCancelBtn");
const friendAddBtn = document.getElementById("friendAddBtn");

// Targets modal
const addTargetBtn = document.getElementById("addTargetBtn");
const targetModal = document.getElementById("targetModal");
const targetTextInput = document.getElementById("targetTextInput");
const targetCancelBtn = document.getElementById("targetCancelBtn");
const targetAddBtn = document.getElementById("targetAddBtn");

// Performance DOM
const perfTimeframe = document.getElementById("perfTimeframe");
const perfRoundsN = document.getElementById("perfRoundsN");
const avgGrossEl = document.getElementById("avgGross");
const varRangeEl = document.getElementById("varRange");
const badHolesList = document.getElementById("badHolesList");
const goodHolesList = document.getElementById("goodHolesList");
const dblAvgEl = document.getElementById("dblAvg");
const dblTargetEl = document.getElementById("dblTarget");
const birdAvgEl = document.getElementById("birdAvg");
const birdTargetEl = document.getElementById("birdTarget");
const badStartsEl = document.getElementById("badStarts");
const badStartsOutOfEl = document.getElementById("badStartsOutOf");
const afterDblEl = document.getElementById("afterDbl");
const birdStreakEl = document.getElementById("birdStreak");
const bogeyStreakEl = document.getElementById("bogeyStreak");
const bogeyOccEl = document.getElementById("bogeyOcc");
const birdStreakLink = document.getElementById("birdStreakLink");
const bogeyStreakLink = document.getElementById("bogeyStreakLink");

// Performance insight modal
const insightAvailBtn = document.getElementById("insightAvailBtn");
const perfInsightModal = document.getElementById("perfInsightModal");
const perfInsightCloseBtn = document.getElementById("perfInsightCloseBtn");

// Charts
const flowCanvas = document.getElementById("flowChart");
const flowCtx = flowCanvas.getContext("2d");
const varCanvas = document.getElementById("varianceChart");
const varCtx = varCanvas.getContext("2d");

// Helpers
function setText(el, val){ if (el) el.textContent = String(val); }

function renderTargets(){
  targetsWrap.innerHTML = "";
  DASH.summary.targets.forEach(t => {
    const row = document.createElement("div");
    row.className = `targetRow ${t.ok ? "ok" : "bad"}`;

    const label = document.createElement("span");
    label.className = "tLabel";
    label.textContent = t.text;

    const status = document.createElement("span");
    status.className = "tStatus";
    status.textContent = t.status;

    row.appendChild(label);
    row.appendChild(status);
    targetsWrap.appendChild(row);
  });
}

function renderChipsWithHighlight(container, items){
  const prev = Array.from(container.querySelectorAll(".chip")).map(el => el.textContent);
  container.innerHTML = "";
  items.forEach((it, idx) => {
    const span = document.createElement("span");
    span.className = "chip";
    const text = `${it.value} · ${it.hole}`;
    span.textContent = text;
    if (prev[idx] && prev[idx] !== text) {
      span.classList.add("changed");
      window.setTimeout(() => span.classList.remove("changed"), 650);
    }
    container.appendChild(span);
  });
}

// ---- Today render + SG switching
let currentMode = "gross";

function renderToday(mode){
  const cfg = DASH.sgModes[mode] || DASH.sgModes.gross;

  setText(grossScoreEl, DASH.summary.grossScore);
  setText(grossRankEl, DASH.summary.grossRank);
  setText(oddsTextEl, DASH.summary.oddsText);
  setText(handicapValueEl, DASH.summary.handicapValue);
  setText(parStreakEl, DASH.summary.parStreakLine);
  setText(friendLine1El, DASH.summary.friendLine1);
  setText(friendLine2El, DASH.summary.friendLine2);

  renderTargets();
  renderChipsWithHighlight(gainedWrap, cfg.gained);
  renderChipsWithHighlight(lostWrap, cfg.lost);
  drawFlowAnimated(cfg.flow);
}

sgModeSelect.onchange = () => {
  currentMode = sgModeSelect.value;
  if (sections.today.classList.contains("active")) renderToday(currentMode);
};

// ---- Tooltip behavior (generic)
function closeAllTooltips(){
  document.querySelectorAll(".tooltip.show").forEach(t => {
    t.classList.remove("show");
    t.setAttribute("aria-hidden", "true");
  });
}
function toggleTooltipById(id){
  const tip = document.getElementById(id);
  if (!tip) return;
  const isOpen = tip.classList.contains("show");
  closeAllTooltips();
  if (!isOpen){
    tip.classList.add("show");
    tip.setAttribute("aria-hidden", "false");
  }
}

sgInfoBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  toggleTooltipById("sgTooltip");
});
sgInfoBtn2.addEventListener("click", (e) => {
  e.stopPropagation();
  toggleTooltipById("sgTooltip");
});

document.addEventListener("click", () => closeAllTooltips());
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeAllTooltips();
});

// Inline info buttons in performance section
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".infoBtn[data-tooltip]");
  if (!btn) return;
  e.stopPropagation();
  toggleTooltipById(btn.dataset.tooltip);
});

// ---- Friends modal
function openModal(overlay){
  overlay.classList.add("show");
  overlay.setAttribute("aria-hidden", "false");
}
function closeModal(overlay){
  overlay.classList.remove("show");
  overlay.setAttribute("aria-hidden", "true");
}

addFriendBtn.addEventListener("click", () => {
  openModal(friendModal);
  friendNameInput.value = "";
  setTimeout(() => friendNameInput.focus(), 0);
});
friendCancelBtn.addEventListener("click", () => closeModal(friendModal));
friendModal.addEventListener("click", (e) => {
  if (e.target === friendModal) closeModal(friendModal);
});
friendAddBtn.addEventListener("click", () => {
  const name = friendNameInput.value.trim();
  if (!name) return closeModal(friendModal);
  DASH.summary.friendLine1 = `Added friend: ${name}`;
  renderToday(currentMode);
  closeModal(friendModal);
});

// ---- Targets modal
addTargetBtn.addEventListener("click", () => {
  openModal(targetModal);
  targetTextInput.value = "";
  setTimeout(() => targetTextInput.focus(), 0);
});
targetCancelBtn.addEventListener("click", () => closeModal(targetModal));
targetModal.addEventListener("click", (e) => {
  if (e.target === targetModal) closeModal(targetModal);
});
targetAddBtn.addEventListener("click", () => {
  const text = targetTextInput.value.trim();
  if (!text) return closeModal(targetModal);
  // Default to Pass for prototype
  DASH.summary.targets.push({ text, status: "Pass", ok: true });
  renderTargets();
  closeModal(targetModal);
});

// ---- Performance: timeframe + render
let currentPerfKey = "last20";

function perfKeyFromValue(v){
  if (v === "10") return "last10";
  if (v === "50") return "last50";
  return "last20";
}

perfTimeframe.addEventListener("change", () => {
  currentPerfKey = perfKeyFromValue(perfTimeframe.value);
  renderPerformance(currentPerfKey);
});

function renderHoleList(container, items){
  container.innerHTML = "";
  items.forEach(it => {
    const row = document.createElement("div");
    row.className = "listRow";

    const left = document.createElement("span");
    left.textContent = `${it.hole}, ${it.desc}`;

    const right = document.createElement("span");
    right.innerHTML = `<strong>${it.sg}</strong> SG${it.note ? ` <span class="subtle">(${it.note})</span>` : ""}`;

    row.appendChild(left);
    row.appendChild(right);
    container.appendChild(row);
  });
}

function renderPerformance(key){
  const data = DASH.performance[key];
  if (!data) return;

  setText(perfRoundsN, key === "last10" ? 10 : key === "last50" ? 50 : 20);
  setText(avgGrossEl, data.avgGross);
  setText(varRangeEl, data.varRange);

  renderHoleList(badHolesList, data.badHoles);
  renderHoleList(goodHolesList, data.goodHoles);

  setText(dblAvgEl, data.dblAvg);
  setText(dblTargetEl, data.dblTarget);
  setText(birdAvgEl, data.birdAvg);
  setText(birdTargetEl, data.birdTarget);

  setText(badStartsEl, data.badStarts.n);
  setText(badStartsOutOfEl, data.badStarts.outOf);

  setText(afterDblEl, data.afterDbl);

  setText(birdStreakEl, data.streaks.birdie.len);
  setText(bogeyStreakEl, data.streaks.bogey.len);
  setText(bogeyOccEl, data.streaks.bogey.occ);

  drawVariance(data.distribution);
}

// placeholder links
[birdStreakLink, bogeyStreakLink].forEach(a => a.addEventListener("click", (e) => e.preventDefault()));

// Performance insight modal text already updated in HTML
insightAvailBtn.addEventListener("click", () => openModal(perfInsightModal));
perfInsightCloseBtn.addEventListener("click", () => closeModal(perfInsightModal));
perfInsightModal.addEventListener("click", (e) => {
  if (e.target === perfInsightModal) closeModal(perfInsightModal);
});

// ---- Flow chart: animate + thicker line (your latest style)
let flowLastSeries = null;
let flowAnimRaf = null;
function easeOutCubic(t){ return 1 - Math.pow(1 - t, 3); }

function drawFlow(series){
  const data = Array.isArray(series) ? series : (DASH.sgModes[currentMode]?.flow || []);

  const cssW = flowCanvas.clientWidth;
  const cssH = flowCanvas.clientHeight;
  const dpr = window.devicePixelRatio || 1;

  flowCanvas.width = Math.round(cssW * dpr);
  flowCanvas.height = Math.round(cssH * dpr);
  flowCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const W = cssW, H = cssH;
  const padL = 36, padR = 10, padT = 10, padB = 16;
  const yMin = -1, yMax = 1;

  flowCtx.clearRect(0,0,W,H);

  const x0 = padL, x1 = W - padR;
  const y0 = padT, y1 = H - padB;
  const xStep = (x1 - x0) / 17;
  const yToPx = (v) => y1 - ((v - yMin) / (yMax - yMin)) * (y1 - y0);

  // zero line
  const yZero = yToPx(0);
  flowCtx.lineWidth = 1;
  flowCtx.strokeStyle = "rgba(7,26,51,0.35)";
  flowCtx.beginPath();
  flowCtx.moveTo(x0, yZero);
  flowCtx.lineTo(x1, yZero);
  flowCtx.stroke();

  // y labels
  flowCtx.fillStyle = "rgba(7,26,51,0.65)";
  flowCtx.font = "12px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";
  for (let gv = -1; gv <= 1; gv++){
    const y = yToPx(gv);
    flowCtx.fillText(String(gv), 6, y + 4);
  }

  // x labels only
  for (let i = 0; i < 18; i++){
    const x = x0 + xStep * i;
    flowCtx.fillText(String(i + 1), x - 4, H - 2);
  }

  // series line (slightly thicker)
  flowCtx.lineWidth = 3.6;
  flowCtx.strokeStyle = "rgba(7,26,51,0.92)";
  flowCtx.beginPath();
  data.forEach((v, i) => {
    const x = x0 + xStep * i;
    const y = yToPx(v);
    if (i === 0) flowCtx.moveTo(x, y);
    else flowCtx.lineTo(x, y);
  });
  flowCtx.stroke();

  // points
  flowCtx.fillStyle = "rgba(7,26,51,0.92)";
  data.forEach((v, i) => {
    const x = x0 + xStep * i;
    const y = yToPx(v);
    flowCtx.beginPath();
    flowCtx.arc(x, y, 2.2, 0, Math.PI * 2);
    flowCtx.fill();
  });
}

function drawFlowAnimated(nextSeries){
  const target = Array.isArray(nextSeries) ? nextSeries.slice() : [];
  if (target.length !== 18) return drawFlow(target);

  if (flowAnimRaf) cancelAnimationFrame(flowAnimRaf);

  if (!flowLastSeries || flowLastSeries.length !== 18){
    flowLastSeries = target.slice();
    return drawFlow(flowLastSeries);
  }

  const start = flowLastSeries.slice();
  const end = target.slice();
  const duration = 420;
  const t0 = performance.now();

  const step = (now) => {
    const t = Math.min(1, (now - t0) / duration);
    const e = easeOutCubic(t);
    const frame = start.map((sv, i) => sv + (end[i] - sv) * e);
    drawFlow(frame);

    if (t < 1){
      flowAnimRaf = requestAnimationFrame(step);
    } else {
      flowLastSeries = end.slice();
      flowAnimRaf = null;
      drawFlow(flowLastSeries);
    }
  };

  flowAnimRaf = requestAnimationFrame(step);
}

// ---- Variance chart: skew + annotated range 72–87 and mean 78
function drawVariance(dist){
  const cssW = varCanvas.clientWidth;
  const cssH = varCanvas.clientHeight;
  const dpr = window.devicePixelRatio || 1;

  varCanvas.width = Math.round(cssW * dpr);
  varCanvas.height = Math.round(cssH * dpr);
  varCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const W = cssW, H = cssH;
  const padL = 18, padR = 18, padT = 10, padB = 22;

  varCtx.clearRect(0,0,W,H);

  const x0 = padL, x1 = W - padR;
  const y0 = padT, y1 = H - padB;

  const min = dist.min;
  const max = dist.max;
  const mean = dist.mean;
  const pts = dist.points || [];
  const maxY = Math.max(...pts, 1);

  // baseline
  varCtx.strokeStyle = "rgba(7,26,51,0.18)";
  varCtx.lineWidth = 1;
  varCtx.beginPath();
  varCtx.moveTo(x0, y1);
  varCtx.lineTo(x1, y1);
  varCtx.stroke();

  // curve
  varCtx.strokeStyle = "rgba(7,26,51,0.92)";
  varCtx.lineWidth = 2.8;
  varCtx.beginPath();
  pts.forEach((v, i) => {
    const x = x0 + (x1 - x0) * (i / (pts.length - 1));
    const y = y1 - (y1 - y0) * (v / maxY);
    if (i === 0) varCtx.moveTo(x, y);
    else varCtx.lineTo(x, y);
  });
  varCtx.stroke();

  // fill under curve (subtle)
  varCtx.fillStyle = "rgba(7,26,51,0.08)";
  varCtx.beginPath();
  pts.forEach((v, i) => {
    const x = x0 + (x1 - x0) * (i / (pts.length - 1));
    const y = y1 - (y1 - y0) * (v / maxY);
    if (i === 0) varCtx.moveTo(x, y);
    else varCtx.lineTo(x, y);
  });
  varCtx.lineTo(x1, y1);
  varCtx.lineTo(x0, y1);
  varCtx.closePath();
  varCtx.fill();

  // mean line at score 78 (mapped to min..max)
  const meanT = (mean - min) / (max - min);
  const mx = x0 + (x1 - x0) * meanT;
  varCtx.strokeStyle = "rgba(7,26,51,0.45)";
  varCtx.lineWidth = 2;
  varCtx.beginPath();
  varCtx.moveTo(mx, y0);
  varCtx.lineTo(mx, y1);
  varCtx.stroke();

  // x-axis labels: 72 ... 87, plus mean 78
  varCtx.fillStyle = "rgba(7,26,51,0.65)";
  varCtx.font = "12px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";
  varCtx.fillText(String(min), x0 - 2, H - 4);
  varCtx.fillText(String(max), x1 - 18, H - 4);

  // mean label
  varCtx.fillStyle = "rgba(7,26,51,0.8)";
  varCtx.fillText(String(mean), Math.max(x0, mx - 10), y0 + 12);
}

// ---- Init
 currentPerfKey = "last20";

window.onload = () => {
  renderToday(currentMode);

  perfTimeframe.value = "20";
  currentPerfKey = "last20";
  renderPerformance(currentPerfKey);
};

window.onresize = () => {
  if (sections.today.classList.contains("active")) {
    const cfg = DASH.sgModes[currentMode] || DASH.sgModes.gross;
    flowLastSeries = cfg.flow.slice();
    drawFlow(flowLastSeries);
  }
  if (sections.performance.classList.contains("active")) {
    drawVariance(DASH.performance[currentPerfKey].distribution);
  }
};
