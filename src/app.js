const categories = {
  "Familia": [
    "Sofá", "Cumpleaños", "Tortilla", "Supermercado", "Piscina", "Chocolate", "Maleta", "Restaurante",
    "Película", "Café", "Parque", "Colegio", "Bicicleta", "Ascensor", "Pizza", "Hospital", "Avión", "Playa",
    "Gato", "Perro", "Helado", "Mercado", "Biblioteca", "Museo", "Cine", "Pijama", "Abuela", "Navidad"
  ],
  "Lugares": [
    "Aeropuerto", "Hotel", "Teatro", "Estación", "Castillo", "Panadería", "Universidad", "Gimnasio",
    "Puerto", "Montaña", "Isla", "Jardín", "Oficina", "Farmacia", "Banco", "Iglesia", "Metro", "Camping",
    "Peluquería", "Circo", "Fábrica", "Librería", "Mercadillo", "Spa", "Terraza", "Zoológico"
  ],
  "Comida": [
    "Croquetas", "Paella", "Sushi", "Hamburguesa", "Queso", "Gazpacho", "Canelones", "Tarta",
    "Cereales", "Macarrones", "Ensalada", "Donut", "Bocadillo", "Patatas", "Crema", "Yogur", "Caramelo",
    "Churros", "Aceitunas", "Tacos", "Lentejas", "Tostada", "Brownie", "Pasta", "Galletas", "Mermelada"
  ],
  "Objetos": [
    "Reloj", "Llave", "Vela", "Espejo", "Cuaderno", "Sombrero", "Paraguas", "Anillo", "Carta",
    "Teléfono", "Lámpara", "Mapa", "Cuchara", "Mochila", "Cámara", "Moneda", "Botella", "Bolígrafo",
    "Almohada", "Cepillo", "Tijeras", "Radio", "Caja", "Guantes", "Perfume", "Silla"
  ],
  "Acciones": [
    "Correr", "Cantar", "Cocinar", "Bailar", "Dormir", "Comprar", "Nadar", "Leer", "Viajar",
    "Llamar", "Pintar", "Gritar", "Esperar", "Buscar", "Romper", "Limpiar", "Construir", "Escuchar",
    "Esconder", "Aplaudir", "Celebrar", "Ordenar", "Saltar", "Conducir", "Soñar", "Regalar"
  ],
  "Personalizadas": []
};

const state = {
  players: [],
  category: "Familia",
  word: "",
  impostorIndexes: new Set(),
  showCategoryToImpostor: false,
  revealIndex: 0,
  isRoleVisible: false,
  selectedVoteIndex: null,
  timerSeconds: 0,
  timerRemaining: 0,
  timerId: null,
  timerPaused: false
};

const $ = (id) => document.getElementById(id);

const screens = [
  "screenStart",
  "screenRules",
  "screenSetup",
  "screenReveal",
  "screenRound",
  "screenVote",
  "screenResult"
];

function showScreen(screenId) {
  screens.forEach((id) => $(id).classList.toggle("hidden", id !== screenId));
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

function saveLastPlayers(players) {
  localStorage.setItem("impostor:lastPlayers", players.join("\n"));
}

function loadLastPlayers() {
  return localStorage.getItem("impostor:lastPlayers") || "";
}

function populateCategories() {
  const select = $("categorySelect");
  select.innerHTML = "";
  Object.keys(categories).forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    select.appendChild(option);
  });
}

function validateSetup({ players, impostorCount, category, words }) {
  if (players.length < 3) return "Necesitas al menos 3 jugadores.";
  if (new Set(players.map((name) => name.toLowerCase())).size !== players.length) {
    return "Hay nombres repetidos. Usa nombres distintos para votar sin confusión.";
  }
  if (impostorCount < 1) return "Debe haber al menos 1 impostor.";
  if (impostorCount >= players.length) return "Debe haber menos impostores que jugadores.";
  if (category === "Personalizadas" && words.length < 2) {
    return "Añade al menos 2 palabras personalizadas para que la partida tenga variedad.";
  }
  if (category !== "Personalizadas" && (!categories[category] || categories[category].length === 0)) {
    return "Esta categoría no tiene palabras disponibles.";
  }
  return "";
}

