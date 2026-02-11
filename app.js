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

const orderScenarios = [
  {
    title: "Gorev: Sandwich hazirla",
    steps: [
      { id: "bread1", icon: "🍞", text: "2 dilim ekmek al" },
      { id: "open", icon: "🫙", text: "Recelin kapagini ac" },
      { id: "dip", icon: "🔪", text: "Bicagi recelin icine daldir" },
      { id: "spread", icon: "🍓", text: "Ekmegin bir tarafina sur" },
      { id: "close", icon: "🥪", text: "Ekmekleri birlestir ve ye" }
    ]
  },
  {
    title: "Gorev: Dis fircala",
    steps: [
      { id: "tap", icon: "🚰", text: "Muslugu ac" },
      { id: "paste", icon: "🪥", text: "Firca ustune dis macunu sur" },
      { id: "brush", icon: "😁", text: "Dislerini fircala" },
      { id: "rinse", icon: "💧", text: "Agzini calkala" }
    ]
  },
  {
    title: "Gorev: Cicek sula",
    steps: [
      { id: "can", icon: "🪣", text: "Sulama kabini al" },
      { id: "fill", icon: "🚿", text: "Kabini su ile doldur" },
      { id: "walk", icon: "🚶", text: "Saksinin yanina git" },
      { id: "pour", icon: "🌼", text: "Cicege suyu dok" }
    ]
  }
];

const duelQuestionBank = {
  seq: [
    {
      type: "Hedef Bulma",
      text: "Robotun bir kare yukari, sonra bir kare saga gitmesi icin hangi kod dogru?",
      options: ["up, right", "right, up", "up, up", "left, right"],
      answer: 0
    },
    {
      type: "Hedef Bulma",
      text: "Hedef soldaysa ilk adim ne olmali?",
      options: ["left", "right", "up", "down"],
      answer: 0
    }
  ],
  order: [
    {
      type: "Siralama",
      text: "Dis fircalama icin dogru sira hangisi?",
      options: [
        "Muslugu ac -> Macun sur -> Fircala -> Calkala",
        "Macun sur -> Muslugu ac -> Calkala -> Fircala",
        "Fircala -> Macun sur -> Muslugu ac -> Calkala",
        "Calkala -> Muslugu ac -> Fircala -> Macun sur"
      ],
      answer: 0
    },
    {
      type: "Siralama",
      text: "Sandwich yaparken ilk adim hangisi olmali?",
      options: ["2 dilim ekmek al", "Bicagi recelin icine daldir", "Ekmegi birlestir", "Recel sur"],
      answer: 0
    }
  ],
  debug: [
    {
      type: "Hata Avcisi",
      text: "Kod: up, up, left. Hedef yukarida sagda. Hangi adim hatali?",
      options: ["1. adim", "2. adim", "3. adim", "Hata yok"],
      answer: 2
    },
    {
      type: "Hata Avcisi",
      text: "Kod: right, down, down. Hedef sagda bir kare. Hata nerde?",
      options: ["1. adim", "2. adim", "3. adim", "Kod dogru"],
      answer: 1
    }
  ],
  loop: [
    {
      type: "Dongu",
      text: "up, up, up, up kodunu en kisa nasil yazariz?",
      options: ["up + repeat3", "repeat2 + up", "up, right, repeat2", "repeat2 + right"],
      answer: 0
    },
    {
      type: "Dongu",
      text: "right, right, right kodu icin en uygun secim hangisi?",
      options: ["right + repeat2", "repeat3 + right", "right + right + up", "repeat2 + up"],
      answer: 0
    }
  ]
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
  history: [],
  order: {
    scenario: null,
    mixed: [],
    sorted: []
  },
  duel: {
    left: 0,
    right: 0,
    winner: "",
    current: null,
    locked: false,
    lastCategory: "",
    matchToken: 0
  }
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
  ,
  gridGameArea: document.getElementById("gridGameArea"),
  orderGameArea: document.getElementById("orderGameArea"),
  orderTaskTitle: document.getElementById("orderTaskTitle"),
  orderMixedCards: document.getElementById("orderMixedCards"),
  orderSortedCards: document.getElementById("orderSortedCards"),
  orderStatus: document.getElementById("orderStatus"),
  orderCode: document.getElementById("orderCode"),
  orderCheckBtn: document.getElementById("orderCheckBtn"),
  orderNewBtn: document.getElementById("orderNewBtn"),
  duelGameArea: document.getElementById("duelGameArea"),
  duelQuestionType: document.getElementById("duelQuestionType"),
  duelQuestionText: document.getElementById("duelQuestionText"),
  duelLeftOptions: document.getElementById("duelLeftOptions"),
  duelRightOptions: document.getElementById("duelRightOptions"),
  duelStatus: document.getElementById("duelStatus"),
  duelLeftScore: document.getElementById("duelLeftScore"),
  duelRightScore: document.getElementById("duelRightScore"),
  duelNeed: document.getElementById("duelNeed"),
  ropeMarker: document.getElementById("ropeMarker"),
  duelNewBtn: document.getElementById("duelNewBtn"),
  duelLeftKid: document.getElementById("duelLeftKid"),
  duelRightKid: document.getElementById("duelRightKid"),
  duelOverlay: document.getElementById("duelOverlay"),
  duelConfetti: document.getElementById("duelConfetti")
};

