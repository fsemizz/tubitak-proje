const baseUrl = "https://fsemizz.github.io/tubitak-proje/";

const modeConfig = {
  m12: { label: "1-2", cards: ["up", "down", "left", "right"], slots: 6 },
  m34: { label: "3-4", cards: ["up", "down", "left", "right", "repeat2"], slots: 8 },
  m5p: { label: "5+", cards: ["up", "down", "left", "right", "repeat2", "repeat3"], slots: 10 }
};

const cardDefs = {
  up: { label: "Yukarı", icon: "↑" },
  down: { label: "Aşağı", icon: "↓" },
  left: { label: "Sol", icon: "←" },
  right: { label: "Sağ", icon: "→" },
  repeat2: { label: "Tekrar x2", icon: "⟲2" },
  repeat3: { label: "Tekrar x3", icon: "⟲3" }
};

const state = {
  mode: "m12",
  gridSize: 6,
  difficulty: "medium",
  program: [],
  expandedProgram: [],
  stepIndex: 0,
  running: false,
  grid: [],
  baseGrid: [],
  start: null,
  target: null,
  history: []
};

const dom = {
  cardTray: document.getElementById("cardTray"),
  slots: document.getElementById("programSlots"),
  status: document.getElementById("status"),
  score: document.getElementById("score"),
  scene: document.getElementById("scene"),
  speed: document.getElementById("speed"),
  startBtn: document.getElementById("startBtn"),
  stepBtn: document.getElementById("stepBtn"),
  resetBtn: document.getElementById("resetBtn"),
  newScenarioBtn: document.getElementById("newScenarioBtn"),
  gridSize: document.getElementById("gridSize"),
  difficulty: document.getElementById("difficulty"),
  shareUrl: document.getElementById("shareUrl"),
  baseUrlText: document.getElementById("baseUrlText"),
  qrImage: document.getElementById("qrImage"),
  copyBtn: document.getElementById("copyBtn"),
  fullscreenBtn: document.getElementById("fullscreenBtn"),
  helpBtn: document.getElementById("helpBtn"),
  help: document.getElementById("help"),
  closeHelp: document.getElementById("closeHelp"),
  hintBtn: document.getElementById("hintBtn"),
  solutionBtn: document.getElementById("solutionBtn"),
  historyList: document.getElementById("historyList")
};

const ctx = dom.scene.getContext("2d");

function init() {
  bindModeChips();
  bindControls();
  setBaseUrlText();
  loadFromUrl();
  generateScenario();
  renderCards();
  renderSlots();
  drawScene();
  updateShareUrl();
}

function bindModeChips() {
  document.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      state.mode = chip.dataset.mode;
      document.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      state.program = [];
      renderCards();
      renderSlots();
      updateShareUrl();
    });
  });
  document.querySelector(".chip[data-mode='m12']").classList.add("active");
}

function bindControls() {
  dom.startBtn.addEventListener("click", () => runProgram(true));
  dom.stepBtn.addEventListener("click", () => runProgram(false));
  dom.resetBtn.addEventListener("click", resetRun);
  dom.newScenarioBtn.addEventListener("click", () => {
    generateScenario();
    resetRun();
    updateShareUrl();
  });
  dom.gridSize.addEventListener("change", () => {
    state.gridSize = Number(dom.gridSize.value);
    generateScenario();
    resetRun();
    updateShareUrl();
  });
  dom.difficulty.addEventListener("change", () => {
    state.difficulty = dom.difficulty.value;
    generateScenario();
    resetRun();
    updateShareUrl();
  });
  dom.copyBtn.addEventListener("click", copyLink);
  dom.fullscreenBtn.addEventListener("click", toggleFullscreen);
  dom.helpBtn.addEventListener("click", () => dom.help.showModal());
  dom.closeHelp.addEventListener("click", () => dom.help.close());
  dom.hintBtn.addEventListener("click", showHint);
  dom.solutionBtn.addEventListener("click", showSuggestion);
}

function renderCards() {
  dom.cardTray.innerHTML = "";
  modeConfig[state.mode].cards.forEach((cmd) => {
    const card = document.createElement("div");
    card.className = "cmd-card";
    card.textContent = `${cardDefs[cmd].icon} ${cardDefs[cmd].label}`;
    card.addEventListener("click", () => addCommand(cmd));
    dom.cardTray.appendChild(card);
  });
}

function renderSlots() {
  dom.slots.innerHTML = "";
  const count = modeConfig[state.mode].slots;
  for (let i = 0; i < count; i++) {
    const slot = document.createElement("li");
    slot.className = "slot";
    const cmd = state.program[i];
    if (cmd) {
      slot.classList.add("filled");
      slot.innerHTML = `<span>${cardDefs[cmd].label}</span><span class="remove" data-idx="${i}">×</span>`;
    } else {
      slot.textContent = `${i + 1}) Kart ekle`;
    }
    if (i === state.stepIndex && state.running) slot.classList.add("active");
    dom.slots.appendChild(slot);
  }
  dom.slots.querySelectorAll(".remove").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const idx = Number(e.target.dataset.idx);
      state.program.splice(idx, 1);
      renderSlots();
    });
  });
}