function createGame({ keepPlayers = false } = {}) {
  const players = keepPlayers ? state.players : normalizeLines($("playersInput").value);
  const category = keepPlayers ? state.category : $("categorySelect").value;
  const customWords = normalizeLines($("customWordsInput").value);
  const impostorCount = keepPlayers ? state.impostorIndexes.size : Number($("impostorCountInput").value);
  const timerSeconds = keepPlayers ? state.timerSeconds : Number($("timerInput").value);
  const showCategoryToImpostor = keepPlayers ? state.showCategoryToImpostor : $("showCategoryToImpostorInput").checked;
  const wordPool = category === "Personalizadas" ? customWords : categories[category];
  const error = validateSetup({ players, impostorCount, category, words: wordPool });

  if (error) {
    $("setupError").textContent = error;
    $("setupError").classList.remove("hidden");
    return;
  }

  const shuffledIndexes = shuffle(players.map((_, index) => index));
  state.players = players;
  state.category = category;
  state.word = randomItem(wordPool);
  state.impostorIndexes = new Set(shuffledIndexes.slice(0, impostorCount));
  state.showCategoryToImpostor = showCategoryToImpostor;
  state.revealIndex = 0;
  state.isRoleVisible = false;
  state.selectedVoteIndex = null;
  state.timerSeconds = timerSeconds;
  state.timerRemaining = timerSeconds;
  state.timerPaused = false;

  saveLastPlayers(players);
  stopTimer();
  renderReveal();
  showScreen("screenReveal");
}

function renderReveal() {
  const player = state.players[state.revealIndex];
  const isImpostor = state.impostorIndexes.has(state.revealIndex);

  $("revealProgress").textContent = `Turno ${state.revealIndex + 1} de ${state.players.length}`;
  $("revealPlayerName").textContent = player;
  $("closedNote").classList.toggle("hidden", state.isRoleVisible);
  $("secretNote").classList.toggle("hidden", !state.isRoleVisible);

  if (!state.isRoleVisible) return;

  if (isImpostor) {
    $("roleTitle").textContent = "Eres el impostor";
    $("secretWord").textContent = "Improvisa";
    $("roleHint").textContent = state.showCategoryToImpostor
      ? `La categoría es ${state.category}. No conoces la palabra exacta.`
      : "No conoces la palabra secreta. Escucha bien y finge seguridad.";
  } else {
    $("roleTitle").textContent = "Palabra secreta";
    $("secretWord").textContent = state.word;
    $("roleHint").textContent = "Recuerda la palabra y no la digas en voz alta.";
  }

  $("hideAndNextButton").textContent =
    state.revealIndex === state.players.length - 1 ? "Ocultar y empezar ronda" : "Ocultar y pasar";
}

function showCurrentRole() {
  state.isRoleVisible = true;
  renderReveal();
}

function hideAndMoveNext() {
  state.isRoleVisible = false;
  if (state.revealIndex < state.players.length - 1) {
    state.revealIndex += 1;
    renderReveal();
  } else {
    renderRound();
    showScreen("screenRound");
    startTimerIfNeeded();
  }
}

function renderRound() {
  const hasTimer = state.timerSeconds > 0;
  $("timerCard").classList.toggle("hidden", !hasTimer);
  $("timerDisplay").textContent = formatTime(state.timerRemaining);
  $("pauseTimerButton").textContent = state.timerPaused ? "Continuar" : "Pausar";
}

