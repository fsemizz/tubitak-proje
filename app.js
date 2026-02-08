const levels = {
  okon: [
    {
      id: "OKN-01",
      title: "Robot Elmaya Gitsin",
      goal: "Robotu elmaya ulaştır.",
      grid: [
        ".....",
        "..E..",
        ".....",
        "..R..",
        "....."
      ],
      allowed: ["ileri", "sag", "sol"],
      solution: ["ileri", "ileri", "ileri"]
    },
    {
      id: "OKN-02",
      title: "Yön Bulma",
      goal: "Robotu yıldızın yanına getir.",
      grid: [
        "..*..",
        ".....",
        "..R..",
        ".....",
        "....."
      ],
      allowed: ["ileri", "sag", "sol"],
      solution: ["ileri", "ileri"]
    }
  ],
  ilk: [
    {
      id: "ILK-01",
      title: "Engeli Geç",
      goal: "Robotu hazineye ulaştır.",
      grid: [
        "..T..",
        ".###.",
        "..R..",
        ".....",
        "....."
      ],
      allowed: ["ileri", "sag", "sol", "tekrar"],
      solution: ["tekrar", "ileri", "ileri", "ileri"]
    },
    {
      id: "ILK-02",
      title: "Koşullu Yol",
      goal: "Engellerden kaç ve yıldızı al.",
      grid: [
        "..*..",
        ".#.#.",
        "..R..",
        ".....",
        "....."
      ],
      allowed: ["ileri", "sag", "sol", "tekrar", "eger"],
      solution: ["ileri", "eger", "sag", "ileri"]
    }
  ]
};

const cardDefs = {
  ileri: { label: "İleri ▷", icon: "▷" },
  sag: { label: "Sağa ↷", icon: "↷" },
  sol: { label: "Sola ↶", icon: "↶" },
  tekrar: { label: "Tekrar ⟲", icon: "⟲" },
  eger: { label: "Eğer ?", icon: "?" }
};

const state = {
  mode: "okon",
  level: null,
  program: [],
  running: false,
  stepIndex: 0,
  dir: 0
};

const dom = {
  levelList: document.getElementById("levelList"),
  cardTray: document.getElementById("cardTray"),
  slots: document.getElementById("programSlots"),
  levelTitle: document.getElementById("levelTitle"),
  levelGoal: document.getElementById("levelGoal"),
  status: document.getElementById("status"),
  shareUrl: document.getElementById("shareUrl"),
  baseUrlText: document.getElementById("baseUrlText"),
  scene: document.getElementById("scene"),
  hintBtn: document.getElementById("hintBtn"),
  solutionBtn: document.getElementById("solutionBtn"),
  startBtn: document.getElementById("startBtn"),
  resetBtn: document.getElementById("resetBtn"),
  runBtn: document.getElementById("runBtn"),
  stepBtn: document.getElementById("stepBtn"),
  speed: document.getElementById("speed"),
  copyBtn: document.getElementById("copyBtn"),
  fullscreenBtn: document.getElementById("fullscreenBtn"),
  helpBtn: document.getElementById("helpBtn"),
  help: document.getElementById("help"),
  closeHelp: document.getElementById("closeHelp")
};

const ctx = dom.scene.getContext("2d");

function init() {
  bootstrapLevels();
  bindModeChips();
  renderLevels();
  bindControls();
  loadFromUrl();
  renderCards();
  renderSlots();
  drawScene();
}

function bindModeChips() {
  document.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      state.mode = chip.dataset.mode;
      document.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      renderLevels();
    });
  });
  document.querySelector(".chip[data-mode='okon']").classList.add("active");
}

function bootstrapLevels() {
  Object.values(levels).flat().forEach((lvl) => {
    if (!lvl.baseGrid) {
      lvl.baseGrid = lvl.grid.slice();
      lvl.targets = findTargets(lvl.baseGrid);
    }
  });
}