const ctx = dom.scene.getContext("2d");

function init() {
  bindModeChips();
  bindGameChips();
  bindControls();
  setBaseUrlText();
  loadFromUrl();
  generateScenario();
  toggleGameLayout();
  renderCards();
  renderOrderGame();
  renderDuelGame();
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
      toggleGameLayout();
      renderCards();
      renderOrderGame();
      renderDuelGame();
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
  if (dom.orderCheckBtn) dom.orderCheckBtn.addEventListener("click", checkOrderSolution);
  if (dom.orderNewBtn) dom.orderNewBtn.addEventListener("click", () => {
    seedOrderScenario();
    renderOrderGame();
  });
  if (dom.duelNewBtn) dom.duelNewBtn.addEventListener("click", () => {
    seedDuelMatch();
    renderDuelGame();
  });
}

function updateGameHint() {
  if (!dom.gameHint) return;
  if (state.game === "seq") {
    dom.gameHint.textContent = "Siralama: Kartlari dogru siraya koyarak hedefe ulas.";
    dom.levelTitle.textContent = "Dinamik Senaryo";
    dom.levelGoal.textContent = "Hedefe en kisa yoldan ulas.";
    if (dom.gameHow) dom.gameHow.textContent = "Kartlari sirala, Calistir ile hepsini oynat, Adim ile tek tek dene.";
    return;
  }
  if (state.game === "loop") {
    dom.gameHint.textContent = "Dongu: Tekrar kartlariyla ayni hareketi kisalt.";
    dom.levelTitle.textContent = "Tekrarla Kazan";
    dom.levelGoal.textContent = "Uzun yolu tekrar kartlariyla kisalt.";
    if (dom.gameHow) dom.gameHow.textContent = "Ayni yonu arka arkaya yapiyorsan Tekrar kartlarini kullan.";
    return;
  }
  if (state.game === "debug") {
    dom.gameHint.textContent = "Debug: Hazir koddaki hatayi bul ve duzelt.";
    dom.levelTitle.textContent = "Hata Avcisi";
    dom.levelGoal.textContent = "Hatali kodu duzelt ve hedefe ulas.";
    if (dom.gameHow) dom.gameHow.textContent = "Hazir kodu duzenle. Yanlis adimi sil veya degistir, sonra calistir.";
    return;
  }
  if (state.game === "duel") {
    dom.gameHint.textContent = "Kapisma: Sorular hedef bulma, dongu, siralama ve hata avcisindan karisik gelir.";
    dom.levelTitle.textContent = "Kod Kapismasi";
    dom.levelGoal.textContent = "Hiz ve dogrulukla 3 fark yakala.";
    if (dom.gameHow) dom.gameHow.textContent = "Iki ogrenci ayni soruyu kendi tarafindan cevaplar. Dogru cevap ipi bir adim ceker.";
    return;
  }
  dom.gameHint.textContent = "Gorselli adim kartlarini dogru siraya koy.";
  dom.levelTitle.textContent = "Gunluk Is Siralama";
  dom.levelGoal.textContent = "Algoritma = adim adim is.";
  if (dom.gameHow) dom.gameHow.textContent = "Karisik kartlardan sec, siraya ekle, yukari-asagi ile yerini degistir ve kontrol et.";
}

