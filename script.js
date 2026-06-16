
// Atalho para obter elementos pelo ID
const $ = (id) => document.getElementById(id);

// =====================================================
// Seleção dos elementos da interface (DOM)
// =====================================================
const [
  scoreEl,     // Exibe a pontuação atual
  timeEl,      // Exibe o tempo restante
  levelEl,     // Exibe o nome da dificuldade selecionada
  highEl,      // Exibe o recorde de pontos
  recordEl,    // Exibe o nome do jogador com o recorde
  nameInput,   // Campo de entrada do nome do jogador
  difficulty,  // Seletor de dificuldade
  target,      // Alvo que o jogador deve clicar
  area,        // Área de jogo
  start        // Botão de iniciar partida
] = [
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

// =====================================================
// Configurações de dificuldade
// time   -> duração da partida em milissegundos
// speed  -> reservado para velocidade (não utilizado)
// shrink -> quanto o alvo diminui a cada ponto
// =====================================================
const DIFF = {
  easy: { time: 14000, speed: 0.9, shrink: 1.8 },
  medium: { time: 10000, speed: 1.15, shrink: 2.5 },
  hard: { time: 8000, speed: 1.4, shrink: 3.2 },
};

// =====================================================
// Chaves utilizadas para armazenar recordes em cookies
// =====================================================
const CK_SCORE = "cookie_rush_high_score";
const CK_NAME = "cookie_rush_high_name";

// =====================================================
// Estado global do jogo
// =====================================================
let score = 0,     // Pontuação atual
  time = 0,        // Tempo restante
  active = false,  // Indica se a partida está em andamento
  timer;           // Referência ao cronômetro

// =====================================================
// Funções para leitura e gravação de cookies
// =====================================================

// Obtém o valor de um cookie pelo nome
const getCookie = (name) =>
  document.cookie
    .split("; ")
    .find((item) => item.startsWith(name + "="))
    ?.split("=")[1] || "";

// Cria ou atualiza um cookie válido por 1 ano
const setCookie = (name, value) =>
  (document.cookie =
    `${name}=${value};max-age=${60 * 60 * 24 * 365};path=/`);

// =====================================================
// Utilitários
// =====================================================

// Retorna a configuração correspondente à dificuldade atual
const getConfig = () => DIFF[difficulty.value] || DIFF.medium;

// Atualiza todos os indicadores da interface
const updateBoard = () => {
  scoreEl.textContent = score;
  timeEl.textContent = (time / 1000).toFixed(1) + "s";

  // Nome da dificuldade selecionada
  levelEl.textContent =
    difficulty.options[difficulty.selectedIndex].text;

  // Recorde salvo
  highEl.textContent = Number(getCookie(CK_SCORE)) || 0;
  recordEl.textContent = getCookie(CK_NAME) || "---";
};

// Gera um número aleatório entre 0 e max
const random = (max) => Math.random() * max;

// =====================================================
// Controle do alvo
// =====================================================

// Ajusta o tamanho do alvo.
// Quanto maior a pontuação, menor o alvo.
const setTargetSize = () => {
  const size = Math.max(
    34,
    76 - score * getConfig().shrink
  );

  target.style.width = `${size}px`;
  target.style.height = `${size}px`;
};

// Move o alvo para uma posição aleatória dentro da área
const moveTarget = () => {
  const areaBox = area.getBoundingClientRect();
  const size = target.offsetWidth;

  target.style.left =
    `${random(areaBox.width - size)}px`;

  target.style.top =
    `${random(areaBox.height - size)}px`;
};

// =====================================================
// Encerramento da partida
// =====================================================
const stopGame = () => {
  // Para o cronômetro
  clearInterval(timer);

  active = false;
  start.disabled = false;
  target.style.display = "none";

  // Recupera recorde atual
  const bestScore = Number(getCookie(CK_SCORE)) || 0;
  const playerName = nameInput.value.trim() || "Jogador";

  // Verifica se houve novo recorde
  if (score > bestScore) {
    setCookie(CK_SCORE, score);
    setCookie(CK_NAME, playerName);

    highEl.textContent = score;
    recordEl.textContent = playerName;

    alert(
      `🎉 ${playerName}, novo recorde: ${score} pontos!`
    );
  } else {
    alert(
      `${playerName}, fim da rodada: ${score} pontos. ` +
      `Recorde: ${bestScore} (${getCookie(CK_NAME) || "---"}).`
    );
  }

  updateBoard();
};

// =====================================================
// Atualização do cronômetro
// Executada a cada 100 ms
// =====================================================
const tick = () => {
  time -= 100;

  // Se o tempo acabou, encerra o jogo
  if (time <= 0) {
    time = 0;
    updateBoard();
    stopGame();
  } else {
    updateBoard();
  }
};

// =====================================================
// Evento: iniciar partida
// =====================================================
start.onclick = () => {
  const playerName = nameInput.value.trim();

  // Obriga o jogador a informar o nome
  if (!playerName) {
    alert("Digite seu nome para começar a partida.");
    nameInput.focus();
    return;
  }

  // Reinicia variáveis do jogo
  score = 0;
  time = getConfig().time;
  active = true;

  // Desabilita o botão enquanto a partida estiver ativa
  start.disabled = true;

  // Exibe o alvo
  target.style.display = "block";

  // Configuração inicial
  setTargetSize();
  moveTarget();
  updateBoard();

  // Inicia o cronômetro
  timer = setInterval(tick, 100);
};

// =====================================================
// Evento: clique no alvo
// =====================================================
target.onclick = (event) => {
  // Evita que o clique seja tratado pela área de jogo
  event.stopPropagation();

  if (!active) return;

  // Incrementa a pontuação
  score += 1;

  // Diminui o tamanho do alvo conforme a pontuação
  setTargetSize();

  // Efeito visual de "estouro"
  target.classList.add("pop");
  setTimeout(() => target.classList.remove("pop"), 120);

  updateBoard();

  // Move o alvo para outra posição
  moveTarget();
};

// =====================================================
// Evento: clique na área de jogo (erro do jogador)
// =====================================================
area.onclick = (event) => {
  if (!active) return;

  // Só desconta ponto se o clique foi na área vazia
  // e se o jogador já tiver pontos
  if (event.target === area && score > 0) {
    score -= 1;
    updateBoard();
  }
};

// =====================================================
// Inicialização da interface ao carregar a página
// =====================================================
window.onload = updateBoard;