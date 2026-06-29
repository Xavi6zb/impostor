const decks = {
  Animales: [
    { word: "Gato", clue: "Pelo" },
    { word: "Perro", clue: "Correa" },
    { word: "Tiburón", clue: "Aleta" },
    { word: "Caballo", clue: "Crin" },
    { word: "Pingüino", clue: "Hielo" },
    { word: "León", clue: "Melena" },
    { word: "Serpiente", clue: "Escamas" },
    { word: "Elefante", clue: "Trompa" },
    { word: "Mariposa", clue: "Alas" },
    { word: "Tortuga", clue: "Caparazón" },
    { word: "Conejo", clue: "Zanahoria" },
    { word: "Águila", clue: "Plumas" }
  ],
  Comida: [
    { word: "Pizza", clue: "Queso" },
    { word: "Sushi", clue: "Arroz" },
    { word: "Croquetas", clue: "Bechamel" },
    { word: "Paella", clue: "Azafrán" },
    { word: "Hamburguesa", clue: "Pan" },
    { word: "Chocolate", clue: "Cacao" },
    { word: "Helado", clue: "Frío" },
    { word: "Tortilla", clue: "Huevo" },
    { word: "Churros", clue: "Azúcar" },
    { word: "Gazpacho", clue: "Tomate" },
    { word: "Tacos", clue: "Maíz" },
    { word: "Pasta", clue: "Salsa" }
  ],
  Lugares: [
    { word: "Aeropuerto", clue: "Maleta" },
    { word: "Playa", clue: "Arena" },
    { word: "Hospital", clue: "Camilla" },
    { word: "Biblioteca", clue: "Silencio" },
    { word: "Cine", clue: "Pantalla" },
    { word: "Hotel", clue: "Recepción" },
    { word: "Gimnasio", clue: "Pesas" },
    { word: "Museo", clue: "Cuadro" },
    { word: "Restaurante", clue: "Carta" },
    { word: "Estación", clue: "Andén" },
    { word: "Supermercado", clue: "Carrito" },
    { word: "Montaña", clue: "Cumbre" }
  ],
  Objetos: [
    { word: "Reloj", clue: "Hora" },
    { word: "Llave", clue: "Puerta" },
    { word: "Sombrero", clue: "Cabeza" },
    { word: "Paraguas", clue: "Lluvia" },
    { word: "Espejo", clue: "Reflejo" },
    { word: "Teléfono", clue: "Llamada" },
    { word: "Mapa", clue: "Ruta" },
    { word: "Mochila", clue: "Espalda" },
    { word: "Vela", clue: "Fuego" },
    { word: "Carta", clue: "Sobre" },
    { word: "Cámara", clue: "Foto" },
    { word: "Anillo", clue: "Dedo" }
  ],
  Acciones: [
    { word: "Correr", clue: "Velocidad" },
    { word: "Cantar", clue: "Voz" },
    { word: "Bailar", clue: "Ritmo" },
    { word: "Cocinar", clue: "Receta" },
    { word: "Dormir", clue: "Sueño" },
    { word: "Nadar", clue: "Agua" },
    { word: "Leer", clue: "Libro" },
    { word: "Viajar", clue: "Destino" },
    { word: "Comprar", clue: "Bolsa" },
    { word: "Pintar", clue: "Color" },
    { word: "Conducir", clue: "Volante" },
    { word: "Esconder", clue: "Secreto" }
  ]
};

const fallbackClues = [
  "Relacionado", "Parecido", "Cerca", "Pista", "Categoría", "Señal", "Detalle", "Sospecha"
];

const state = {
  players: [],
  mode: "builtin",
  category: "Animales",
  round: 1,
  totalRounds: 5,
  word: "",
  clue: "",
  impostorIndexes: new Set(),
  revealIndex: 0,
  roleVisible: false,
  selectedVoteIndex: null,
  timerSeconds: 90,
  timerRemaining: 90,
  timerId: null,
  timerPaused: false
};

const $ = (id) => document.getElementById(id);

const screens = [
  "screenSetup",
  "screenRules",
  "screenReveal",
  "screenRound",
  "screenVote",
  "screenResult"
];

function showScreen(screenId) {
  screens.forEach((id) => $(id).classList.toggle("active", id === screenId));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function normalizeLines(value) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function plural(value, singular, pluralText) {
  return value === 1 ? singular : pluralText;
}

function safeText(value) {
  const element = document.createElement("span");
  element.textContent = value;
  return element.innerHTML;
}

function savePlayers(players) {
  localStorage.setItem("impostor:lastPlayers", players.join("\n"));
}

function loadPlayers() {
  return localStorage.getItem("impostor:lastPlayers") || "";
}

function populateCategories() {
  const select = $("categorySelect");
  select.innerHTML = "";
  Object.keys(decks).forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    select.appendChild(option);
  });
}

