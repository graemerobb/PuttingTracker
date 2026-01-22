// public/app.js
// PuttingTracker (mobile-first)
// Dashboard loads from /puttingtracker/api/stats.php
// Workout submits to /puttingtracker/api/sessions.php
//
// IMPORTANT FIXES in this version:
// 1) isGameComplete() no longer depends on game.completed (except home_base)
//    -> prevents circular "never completes" bug
// 2) Mark done remains manual for home_base; other games validate before allowing mark done
// 3) (Still uses your current pointer-swipe + transform carousel. If you switch to scroll-snap later,
//    this file will still work; only the swipe layer would change.)

const API_SESSIONS = "/puttingtracker/api/sessions.php";
const API_STATS = "/puttingtracker/api/stats.php";

const LS_PLAYER = "PuttingTracker.playerId";
const LS_CURRENT = "PuttingTracker.currentSession";

const GAMES = [
  { gameId: "home_base", title: "Home Base", pbBetter: "na",
    instructions: "Before playing check alignment and strike quality through the gate.\nCheck ball position, and ability to hit targets while head down." },
  { gameId: "touch_drill", title: "Touch Drill", pbBetter: "lower",
    instructions: "Setup markers at fixed distances 1 ft apart.\nGoal: achieve 4 in a row at each distance.\nScore: attempts needed to complete." },
  { gameId: "lag_distance", title: "Lag Distance", pbBetter: "lower",
    instructions: "Select random putts over 32ft.\nObjective: Hole it for 3 points, Lag it to 7% for 2 points, Lag it longer for -1 point.\nScore: How many putts to get to 10 points." },
  { gameId: "short_makes", title: "Short Makes", pbBetter: "higher",
    instructions: "Hit putts from the disances below\nObjective: Make as many as possible.\nScore: Number of makes vs Tour baseline: 12/18." },
  { gameId: "mid_makes", title: "Mid Makes", pbBetter: "higher",
    instructions: "Hit putts from the disances below\nObjective: Make as many as possible.\nScore: Number of makes vs Tour baseline: 9/18." }
];

const DISTANCES = {
  short_makes: [
    { hole: 1, distances: [3, 4, 5] },
    { hole: 2, distances: [4, 5, 6] },
    { hole: 3, distances: [6, 7, 8] },
    { hole: 4, distances: [8, 9, 10] }
  ],
  mid_makes: [
    { hole: 1, distances: [3, 5, 7] },
    { hole: 2, distances: [5, 7, 9] },
    { hole: 3, distances: [7, 9, 11] },
    { hole: 4, distances: [13, 15, 17] }
  ]
};

const BASELINES = { short_makes: 12, mid_makes: 9 };

// ---- DOM
const viewDashboard = document.getElementById("viewDashboard");
const viewWorkout = document.getElementById("viewWorkout");

const scoresList = document.getElementById("scoresList");
const historyMeta = document.getElementById("historyMeta");
const playerLine = document.getElementById("playerLine");

const btnStartWorkout = document.getElementById("btnStartWorkout");
const btnRefresh = document.getElementById("btnRefresh");
const btnBackToDashboard = document.getElementById("btnBackToDashboard");
const btnSubmitWorkout = document.getElementById("btnSubmitWorkout");

const workoutTitle = document.getElementById("workoutTitle");
const workoutMeta = document.getElementById("workoutMeta");

const carouselTrack = document.getElementById("carouselTrack");
const carouselViewport = carouselTrack.parentElement; // .carousel (viewport)

const dots = document.getElementById("dots");

const settingsModal = document.getElementById("settingsModal");
const btnSettings = document.getElementById("btnSettings");
const btnCloseSettings = document.getElementById("btnCloseSettings");
const btnSavePlayer = document.getElementById("btnSavePlayer");
const playerIdInput = document.getElementById("playerIdInput");

// Resume banner
const resumeBanner = document.getElementById("resumeBanner");
const resumeMeta = document.getElementById("resumeMeta");
const btnResume = document.getElementById("btnResume");
const btnResetWorkout = document.getElementById("btnResetWorkout");