function toggleGameLayout() {
  const showOrder = state.game === "order";
  const showDuel = state.game === "duel";
  if (dom.gridGameArea) dom.gridGameArea.classList.toggle("hidden", showOrder || showDuel);
  if (dom.orderGameArea) dom.orderGameArea.classList.toggle("hidden", !showOrder);
  if (dom.duelGameArea) dom.duelGameArea.classList.toggle("hidden", !showDuel);
  if (!showDuel && dom.duelOverlay) dom.duelOverlay.classList.add("hidden");
}

function seedOrderScenario() {
  const scenario = orderScenarios[Math.floor(Math.random() * orderScenarios.length)];
  const mixed = shuffle(scenario.steps.map((step) => ({ ...step })));
  state.order.scenario = scenario;
  state.order.mixed = mixed;
  state.order.sorted = [];
}

function renderOrderGame() {
  if (state.game !== "order") return;
  if (!state.order.scenario) seedOrderScenario();
  dom.orderTaskTitle.textContent = state.order.scenario.title;
  dom.orderStatus.textContent = "Kartlari dogru siraya koy.";
  dom.orderCode.textContent = "";
  renderOrderMixedCards();
  renderOrderSortedCards();
}

function renderOrderMixedCards() {
  dom.orderMixedCards.innerHTML = "";
  if (!state.order.mixed.length) {
    const empty = document.createElement("div");
    empty.className = "order-empty";
    empty.textContent = "Tum kartlari sira alanina aktardin.";
    dom.orderMixedCards.appendChild(empty);
    return;
  }
  state.order.mixed.forEach((card, idx) => {
    dom.orderMixedCards.appendChild(createOrderCard(card, idx, false));
  });
}

function renderOrderSortedCards() {
  dom.orderSortedCards.innerHTML = "";
  if (!state.order.sorted.length) {
    const empty = document.createElement("div");
    empty.className = "order-empty";
    empty.textContent = "Kart eklemek icin soldaki karisik kartlardan sec.";
    dom.orderSortedCards.appendChild(empty);
    return;
  }
  state.order.sorted.forEach((card, idx) => {
    dom.orderSortedCards.appendChild(createOrderCard(card, idx, true));
  });
}

function createOrderCard(card, idx, inSorted) {
  const item = document.createElement("div");
  item.className = "order-card";
  const action = inSorted
    ? `<button class="mini-btn" data-act="up" data-idx="${idx}">↑</button>
       <button class="mini-btn" data-act="down" data-idx="${idx}">↓</button>
       <button class="mini-btn" data-act="back" data-idx="${idx}">↶</button>`
    : `<button class="mini-btn" data-act="add" data-idx="${idx}">Ekle</button>`;
  item.innerHTML = `<div class="order-visual">${card.icon}</div><div class="order-text">${card.text}</div><div class="order-actions">${action}</div>`;
  item.querySelectorAll(".mini-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => onOrderCardAction(e.target.dataset.act, Number(e.target.dataset.idx), inSorted));
  });
  return item;
}

function onOrderCardAction(action, idx, inSorted) {
  if (action === "add" && !inSorted) {
    const moved = state.order.mixed.splice(idx, 1)[0];
    state.order.sorted.push(moved);
  }
  if (action === "back" && inSorted) {
    const moved = state.order.sorted.splice(idx, 1)[0];
    state.order.mixed.push(moved);
  }
  if (action === "up" && inSorted && idx > 0) {
    const temp = state.order.sorted[idx - 1];
    state.order.sorted[idx - 1] = state.order.sorted[idx];
    state.order.sorted[idx] = temp;
  }
  if (action === "down" && inSorted && idx < state.order.sorted.length - 1) {
    const temp = state.order.sorted[idx + 1];
    state.order.sorted[idx + 1] = state.order.sorted[idx];
    state.order.sorted[idx] = temp;
  }
  renderOrderMixedCards();
  renderOrderSortedCards();
}