function parseCustomDeck(value) {
  return normalizeLines(value)
    .map((line) => {
      const separators = ["|", ":", "-", "—"];
      let separator = separators.find((item) => line.includes(item));

      if (!separator) {
        return {
          word: line,
          clue: randomItem(fallbackClues)
        };
      }

      const [word, ...clueParts] = line.split(separator);
      const cleanWord = word.trim();
      const cleanClue = clueParts.join(separator).trim();

      if (!cleanWord) return null;

      return {
        word: cleanWord,
        clue: cleanClue || randomItem(fallbackClues)
      };
    })
    .filter(Boolean);
}

function getCurrentDeck() {
  if (state.mode === "custom") {
    return parseCustomDeck($("customWordsInput").value);
  }

  return decks[$("categorySelect").value] || [];
}

function getPlayersFromInput() {
  return normalizeLines($("playersInput").value);
}

function updatePlayersCount() {
  const total = getPlayersFromInput().length;
  $("playersCountLabel").textContent = `${total} ${plural(total, "jugador", "jugadores")}`;
}

function updateFeatureStrip() {
  const timer = Number($("timerInput").value);
  const rounds = Number($("roundsInput").value);
  $("featureTimer").textContent = timer === 0 ? "Sin temporizador" : formatTimerLabel(timer);
  $("featureRounds").textContent = `${rounds} ${plural(rounds, "ronda", "rondas")}`;
}

function formatTimerLabel(seconds) {
  if (seconds === 60) return "1 minuto";
  if (seconds < 60) return `${seconds} segundos`;
  if (seconds % 60 === 0) return `${seconds / 60} minutos`;
  return `${seconds} segundos`;
}

function setMode(mode) {
  state.mode = mode;
  $("builtInModeButton").classList.toggle("active", mode === "builtin");
  $("customModeButton").classList.toggle("active", mode === "custom");
  $("categoryRow").classList.toggle("hidden", mode === "custom");
  $("customWordsBlock").classList.toggle("hidden", mode !== "custom");
}

function changeImpostorCount(delta) {
  const input = $("impostorCountInput");
  const current = Number(input.value) || 1;
  const next = Math.min(3, Math.max(1, current + delta));
  input.value = String(next);
}

function validateSetup(players, impostorCount, deck) {
  const lowerNames = players.map((name) => name.toLowerCase());

  if (players.length < 3) return "Necesitas al menos 3 jugadores.";
  if (new Set(lowerNames).size !== players.length) return "Hay nombres repetidos. Usa nombres distintos.";
  if (impostorCount < 1) return "Debe haber al menos 1 impostor.";
  if (impostorCount >= players.length) return "Debe haber menos impostores que jugadores.";
  if (impostorCount > 3) return "Máximo 3 impostores para que el juego siga siendo claro.";
  if (deck.length < 2) return "Necesitas al menos 2 parejas de palabra y pista.";

  return "";
}

function createGame({ keepPlayers = false, keepRound = false } = {}) {
  const players = keepPlayers ? state.players : getPlayersFromInput();
  const impostorCount = keepPlayers ? state.impostorIndexes.size : Number($("impostorCountInput").value);
  const deck = getCurrentDeck();
  const error = validateSetup(players, impostorCount, deck);

  if (error) {
    $("setupError").textContent = error;
    $("setupError").classList.remove("hidden");
    return;
  }

  const selected = randomItem(deck);
  const indexes = shuffle(players.map((_, index) => index)).slice(0, impostorCount);

  state.players = players;
  state.category = state.mode === "custom" ? "Personalizadas" : $("categorySelect").value;
  state.word = selected.word;
  state.clue = selected.clue;
  state.impostorIndexes = new Set(indexes);
  state.revealIndex = 0;
  state.roleVisible = false;
  state.selectedVoteIndex = null;
  state.timerSeconds = Number($("timerInput").value);
  state.timerRemaining = state.timerSeconds;
  state.totalRounds = Number($("roundsInput").value);
  state.round = keepRound ? Math.min(state.round + 1, state.totalRounds) : 1;
  state.timerPaused = false;

  savePlayers(players);
  stopTimer();
  $("setupError").classList.add("hidden");
  renderStatus();
  renderReveal();
  showScreen("screenReveal");
}