// ---- State
let playerId = loadPlayerId();
let currentSession = loadCurrentSession();
let activeGameIndex = 0;

// -------------------- Utilities --------------------
function uid(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`;
}
function nowIsoUTC() { return new Date().toISOString(); }
function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
    .replaceAll('"',"&quot;").replaceAll("'","&#039;");
}
function clamp(n,a,b){ return Math.max(a, Math.min(b, n)); }
function showDashboard(){ viewWorkout.classList.add("hidden"); viewDashboard.classList.remove("hidden"); }
function showWorkout(){ viewDashboard.classList.add("hidden"); viewWorkout.classList.remove("hidden"); }

// -------------------- Local Storage --------------------
function loadPlayerId() {
  const v = localStorage.getItem(LS_PLAYER);
  return v && v.trim() ? v.trim() : "ply_001";
}
function savePlayerId(v) {
  playerId = (v || "").trim() || "ply_001";
  localStorage.setItem(LS_PLAYER, playerId);
  renderPlayerLine();
}
function loadCurrentSession() {
  const raw = localStorage.getItem(LS_CURRENT);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}
function saveCurrentSession() {
  if (!currentSession) return;
  localStorage.setItem(LS_CURRENT, JSON.stringify(currentSession));
}
function clearCurrentSession() {
  currentSession = null;
  localStorage.removeItem(LS_CURRENT);
}

// -------------------- API --------------------
async function getStats() {
  const url = `${API_STATS}?playerId=${encodeURIComponent(playerId)}`;
  const res = await fetch(url);
  const text = await res.text();
  let json = null; try { json = JSON.parse(text); } catch {}
  if (!res.ok) throw new Error(`Stats failed: ${res.status} ${json ? JSON.stringify(json) : text}`);
  return json;
}
async function postSession(envelope) {
  const res = await fetch(API_SESSIONS, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(envelope)
  });
  const text = await res.text();
  let json = null; try { json = JSON.parse(text); } catch {}
  if (!res.ok) throw new Error(`POST failed: ${res.status} ${json ? JSON.stringify(json) : text}`);
  return json ?? { ok: true };
}

// -------------------- Game completeness / scoring --------------------
// FIX: completion no longer depends on game.completed (except home_base).
// We treat "complete" for non-home games as "required data is present".
function isGameComplete(game) {
  if (!game) return false;

  // Home base is manual only (Mark done)
  if (game.gameId === "home_base") {
    return game.completed === true;
  }

  if (game.gameId === "touch_drill") {
    return Number.isFinite(game?.result?.attemptsToComplete);
  }

  if (game.gameId === "lag_distance") {
    return Number.isFinite(game?.result?.puttsToReachTarget);
  }

  if (game.gameId === "short_makes" || game.gameId === "mid_makes") {
    const holes = game?.result?.holes || [];
    if (holes.length !== 4) return false;

    for (const h of holes) {
      const putts = h.putts || {};
      const keys = Object.keys(putts);
      if (keys.length !== 3) return false;

      for (const k of keys) {
        const v = putts[k];
        if (!(v === 0 || v === 1)) return false;
      }
    }
    return true;
  }

  return false;
}

function countCompletedGames(env) {
  return (env.session.games || []).filter(isGameComplete).length;
}

function scoreMakesGame(game) {
  const holes = game?.result?.holes || [];
  let makes = 0;
  for (const h of holes) {
    const putts = h.putts || {};
    for (const k of Object.keys(putts)) if (putts[k] === 1) makes += 1;
  }
  const baseline = game.result.baseline ?? 0;
  game.result.score = { makes, deltaVsBaseline: makes - baseline };
}

// -------------------- Session model --------------------
function blankMakesResult(gameId) {
  const baseline = BASELINES[gameId];
  const holes = DISTANCES[gameId].map(h => {
    const putts = {};
    for (const d of h.distances) putts[`${d}ft`] = null;
    return { hole: h.hole, putts };
  });
  return { baseline, totalPutts: 18, holes, score: { makes: 0, deltaVsBaseline: -baseline } };
}

function newSessionEnvelope() {
  const startedAt = nowIsoUTC();
  const sessionId = uid("sess");
  return {
    schemaVersion: "1.0",
    app: "PuttingTracker",
    session: {
      sessionId,
      startedAt,
      endedAt: startedAt,
      playerId,
      games: [
        { gameId: "home_base", completed: false },
        { gameId: "touch_drill", completed: false, result: { attemptsToComplete: null, distancesFtUsed: [3,6,9,12] } },
        { gameId: "lag_distance", completed: false, result: { puttsToReachTarget: null, targetPoints: 10, minStartDistanceFt: 32 } },
        { gameId: "short_makes", completed: false, result: blankMakesResult("short_makes") },
        { gameId: "mid_makes", completed: false, result: blankMakesResult("mid_makes") }
      ],
      summary: { gamesCompleted: 0, submitted: false, overallNotes: "" }
    }
  };
}

// -------------------- Dashboard --------------------
function renderPlayerLine(){ playerLine.textContent = `Player: ${playerId}`; }

function renderDashboardFromStats(stats) {
  const count = stats?.meta?.sessionsCount;
  historyMeta.textContent = Number.isFinite(count) ? `Sessions: ${count}` : "Stats loaded";
  scoresList.innerHTML = "";

  for (const gdef of GAMES) {
    const gStats = stats?.games?.[gdef.gameId] || {};
    const lastText = gStats?.last?.display ?? "—";
    const pbText = gStats?.pb?.display ?? "—";

    const card = document.createElement("div");
    card.className = "score-card";
    card.innerHTML = `
      <div class="score-top">
        <div>
          <div class="score-title">${escapeHtml(gdef.title)}</div>
          <div class="score-meta">${escapeHtml(gdef.gameId)}</div>
        </div>
        <div class="badge">${gStats.last ? "Last" : "No data"}</div>
      </div>
      <div class="kpis">
        <div class="kpi">
          <div class="label">Personal best</div>
          <div class="value">${escapeHtml(pbText)}</div>
        </div>
        <div class="kpi">
          <div class="label">Last score</div>
          <div class="value">${escapeHtml(lastText)}</div>
        </div>
      </div>
    `;
    scoresList.appendChild(card);
  }
}

// -------------------- Resume banner --------------------
function sessionProgress(env) {
  const total = env?.session?.games?.length ?? 0;
  const completed = total ? env.session.games.filter(isGameComplete).length : 0;
  return { completed, total };
}

function renderResumeBanner() {
  const env = loadCurrentSession();
  if (!env) { resumeBanner.classList.add("hidden"); return; }

  const p = sessionProgress(env);
  const pid = env?.session?.playerId;
  const id = env?.session?.sessionId;

  resumeMeta.textContent = (pid && pid !== playerId)
    ? `Saved session ${id} belongs to ${pid} (you are ${playerId}).`
    : `Session ${id} • Completed ${p.completed}/${p.total}`;

  resumeBanner.classList.remove("hidden");
}

// -------------------- Workout --------------------
function updateSubmitState() {
  if (!currentSession) { btnSubmitWorkout.disabled = true; workoutMeta.textContent = ""; return; }
  const completed = countCompletedGames(currentSession);
  const total = currentSession.session.games.length;
  btnSubmitWorkout.disabled = completed !== total;
  workoutMeta.textContent = `Completed ${completed}/${total}`;
}

function setActiveGame(index, skipAnim=false) {
  activeGameIndex = clamp(index, 0, GAMES.length - 1);

  const w = carouselViewport.clientWidth || carouselTrack.clientWidth;
  const x = -activeGameIndex * w;

  carouselTrack.style.transition = skipAnim ? "none" : "transform 180ms ease";
  carouselTrack.style.transform = `translateX(${x}px)`;

  [...dots.children].forEach((d,i)=>d.classList.toggle("active", i===activeGameIndex));
}

function renderWorkout() {
  if (!currentSession) return;

  workoutTitle.textContent = "Workout";
  workoutMeta.textContent = `Session: ${currentSession.session.sessionId}`;

  carouselTrack.innerHTML = "";
  dots.innerHTML = "";

  currentSession.session.games.forEach((game, idx) => {
    const def = GAMES.find(g => g.gameId === game.gameId);

    // Keep makes score fresh
    if (game.gameId === "short_makes" || game.gameId === "mid_makes") scoreMakesGame(game);

    const badge = isGameComplete(game)
      ? `<span class="badge">Completed</span>`
      : `<span class="badge">In progress</span>`;

    const card = document.createElement("div");
    card.className = "game-card";
    card.setAttribute("data-game-id", game.gameId);
    card.innerHTML = `
      <div class="game-head">
        <div>
          <div class="game-title">${escapeHtml(def?.title || game.gameId)}</div>
          <div class="game-sub">${escapeHtml(game.gameId)}</div>
        </div>
        ${badge}
      </div>
      <div class="instructions">${escapeHtml(def?.instructions || "").replaceAll("\n","<br>")}</div>
      <div class="capture" id="cap_${escapeHtml(game.gameId)}"></div>
      <div class="actions">
        <button class="btn btn-secondary" data-action="markDone" data-game="${escapeHtml(game.gameId)}">Mark done</button>
      </div>
    `;

    carouselTrack.appendChild(card);

    const dot = document.createElement("div");
    dot.className = "dot" + (idx === activeGameIndex ? " active" : "");
    dot.addEventListener("click", () => setActiveGame(idx));
    dots.appendChild(dot);

    const cap = card.querySelector(`#cap_${CSS.escape(game.gameId)}`);
    cap.appendChild(renderCaptureUI(game));
  });

  setActiveGame(activeGameIndex, true);
  updateSubmitState();
}