function renderLevels() {
  dom.levelList.innerHTML = "";
  levels[state.mode].forEach((lvl) => {
    const el = document.createElement("div");
    el.className = "level-item";
    el.innerHTML = `<div><strong>${lvl.id}</strong> - ${lvl.title}</div><div>Seç</div>`;
    el.addEventListener("click", () => selectLevel(lvl));
    dom.levelList.appendChild(el);
  });
}

function selectLevel(lvl) {
  state.level = lvl;
  state.program = [];
  state.stepIndex = 0;
  state.dir = 0;
  resetGrid();
  dom.levelTitle.textContent = `${lvl.id} • ${lvl.title}`;
  dom.levelGoal.textContent = lvl.goal;
  dom.status.textContent = "Hazır";
  renderCards();
  renderSlots();
  drawScene();
  updateShareUrl();
  highlightSelectedLevel();
}

function highlightSelectedLevel() {
  document.querySelectorAll(".level-item").forEach((item) => {
    item.classList.remove("active");
    if (state.level && item.textContent.includes(state.level.id)) item.classList.add("active");
  });
}

function renderCards() {
  dom.cardTray.innerHTML = "";
  if (!state.level) return;
  state.level.allowed.forEach((cmd) => {
    const card = document.createElement("div");
    card.className = `cmd-card ${state.mode}`;
    card.textContent = cardDefs[cmd].label;
    card.addEventListener("click", () => addCommand(cmd));
    dom.cardTray.appendChild(card);
  });
}

function renderSlots() {
  dom.slots.innerHTML = "";
  const count = state.mode === "okon" ? 6 : 8;
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
  const limit = state.mode === "okon" ? 6 : 8;
  if (state.program.length >= limit) return;
  state.program.push(cmd);
  renderSlots();
}

function bindControls() {
  dom.startBtn.addEventListener("click", () => runProgram(true));
  dom.resetBtn.addEventListener("click", resetLevel);
  dom.runBtn.addEventListener("click", () => runProgram(true));
  dom.stepBtn.addEventListener("click", () => runProgram(false));
  dom.hintBtn.addEventListener("click", () => showHint());
  dom.solutionBtn.addEventListener("click", () => showSolution());
  dom.copyBtn.addEventListener("click", copyLink);
  dom.fullscreenBtn.addEventListener("click", toggleFullscreen);
  dom.helpBtn.addEventListener("click", () => dom.help.showModal());
  dom.closeHelp.addEventListener("click", () => dom.help.close());
}

function resetLevel() {
  state.stepIndex = 0;
  state.dir = 0;
  resetGrid();
  dom.status.textContent = "Hazır";
  drawScene();
}

function runProgram(auto) {
  if (!state.level) return;
  if (state.program.length === 0) {
    dom.status.textContent = "Önce kartları ekleyin.";
    return;
  }
  state.running = true;
  const speed = 900 / Number(dom.speed.value);

  const step = () => {
    if (state.stepIndex >= state.program.length) {
      state.running = false;
      dom.status.textContent = checkSuccess() ? "Başarılı!" : "Tekrar dene.";
      return;
    }
    executeCommand(state.program[state.stepIndex]);
    state.stepIndex++;
    drawScene();
    if (!auto) {
      state.running = false;
      dom.status.textContent = `Adım ${state.stepIndex}`;
      return;
    }
    setTimeout(step, speed);
  };

  step();
}

function executeCommand(cmd) {
  if (!state.level) return;
  if (cmd === "sag") state.dir = (state.dir + 1) % 4;
  if (cmd === "sol") state.dir = (state.dir + 3) % 4;
  if (cmd === "ileri") moveForward();
  if (cmd === "tekrar") moveForward();
  if (cmd === "eger") {
    const next = peekForward();
    if (next === "#") state.dir = (state.dir + 1) % 4;
  }
}

function moveForward() {
  const pos = findChar("R");
  const [nx, ny] = nextPos(pos[0], pos[1]);
  const cell = getCell(nx, ny);
  if (cell === "#") return;
  setCell(pos[0], pos[1], ".");
  setCell(nx, ny, "R");
}

