// PuttingTracker - Mobile-first SPA
// Uses existing API:
//   GET  /puttingtracker/api/sessions.php?playerId=...&limit=...
//   POST /puttingtracker/api/sessions.php
//
// Stores currentSession in localStorage so you can resume.

const API_BASE = "/puttingtracker/api/sessions.php";
const LS_PLAYER = "PuttingTracker.playerId";
const LS_CURRENT = "PuttingTracker.currentSession";

const GAMES = [
  {
    gameId: "home_base",
    title: "Home Base",
    instructions:
      "Check alignment and strike quality through the gate.\n(No data — just confirm you did it.)",
    scoreLabel: () => "Done",
    pbBetter: "higher", // doesn't matter
  },
  {
    gameId: "touch_drill",
    title: "Touch Drill",
    instructions:
      "Setup markers at fixed distances.\nGoal: achieve 4 in a row at each distance.\nScore: attempts needed to complete.",
    scoreLabel: (g) => (g?.result?.attemptsToComplete ?? "—"),
    pbBetter: "lower",
  },
  {
    gameId: "lag_distance",
    title: "Lag Distance",
    instructions:
      "Random putts over 32ft.\nObjective: get score over 10 points.\nScore: number of putts needed to reach the target.",
    scoreLabel: (g) => (g?.result?.puttsToReachTarget ?? "—"),
    pbBetter: "lower",
  },
  {
    gameId: "short_makes",
    title: "Short Makes",
    instructions:
      "4 holes (stations). Distances:\nH1: 3,4,5 | H2: 4,5,6 | H3: 6,7,8 | H4: 8,9,10\n18 putts. Score: makes. Baseline: 12.",
    scoreLabel: (g) => (g?.result?.score?.makes ?? "—"),
    pbBetter: "higher",
  },
  {
    gameId: "mid_makes",
    title: "Mid Makes",
    instructions:
      "4 holes (stations). Distances:\nH1: 3,5,7 | H2: 5,7,9 | H3: 7,9,11 | H4: 13,15,17\n18 putts. Score: makes. Baseline: 9.",
    scoreLabel: (g) => (g?.result?.score?.makes ?? "—"),
    pbBetter: "higher",
  }
];

const DISTANCES = {
  short_makes: [
    { hole: 1, distances: [3,4,5] },
    { hole: 2, distances: [4,5,6] },
    { hole: 3, distances: [6,7,8] },
    { hole: 4, distances: [8,9,10] }
  ],
  mid_makes: [
    { hole: 1, distances: [3,5,7] },
    { hole: 2, distances: [5,7,9] },
    { hole: 3, distances: [7,9,11] },
    { hole: 4, distances: [13,15,17] }
  ]
};

const BASELINES = { short_makes: 12, mid_makes: 9 };

// ----- DOM
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
const dots = document.getElementById("dots");

const settingsModal = document.getElementById("settingsModal");
const btnSettings = document.getElementById("btnSettings");
const btnCloseSettings = document.getElementById("btnCloseSettings");
const btnSavePlayer = document.getElementById("btnSavePlayer");
const playerIdInput = document.getElementById("playerIdInput");

// ----- State
let playerId = loadPlayerId();
let historySessions = []; // array of envelopes {schemaVersion, app, session}
let currentSession = loadCurrentSession(); // envelope or null
let activeGameIndex = 0;

// -------------------- Utilities --------------------
function nowIsoWithTZ() {
  // Browser ISO includes Z; we want offset. This keeps it simple & consistent enough:
  // Use Intl to format offset not trivial; acceptable for v1 to store Z.
  return new Date().toISOString(); // "2026-01-21T...Z"
}