function renderCaptureUI(game) {
  const wrap = document.createElement("div");

  if (game.gameId === "home_base") {
    wrap.innerHTML = `<div class="field"><span class="help">No data. Use “Mark done” when complete.</span></div>`;
    return wrap;
  }

  if (game.gameId === "touch_drill") {
    wrap.innerHTML = `
      <label class="field">
        <span>Attempts to complete</span>
        <input inputmode="numeric" placeholder="e.g. 27" value="${game.result.attemptsToComplete ?? ""}" data-bind="touch_attempts" />
      </label>
      <label class="field">
        <span>Distances used (ft, comma-separated)</span>
        <input inputmode="text" placeholder="3,6,9,12" value="${(game.result.distancesFtUsed || []).join(",")}" data-bind="touch_distances" />
      </label>
    `;
    hookTouchInputs(wrap, game);
    return wrap;
  }

  if (game.gameId === "lag_distance") {
    wrap.innerHTML = `
      <label class="field">
        <span>Putts to reach ${game.result.targetPoints} points</span>
        <input inputmode="numeric" placeholder="e.g. 8" value="${game.result.puttsToReachTarget ?? ""}" data-bind="lag_putts" />
      </label>
    `;
    hookLagInputs(wrap, game);
    return wrap;
  }

  if (game.gameId === "short_makes" || game.gameId === "mid_makes") {
    const rows = DISTANCES[game.gameId];
    const container = document.createElement("div");

    for (const row of rows) {
      const holeObj = game.result.holes.find(x => x.hole === row.hole);

      const holeBlock = document.createElement("div");
      holeBlock.style.marginBottom = "12px";
      holeBlock.innerHTML = `<div class="muted" style="margin:8px 0;">Hole ${row.hole}</div>`;

      const grid = document.createElement("div");
      grid.className = "grid";

      for (const d of row.distances) {
        const key = `${d}ft`;
        const current = holeObj.putts[key];

        const tile = document.createElement("div");
        tile.className = "tile";
        tile.innerHTML = `
        <div class="dist">${d}ft</div>
        <div class="toggle">
            <div class="pill ${current === 1 ? "on" : ""}" data-set="1" aria-label="Made">✓</div>
            <div class="pill ${current === 0 ? "off" : ""}" data-set="0" aria-label="Missed">✕</div>
        </div>
        `;


        tile.querySelectorAll(".pill").forEach(p => {
          p.addEventListener("click", () => {
            const v = Number(p.getAttribute("data-set"));
            holeObj.putts[key] = v;

            scoreMakesGame(game);

            // NOTE: we no longer set game.completed based on isGameComplete() for home_base only
            // For other games, completed is manual, but readiness is computed by isGameComplete()
            // We keep completed flag for makes/touch/lag as "optional"; it will be set via Mark done.
            currentSession.session.endedAt = nowIsoUTC();
            currentSession.session.summary.gamesCompleted = countCompletedGames(currentSession);

            saveCurrentSession();
            renderWorkout();
            renderResumeBanner();
          });
        });

        grid.appendChild(tile);
      }

      holeBlock.appendChild(grid);
      container.appendChild(holeBlock);
    }

    const scoreRow = document.createElement("div");
    scoreRow.className = "kpis";
    scoreRow.innerHTML = `
      <div class="kpi"><div class="label">Makes</div><div class="value">${game.result.score?.makes ?? 0}</div></div>
      <div class="kpi"><div class="label">Baseline</div><div class="value">${game.result.baseline}</div></div>
      <div class="kpi"><div class="label">Delta</div><div class="value">${game.result.score?.deltaVsBaseline ?? 0}</div></div>
    `;
    wrap.appendChild(container);
    wrap.appendChild(scoreRow);
    return wrap;
  }

  wrap.textContent = "Unknown game.";
  return wrap;
}

