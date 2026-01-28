// dash-app.js
const sgSeries = {
  gross:    [0.2,-0.4,1.0,0.1,-0.2,0.3,-0.6,0.0,0.4,1.0,-0.1,-1.0,0.2,1.0,-0.3,0.1,0.5,1.0],
  handicap: [0.4,-0.2,0.8,0.3,0.0,0.2,-0.3,0.1,0.5,0.9,0.0,-0.8,0.3,0.9,-0.2,0.2,0.6,0.9],
  selected: [0.1,-0.5,1.2,-0.1,-0.3,0.4,-0.7,-0.1,0.3,0.8,-0.2,-1.2,0.1,0.8,-0.4,0.0,0.4,0.8]
};

const sectionSelect = document.getElementById("sectionSelect");
const sections = {
  today: document.getElementById("sec-today"),
  insights: document.getElementById("sec-insights"),
  group: document.getElementById("sec-group"),
  workouts: document.getElementById("sec-workouts")
};

sectionSelect.onchange = () => {
  Object.values(sections).forEach(s => s.classList.remove("active"));
  sections[sectionSelect.value].classList.add("active");
  if (sectionSelect.value === "today") drawChart(currentMode);
};

let currentMode = "gross";
const sgModeSelect = document.getElementById("sgModeSelect");
const sgHint = document.getElementById("sgHint");

function updateSgHint(mode){
  const map = {
    gross: "sg = strokes gained on today’s field (gross)",
    handicap: "sg = strokes gained on handicap",
    selected: "sg = strokes gained on selected handicap"
  };
  sgHint.textContent = map[mode] || map.gross;
}

sgModeSelect.onchange = () => {
  currentMode = sgModeSelect.value;
  updateSgHint(currentMode);
  if (sections.today.classList.contains("active")) {
    drawChart(currentMode);
  }
};

// Info modal
const modalOverlay = document.getElementById("modalOverlay");
const sgInfoBtn = document.getElementById("sgInfoBtn");
const modalCloseBtn = document.getElementById("modalCloseBtn");

function openModal(){
  modalOverlay.classList.add("show");
  modalOverlay.setAttribute("aria-hidden", "false");
}
function closeModal(){
  modalOverlay.classList.remove("show");
  modalOverlay.setAttribute("aria-hidden", "true");
}

sgInfoBtn.addEventListener("click", openModal);
modalCloseBtn.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) closeModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modalOverlay.classList.contains("show")) closeModal();
});

// Chart
const canvas = document.getElementById("flowChart");
const ctx = canvas.getContext("2d");

function drawChart(mode){
  const data = sgSeries[mode] || sgSeries.gross;

  const cssW = canvas.clientWidth;
  const cssH = canvas.clientHeight;
  const dpr = window.devicePixelRatio || 1;

  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const W = cssW, H = cssH;
  const padL = 36, padR = 10, padT = 12, padB = 28;
  const yMin = -3, yMax = 3;

  ctx.clearRect(0,0,W,H);

  const x0 = padL, x1 = W - padR;
  const y0 = padT, y1 = H - padB;
  const xStep = (x1 - x0) / 17;
  const yToPx = (v) => y1 - ((v - yMin) / (yMax - yMin)) * (y1 - y0);

  // grid + y labels
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(7,26,51,0.18)";
  ctx.fillStyle = "rgba(7,26,51,0.65)";
  ctx.font = "12px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";

  for (let gv = -3; gv <= 3; gv++){
    const y = yToPx(gv);
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(x1, y);
    ctx.stroke();
    ctx.fillText(String(gv), 6, y + 4);
  }

  // x grid + hole labels
  for (let i = 0; i < 18; i++){
    const x = x0 + xStep * i;
    ctx.beginPath();
    ctx.moveTo(x, y0);
    ctx.lineTo(x, y1);
    ctx.stroke();
    ctx.fillText(String(i + 1), x - 4, H - 6);
  }

  // y axis label
  ctx.save();
  ctx.translate(16, (y0 + y1) / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("sg", 0, 0);
  ctx.restore();

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
    ctx.arc(x, y, 2.6, 0, Math.PI * 2);
    ctx.fill();
  });
}

window.onload = () => {
  updateSgHint(currentMode);
  drawChart(currentMode);
};

window.onresize = () => {
  if (sections.today.classList.contains("active")) {
    drawChart(currentMode);
  }
};
