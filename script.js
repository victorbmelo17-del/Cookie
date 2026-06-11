const $ = (id) => document.getElementById(id);

// --- Seleção de elementos do DOM ---
const [scoreEl, timeEl, levelEl, highEl, recordEl, nameInput, difficulty, target, area, start] = [
  $("score"),
  $("time"),
  $("levelName"),
  $("highScore"),
  $("recordName"),
  $("playerName"),
  $("difficulty"),
  $("target"),
  $("gameArea"),
  $("startButton"),
];

// --- Configurações de dificuldade ---
const DIFF = {
  easy: { time: 14000, speed: 0.9, shrink: 1.8 },
  medium: { time: 10000, speed: 1.15, shrink: 2.5 },
  hard: { time: 8000, speed: 1.4, shrink: 3.2 },
};

// --- Chaves de armazenamento em cookie ---
const CK_SCORE = "cookie_rush_high_score";
const CK_NAME = "cookie_rush_high_name";

// --- Estado global do jogo ---
let score = 0,
  time = 0,
  active = false,
  timer;

// --- Funções de cookie ---
const getCookie = (name) =>
  document.cookie.split("; ").find((item) => item.startsWith(name + "="))?.split("=")[1] || "";
const setCookie = (name, value) =>
  (document.cookie = `${name}=${value};max-age=${60 * 60 * 24 * 365};path=/`);

// --- Utilitários de configuração e atualização ---
const getConfig = () => DIFF[difficulty.value] || DIFF.medium;
const updateBoard = () => {
  scoreEl.textContent = score;
  timeEl.textContent = (time / 1000).toFixed(1) + "s";
  levelEl.textContent = difficulty.options[difficulty.selectedIndex].text;
  highEl.textContent = Number(getCookie(CK_SCORE)) || 0;
  recordEl.textContent = getCookie(CK_NAME) || "---";
};
const random = (max) => Math.random() * max;

// --- Controle do alvo ---
const setTargetSize = () => {
  const size = Math.max(34, 76 - score * getConfig().shrink);
  target.style.width = `${size}px`;
  target.style.height = `${size}px`;
};
const moveTarget = () => {
  const areaBox = area.getBoundingClientRect();
  const size = target.offsetWidth;
  target.style.left = `${random(areaBox.width - size)}px`;
  target.style.top = `${random(areaBox.height - size)}px`;
};

// --- Finaliza a partida ---
const stopGame = () => {
  clearInterval(timer);
  active = false;
  start.disabled = false;
  target.style.display = "none";

  const bestScore = Number(getCookie(CK_SCORE)) || 0;
  const playerName = nameInput.value.trim() || "Jogador";

  if (score > bestScore) {
    setCookie(CK_SCORE, score);
    setCookie(CK_NAME, playerName);
    highEl.textContent = score;
    recordEl.textContent = playerName;
    alert(`🎉 ${playerName}, novo recorde: ${score} pontos!`);
  } else {
    alert(
      `${playerName}, fim da rodada: ${score} pontos. Recorde: ${bestScore} (${getCookie(CK_NAME) || "---"}).`
    );
  }

  updateBoard();
};

// --- Atualização do cronômetro ---
const tick = () => {
  time -= 100;
  if (time <= 0) {
    time = 0;
    updateBoard();
    stopGame();
  } else {
    updateBoard();
  }
};

// --- Eventos principais ---
start.onclick = () => {
  const playerName = nameInput.value.trim();
  if (!playerName) {
    alert("Digite seu nome para começar a partida.");
    nameInput.focus();
    return;
  }

  score = 0;
  time = getConfig().time;
  active = true;
  start.disabled = true;
  target.style.display = "block";

  setTargetSize();
  moveTarget();
  updateBoard();

  timer = setInterval(tick, 100);
};

target.onclick = (event) => {
  event.stopPropagation();
  if (!active) return;

  score += 1;
  setTargetSize();
  target.classList.add("pop");
  setTimeout(() => target.classList.remove("pop"), 120);
  updateBoard();
  moveTarget();
};

area.onclick = (event) => {
  if (!active) return;
  if (event.target === area && score > 0) {
    score -= 1;
    updateBoard();
  }
};

// --- Inicialização da interface ---
window.onload = updateBoard;