function hookTouchInputs(root, game) {
  const attemptsEl = root.querySelector('[data-bind="touch_attempts"]');
  const distEl = root.querySelector('[data-bind="touch_distances"]');

  const commit = () => {
    const attempts = parseInt((attemptsEl.value || "").trim(), 10);
    game.result.attemptsToComplete = Number.isFinite(attempts) ? attempts : null;

    const dist = (distEl.value || "")
      .split(",")
      .map(s => parseInt(s.trim(), 10))
      .filter(n => Number.isFinite(n));
    if (dist.length) game.result.distancesFtUsed = dist;

    currentSession.session.endedAt = nowIsoUTC();
    currentSession.session.summary.gamesCompleted = countCompletedGames(currentSession);

    saveCurrentSession();
    updateSubmitState();
    renderResumeBanner();
  };

  attemptsEl.addEventListener("input", commit);
  distEl.addEventListener("input", commit);
}

function hookLagInputs(root, game) {
  const puttsEl = root.querySelector('[data-bind="lag_putts"]');
  const commit = () => {
    const putts = parseInt((puttsEl.value || "").trim(), 10);
    game.result.puttsToReachTarget = Number.isFinite(putts) ? putts : null;

    currentSession.session.endedAt = nowIsoUTC();
    currentSession.session.summary.gamesCompleted = countCompletedGames(currentSession);

    saveCurrentSession();
    updateSubmitState();
    renderResumeBanner();
  };
  puttsEl.addEventListener("input", commit);
}