function startTimerIfNeeded() {
  if (state.timerSeconds <= 0) return;
  stopTimer();
  state.timerPaused = false;
  state.timerId = window.setInterval(() => {
    if (state.timerPaused) return;
    state.timerRemaining = Math.max(0, state.timerRemaining - 1);
    $("timerDisplay").textContent = formatTime(state.timerRemaining);
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

function toggleTimerPause() {
  if (state.timerRemaining === 0) return;
  state.timerPaused = !state.timerPaused;
  $("pauseTimerButton").textContent = state.timerPaused ? "Continuar" : "Pausar";
}

function resetTimer() {
  state.timerRemaining = state.timerSeconds;
  state.timerPaused = false;
  renderRound();
  startTimerIfNeeded();
}

function renderVote() {
  const list = $("voteList");
  list.innerHTML = "";

  state.players.forEach((player, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "vote-option";
    button.setAttribute("aria-pressed", String(state.selectedVoteIndex === index));
    button.innerHTML = `<strong>${player}</strong><span>${state.selectedVoteIndex === index ? "Elegido" : "Votar"}</span>`;
    button.addEventListener("click", () => {
      state.selectedVoteIndex = index;
      $("showResultButton").disabled = false;
      renderVote();
    });
    list.appendChild(button);
  });

  $("showResultButton").disabled = state.selectedVoteIndex === null;
}

function renderResult() {
  const selectedName = state.players[state.selectedVoteIndex];
  const impostorNames = [...state.impostorIndexes].map((index) => state.players[index]);
  const hasCaughtImpostor = state.impostorIndexes.has(state.selectedVoteIndex);

  $("resultTitle").textContent = hasCaughtImpostor ? "Impostor descubierto" : "El impostor ha sobrevivido";

  const resultBox = $("resultBox");
  resultBox.innerHTML = "";

  const verdict = document.createElement("div");
  verdict.className = "result-line";
  verdict.innerHTML = `<strong>${hasCaughtImpostor ? "Gana el grupo" : "Gana el impostor"}</strong>Habéis votado a ${selectedName}.`;

  const word = document.createElement("div");
  word.className = "result-line";
  word.innerHTML = `<strong>La palabra secreta era</strong><span class="secret-word" style="font-size: clamp(2rem, 9vw, 4.4rem); margin: .25rem 0 0; display: block;">${state.word}</span>`;

  const impostors = document.createElement("div");
  impostors.className = "result-line";
  impostors.innerHTML = `<strong>${impostorNames.length === 1 ? "El impostor era" : "Los impostores eran"}</strong>`;
  const pillRow = document.createElement("div");
  pillRow.className = "player-pill-row";
  impostorNames.forEach((name) => {
    const pill = document.createElement("span");
    pill.className = "player-pill";
    pill.textContent = name;
    pillRow.appendChild(pill);
  });
  impostors.appendChild(pillRow);

  resultBox.append(verdict, word, impostors);
}

function resetToSetup() {
  stopTimer();
  $("setupError").classList.add("hidden");
  showScreen("screenSetup");
}

function bindEvents() {
  $("startSetupButton").addEventListener("click", resetToSetup);
  $("howToPlayButton").addEventListener("click", () => showScreen("screenRules"));
  $("backFromRulesButton").addEventListener("click", () => showScreen("screenStart"));
  $("rulesToSetupButton").addEventListener("click", resetToSetup);
  $("resetGameButton").addEventListener("click", () => {
    stopTimer();
    showScreen("screenStart");
  });
  $("categorySelect").addEventListener("change", () => {
    $("customWordsBlock").classList.toggle("hidden", $("categorySelect").value !== "Personalizadas");
  });
  $("setupForm").addEventListener("submit", (event) => {
    event.preventDefault();
    createGame();
  });
  $("loadExampleButton").addEventListener("click", () => {
    $("playersInput").value = "Ana\nMarc\nNuria\nXavier\nMarta";
    $("categorySelect").value = "Familia";
    $("impostorCountInput").value = "1";
    $("timerInput").value = "180";
    $("showCategoryToImpostorInput").checked = true;
    $("customWordsBlock").classList.add("hidden");
  });
  $("showRoleButton").addEventListener("click", showCurrentRole);
  $("hideAndNextButton").addEventListener("click", hideAndMoveNext);
  $("pauseTimerButton").addEventListener("click", toggleTimerPause);
  $("resetTimerButton").addEventListener("click", resetTimer);
  $("reviewRolesButton").addEventListener("click", () => {
    stopTimer();
    state.revealIndex = 0;
    state.isRoleVisible = false;
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
    startTimerIfNeeded();
  });
  $("showResultButton").addEventListener("click", () => {
    renderResult();
    showScreen("screenResult");
  });
  $("samePlayersButton").addEventListener("click", () => createGame({ keepPlayers: true }));
  $("newGameButton").addEventListener("click", resetToSetup);
}

function init() {
  populateCategories();
  bindEvents();
  const lastPlayers = loadLastPlayers();
  if (lastPlayers) $("playersInput").value = lastPlayers;
  showScreen("screenStart");
}

init();