function peekForward() {
  const pos = findChar("R");
  const [nx, ny] = nextPos(pos[0], pos[1]);
  return getCell(nx, ny);
}

function nextPos(x, y) {
  if (state.dir === 0) return [x, y - 1];
  if (state.dir === 1) return [x + 1, y];
  if (state.dir === 2) return [x, y + 1];
  return [x - 1, y];
}

function findChar(ch) {
  const grid = getGrid();
  for (let y = 0; y < grid.length; y++) {
    const row = grid[y];
    const x = row.indexOf(ch);
    if (x >= 0) return [x, y];
  }
  return [0, 0];
}

function getGrid() {
  return state.level.grid.map((row) => row.split(""));
}

function setCell(x, y, value) {
  const rows = state.level.grid.map((row) => row.split(""));
  rows[y][x] = value;
  state.level.grid = rows.map((r) => r.join(""));
}

function getCell(x, y) {
  const grid = getGrid();
  if (y < 0 || y >= grid.length || x < 0 || x >= grid[0].length) return "#";
  return grid[y][x];
}

function checkSuccess() {
  const [rx, ry] = findChar("R");
  return state.level.targets.some((t) => t.x === rx && t.y === ry);
}

function drawScene() {
  if (!state.level) {
    ctx.clearRect(0, 0, dom.scene.width, dom.scene.height);
    return;
  }
  const grid = getGrid();
  const size = dom.scene.width / grid.length;
  ctx.clearRect(0, 0, dom.scene.width, dom.scene.height);
  grid.forEach((row, y) => {
    row.forEach((cell, x) => {
      ctx.strokeStyle = "#1f2937";
      ctx.strokeRect(x * size, y * size, size, size);
      if (cell === "#") {
        ctx.fillStyle = "#334155";
        ctx.fillRect(x * size, y * size, size, size);
      }
      drawTarget(x, y, size);
      if (cell === "R") {
        ctx.fillStyle = "#38bdf8";
        ctx.fillRect(x * size + 8, y * size + 8, size - 16, size - 16);
      }
    });
  });
}

function updateShareUrl() {
  if (!state.level) return;
  const url = new URL(window.location.href);
  url.searchParams.set("e", state.level.id);
  dom.shareUrl.value = url.toString();
}

function setBaseUrlText() {
  const base = "https://fsemizz.github.io/tubitak-proje/";
  dom.baseUrlText.textContent = `Base: ${base}`;
}

function copyLink() {
  if (!dom.shareUrl.value) return;
  navigator.clipboard.writeText(dom.shareUrl.value);
  dom.status.textContent = "Link kopyalandı.";
}

function showHint() {
  if (!state.level) return;
  dom.status.textContent = `İpucu: ${state.level.solution[0]} ile başla.`;
}

function showSolution() {
  if (!state.level) return;
  state.program = [...state.level.solution];
  renderSlots();
  dom.status.textContent = "Çözüm yerleştirildi.";
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
}

function loadFromUrl() {
  const id = new URLSearchParams(window.location.search).get("e");
  if (!id) return;
  const lvl = Object.values(levels).flat().find((l) => l.id === id);
  if (lvl) {
    state.mode = lvl.id.startsWith("OKN") ? "okon" : "ilk";
    document.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
    document.querySelector(`.chip[data-mode='${state.mode}']`).classList.add("active");
    renderLevels();
    selectLevel(lvl);
  }
}

function resetGrid() {
  state.level.grid = state.level.baseGrid.slice();
}

function findTargets(grid) {
  const targets = [];
  grid.forEach((row, y) => {
    row.split("").forEach((cell, x) => {
      if (cell === "E" || cell === "T" || cell === "*") targets.push({ x, y });
    });
  });
  return targets;
}

function drawTarget(x, y, size) {
  if (!state.level.targets.some((t) => t.x === x && t.y === y)) return;
  ctx.fillStyle = "#fbbf24";
  ctx.beginPath();
  ctx.arc(x * size + size / 2, y * size + size / 2, size / 3, 0, Math.PI * 2);
  ctx.fill();
}

setBaseUrlText();
init();