function addCommand(cmd) {
  const limit = modeConfig[state.mode].slots;
  if (state.program.length >= limit) return;
  state.program.push(cmd);
  renderSlots();
}

function generateScenario() {
  const size = state.gridSize;
  const attempts = 200;
  for (let i = 0; i < attempts; i++) {
    const grid = Array.from({ length: size }, () => Array(size).fill("."));
    const start = { x: Math.floor(size / 2), y: Math.floor(size / 2) };
    const target = randomCell(size, start);
    grid[start.y][start.x] = "S";
    grid[target.y][target.x] = "T";

    const obstacleCount = Math.floor(size * size * obstacleRatio());
    let placed = 0;
    while (placed < obstacleCount) {
      const pos = randomCell(size, start, target);
      if (grid[pos.y][pos.x] === ".") {
        grid[pos.y][pos.x] = "#";
        placed++;
      }
    }

    if (hasPath(grid, start, target)) {
      state.grid = grid;
      state.baseGrid = cloneGrid(grid);
      state.start = start;
      state.target = target;
      return;
    }
  }
  // fallback
  state.grid = Array.from({ length: size }, () => Array(size).fill("."));
  state.baseGrid = cloneGrid(state.grid);
  state.start = { x: 0, y: 0 };
  state.target = { x: size - 1, y: size - 1 };
  state.grid[0][0] = "S";
  state.grid[size - 1][size - 1] = "T";
  state.baseGrid = cloneGrid(state.grid);
}

function obstacleRatio() {
  if (state.difficulty === "easy") return 0.08;
  if (state.difficulty === "hard") return 0.25;
  return 0.16;
}

function randomCell(size, ...exclude) {
  let x = 0;
  let y = 0;
  do {
    x = Math.floor(Math.random() * size);
    y = Math.floor(Math.random() * size);
  } while (exclude.some((p) => p.x === x && p.y === y));
  return { x, y };
}

function hasPath(grid, start, target) {
  const size = grid.length;
  const visited = Array.from({ length: size }, () => Array(size).fill(false));
  const queue = [start];
  visited[start.y][start.x] = true;
  const dirs = [
    { x: 0, y: -1 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
    { x: 1, y: 0 }
  ];
  while (queue.length) {
    const cur = queue.shift();
    if (cur.x === target.x && cur.y === target.y) return true;
    for (const d of dirs) {
      const nx = cur.x + d.x;
      const ny = cur.y + d.y;
      if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
      if (visited[ny][nx]) continue;
      if (grid[ny][nx] === "#") continue;
      visited[ny][nx] = true;
      queue.push({ x: nx, y: ny });
    }
  }
  return false;
}

function resetRun() {
  state.program = [];
  state.expandedProgram = [];
  state.stepIndex = 0;
  state.running = false;
  state.grid = cloneGrid(state.baseGrid);
  dom.status.textContent = "Hazır";
  renderSlots();
  drawScene();
  updateScore(0);
}

function expandProgram() {
  const expanded = [];
  for (let i = 0; i < state.program.length; i++) {
    const cmd = state.program[i];
    if (cmd === "repeat2" || cmd === "repeat3") {
      const prev = expanded[expanded.length - 1];
      const count = cmd === "repeat2" ? 2 : 3;
      if (prev) {
        for (let k = 0; k < count; k++) expanded.push(prev);
      }
    } else {
      expanded.push(cmd);
    }
  }
  return expanded;
}

function runProgram(auto) {
  if (state.program.length === 0) {
    dom.status.textContent = "Önce kartları ekleyin.";
    return;
  }
  if (auto) {
    state.expandedProgram = expandProgram();
    state.stepIndex = 0;
    state.grid = cloneGrid(state.baseGrid);
  } else if (state.expandedProgram.length === 0 || state.stepIndex >= state.expandedProgram.length) {
    state.expandedProgram = expandProgram();
    state.stepIndex = 0;
    state.grid = cloneGrid(state.baseGrid);
  }

  state.running = true;
  const speed = 900 / Number(dom.speed.value);

  const step = () => {
    if (state.stepIndex >= state.expandedProgram.length) {
      state.running = false;
      const done = checkSuccess();
      dom.status.textContent = done ? "Başarılı!" : "Tekrar dene.";
      finalizeScore(done);
      renderSlots();
      return;
    }
    const cmd = state.expandedProgram[state.stepIndex];
    executeCommand(cmd);
    dom.status.textContent = `Adım ${state.stepIndex + 1}/${state.expandedProgram.length}: ${cardDefs[cmd].label}`;
    state.stepIndex++;
    drawScene();
    renderSlots();
    if (!auto) {
      state.running = false;
      return;
    }
    setTimeout(step, speed);
  };

  step();
}

function executeCommand(cmd) {
  const pos = findStart();
  const dirMap = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 }
  };
  const d = dirMap[cmd];
  if (!d) return;
  const nx = pos.x + d.x;
  const ny = pos.y + d.y;
  if (nx < 0 || ny < 0 || nx >= state.grid.length || ny >= state.grid.length) return;
  if (state.grid[ny][nx] === "#") return;
  state.grid[pos.y][pos.x] = ".";
  state.grid[ny][nx] = "S";
}

