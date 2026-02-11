const baseUrl = "https://fsemizz.github.io/tubitak-proje/";

const modeConfig = {
  pre: { label: "Anaokulu", cards: ["up", "down", "left", "right"], slots: 5 },
  m12: { label: "1-2", cards: ["up", "down", "left", "right", "repeat2"], slots: 7 },
  m34: { label: "3-4", cards: ["up", "down", "left", "right", "repeat2", "repeat3"], slots: 9 }
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
  mode: "pre",
  game: "seq",
  gridSize: 6,
  difficulty: "medium",
  program: [],
  expandedProgram: [],
  programSignature: "",
  stepIndex: 0,
  running: false,
  runToken: 0,
  invalidMoves: 0,
  grid: [],
  baseGrid: [],
  start: null,
  target: null,
  history: []
};

const dom = {
  cardTray: document.getElementById("cardTray"),
  slots: document.getElementById("programSlots"),
  levelTitle: document.getElementById("levelTitle"),
  levelGoal: document.getElementById("levelGoal"),
  status: document.getElementById("status"),
  score: document.getElementById("score"),
  scoreRules: document.getElementById("scoreRules"),
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
  gameHint: document.getElementById("gameHint"),
  gameHow: document.getElementById("gameHow"),
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
  bindGameChips();
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
  document.querySelectorAll(".mode-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      state.mode = chip.dataset.mode;
      document.querySelectorAll(".mode-chip").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      state.program = [];
      state.expandedProgram = [];
      state.programSignature = "";
      state.stepIndex = 0;
      state.runToken++;
      renderCards();
      renderSlots();
      updateShareUrl();
    });
  });
  document.querySelector(".mode-chip[data-mode='pre']").classList.add("active");
}

function bindGameChips() {
  document.querySelectorAll(".game-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      state.game = chip.dataset.game;
      document.querySelectorAll(".game-chip").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      generateScenario();
      resetRun();
      renderCards();
      updateGameHint();
      updateShareUrl();
    });
  });
  const first = document.querySelector(".game-chip[data-game='seq']");
  if (first) first.classList.add("active");
  updateGameHint();
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

function updateGameHint() {
  if (!dom.gameHint) return;
  if (state.game === "seq") {
    dom.gameHint.textContent = "Sıralama: Kartları doğru sıraya koyarak hedefe ulaş.";
    dom.levelTitle.textContent = "Dinamik Senaryo";
    dom.levelGoal.textContent = "Hedefe en kısa yoldan ulaş.";
    if (dom.gameHow) dom.gameHow.textContent = "Kartları sırala, Çalıştır ile hepsini oynat, Adım ile tek tek dene.";
  } else if (state.game === "loop") {
    dom.gameHint.textContent = "Döngü: Tekrar kartlarıyla aynı hareketi kısalt.";
    dom.levelTitle.textContent = "Tekrarla Kazan";
    dom.levelGoal.textContent = "Uzun yolu tekrar kartlarıyla kısalt.";
    if (dom.gameHow) dom.gameHow.textContent = "Aynı yönü arka arkaya yapacaksan Tekrar kartlarını kullan.";
  } else {
    dom.gameHint.textContent = "Debug: Hazır koddaki hatayı bul ve düzelt.";
    dom.levelTitle.textContent = "Hata Avcısı";
    dom.levelGoal.textContent = "Hatalı kodu düzelt ve hedefe ulaş.";
    if (dom.gameHow) dom.gameHow.textContent = "Hazır kodu düzenle. Yanlış adımı sil veya değiştir, sonra çalıştır.";
  }
}

function renderCards() {
  dom.cardTray.innerHTML = "";
  const cards = getAvailableCards();
  if (!cards.length) {
    const empty = document.createElement("div");
    empty.className = "hint";
    empty.textContent = "Kartlar yüklenemedi. Mod veya oyun seçimini kontrol edin.";
    dom.cardTray.appendChild(empty);
    return;
  }
  cards.forEach((cmd) => {
    const card = document.createElement("div");
    card.className = "cmd-card";
    card.textContent = `${cardDefs[cmd].icon} ${cardDefs[cmd].label}`;
    card.addEventListener("click", () => addCommand(cmd));
    dom.cardTray.appendChild(card);
  });
}

function getAvailableCards() {
  if (state.game === "loop") {
    const base = ["up", "right", "repeat2"];
    if (state.mode === "m34") return [...base, "repeat3"];
    return base;
  }
  if (state.game === "debug") {
    return ["up", "down", "left", "right"];
  }
  return modeConfig[state.mode]?.cards || [];
}

function renderSlots() {
  dom.slots.innerHTML = "";
  const count = getSlotLimit();
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
      state.expandedProgram = [];
      state.programSignature = "";
      state.stepIndex = 0;
      state.runToken++;
      renderSlots();
    });
  });
}