function renderStatus() {
  const impostorCount = state.impostorIndexes.size;
  $("statusPlayers").textContent = `${state.players.length} ${plural(state.players.length, "jugador", "jugadores")}`;
  $("statusImpostors").textContent = `${impostorCount} ${plural(impostorCount, "impostor", "impostores")}`;
  $("statusCategory").textContent = state.category;
  $("roundLabel").textContent = `Ronda ${state.round} de ${state.totalRounds}`;
}

function renderReveal() {
  const playerName = state.players[state.revealIndex];
  const isImpostor = state.impostorIndexes.has(state.revealIndex);
  const isLastPlayer = state.revealIndex === state.players.length - 1;

  $("revealProgress").textContent = `Jugador ${state.revealIndex + 1} de ${state.players.length}`;
  $("closedPlayerName").textContent = playerName;
  $("closedState").classList.toggle("hidden", state.roleVisible);
  $("roleState").classList.toggle("hidden", !state.roleVisible);
  $("nextRevealButton").disabled = !state.roleVisible;
  $("hideScreenButton").disabled = !state.roleVisible;
  $("nextRevealLabel").textContent = isLastPlayer ? "Empezar discusión" : "Pasar al siguiente";

  if (!state.roleVisible) return;

  $("roleSymbol").className = `role-symbol ${isImpostor ? "impostor-symbol" : "citizen-symbol"}`;
  $("roleTitle").className = isImpostor ? "impostor-title" : "";
  $("secretField").classList.toggle("citizen-secret", !isImpostor);

  if (isImpostor) {
    $("roleTitle").textContent = "Eres el impostor";
    $("roleDescription").textContent = "No conoces la palabra exacta. Usa la pista y disimula.";
    $("secretLabel").textContent = "Pista relacionada";
    $("secretValue").textContent = state.clue;
    $("secretStamp").textContent = "Confidencial";
  } else {
    $("roleTitle").textContent = "Ciudadano";
    $("roleDescription").textContent = "Conoces la palabra secreta. Da pistas sin decirla literalmente.";
    $("secretLabel").textContent = "Palabra secreta";
    $("secretValue").textContent = state.word;
    $("secretStamp").textContent = "Reservado";
  }
}

function showRole() {
  state.roleVisible = true;
  renderReveal();
}

function hideRole() {
  state.roleVisible = false;
  renderReveal();
}

function nextReveal() {
  state.roleVisible = false;

  if (state.revealIndex < state.players.length - 1) {
    state.revealIndex += 1;
    renderReveal();
    return;
  }

  renderRound();
  showScreen("screenRound");
  startTimer();
}

function renderRound() {
  const formatted = state.timerSeconds === 0 ? "∞" : formatTime(state.timerRemaining);
  $("timerDisplay").textContent = formatted;
  $("voteTimerDisplay").textContent = formatted;
  $("timerBlock").classList.toggle("no-timer", state.timerSeconds === 0);
  $("pauseTimerButton").disabled = state.timerSeconds === 0;
  $("restartTimerButton").disabled = state.timerSeconds === 0;
  $("pauseTimerButton").textContent = state.timerPaused ? "Continuar" : "Pausar";
}

function startTimer() {
  stopTimer();
  if (state.timerSeconds === 0) return;

  state.timerPaused = false;
  state.timerId = window.setInterval(() => {
    if (state.timerPaused) return;

    state.timerRemaining = Math.max(0, state.timerRemaining - 1);
    renderRound();

    if (state.timerRemaining === 0) {
      stopTimer();
      $("pauseTimerButton").textContent = "Tiempo agotado";
    }
  }, 1000);
}

function stopTimer() {
  if (state.timerId) {
    window.clearInterval(state.timerId);
    state.timerId = null;
  }
}

function pauseTimer() {
  if (state.timerSeconds === 0 || state.timerRemaining === 0) return;
  state.timerPaused = !state.timerPaused;
  renderRound();
}

function restartTimer() {
  state.timerRemaining = state.timerSeconds;
  state.timerPaused = false;
  renderRound();
  startTimer();
}

function renderVote() {
  const list = $("voteList");
  list.innerHTML = "";
  $("showResultButton").disabled = state.selectedVoteIndex === null;
  renderRound();
  renderStatus();

  state.players.forEach((player, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "vote-option";
    button.setAttribute("aria-pressed", String(state.selectedVoteIndex === index));
    button.innerHTML = `
      <span class="avatar" aria-hidden="true">${safeText(player.charAt(0).toUpperCase())}</span>
      <strong>${safeText(player)}</strong>
      <span class="radio" aria-hidden="true"></span>
    `;
    button.addEventListener("click", () => {
      state.selectedVoteIndex = index;
      renderVote();
    });
    list.appendChild(button);
  });
}

