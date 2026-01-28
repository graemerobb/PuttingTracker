// ----- Hardcoded SG data -----
const sgSeries = {
  gross:    [0.2,-0.4,1.0,0.1,-0.2,0.3,-0.6,0.0,0.4,1.0,-0.1,-1.0,0.2,1.0,-0.3,0.1,0.5,1.0],
  handicap: [0.4,-0.2,0.8,0.3,0.0,0.2,-0.3,0.1,0.5,0.9,0.0,-0.8,0.3,0.9,-0.2,0.2,0.6,0.9],
  selected: [0.1,-0.5,1.2,-0.1,-0.3,0.4,-0.7,-0.1,0.3,0.8,-0.2,-1.2,0.1,0.8,-0.4,0.0,0.4,0.8]
};

// ----- Role selector -----
document.querySelectorAll(".role .btn").forEach(btn=>{
  btn.onclick=()=>{
    document.querySelectorAll(".role .btn").forEach(b=>b.classList.remove("selected"));
    btn.classList.add("selected");
  };
});

// ----- Section selector -----
const sectionSelect=document.getElementById("sectionSelect");
const sections={
  today:document.getElementById("sec-today"),
  insights:document.getElementById("sec-insights"),
  group:document.getElementById("sec-group"),
  workouts:document.getElementById("sec-workouts")
};

sectionSelect.onchange=()=>{
  Object.values(sections).forEach(s=>s.classList.remove("active"));
  sections[sectionSelect.value].classList.add("active");
  if(sectionSelect.value==="today") drawChart(currentMode);
};

// ----- SG mode buttons -----
let currentMode="gross";
document.querySelectorAll(".seg .sbtn").forEach(btn=>{
  btn.onclick=()=>{
    document.querySelectorAll(".seg .sbtn").forEach(b=>b.classList.remove("selected"));
    btn.classList.add("selected");
    currentMode=btn.dataset.sgmode;
    drawChart(currentMode);
  };
});

// ----- Canvas chart -----
const canvas=document.getElementById("flowChart");
const ctx=canvas.getContext("2d");

function drawChart(mode){
  const data=sgSeries[mode];
  const w=canvas.clientWidth;
  const h=canvas.clientHeight;
  const dpr=window.devicePixelRatio||1;
  canvas.width=w*dpr;
  canvas.height=h*dpr;
  ctx.setTransform(dpr,0,0,dpr,0,0);

  const pad=24;
  const yMin=-3,yMax=3;

  ctx.clearRect(0,0,w,h);

  // grid
  ctx.strokeStyle="rgba(7,26,51,0.2)";
  for(let i=-3;i<=3;i++){
    const y=pad+(1-(i-yMin)/(yMax-yMin))*(h-2*pad);
    ctx.beginPath();
    ctx.moveTo(pad,y);
    ctx.lineTo(w-pad,y);
    ctx.stroke();
  }

  // line
  ctx.strokeStyle="rgba(7,26,51,0.9)";
  ctx.lineWidth=2;
  ctx.beginPath();
  data.forEach((v,i)=>{
    const x=pad+(w-2*pad)*(i/17);
    const y=pad+(1-(v-yMin)/(yMax-yMin))*(h-2*pad);
    i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
  });
  ctx.stroke();
}

// init
window.onload=()=>drawChart(currentMode);
window.onresize=()=>drawChart(currentMode);