function addCommand(cmd) {
  const limit = getSlotLimit();
  if (state.program.length >= limit) return;
  state.program.push(cmd);
  state.expandedProgram = [];
  state.programSignature = "";
  state.stepIndex = 0;
  state.runToken++;
  renderSlots();
}

function getSlotLimit() {
  const base = modeConfig[state.mode].slots;
  if (state.start && state.target) {
    const ideal = manhattan(state.start, state.target);
    const extra = state.game === "loop" ? 3 : 2;
    return Math.max(base, ideal + extra);
  }
  return base;
}

function generateScenario() {
  const size = state.gridSize;

  if (state.game === "loop") {
    const grid = Array.from({ length: size }, () => Array(size).fill("."));
    const start = { x: Math.floor(size / 2), y: Math.floor(size / 2) };
    const isVertical = Math.random() > 0.5;
    const maxDist = Math.max(3, size - 2);
    const dist = Math.min(maxDist, Math.floor(maxDist / 3) * 3 || 3);
    const target = isVertical
      ? { x: start.x, y: clamp(start.y + dist, 0, size - 1) }
      : { x: clamp(start.x + dist, 0, size - 1), y: start.y };
    grid[start.y][start.x] = "S";
    grid[target.y][target.x] = "T";
    state.grid = grid;
    state.baseGrid = cloneGrid(grid);
    state.start = start;
    state.target = target;
    seedDebugProgram(false);
    return;
  }

  if (state.game === "debug") {
    const grid = Array.from({ length: size }, () => Array(size).fill("."));
    const start = { x: Math.floor(size / 2), y: Math.floor(size / 2) };
    const target = { x: start.x, y: Math.max(0, start.y - 2) };
    grid[start.y][start.x] = "S";
    grid[target.y][target.x] = "T";
    if (start.y - 1 >= 0) grid[start.y - 1][start.x] = "#";
    state.grid = grid;
    state.baseGrid = cloneGrid(grid);
    state.start = start;
    state.target = target;
    seedDebugProgram(true);
    return;
  }

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
      seedDebugProgram(false);
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
  seedDebugProgram(false);
}

function obstacleRatio() {
  if (state.difficulty === "easy") return 0.08;
  if (state.difficulty === "hard") return 0.25;
  return 0.16;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function seedDebugProgram(enable) {
  if (!enable) return;
  state.program = ["up", "up", "right", "up"];
  state.expandedProgram = [];
  state.stepIndex = 0;
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
  if (state.game !== "debug") {
    state.program = [];
  }
  state.expandedProgram = [];
  state.programSignature = "";
  state.stepIndex = 0;
  state.running = false;
  state.runToken++;
  state.invalidMoves = 0;
  state.grid = cloneGrid(state.baseGrid);
  dom.status.textContent = "Hazır";
  if (state.game === "debug") seedDebugProgram(true);
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
  const token = ++state.runToken;
  state.running = true;
  const signature = state.program.join("|");
  const needsRebuild =
    state.programSignature !== signature ||
    state.expandedProgram.length === 0 ||
    state.stepIndex >= state.expandedProgram.length;

  if (auto) {
    state.expandedProgram = expandProgram();
    state.programSignature = signature;
    state.stepIndex = 0;
    state.invalidMoves = 0;
    updateScore(0);
  } else if (needsRebuild) {
    state.expandedProgram = expandProgram();
    state.programSignature = signature;
    state.stepIndex = 0;
    state.invalidMoves = 0;
    updateScore(0);
  }

  const speed = 900 / Number(dom.speed.value);

  const step = () => {
    if (token !== state.runToken) return;
    if (state.stepIndex >= state.expandedProgram.length) {
      state.running = false;
      const done = checkSuccess();
      dom.status.textContent = done ? "Başarılı!" : "Tekrar dene.";
      finalizeScore(done);
      renderSlots();
      return;
    }
    const cmd = state.expandedProgram[state.stepIndex];
    const moved = executeCommand(cmd);
    if (!moved) state.invalidMoves++;
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
  if (!d) return false;
  const nx = pos.x + d.x;
  const ny = pos.y + d.y;
  if (nx < 0 || ny < 0 || nx >= state.grid.length || ny >= state.grid.length) return false;
  if (state.grid[ny][nx] === "#") return false;
  state.grid[pos.y][pos.x] = ".";
  state.grid[ny][nx] = "S";
  return true;
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
        drawTarget(x, y, cell);
      }
      if (v === "S") {
        drawRobot(x, y, cell);
      }
    }
  }
}