function renderResult() {
  const grid = $("resultGrid");
  const selectedName = state.players[state.selectedVoteIndex];
  const impostorNames = [...state.impostorIndexes].map((index) => state.players[index]);
  const caught = state.impostorIndexes.has(state.selectedVoteIndex);

  $("resultTitle").textContent = caught ? "Impostor descubierto" : "El impostor ha sobrevivido";

  grid.innerHTML = `
    <div class="result-card ${caught ? "" : "red"}">
      <span>Veredicto</span>
      <strong>${caught ? "Gana el grupo" : "Ganan los impostores"}</strong>
    </div>
    <div class="result-card">
      <span>Votado</span>
      <strong>${safeText(selectedName)}</strong>
    </div>
    <div class="result-card red">
      <span>${impostorNames.length === 1 ? "Impostor" : "Impostores"}</span>
      <strong>${safeText(impostorNames.join(", "))}</strong>
    </div>
    <div class="result-card wide">
      <span>Palabra secreta</span>
      <strong>${safeText(state.word)}</strong>
    </div>
    <div class="result-card wide red">
      <span>Pista que recibieron los impostores</span>
      <strong>${safeText(state.clue)}</strong>
    </div>
  `;
}

function goToSetup() {
  stopTimer();
  showScreen("screenSetup");
}

function loadExample() {
  $("playersInput").value = "Clara\nMateo\nLucía\nPablo\nSara\nDiego";
  $("impostorCountInput").value = "1";
  $("categorySelect").value = "Animales";
  $("timerInput").value = "90";
  $("roundsInput").value = "5";
  setMode("builtin");
  updatePlayersCount();
  updateFeatureStrip();
}

function shufflePreview() {
  const preview = randomItem(decks.Animales);
  document.querySelector(".example-word").textContent = preview.word;
  document.querySelector(".example-clue").innerHTML = `${safeText(preview.clue)} <span>Ejemplo</span>`;
}

function bindEvents() {
  $("brandButton").addEventListener("click", goToSetup);
  $("rulesButton").addEventListener("click", () => showScreen("screenRules"));
  $("backToSetupButton").addEventListener("click", () => showScreen("screenSetup"));
  $("resetButton").addEventListener("click", () => {
    stopTimer();
    state.round = 1;
    showScreen("screenSetup");
  });

  $("playersInput").addEventListener("input", updatePlayersCount);
  $("timerInput").addEventListener("change", updateFeatureStrip);
  $("roundsInput").addEventListener("change", updateFeatureStrip);
  $("builtInModeButton").addEventListener("click", () => setMode("builtin"));
  $("customModeButton").addEventListener("click", () => setMode("custom"));
  $("impostorMinusButton").addEventListener("click", () => changeImpostorCount(-1));
  $("impostorPlusButton").addEventListener("click", () => changeImpostorCount(1));
  $("loadExampleButton").addEventListener("click", loadExample);
  $("shuffleExampleButton").addEventListener("click", shufflePreview);

  $("setupForm").addEventListener("submit", (event) => {
    event.preventDefault();
    createGame();
  });

  $("showRoleButton").addEventListener("click", showRole);
  $("hideScreenButton").addEventListener("click", hideRole);
  $("nextRevealButton").addEventListener("click", nextReveal);

  $("pauseTimerButton").addEventListener("click", pauseTimer);
  $("restartTimerButton").addEventListener("click", restartTimer);
  $("reviewRolesButton").addEventListener("click", () => {
    stopTimer();
    state.revealIndex = 0;
    state.roleVisible = false;
    renderReveal();
    showScreen("screenReveal");
  });
  $("goVoteButton").addEventListener("click", () => {
    stopTimer();
    renderVote();
    showScreen("screenVote");
  });
  $("backToRoundButton").addEventListener("click", () => {
    renderRound();
    showScreen("screenRound");
    startTimer();
  });
  $("showResultButton").addEventListener("click", () => {
    renderResult();
    showScreen("screenResult");
  });
  $("samePlayersButton").addEventListener("click", () => createGame({ keepPlayers: true, keepRound: true }));
  $("newGameButton").addEventListener("click", () => {
    state.round = 1;
    goToSetup();
  });
}

function init() {
  populateCategories();
  bindEvents();
  const storedPlayers = loadPlayers();

  if (storedPlayers) {
    $("playersInput").value = storedPlayers;
  } else {
    loadExample();
  }

  updatePlayersCount();
  updateFeatureStrip();
  setMode("builtin");
  showScreen("screenSetup");
}

init();