// -------------------- Swipe (unchanged from your version) --------------------
function attachSwipe() {
  let startX = 0;
  let currentX = 0;
  let dragging = false;

  const isInteractive = (el) => !!el.closest("button, a, input, textarea, select, label");

  carouselViewport.addEventListener("pointerdown", (e) => {
    if (isInteractive(e.target)) return;

    dragging = true;
    startX = e.clientX;
    currentX = startX;

    carouselViewport.setPointerCapture(e.pointerId);
    carouselTrack.style.transition = "none";
  });

  carouselViewport.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    currentX = e.clientX;

    const dx = currentX - startX;
    const w = carouselViewport.clientWidth || carouselTrack.clientWidth;
    const base = -activeGameIndex * w;

    carouselTrack.style.transform = `translateX(${base + dx}px)`;
  });

  const end = (e) => {
    if (!dragging) return;
    dragging = false;

    try { carouselViewport.releasePointerCapture(e.pointerId); } catch {}

    const dx = currentX - startX;
    const w = carouselViewport.clientWidth || carouselTrack.clientWidth;
    const threshold = w * 0.18;

    if (dx > threshold) setActiveGame(activeGameIndex - 1);
    else if (dx < -threshold) setActiveGame(activeGameIndex + 1);
    else setActiveGame(activeGameIndex);
  };

  carouselViewport.addEventListener("pointerup", end);
  carouselViewport.addEventListener("pointercancel", end);

  window.addEventListener("resize", () => setActiveGame(activeGameIndex, true));
}