function checkOrderSolution() {
  if (state.game !== "order" || !state.order.scenario) return;
  const correct = state.order.scenario.steps;
  if (state.order.sorted.length !== correct.length) {
    dom.orderStatus.textContent = "Tum kartlar siraya eklenmeli.";
    updateScore(0);
    return;
  }
  let okCount = 0;
  for (let i = 0; i < correct.length; i++) {
    if (state.order.sorted[i].id === correct[i].id) okCount++;
  }
  const success = okCount === correct.length;
  const score = success ? 100 : Math.round((okCount / correct.length) * 60);
  updateScore(score);
  dom.orderStatus.textContent = success
    ? "Dogru sira! Algoritmayi kurdun."
    : `Tam degil. Dogru yerdeki kart sayisi: ${okCount}/${correct.length}.`;
  dom.orderCode.textContent = correct.map((step, i) => `${i + 1}. ${step.text}`).join("\n");
}

function shuffle(arr) {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy;
}

function seedDuelMatch() {
  state.duel.left = 0;
  state.duel.right = 0;
  state.duel.winner = "";
  state.duel.locked = false;
  state.duel.lastCategory = "";
  state.duel.matchToken++;
  state.duel.current = randomDuelQuestion();
  startDuelIntro();
}

function randomDuelQuestion() {
  const categories = Object.keys(duelQuestionBank);
  const options = categories.filter((key) => key !== state.duel.lastCategory);
  const category = options[Math.floor(Math.random() * options.length)] || categories[0];
  state.duel.lastCategory = category;
  const pool = duelQuestionBank[category];
  return pool[Math.floor(Math.random() * pool.length)];
}

function renderDuelGame() {
  if (state.game !== "duel") return;
  if (!state.duel.current) seedDuelMatch();
  dom.duelQuestionType.textContent = `Tur: ${state.duel.current.type}`;
  dom.duelQuestionText.textContent = state.duel.current.text;
  dom.duelStatus.textContent = state.duel.winner
    ? `${state.duel.winner} kazandi. Yeni mac baslat.`
    : "Ilk dogru cevap veren ipi kendi tarafina ceker.";
  dom.duelLeftScore.textContent = `Sol: ${state.duel.left}`;
  dom.duelRightScore.textContent = `Sag: ${state.duel.right}`;
  if (dom.duelNeed) dom.duelNeed.textContent = "Kazanmak icin fark: 3";
  renderDuelOptions("left");
  renderDuelOptions("right");
  updateRopeMarker();
}

function renderDuelOptions(side) {
  const container = side === "left" ? dom.duelLeftOptions : dom.duelRightOptions;
  container.innerHTML = "";
  state.duel.current.options.forEach((opt, idx) => {
    const btn = document.createElement("button");
    btn.className = "duel-opt";
    btn.textContent = opt;
    btn.disabled = !!state.duel.winner || state.duel.locked;
    btn.addEventListener("click", () => onDuelAnswer(side, idx));
    container.appendChild(btn);
  });
}

function onDuelAnswer(side, answerIdx) {
  if (state.game !== "duel" || state.duel.locked || state.duel.winner) return;
  state.duel.locked = true;
  const correct = answerIdx === state.duel.current.answer;
  if (correct) {
    if (side === "left") state.duel.left++;
    else state.duel.right++;
    dom.duelStatus.textContent = `${side === "left" ? "Sol" : "Sag"} dogru cevap verdi.`;
    animateDuelPull(side);
  } else {
    dom.duelStatus.textContent = `${side === "left" ? "Sol" : "Sag"} yanlis cevap verdi.`;
  }
  updateRopeMarker();
  const diff = Math.abs(state.duel.left - state.duel.right);
  if (diff >= 3) {
    state.duel.winner = state.duel.left > state.duel.right ? "Sol ogrenci" : "Sag ogrenci";
    playDuelCelebration(state.duel.winner);
    renderDuelGame();
    return;
  }
  const token = state.duel.matchToken;
  setTimeout(() => {
    if (token !== state.duel.matchToken) return;
    state.duel.current = randomDuelQuestion();
    state.duel.locked = false;
    renderDuelGame();
  }, 500);
}

function updateRopeMarker() {
  if (!dom.ropeMarker) return;
  const diff = state.duel.left - state.duel.right;
  const clamped = clamp(diff, -3, 3);
  const percent = 50 - clamped * 12;
  dom.ropeMarker.style.left = `${percent}%`;
  dom.duelLeftScore.textContent = `Sol: ${state.duel.left}`;
  dom.duelRightScore.textContent = `Sag: ${state.duel.right}`;
}