function uid(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`;
}

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

function showDashboard() {
  viewWorkout.classList.add("hidden");
  viewDashboard.classList.remove("hidden");
}
function showWorkout() {
  viewDashboard.classList.add("hidden");
  viewWorkout.classList.remove("hidden");
}

function renderPlayerLine() {
  playerLine.textContent = `Player: ${playerId}`;
}

// -------------------- API --------------------
async function getHistory(limit = 50) {
  const url = `${API_BASE}?playerId=${encodeURIComponent(playerId)}&limit=${limit}`;
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`History failed: ${res.status} ${text}`);
  }
  return res.json();
}

async function postSession(envelope) {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(envelope)
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* ignore */ }

  if (!res.ok) {
    throw new Error(`POST failed: ${res.status} ${json ? JSON.stringify(json) : text}`);
  }
  return json ?? { ok: true };
}

// -------------------- Scoring helpers --------------------
function scoreMakesGame(game) {
  const holes = game?.result?.holes || [];
  let makes = 0;
  for (const h of holes) {
    const putts = h.putts || {};
    for (const k of Object.keys(putts)) {
      const v = putts[k];
      if (v === 1) makes += 1;
    }
  }
  const baseline = game.result.baseline ?? 0;
  game.result.score = {
    makes,
    deltaVsBaseline: makes - baseline
  };
}

function isGameComplete(game) {
  if (!game?.completed) return false;
  // For games with required fields, ensure they exist
  if (game.gameId === "touch_drill") return Number.isFinite(game?.result?.attemptsToComplete);
  if (game.gameId === "lag_distance") return Number.isFinite(game?.result?.puttsToReachTarget);
  if (game.gameId === "short_makes" || game.gameId === "mid_makes") {
    // must have full holes structure with values 0/1
    const holes = game?.result?.holes || [];
    if (holes.length !== 4) return false;
    for (const h of holes) {
      const putts = h.putts || {};
      const keys = Object.keys(putts);
      if (keys.length !== 3) return false;
      for (const k of keys) if (!(putts[k] === 0 || putts[k] === 1)) return false;
    }
    return true;
  }
  return true;
}

function computeDashboardStats(sessions) {
  // sessions: envelopes
  // Build last + PB per game using session.session.games
  const byGame = new Map();
  for (const g of GAMES) {
    byGame.set(g.gameId, { last: null, pb: null });
  }

  // sort by startedAt desc
  const sorted = [...sessions].sort((a, b) => {
    const sa = a.session?.startedAt || "";
    const sb = b.session?.startedAt || "";
    return sb.localeCompare(sa);
  });

  for (const env of sorted) {
    const games = env.session?.games || [];
    for (const g of games) {
      if (!byGame.has(g.gameId)) continue;
      const entry = byGame.get(g.gameId);

      // last
      if (!entry.last) entry.last = g;

      // pb
      if (!entry.pb) {
        entry.pb = g;
      } else {
        entry.pb = betterGameResult(g.gameId, g, entry.pb) ? g : entry.pb;
      }
    }
  }
  return byGame;
}

function betterGameResult(gameId, candidate, currentBest) {
  const def = GAMES.find(x => x.gameId === gameId);
  const dir = def?.pbBetter || "higher";

  // home_base: treat "completed true" as PB (doesn't matter)
  if (gameId === "home_base") return false;

  if (gameId === "touch_drill") {
    const a = candidate?.result?.attemptsToComplete;
    const b = currentBest?.result?.attemptsToComplete;
    if (!Number.isFinite(a)) return false;
    if (!Number.isFinite(b)) return true;
    return dir === "lower" ? a < b : a > b;
  }

  if (gameId === "lag_distance") {
    const a = candidate?.result?.puttsToReachTarget;
    const b = currentBest?.result?.puttsToReachTarget;
    if (!Number.isFinite(a)) return false;
    if (!Number.isFinite(b)) return true;
    return dir === "lower" ? a < b : a > b;
  }

  if (gameId === "short_makes" || gameId === "mid_makes") {
    const a = candidate?.result?.score?.makes;
    const b = currentBest?.result?.score?.makes;
    if (!Number.isFinite(a)) return false;
    if (!Number.isFinite(b)) return true;
    return dir === "higher" ? a > b : a < b;
  }

  return false;
}

// -------------------- Rendering: Dashboard --------------------
function formatGameLast(gameId, g) {
  if (!g) return "—";
  if (gameId === "home_base") return g.completed ? "Done" : "—";
  if (gameId === "touch_drill") return `${g.result.attemptsToComplete} attempts`;
  if (gameId === "lag_distance") return `${g.result.puttsToReachTarget} putts`;
  if (gameId === "short_makes" || gameId === "mid_makes") return `${g.result.score.makes} / 18`;
  return "—";
}

function formatGamePB(gameId, g) {
  if (!g) return "—";
  if (gameId === "home_base") return "—";
  if (gameId === "touch_drill") return `${g.result.attemptsToComplete} (lower)`;
  if (gameId === "lag_distance") return `${g.result.puttsToReachTarget} (lower)`;
  if (gameId === "short_makes") return `${g.result.score.makes} (baseline 12)`;
  if (gameId === "mid_makes") return `${g.result.score.makes} (baseline 9)`;
  return "—";
}

function renderDashboard() {
  const count = historySessions.length;
  historyMeta.textContent = count ? `Loaded ${count} sessions` : "No sessions yet";

  const stats = computeDashboardStats(historySessions);

  scoresList.innerHTML = "";
  for (const gdef of GAMES) {
    const s = stats.get(gdef.gameId) || { last: null, pb: null };
    const lastText = formatGameLast(gdef.gameId, s.last);
    const pbText = formatGamePB(gdef.gameId, s.pb);

    const card = document.createElement("div");
    card.className = "score-card";
    card.innerHTML = `
      <div class="score-top">
        <div>
          <div class="score-title">${escapeHtml(gdef.title)}</div>
          <div class="score-meta">${escapeHtml(gdef.gameId)}</div>
        </div>
        <div class="badge">${s.last ? "Last" : "No data"}</div>
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

// -------------------- Rendering: Workout --------------------
function newSessionEnvelope() {
  const startedAt = nowIsoWithTZ();
  const sessionId = uid("sess");

  // build blank games in schema
  const games = [
    { gameId: "home_base", completed: false },
    { gameId: "touch_drill", completed: false, result: { attemptsToComplete: null, distancesFtUsed: [3,6,9,12] } },
    { gameId: "lag_distance", completed: false, result: { puttsToReachTarget: null, targetPoints: 10, minStartDistanceFt: 32 } },
    { gameId: "short_makes", completed: false, result: blankMakesResult("short_makes") },
    { gameId: "mid_makes", completed: false, result: blankMakesResult("mid_makes") }
  ];

  return {
    schemaVersion: "1.0",
    app: "PuttingTracker",
    session: {
      sessionId,
      startedAt,
      endedAt: startedAt,
      playerId,
      games,
      summary: {
        gamesCompleted: 0,
        submitted: false,
        overallNotes: ""
      }
    }
  };
}

function blankMakesResult(gameId) {
  const baseline = BASELINES[gameId];
  const holes = DISTANCES[gameId].map(h => {
    const putts = {};
    for (const d of h.distances) putts[`${d}ft`] = null; // not set yet
    return { hole: h.hole, putts };
  });
  return {
    baseline,
    totalPutts: 18,
    holes,
    score: { makes: 0, deltaVsBaseline: -baseline }
  };
}

function renderWorkout() {
  if (!currentSession) return;

  workoutTitle.textContent = "Workout";
  workoutMeta.textContent = `Session: ${currentSession.session.sessionId}`;

  // Build cards
  carouselTrack.innerHTML = "";
  dots.innerHTML = "";
  activeGameIndex = clamp(activeGameIndex, 0, GAMES.length - 1);

  currentSession.session.games.forEach((g, idx) => {
    const gdef = GAMES.find(x => x.gameId === g.gameId);

    const card = document.createElement("div");
    card.className = "game-card";
    card.setAttribute("data-game-id", g.gameId);

    const statusBadge = isGameComplete(g) ? `<span class="badge">Completed</span>` : `<span class="badge">In progress</span>`;

    card.innerHTML = `
      <div class="game-head">
        <div>
          <div class="game-title">${escapeHtml(gdef?.title || g.gameId)}</div>
          <div class="game-sub">${escapeHtml(g.gameId)}</div>
        </div>
        ${statusBadge}
      </div>
      <div class="instructions">${escapeHtml((gdef?.instructions || "").trim()).replaceAll("\n","<br>")}</div>
      <div class="capture" id="capture_${escapeHtml(g.gameId)}"></div>
      <div class="actions">
        <button class="btn btn-secondary" data-action="markDone" data-game="${escapeHtml(g.gameId)}">Mark done</button>
      </div>
    `;

    carouselTrack.appendChild(card);

    const dot = document.createElement("div");
    dot.className = "dot" + (idx === activeGameIndex ? " active" : "");
    dot.addEventListener("click", () => setActiveGame(idx));
    dots.appendChild(dot);

    // Inject capture UI per game
    const capture = card.querySelector(`#capture_${CSS.escape(g.gameId)}`);
    capture.appendChild(renderCaptureUI(g));
  });

  setActiveGame(activeGameIndex, true);
  updateSubmitState();
}

function renderCaptureUI(game) {
  const wrap = document.createElement("div");

  if (game.gameId === "home_base") {
    wrap.innerHTML = `
      <div class="field">
        <span>No data capture for Home Base.</span>
        <span class="help">Use “Mark done” when you’ve checked alignment + strike through the gate.</span>
      </div>
    `;
    return wrap;
  }

  if (game.gameId === "touch_drill") {
    wrap.innerHTML = `
      <label class="field">
        <span>Attempts to complete</span>
        <input inputmode="numeric" placeholder="e.g. 27" value="${game.result.attemptsToComplete ?? ""}" data-bind="touch_attempts" />
        <span class="help">Lower is better. Distances used are stored with the session.</span>
      </label>
      <label class="field">
        <span>Distances (ft) used (comma-separated)</span>
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
        <span class="help">Lower is better.</span>
      </label>
      <label class="field">
        <span>Min start distance (ft)</span>
        <input inputmode="numeric" value="${game.result.minStartDistanceFt ?? 32}" data-bind="lag_min_start" />
      </label>
      <label class="field">
        <span>Target points</span>
        <input inputmode="numeric" value="${game.result.targetPoints ?? 10}" data-bind="lag_target" />
      </label>
    `;
    hookLagInputs(wrap, game);
    return wrap;
  }

  if (game.gameId === "short_makes" || game.gameId === "mid_makes") {
    // create tiles grouped by hole
    const rows = DISTANCES[game.gameId];
    const container = document.createElement("div");

    for (const row of rows) {
      const h = game.result.holes.find(x => x.hole === row.hole);
      const holeBlock = document.createElement("div");
      holeBlock.style.marginBottom = "12px";
      holeBlock.innerHTML = `<div class="muted" style="margin:8px 0 8px;">Hole ${row.hole}</div>`;

      const grid = document.createElement("div");
      grid.className = "grid";

      for (const d of row.distances) {
        const key = `${d}ft`;
        const current = h.putts[key];

        const tile = document.createElement("div");
        tile.className = "tile";
        tile.innerHTML = `
          <div class="dist">${d}ft</div>
          <div class="toggle">
            <div class="pill ${current === 1 ? "on" : ""}" data-set="1">Made</div>
            <div class="pill ${current === 0 ? "off" : ""}" data-set="0">Miss</div>
          </div>
        `;

        // click handlers
        tile.querySelectorAll(".pill").forEach(p => {
          p.addEventListener("click", () => {
            const v = Number(p.getAttribute("data-set"));
            h.putts[key] = v;
            scoreMakesGame(game);
            game.completed = isGameComplete(game);
            currentSession.session.endedAt = nowIsoWithTZ();
            currentSession.session.summary.gamesCompleted = countCompletedGames(currentSession);
            saveCurrentSession();
            renderWorkout(); // re-render to update badges and submit state (simple v1)
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
      <div class="kpi">
        <div class="label">Makes</div>
        <div class="value">${game.result.score?.makes ?? 0}</div>
      </div>
      <div class="kpi">
        <div class="label">Baseline</div>
        <div class="value">${game.result.baseline}</div>
      </div>
      <div class="kpi">
        <div class="label">Delta</div>
        <div class="value">${(game.result.score?.deltaVsBaseline ?? 0)}</div>
      </div>
    `;

    wrap.appendChild(container);
    wrap.appendChild(scoreRow);
    return wrap;
  }

  wrap.textContent = "Unknown game.";
  return wrap;
}

function hookTouchInputs(root, game) {
  const a = root.querySelector('[data-bind="touch_attempts"]');
  const d = root.querySelector('[data-bind="touch_distances"]');

  const commit = () => {
    const attempts = parseInt((a.value || "").trim(), 10);
    game.result.attemptsToComplete = Number.isFinite(attempts) ? attempts : null;

    const dist = (d.value || "")
      .split(",")
      .map(s => parseInt(s.trim(), 10))
      .filter(n => Number.isFinite(n));

    game.result.distancesFtUsed = dist.length ? dist : game.result.distancesFtUsed;

    game.completed = isGameComplete(game);
    currentSession.session.endedAt = nowIsoWithTZ();
    currentSession.session.summary.gamesCompleted = countCompletedGames(currentSession);
    saveCurrentSession();
    updateSubmitState();
  };

  a.addEventListener("input", commit);
  d.addEventListener("input", commit);
}

function hookLagInputs(root, game) {
  const p = root.querySelector('[data-bind="lag_putts"]');
  const min = root.querySelector('[data-bind="lag_min_start"]');
  const t = root.querySelector('[data-bind="lag_target"]');

  const commit = () => {
    const putts = parseInt((p.value || "").trim(), 10);
    game.result.puttsToReachTarget = Number.isFinite(putts) ? putts : null;

    const minV = parseInt((min.value || "").trim(), 10);
    game.result.minStartDistanceFt = Number.isFinite(minV) ? minV : 32;

    const tar = parseInt((t.value || "").trim(), 10);
    game.result.targetPoints = Number.isFinite(tar) ? tar : 10;

    game.completed = isGameComplete(game);
    currentSession.session.endedAt = nowIsoWithTZ();
    currentSession.session.summary.gamesCompleted = countCompletedGames(currentSession);
    saveCurrentSession();
    updateSubmitState();
  };

  p.addEventListener("input", commit);
  min.addEventListener("input", commit);
  t.addEventListener("input", commit);
}

function countCompletedGames(env) {
  return (env.session.games || []).filter(isGameComplete).length;
}

function updateSubmitState() {
  if (!currentSession) {
    btnSubmitWorkout.disabled = true;
    return;
  }
  const completed = countCompletedGames(currentSession);
  const total = currentSession.session.games.length;
  btnSubmitWorkout.disabled = completed !== total;
  workoutMeta.textContent = `Completed ${completed}/${total}`;
}

// -------------------- Carousel swipe --------------------
function setActiveGame(index, skipScroll = false) {
  activeGameIndex = clamp(index, 0, GAMES.length - 1);

  const x = -activeGameIndex * carouselTrack.clientWidth;
  if (!skipScroll) {
    carouselTrack.style.transition = "transform 180ms ease";
  } else {
    carouselTrack.style.transition = "none";
  }
  carouselTrack.style.transform = `translateX(${x}px)`;

  [...dots.children].forEach((d, i) => {
    d.classList.toggle("active", i === activeGameIndex);
  });
}

function attachSwipe() {
  let startX = 0;
  let currentX = 0;
  let dragging = false;

  carouselTrack.addEventListener("pointerdown", (e) => {
    dragging = true;
    startX = e.clientX;
    currentX = startX;
    carouselTrack.setPointerCapture(e.pointerId);
    carouselTrack.style.transition = "none";
  });

  carouselTrack.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    currentX = e.clientX;
    const dx = currentX - startX;
    const base = -activeGameIndex * carouselTrack.clientWidth;
    carouselTrack.style.transform = `translateX(${base + dx}px)`;
  });

  const end = () => {
    if (!dragging) return;
    dragging = false;
    const dx = currentX - startX;
    const threshold = carouselTrack.clientWidth * 0.18;
    if (dx > threshold) setActiveGame(activeGameIndex - 1);
    else if (dx < -threshold) setActiveGame(activeGameIndex + 1);
    else setActiveGame(activeGameIndex);
  };

  carouselTrack.addEventListener("pointerup", end);
  carouselTrack.addEventListener("pointercancel", end);

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
});

btnBackToDashboard.addEventListener("click", () => {
  showDashboard();
});

btnRefresh.addEventListener("click", async () => {
  await loadAndRenderHistory();
});

btnSubmitWorkout.addEventListener("click", async () => {
  try {
    // Mark all games completed? (should already be)
    currentSession.session.summary.gamesCompleted = countCompletedGames(currentSession);
    currentSession.session.endedAt = nowIsoWithTZ();

    const res = await postSession(currentSession);
    // Once submitted, clear current session and refresh dashboard
    clearCurrentSession();
    await loadAndRenderHistory();
    showDashboard();
    alert("Workout submitted ✅");
  } catch (e) {
    console.error(e);
    alert(`Submit failed:\n${String(e.message || e)}`);
  }
});

carouselTrack.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action='markDone']");
  if (!btn || !currentSession) return;
  const gameId = btn.getAttribute("data-game");
  const game = currentSession.session.games.find(g => g.gameId === gameId);
  if (!game) return;

  // For home_base mark done; for other games, require required fields
  if (gameId === "home_base") {
    game.completed = true;
  } else {
    // do a validation check; if not complete, nudge
    if (!isGameComplete(game)) {
      alert("Finish the fields for this game first.");
      return;
    }
    game.completed = true;
  }

  if (gameId === "short_makes" || gameId === "mid_makes") {
    scoreMakesGame(game);
  }

  currentSession.session.summary.gamesCompleted = countCompletedGames(currentSession);
  currentSession.session.endedAt = nowIsoWithTZ();
  saveCurrentSession();
  renderWorkout();
});

btnSettings.addEventListener("click", () => {
  playerIdInput.value = playerId;
  settingsModal.classList.remove("hidden");
});

btnCloseSettings.addEventListener("click", () => {
  settingsModal.classList.add("hidden");
});

btnSavePlayer.addEventListener("click", async () => {
  savePlayerId(playerIdInput.value);
  settingsModal.classList.add("hidden");
  await loadAndRenderHistory();
});

// -------------------- Init --------------------
function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

async function loadAndRenderHistory() {
  try {
    historyMeta.textContent = "Loading history…";
    const data = await getHistory(50);
    historySessions = data.sessions || [];
    renderDashboard();
  } catch (e) {
    console.error(e);
    historyMeta.textContent = "Failed to load history";
    alert(`History load failed:\n${String(e.message || e)}`);
  }
}

(function init() {
  renderPlayerLine();
  attachSwipe();

  // If a session exists, show a subtle ability to resume by starting workout
  loadAndRenderHistory();

  // If you want to auto-resume:
  // if (currentSession) { showWorkout(); renderWorkout(); }
})();
