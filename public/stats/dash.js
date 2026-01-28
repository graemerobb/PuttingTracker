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
  sgHint.textContent = map[mode];
}

sgModeSelect.onchange = () => {
  currentMode = sgModeSelect.value;
  updateSgHint(currentMode);
  if (sections.today.classList.contains("active")) {
    drawChart(currentMode);
  }
};

const canvas = document.getElementById("flowChart");
const ctx = canvas.getContext("2d");

function drawChart(mode){
  const data = sgSeries[mode];
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  const dpr = window.devicePixelRatio || 1;

  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.setTransform(dpr,0,0,dpr,0,0);

  const padL=34, padR=10, padT=12, padB=26;
  const yMin=-3, yMax=3;

  ctx.clearRect(0,0,w,h);

  const x0=padL, x1=w-padR;
  const y0=padT, y1=h-padB;
  const xStep=(x1-x0)/17;
  const yToPx=v=>y1-((v-yMin)/(yMax-yMin))*(y1-y0);

  ctx.font="11px system-ui";
  ctx.strokeStyle="rgba(7,26,51,0.18)";
  ctx.fillStyle="rgba(7,26,51,0.6)";

  for(let gv=-3; gv<=3; gv++){
    const y=yToPx(gv);
    ctx.beginPath(); ctx.moveTo(x0,y); ctx.lineTo(x1,y); ctx.stroke();
    ctx.fillText(gv,6,y+4);
  }

  for(let i=0;i<18;i++){
    const x=x0+xStep*i;
    ctx.beginPath(); ctx.moveTo(x,y0); ctx.lineTo(x,y1); ctx.stroke();
    ctx.fillText(i+1,x-4,h-6);
  }

  ctx.save();
  ctx.translate(14,(y0+y1)/2);
  ctx.rotate(-Math.PI/2);
  ctx.fillText("sg",0,0);
  ctx.restore();

  ctx.strokeStyle="rgba(7,26,51,0.9)";
  ctx.lineWidth=2;
  ctx.beginPath();
  data.forEach((v,i)=>{
    const x=x0+xStep*i;
    const y=yToPx(v);
    i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
  });
  ctx.stroke();
}

window.onload = () => {
  updateSgHint(currentMode);
  drawChart(currentMode);
};
window.onresize = () => {
  if (sections.today.classList.contains("active")) drawChart(currentMode);
};
