// All editable values in one place
const DASH = {
  summary: {
    grossScore: 77,
    grossRank: "4th",
    oddsText: "1 in 200",
    handicapValue: 4,
    friendLine1: "You beat Bryan by 6 shots on hole 3. He got an 8.",
    friendLine2: "You had the most birdies today."
  },

  // When sg selection changes, switch ALL relevant numbers (chips + flow series)
  sgModes: {
    gross: {
      gained: [
        { value: "+1.1", hole: "14th" },
        { value: "+1.5", hole: "10th" },
        { value: "+2.1", hole: "18th" }
      ],
      lost: [
        { value: "-0.3", hole: "12th" }
      ],
      flow: [ 0.2,-0.4, 1.0, 0.1,-0.2, 0.3,-0.6, 0.0, 0.4, 1.0,-0.1,-1.0, 0.2, 1.0,-0.3, 0.1, 0.5, 1.0 ]
    },
    handicap: {
      gained: [
        { value: "+0.6", hole: "10th" },
        { value: "+0.9", hole: "14th" },
        { value: "+1.4", hole: "18th" }
      ],
      lost: [
        { value: "-0.7", hole: "12th" }
      ],
      flow: [ 0.4,-0.2, 0.8, 0.3, 0.0, 0.2,-0.3, 0.1, 0.5, 0.9, 0.0,-0.8, 0.3, 0.9,-0.2, 0.2, 0.6, 0.9 ]
    },
    selected: {
      gained: [
        { value: "+0.8", hole: "14th" },
        { value: "+1.2", hole: "10th" },
        { value: "+1.9", hole: "18th" }
      ],
      lost: [
        { value: "-0.4", hole: "12th" }
      ],
      flow: [ 0.1,-0.5, 1.2,-0.1,-0.3, 0.4,-0.7,-0.1, 0.3, 0.8,-0.2,-1.2, 0.1, 0.8,-0.4, 0.0, 0.4, 0.8 ]
    }
  }
};

// --------- DOM references ----------
const sectionSelect = document.getElementById("sectionSelect");
const sections = {
  today: document.getElementById("sec-today"),
  insights: document.getElementById("sec-insights"),
  group: document.getElementById("sec-group"),
  workouts: document.getElementById("sec-workouts")
};

const grossScoreEl = document.getElementById("grossScore");
const grossRankEl = document.getElementById("grossRank");
const oddsTextEl = document.getElementById("oddsText");
const handicapValueEl = document.getElementById("handicapValue");
const friendLine1El = document.getElementById("friendLine1");
const friendLine2El = document.getElementById("friendLine2");

const gainedWrap = document.getElementById("sgGainedChips");
const lostWrap = document.getElementById("sgLostChips");

const sgModeSelect = document.getElementById("sgModeSelect");

// Tooltip
const sgInfoBtn = document.getElementById("sgInfoBtn");
const sgTooltip = document.getElementById("sgTooltip");

// Chart
const canvas = document.getElementById("flowChart");
const ctx = canvas.getContext("2d");

// --------- Render helpers ----------
function setText(el, val){ if (el) el.textContent = String(val); }

function renderSummary(){
  setText(grossScoreEl, DASH.summary.grossScore);
  setText(grossRankEl, DASH.summary.grossRank);
  setText(oddsTextEl, DASH.summary.oddsText);
  setText(handicapValueEl, DASH.summary.handicapValue);
  setText(friendLine1El, DASH.summary.friendLine1);
  setText(friendLine2El, DASH.summary.friendLine2);
}

function renderChips(container, items){
  container.innerHTML = "";
  items.forEach(it => {
    const span = document.createElement("span");
    span.className = "chip";
    span.textContent = `${it.value} · ${it.hole}`;
    container.appendChild(span);
  });
}

let currentMode = "gross";

function renderForMode(mode){
  const cfg = DASH.sgModes[mode] || DASH.sgModes.gross;
  renderChips(gainedWrap, cfg.gained);
  renderChips(lostWrap, cfg.lost);
  drawChartAnimated(cfg.flow);
}

// --------- Section selector ----------
sectionSelect.onchange = () => {
  Object.values(sections).forEach(s => s.classList.remove("active"));
  sections[sectionSelect.value].classList.add("active");
  if (sectionSelect.value === "today") {
    renderForMode(currentMode);
  }
};