function animateDuelPull(side) {
  if (!dom.duelLeftKid || !dom.duelRightKid) return;
  dom.duelLeftKid.classList.remove("pull-left");
  dom.duelRightKid.classList.remove("pull-right");
  if (side === "left") dom.duelLeftKid.classList.add("pull-left");
  if (side === "right") dom.duelRightKid.classList.add("pull-right");
  setTimeout(() => {
    dom.duelLeftKid.classList.remove("pull-left");
    dom.duelRightKid.classList.remove("pull-right");
  }, 220);
}

function startDuelIntro() {
  if (!dom.duelOverlay) return;
  const token = state.duel.matchToken;
  const steps = ["3", "2", "1", "Basla!"];
  state.duel.locked = true;
  dom.duelOverlay.classList.remove("hidden");
  let idx = 0;
  const tick = () => {
    if (token !== state.duel.matchToken || state.game !== "duel") return;
    dom.duelOverlay.textContent = steps[idx];
    idx++;
    if (idx < steps.length) {
      setTimeout(tick, 420);
    } else {
      setTimeout(() => {
        if (token !== state.duel.matchToken || state.game !== "duel") return;
        dom.duelOverlay.classList.add("hidden");
        state.duel.locked = false;
        renderDuelGame();
      }, 320);
    }
  };
  tick();
}

function playDuelCelebration(winner) {
  if (dom.duelOverlay) {
    dom.duelOverlay.textContent = `Tebrikler ${winner}!`;
    dom.duelOverlay.classList.remove("hidden");
    setTimeout(() => {
      if (dom.duelOverlay) dom.duelOverlay.classList.add("hidden");
    }, 1100);
  }
  if (!dom.duelConfetti) return;
  dom.duelConfetti.innerHTML = "";
  for (let i = 0; i < 36; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = ["#22c55e", "#38bdf8", "#fbbf24", "#f97316"][i % 4];
    piece.style.animationDelay = `${Math.random() * 180}ms`;
    dom.duelConfetti.appendChild(piece);
    setTimeout(() => piece.remove(), 1400);
  }
}

function renderCards() {
  if (state.game === "order" || state.game === "duel") return;
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
  if (state.game === "order" || state.game === "duel") return [];
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
  if (state.game === "order") {
    seedOrderScenario();
    return;
  }
  if (state.game === "duel") {
    seedDuelMatch();
    return;
  }

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
  if (state.game === "order") {
    updateScore(0);
    renderOrderGame();
    return;
  }
  if (state.game === "duel") {
    updateScore(0);
    seedDuelMatch();
    renderDuelGame();
    return;
  }
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
  if (state.game === "order" || state.game === "duel") return;
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
  if (state.game === "order") {
    dom.orderStatus.textContent = "Ipucu: Once islem baslangici, sonra uygulama, en son bitis adimi gelir.";
    return;
  }
  if (state.game === "duel") {
    dom.duelStatus.textContent = "Ipucu: Hizi arttir ama cevaplamadan once secenegi kontrol et.";
    return;
  }
  if (state.game === "loop") {
    dom.status.textContent = "İpucu: Aynı yönü tekrar ediyorsan Tekrar kartını kullan.";
  } else if (state.game === "debug") {
    dom.status.textContent = "İpucu: Bir adım engelle çakışıyor olabilir.";
  } else {
    dom.status.textContent = "İpucu: Hedefe kısa bir yol bul ve kartları sırala.";
  }
}

function showSuggestion() {
  if (state.game === "order") {
    if (state.order.scenario) {
      dom.orderCode.textContent = state.order.scenario.steps.map((step, i) => `${i + 1}. ${step.text}`).join("\n");
      dom.orderStatus.textContent = "Ornek dogru sirayi asagida gordun.";
    }
    return;
  }
  if (state.game === "duel") {
    dom.duelStatus.textContent = "Oneri: Siralama sorularinda baslangic adimini bul, sonra akisi tamamla.";
    return;
  }
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
  if (game && ["seq", "loop", "debug", "order", "duel"].includes(game)) state.game = game;
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