function drawTarget(x, y, cell) {
  const cx = x * cell + cell * 0.5;
  const cy = y * cell + cell * 0.55;
  ctx.fillStyle = "#fbbf24";
  ctx.beginPath();
  ctx.moveTo(cx, cy - cell * 0.3);
  ctx.lineTo(cx + cell * 0.2, cy + cell * 0.25);
  ctx.lineTo(cx - cell * 0.25, cy - cell * 0.05);
  ctx.lineTo(cx + cell * 0.25, cy - cell * 0.05);
  ctx.lineTo(cx - cell * 0.2, cy + cell * 0.25);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#f59e0b";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - cell * 0.3, cy + cell * 0.3);
  ctx.lineTo(cx - cell * 0.3, cy - cell * 0.25);
  ctx.stroke();
}

function drawRobot(x, y, cell) {
  const cx = x * cell + cell / 2;
  const cy = y * cell + cell / 2;
  ctx.fillStyle = "#38bdf8";
  ctx.beginPath();
  ctx.arc(cx, cy, cell * 0.32, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#0b1120";
  ctx.beginPath();
  ctx.arc(cx - cell * 0.1, cy - cell * 0.05, cell * 0.05, 0, Math.PI * 2);
  ctx.arc(cx + cell * 0.1, cy - cell * 0.05, cell * 0.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#0b1120";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy - cell * 0.32);
  ctx.lineTo(cx, cy - cell * 0.45);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy - cell * 0.5, cell * 0.04, 0, Math.PI * 2);
  ctx.fill();
}

function updateShareUrl() {
  const url = new URL(baseUrl);
  url.searchParams.set("size", String(state.gridSize));
  url.searchParams.set("diff", state.difficulty);
  url.searchParams.set("mode", state.mode);
  url.searchParams.set("game", state.game);
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
  if (state.game === "loop") {
    dom.status.textContent = "İpucu: Aynı yönü tekrar ediyorsan Tekrar kartını kullan.";
  } else if (state.game === "debug") {
    dom.status.textContent = "İpucu: Bir adım engelle çakışıyor olabilir.";
  } else {
    dom.status.textContent = "İpucu: Hedefe kısa bir yol bul ve kartları sırala.";
  }
}

function showSuggestion() {
  if (state.game === "loop") {
    dom.status.textContent = "Öneri: 3x yukarı veya 3x sağ gibi tekrarları kısalt.";
  } else if (state.game === "debug") {
    dom.status.textContent = "Öneri: Yanlış komutu sil veya yönü değiştir.";
  } else {
    dom.status.textContent = "Öneri: Önce yatay, sonra dikey ilerle.";
  }
}

function updateScore(value) {
  dom.score.textContent = `Puan: ${value}`;
  if (dom.scoreRules) {
    dom.scoreRules.textContent = "Kural: Hedefe ulasirsan puan alirsin. Fazla adim ve duvar/sinir carpmasi puani dusurur. Hedefe ulasilmazsa puan 0.";
  }
}

function finalizeScore(success) {
  const ideal = Math.max(1, manhattan(state.start, state.target));
  const used = Math.max(1, state.expandedProgram.length);
  const size = state.grid.length;
  const difficultyBonus = state.difficulty === "easy" ? 0 : state.difficulty === "hard" ? 15 : 8;
  const sizeBonus = Math.max(0, (size - 3) * 2);
  const extraStepPenalty = Math.max(0, used - ideal) * 6;
  const invalidPenalty = state.invalidMoves * 12;

  let score = 0;
  if (success) {
    score = Math.max(0, Math.round(100 + difficultyBonus + sizeBonus - extraStepPenalty - invalidPenalty));
  }
  updateScore(score);
  dom.status.textContent = success
    ? `Basarili! Puan: ${score} (Fazla adim cezasi: ${extraStepPenalty}, carpma cezasi: ${invalidPenalty})`
    : "Basarisiz. Hedefe ulasilmadi, puan 0.";
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
  const game = params.get("game");
  if (size) state.gridSize = size;
  if (diff) state.difficulty = diff;
  if (mode && modeConfig[mode]) state.mode = mode;
  if (game && ["seq", "loop", "debug"].includes(game)) state.game = game;
  dom.gridSize.value = String(state.gridSize);
  dom.difficulty.value = state.difficulty;
  document.querySelectorAll(".mode-chip").forEach((c) => c.classList.remove("active"));
  const active = document.querySelector(`.mode-chip[data-mode='${state.mode}']`);
  if (active) active.classList.add("active");
  document.querySelectorAll(".game-chip").forEach((c) => c.classList.remove("active"));
  const activeGame = document.querySelector(`.game-chip[data-game='${state.game}']`);
  if (activeGame) activeGame.classList.add("active");
  updateGameHint();
}

init();