function cloneGrid(grid) {
  return grid.map((row) => row.slice());
}

function findStart() {
  for (let y = 0; y < state.grid.length; y++) {
    for (let x = 0; x < state.grid.length; x++) {
      if (state.grid[y][x] === "S") return { x, y };
    }
  }
  return { x: 0, y: 0 };
}

function checkSuccess() {
  const pos = findStart();
  return pos.x === state.target.x && pos.y === state.target.y;
}

function drawScene() {
  const size = state.grid.length;
  const cell = dom.scene.width / size;
  ctx.clearRect(0, 0, dom.scene.width, dom.scene.height);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      ctx.strokeStyle = "#1f2937";
      ctx.strokeRect(x * cell, y * cell, cell, cell);
      const v = state.grid[y][x];
      if (v === "#") {
        ctx.fillStyle = "#334155";
        ctx.fillRect(x * cell, y * cell, cell, cell);
      }
      if (x === state.target.x && y === state.target.y) {
        ctx.fillStyle = "#fbbf24";
        ctx.beginPath();
        ctx.arc(x * cell + cell / 2, y * cell + cell / 2, cell / 3, 0, Math.PI * 2);
        ctx.fill();
      }
      if (v === "S") {
        ctx.fillStyle = "#38bdf8";
        ctx.beginPath();
        ctx.arc(x * cell + cell / 2, y * cell + cell / 2, cell / 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

function updateShareUrl() {
  const url = new URL(baseUrl);
  url.searchParams.set("size", String(state.gridSize));
  url.searchParams.set("diff", state.difficulty);
  url.searchParams.set("mode", state.mode);
  dom.shareUrl.value = url.toString();
  updateQr(url.toString());
}

function setBaseUrlText() {
  dom.baseUrlText.textContent = `Base: ${baseUrl}`;
  updateQr(baseUrl);
}

function updateQr(value) {
  const encoded = encodeURIComponent(value);
  dom.qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encoded}`;
}

function copyLink() {
  if (!dom.shareUrl.value) return;
  navigator.clipboard.writeText(dom.shareUrl.value);
  dom.status.textContent = "Link kopyalandı.";
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
}

function showHint() {
  dom.status.textContent = "İpucu: Hedefe kısa bir yol bul ve kartları sırala.";
}

function showSuggestion() {
  dom.status.textContent = "Öneri: Önce yatay, sonra dikey ilerle.";
}

function updateScore(value) {
  dom.score.textContent = `Puan: ${value}`;
}

function finalizeScore(success) {
  const ideal = manhattan(state.start, state.target);
  const used = state.expandedProgram.length || 1;
  const size = state.grid.length;
  const difficultyMultiplier = state.difficulty === "easy" ? 1 : state.difficulty === "hard" ? 1.4 : 1.2;
  let score = Math.max(0, Math.round((ideal / used) * difficultyMultiplier * (size / 6) * 100));
  if (!success) score = Math.max(0, Math.round(score * 0.3));
  updateScore(score);
  addHistory({
    size,
    diff: state.difficulty,
    score,
    success,
    steps: used
  });
}

function addHistory(item) {
  state.history.unshift(item);
  state.history = state.history.slice(0, 5);
  renderHistory();
}

function renderHistory() {
  dom.historyList.innerHTML = "";
  state.history.forEach((h) => {
    const li = document.createElement("li");
    li.className = "history-item";
    li.textContent = `${h.size}x${h.size} · ${h.diff} · ${h.score} puan · ${h.success ? "Başarılı" : "Başarısız"}`;
    dom.historyList.appendChild(li);
  });
}

function manhattan(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function loadFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const size = Number(params.get("size"));
  const diff = params.get("diff");
  const mode = params.get("mode");
  if (size) state.gridSize = size;
  if (diff) state.difficulty = diff;
  if (mode && modeConfig[mode]) state.mode = mode;
  dom.gridSize.value = String(state.gridSize);
  dom.difficulty.value = state.difficulty;
  document.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
  const active = document.querySelector(`.chip[data-mode='${state.mode}']`);
  if (active) active.classList.add("active");
}

init();