// -------------------- Events --------------------
btnStartWorkout.addEventListener("click", () => {
  if (!currentSession) {
    currentSession = newSessionEnvelope();
    saveCurrentSession();
  }
  activeGameIndex = 0;
  showWorkout();
  renderWorkout();
  renderResumeBanner();
});

btnBackToDashboard.addEventListener("click", () => {
  showDashboard();
  renderResumeBanner();
});

btnRefresh.addEventListener("click", async () => {
  await loadAndRenderStats();
});

btnSubmitWorkout.addEventListener("click", async () => {
  try {
    if (!currentSession) return;

    // Ensure makes games are scored
    for (const g of currentSession.session.games) {
      if (g.gameId === "short_makes" || g.gameId === "mid_makes") scoreMakesGame(g);
    }

    currentSession.session.summary.gamesCompleted = countCompletedGames(currentSession);
    currentSession.session.endedAt = nowIsoUTC();

    await postSession(currentSession);

    clearCurrentSession();
    await loadAndRenderStats();
    showDashboard();
    renderResumeBanner();
    alert("Workout submitted ✅");
  } catch (e) {
    console.error(e);
    alert(`Submit failed:\n${String(e.message || e)}`);
  }
});

// Mark done button (delegated)
carouselTrack.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action='markDone']");
  if (!btn || !currentSession) return;

  const gameId = btn.getAttribute("data-game");
  const game = currentSession.session.games.find(g => g.gameId === gameId);
  if (!game) return;

  if (gameId === "home_base") {
    game.completed = true;
    btn.disabled = true;
    btn.textContent = "✓ Done";
    btn.classList.add("btn-done");

} else {
    // Validate readiness (required data present)
    if (!isGameComplete(game)) {
      alert("Finish the fields for this game first.");
      return;
    }
    game.completed = true;
    // Visual feedback for Mark Done
    btn.disabled = true;
    btn.textContent = "✓ Done";
    btn.classList.add("btn-done");

  }

  if (gameId === "short_makes" || gameId === "mid_makes") scoreMakesGame(game);

  currentSession.session.summary.gamesCompleted = countCompletedGames(currentSession);
  currentSession.session.endedAt = nowIsoUTC();

  saveCurrentSession();
  renderWorkout();
  renderResumeBanner();
});

btnSettings.addEventListener("click", () => {
  playerIdInput.value = playerId;
  settingsModal.classList.remove("hidden");
});
btnCloseSettings.addEventListener("click", () => settingsModal.classList.add("hidden"));
btnSavePlayer.addEventListener("click", async () => {
  savePlayerId(playerIdInput.value);
  settingsModal.classList.add("hidden");
  await loadAndRenderStats();
  renderResumeBanner();
});

btnResume.addEventListener("click", () => {
  currentSession = loadCurrentSession();
  if (!currentSession) return;
  activeGameIndex = 0;
  showWorkout();
  renderWorkout();
});
btnResetWorkout.addEventListener("click", () => {
  if (!confirm("Reset the current workout? This clears the in-progress session on this device.")) return;
  clearCurrentSession();
  renderResumeBanner();
  btnSubmitWorkout.disabled = true;
});

// -------------------- Init --------------------
async function loadAndRenderStats() {
  try {
    historyMeta.textContent = "Loading stats…";
    const stats = await getStats();
    renderDashboardFromStats(stats);
  } catch (e) {
    console.error(e);
    historyMeta.textContent = "Failed to load stats";
    alert(`Stats load failed:\n${String(e.message || e)}`);
  }
}

(function init() {
  renderPlayerLine();
  attachSwipe();
  renderResumeBanner();
  loadAndRenderStats();
})();