// --------- sg view dropdown ----------
sgModeSelect.onchange = () => {
  currentMode = sgModeSelect.value;
  if (sections.today.classList.contains("active")) {
    renderForMode(currentMode);
  }
};

// --------- Tooltip behavior ----------
function closeTooltip(){
  sgTooltip.classList.remove("show");
  sgTooltip.setAttribute("aria-hidden", "true");
}
function toggleTooltip(){
  const isOpen = sgTooltip.classList.contains("show");
  if (isOpen) closeTooltip();
  else {
    sgTooltip.classList.add("show");
    sgTooltip.setAttribute("aria-hidden", "false");
  }
}

sgInfoBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  toggleTooltip();
});

document.addEventListener("click", () => closeTooltip());
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeTooltip();
});

// --------- Chart (your latest style + animation) ----------
let lastSeries = null;
let animRaf = null;

function easeOutCubic(t){ return 1 - Math.pow(1 - t, 3); }

function drawChart(series){
  const data = Array.isArray(series) ? series : (DASH.sgModes[currentMode]?.flow || []);

  const cssW = canvas.clientWidth;
  const cssH = canvas.clientHeight;
  const dpr = window.devicePixelRatio || 1;

  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const W = cssW, H = cssH;
  const padL = 36, padR = 10, padT = 12, padB = 18;
  const yMin = -1, yMax = 1;

  ctx.clearRect(0,0,W,H);

  const x0 = padL, x1 = W - padR;
  const y0 = padT, y1 = H - padB;
  const xStep = (x1 - x0) / 17;
  const yToPx = (v) => y1 - ((v - yMin) / (yMax - yMin)) * (y1 - y0);

  // zero line only
  const yZero = yToPx(0);
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(7,26,51,0.35)";
  ctx.beginPath();
  ctx.moveTo(x0, yZero);
  ctx.lineTo(x1, yZero);
  ctx.stroke();

  // y-axis labels (no grid)
  ctx.fillStyle = "rgba(7,26,51,0.65)";
  ctx.font = "12px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";
  for (let gv = -1; gv <= 1; gv++){
    const y = yToPx(gv);
    ctx.fillText(String(gv), 6, y + 4);
  }

  // x labels only (no vertical grid)
  ctx.fillStyle = "rgba(7,26,51,0.65)";
  for (let i = 0; i < 18; i++){
    const x = x0 + xStep * i;
    ctx.fillText(String(i + 1), x - 4, H - 4);
  }

  // line
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(7,26,51,0.92)";
  ctx.beginPath();
  data.forEach((v, i) => {
    const x = x0 + xStep * i;
    const y = yToPx(v);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // points
  ctx.fillStyle = "rgba(7,26,51,0.92)";
  data.forEach((v, i) => {
    const x = x0 + xStep * i;
    const y = yToPx(v);
    ctx.beginPath();
    ctx.arc(x, y, 2.3, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawChartAnimated(nextSeries){
  const target = Array.isArray(nextSeries) ? nextSeries.slice() : [];
  if (target.length !== 18) return drawChart(target);

  // Cancel any in-flight animation
  if (animRaf) cancelAnimationFrame(animRaf);

  // Seed lastSeries (first run)
  if (!lastSeries || lastSeries.length !== 18){
    lastSeries = target.slice();
    return drawChart(lastSeries);
  }

  const start = lastSeries.slice();
  const end = target.slice();
  const duration = 380; // ms
  const t0 = performance.now();

  const step = (now) => {
    const t = Math.min(1, (now - t0) / duration);
    const e = easeOutCubic(t);

    const frame = start.map((sv, i) => sv + (end[i] - sv) * e);
    drawChart(frame);

    if (t < 1){
      animRaf = requestAnimationFrame(step);
    } else {
      lastSeries = end.slice();
      animRaf = null;
      drawChart(lastSeries); // final crisp draw
    }
  };

  animRaf = requestAnimationFrame(step);
}

// --------- Init ----------
window.onload = () => {
  renderSummary();
  renderForMode(currentMode);
};

window.onresize = () => {
  if (sections.today.classList.contains("active")) {
    // redraw without anim on resize
    const cfg = DASH.sgModes[currentMode] || DASH.sgModes.gross;
    lastSeries = cfg.flow.slice();
    drawChart(lastSeries);
  }
};
