const app = document.querySelector("#app");

const DEFAULT_PLAYERS = ["Clara", "Mateo", "Lucía", "Pablo", "Sara", "Diego"];

const DECKS = {
  animales: [
    { word: "Gato", clue: "Pelo" },
    { word: "Perro", clue: "Correa" },
    { word: "Caballo", clue: "Montura" },
    { word: "Tiburón", clue: "Aleta" },
    { word: "León", clue: "Melena" },
    { word: "Pingüino", clue: "Hielo" },
    { word: "Elefante", clue: "Trompa" },
    { word: "Serpiente", clue: "Escamas" },
    { word: "Águila", clue: "Cielo" },
    { word: "Delfín", clue: "Mar" },
    { word: "Conejo", clue: "Zanahoria" },
    { word: "Oso", clue: "Miel" }
  ],
  comida: [
    { word: "Pizza", clue: "Queso" },
    { word: "Sushi", clue: "Arroz" },
    { word: "Hamburguesa", clue: "Pan" },
    { word: "Chocolate", clue: "Cacao" },
    { word: "Paella", clue: "Azafrán" },
    { word: "Helado", clue: "Frío" },
    { word: "Tortilla", clue: "Huevo" },
    { word: "Croissant", clue: "Mantequilla" },
    { word: "Taco", clue: "Maíz" },
    { word: "Café", clue: "Taza" }
  ],
  lugares: [
    { word: "Playa", clue: "Arena" },
    { word: "Hospital", clue: "Camilla" },
    { word: "Biblioteca", clue: "Silencio" },
    { word: "Aeropuerto", clue: "Maleta" },
    { word: "Castillo", clue: "Muralla" },
    { word: "Museo", clue: "Cuadro" },
    { word: "Gimnasio", clue: "Pesas" },
    { word: "Teatro", clue: "Telón" },
    { word: "Mercado", clue: "Puesto" },
    { word: "Montaña", clue: "Cima" }
  ],
  objetos: [
    { word: "Teléfono", clue: "Pantalla" },
    { word: "Reloj", clue: "Hora" },
    { word: "Paraguas", clue: "Lluvia" },
    { word: "Llave", clue: "Puerta" },
    { word: "Gafas", clue: "Cristal" },
    { word: "Mochila", clue: "Espalda" },
    { word: "Cámara", clue: "Foto" },
    { word: "Libro", clue: "Página" },
    { word: "Vela", clue: "Fuego" },
    { word: "Mapa", clue: "Ruta" }
  ],
  cultura: [
    { word: "Cine", clue: "Pantalla" },
    { word: "Música", clue: "Ritmo" },
    { word: "Fútbol", clue: "Gol" },
    { word: "Magia", clue: "Truco" },
    { word: "Carnaval", clue: "Disfraz" },
    { word: "Cumpleaños", clue: "Tarta" },
    { word: "Navidad", clue: "Regalo" },
    { word: "Boda", clue: "Anillo" },
    { word: "Viaje", clue: "Billete" },
    { word: "Universidad", clue: "Examen" }
  ]
};

const DEFAULT_CUSTOM = `Gato - Pelo\nPlaya - Arena\nPizza - Queso\nTeléfono - Pantalla\nAeropuerto - Maleta`;

let state = loadState() || {
  screen: "setup",
  players: DEFAULT_PLAYERS.map((name) => createPlayer(name)),
  playerInput: "",
  impostorCount: 1,
  category: "animales",
  mode: "included",
  customRaw: DEFAULT_CUSTOM,
  timerSeconds: 90,
  roundLimit: 5,
  currentRound: 1,
  currentRevealIndex: 0,
  revealOpen: false,
  assignment: null,
  timerLeft: 90,
  timerRunning: false,
  selectedVotes: [],
  error: ""
};

let timerId = null;
let dragState = null;

function createPlayer(name) {
  return {
    id: cryptoRandomId(),
    name: name.trim()
  };
}

function cryptoRandomId() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function saveState() {
  const safe = { ...state, timerRunning: false };
  localStorage.setItem("el-impostor-state-v2", JSON.stringify(safe));
}

function loadState() {
  try {
    const raw = localStorage.getItem("el-impostor-state-v2");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function initials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";
}

function getDeck() {
  if (state.mode === "custom") {
    const custom = parseCustomDeck(state.customRaw);
    return custom.length ? custom : [];
  }
  return DECKS[state.category] || DECKS.animales;
}

function parseCustomDeck(raw) {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separator = line.includes(" - ") ? " - " : line.includes("-") ? "-" : line.includes(",") ? "," : null;
      if (!separator) return null;
      const [word, clue] = line.split(separator).map((part) => part.trim());
      if (!word || !clue) return null;
      return { word, clue };
    })
    .filter(Boolean);
}

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const rest = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${rest}`;
}

function currentPlayer() {
  return state.players[state.currentRevealIndex];
}

function currentRoleFor(playerId) {
  return state.assignment?.roles?.find((role) => role.playerId === playerId);
}

function startTimer() {
  stopTimer();
  state.timerRunning = true;
  timerId = window.setInterval(() => {
    state.timerLeft = Math.max(0, state.timerLeft - 1);
    if (state.timerLeft <= 0) {
      stopTimer(false);
    }
    render();
  }, 1000);
  render();
}

function stopTimer(shouldRender = true) {
  if (timerId) window.clearInterval(timerId);
  timerId = null;
  state.timerRunning = false;
  if (shouldRender) render();
}

function setError(message) {
  state.error = message;
  render();
}

function clearError() {
  state.error = "";
}

function appHeader() {
  const roundText = state.assignment ? `Ronda <strong>${state.currentRound}</strong> de ${state.roundLimit}` : `Modo <strong>local</strong>`;
  return `
    <header class="app-header">
      <div class="brand" aria-label="El Impostor">
        <div class="brand-mark">EI</div>
        <div>
          <h1>El Impostor</h1>
          <p>Hablad, insinuad y descubrid quién no encaja</p>
        </div>
      </div>
      <div class="header-actions">
        <div class="header-chip">${roundText}</div>
        <button class="ghost-button" data-action="go-setup" type="button">Nueva partida</button>
      </div>
    </header>
  `;
}

function render() {
  saveState();
  app.innerHTML = `${appHeader()}<section class="stage">${renderScreen()}</section>`;
  bindInputs();
}

function renderScreen() {
  if (state.screen === "reveal") return renderRevealScreen();
  if (state.screen === "discussion") return renderDiscussionScreen();
  if (state.screen === "vote") return renderVoteScreen();
  if (state.screen === "result") return renderResultScreen();
  return renderSetupScreen();
}

function renderSetupScreen() {
  const maxImpostors = Math.max(1, Math.min(3, state.players.length - 1));
  state.impostorCount = clamp(state.impostorCount, 1, maxImpostors);
  const deckCount = getDeck().length;

  return `
    <div class="stage-inner setup-layout">
      <section class="paper-card setup-panel" aria-label="Jugadores">
        <div class="panel-head">
          <div>
            <p class="section-title">Preparar la mesa</p>
            <h2>Jugadores</h2>
            <p>Añádelos en orden. Puedes arrastrar para cambiar los turnos de revelación.</p>
          </div>
          <div class="count-pill">${state.players.length} jugadores</div>
        </div>

        <form class="add-player" data-form="add-player">
          <input class="input" id="playerName" name="playerName" autocomplete="off" maxlength="24" placeholder="Nombre del jugador" value="${escapeHtml(state.playerInput || "")}" />
          <button class="add-button" type="submit">Añadir</button>
        </form>

        <div class="player-list-wrap">
          <div class="player-list" id="playerList" aria-label="Lista de jugadores">
            ${state.players.map((player, index) => renderPlayerRow(player, index)).join("")}
          </div>
        </div>

        <div class="setup-footer">
          <div class="error-box">${escapeHtml(state.error)}</div>
          <button class="primary-button start-button" data-action="start-game" type="button">Empezar ronda</button>
        </div>
      </section>

      <aside class="config-panel card" aria-label="Configuración de partida">
        <div class="rules-card card">
          <h3>Regla clave</h3>
          <p>Nadie ve la palabra durante la configuración. Al empezar, cada jugador mira su pantalla privada: los ciudadanos reciben la palabra; los impostores reciben solo una pista relacionada.</p>
          <div class="role-compare">
            <div class="role-mini"><span>Ciudadanos</span><strong>Palabra secreta</strong></div>
            <div class="role-mini"><span>Impostores</span><strong>Pista relacionada</strong></div>
          </div>
        </div>

        <div class="form-scroll">
          <div class="form-row">
            <label class="form-label">
              <strong>Impostores</strong>
              <small>Número oculto de impostores.</small>
            </label>
            <div class="stepper">
              <button data-action="dec-impostors" type="button">−</button>
              <output>${state.impostorCount}</output>
              <button data-action="inc-impostors" type="button">+</button>
            </div>
          </div>

          <div class="form-row">
            <label class="form-label">
              <strong>Modo</strong>
              <small>Usa mazos incluidos o escribe el tuyo.</small>
            </label>
            <div class="segmented">
              <button class="${state.mode === "included" ? "active" : ""}" data-action="mode-included" type="button">Incluido</button>
              <button class="${state.mode === "custom" ? "active" : ""}" data-action="mode-custom" type="button">Personalizado</button>
            </div>
          </div>

          ${state.mode === "included" ? renderIncludedDeckControls() : renderCustomDeckControls(deckCount)}

          <div class="form-row">
            <label class="form-label">
              <strong>Temporizador</strong>
              <small>Tiempo de discusión.</small>
            </label>
            <select class="select" id="timerSelect">
              ${[60, 90, 120, 180, 300].map((seconds) => `<option value="${seconds}" ${state.timerSeconds === seconds ? "selected" : ""}>${seconds < 60 ? seconds : `${seconds / 60} min`}</option>`).join("")}
            </select>
          </div>

          <div class="form-row">
            <label class="form-label">
              <strong>Rondas</strong>
              <small>Partidas seguidas con los mismos jugadores.</small>
            </label>
            <div class="stepper">
              <button data-action="dec-rounds" type="button">−</button>
              <output>${state.roundLimit}</output>
              <button data-action="inc-rounds" type="button">+</button>
            </div>
          </div>
        </div>

        <div class="round-strip" aria-label="Resumen">
          <div class="strip-item"><span>Turnos</span><strong>Orden manual</strong></div>
          <div class="strip-item"><span>Mazo</span><strong>${deckCount} pares</strong></div>
          <div class="strip-item"><span>Privado</span><strong>Sin revelar antes</strong></div>
          <div class="strip-item"><span>Anuncios</span><strong>Cero</strong></div>
        </div>
      </aside>
    </div>
  `;
}

function renderIncludedDeckControls() {
  const options = Object.keys(DECKS).map((key) => {
    const label = {
      animales: "Animales",
      comida: "Comida",
      lugares: "Lugares",
      objetos: "Objetos",
      cultura: "Cultura general"
    }[key] || key;
    return `<option value="${key}" ${state.category === key ? "selected" : ""}>${label}</option>`;
  }).join("");

  return `
    <div class="form-row">
      <label class="form-label">
        <strong>Categoría</strong>
        <small>La palabra y la pista se escogen al empezar.</small>
      </label>
      <select class="select" id="categorySelect">${options}</select>
    </div>
  `;
}

function renderCustomDeckControls(deckCount) {
  return `
    <div class="custom-editor">
      <label class="form-label" for="customRaw">
        <strong>Mazo personalizado</strong>
        <small>Un par por línea. Formato: Palabra - Pista. No se mostrará ninguna antes de empezar.</small>
      </label>
      <textarea class="textarea" id="customRaw" spellcheck="false">${escapeHtml(state.customRaw)}</textarea>
      <small>${deckCount} pares válidos detectados.</small>
    </div>
  `;
}

function renderPlayerRow(player, index) {
  return `
    <div class="player-row" data-player-id="${player.id}" draggable="true">
      <div class="drag-handle" data-drag-handle="${player.id}" title="Arrastrar">${index + 1}</div>
      <div class="player-name">${escapeHtml(player.name)}</div>
      <div class="row-actions">
        <button class="tiny-button" data-action="move-player-up" data-id="${player.id}" type="button" aria-label="Subir jugador">↑</button>
        <button class="tiny-button" data-action="move-player-down" data-id="${player.id}" type="button" aria-label="Bajar jugador">↓</button>
        <button class="tiny-button" data-action="remove-player" data-id="${player.id}" type="button" aria-label="Eliminar jugador">×</button>
      </div>
    </div>
  `;
}

function renderRevealScreen() {
  const player = currentPlayer();
  const role = currentRoleFor(player.id);
  const playerNumber = state.currentRevealIndex + 1;
  const total = state.players.length;
  const isLast = playerNumber === total;

  return `
    <div class="stage-inner reveal-layout">
      <div class="status-row">
        <div class="status-card">Jugador <strong>${playerNumber}</strong> de ${total}</div>
        <div class="status-card">Ronda <strong>${state.currentRound}</strong> de ${state.roundLimit}</div>
        <div class="status-card"><strong>${state.impostorCount}</strong> impostor${state.impostorCount > 1 ? "es" : ""}</div>
      </div>

      <div class="reveal-center">
        ${state.revealOpen ? renderOpenReveal(player, role) : renderClosedReveal(player)}
      </div>

      <div class="status-row">
        <div class="status-card">Pasa el móvil en el orden de la lista. Cada persona ve solo su panel.</div>
      </div>
    </div>
  `;
}

function renderClosedReveal(player) {
  return `
    <section class="paper-card reveal-card compact-closed" aria-label="Pantalla privada cerrada">
      <div class="private-head">
        <div>
          <p class="section-title">Pantalla privada</p>
          <small>Solo debe mirar esta persona.</small>
        </div>
        <small>${escapeHtml(player.name)}</small>
      </div>
      <div class="private-body">
        <div class="player-focus">
          <div class="initials">${escapeHtml(initials(player.name))}</div>
          <h2>${escapeHtml(player.name)}</h2>
          <p>Cuando estés preparado, pulsa para ver tu papel. No enseñes la pantalla.</p>
        </div>
      </div>
      <div class="reveal-actions single">
        <button class="primary-button" data-action="open-reveal" type="button">Ver mi papel</button>
      </div>
    </section>
  `;
}

function renderOpenReveal(player, role) {
  const isImpostor = role.type === "impostor";
  const title = isImpostor ? "Eres el impostor" : "Eres ciudadano";
  const text = isImpostor
    ? "No conoces la palabra exacta. Usa la pista, escucha y disimula."
    : "Conoces la palabra secreta. Da pistas sin decirla directamente.";
  const label = isImpostor ? "Pista relacionada" : "Palabra secreta";
  const value = isImpostor ? state.assignment.clue : state.assignment.word;
  const boxClass = isImpostor ? "secret-box impostor" : "secret-box";
  const nextLabel = state.currentRevealIndex + 1 === state.players.length ? "Empezar discusión" : "Ocultar y pasar";

  return `
    <section class="paper-card reveal-card" aria-label="Revelación privada">
      <div class="private-head">
        <div>
          <p class="section-title">Revelación privada</p>
          <small>No digas lo que ves aquí.</small>
        </div>
        <small>${escapeHtml(player.name)}</small>
      </div>
      <div class="private-body">
        <div class="player-focus">
          <div class="initials">${isImpostor ? "I" : "C"}</div>
          <h2>${title}</h2>
          <p>${text}</p>
          <div class="${boxClass}">
            <span>${label}</span>
            <strong>${escapeHtml(value)}</strong>
          </div>
          <div class="disclaimer-line">Los demás no ven esta pantalla.</div>
        </div>
      </div>
      <div class="reveal-actions">
        <button class="secondary-button" data-action="hide-reveal" type="button">Ocultar</button>
        <button class="primary-button" data-action="next-reveal" type="button">${nextLabel}</button>
      </div>
    </section>
  `;
}

function renderDiscussionScreen() {
  return `
    <div class="stage-inner round-layout">
      <section class="paper-card round-panel" aria-label="Discusión">
        <div class="panel-head">
          <div>
            <p class="section-title">Fase de discusión</p>
            <h2>Hablad sin revelar</h2>
          </div>
          <div class="count-pill">${state.players.length} jugadores</div>
        </div>
        <div class="centered-block">
          <div class="timer-block">
            <div class="timer-value">${formatTime(state.timerLeft)}</div>
            <div class="timer-label">Lanzad pistas, preguntad y observad. Nadie debe decir la palabra exacta ni leer su pista literalmente.</div>
          </div>
        </div>
        <div class="action-grid">
          <button class="secondary-button" data-action="toggle-timer" type="button">${state.timerRunning ? "Pausar" : "Iniciar"}</button>
          <button class="secondary-button" data-action="reset-timer" type="button">Reiniciar</button>
        </div>
      </section>

      <section class="card round-panel" aria-label="Acciones de ronda">
        <div class="panel-head">
          <div>
            <p class="section-title">Cuando estéis listos</p>
            <h2>Votación final</h2>
            <p class="dark-muted">La partida no revela nada hasta confirmar el resultado. Si hay más de un impostor, seleccionad tantos nombres como impostores.</p>
          </div>
        </div>
        <div class="centered-block">
          <div class="result-list">
            <div class="result-pill">
              <small>Objetivo</small>
              <strong>Elegir al impostor</strong>
            </div>
            <div class="result-pill">
              <small>Ronda</small>
              <strong>${state.currentRound} de ${state.roundLimit}</strong>
            </div>
          </div>
        </div>
        <div class="action-grid">
          <button class="secondary-button" data-action="back-to-reveal" type="button">Revisar turnos</button>
          <button class="primary-button" data-action="go-vote" type="button">Ir a votar</button>
        </div>
      </section>
    </div>
  `;
}

function renderVoteScreen() {
  const selectedCount = state.selectedVotes.length;
  const needed = state.impostorCount;
  return `
    <div class="stage-inner round-layout">
      <section class="paper-card round-panel" aria-label="Votación">
        <div class="panel-head">
          <div>
            <p class="section-title">Votación</p>
            <h2>¿Quién no encaja?</h2>
            <p>Seleccionad ${needed === 1 ? "un nombre" : `${needed} nombres`}.</p>
          </div>
          <div class="count-pill">${selectedCount}/${needed}</div>
        </div>
        <div class="vote-list">
          ${state.players.map((player) => renderVoteRow(player)).join("")}
        </div>
        <div class="action-grid">
          <button class="secondary-button" data-action="go-discussion" type="button">Volver</button>
          <button class="primary-button" data-action="show-result" type="button" ${selectedCount !== needed ? "disabled" : ""}>Confirmar</button>
        </div>
      </section>

      <section class="card round-panel" aria-label="Instrucciones de votación">
        <div class="panel-head">
          <div>
            <p class="section-title">Sin trampas</p>
            <h2>Resultado oculto</h2>
            <p class="dark-muted">La palabra y la pista solo se revelan después de confirmar. Hasta entonces, nadie tiene ventaja desde la configuración.</p>
          </div>
        </div>
        <div class="centered-block">
          <div class="result-list">
            <div class="result-pill">
              <small>Ciudadanos tenían</small>
              <strong>Palabra secreta</strong>
            </div>
            <div class="result-pill">
              <small>Impostores tenían</small>
              <strong>Pista relacionada</strong>
            </div>
          </div>
        </div>
        <div class="action-grid">
          <button class="danger-button" data-action="cancel-round" type="button">Cancelar ronda</button>
        </div>
      </section>
    </div>
  `;
}

function renderVoteRow(player) {
  const selected = state.selectedVotes.includes(player.id);
  return `
    <button class="vote-row ${selected ? "selected" : ""}" data-action="toggle-vote" data-id="${player.id}" type="button">
      <div class="iconless-badge">${escapeHtml(initials(player.name))}</div>
      <div class="vote-name">${escapeHtml(player.name)}</div>
      <div class="radio" aria-hidden="true"></div>
    </button>
  `;
}

function renderResultScreen() {
  const impostors = state.assignment.roles
    .filter((role) => role.type === "impostor")
    .map((role) => state.players.find((player) => player.id === role.playerId)?.name)
    .filter(Boolean);
  const correctIds = state.assignment.roles.filter((role) => role.type === "impostor").map((role) => role.playerId).sort();
  const voteIds = [...state.selectedVotes].sort();
  const success = JSON.stringify(correctIds) === JSON.stringify(voteIds);
  const canContinue = state.currentRound < state.roundLimit;

  return `
    <div class="stage-inner round-layout">
      <section class="paper-card round-panel" aria-label="Resultado">
        <div class="panel-head">
          <div>
            <p class="section-title">Resultado</p>
            <h2>${success ? "Habéis acertado" : "El impostor escapó"}</h2>
            <p>${success ? "La mesa detectó quién no tenía la palabra." : "La votación no coincidió con el papel real."}</p>
          </div>
        </div>
        <div class="centered-block">
          <div class="result-list">
            <div class="result-pill"><small>Impostor${impostors.length > 1 ? "es" : ""}</small><strong>${escapeHtml(impostors.join(", "))}</strong></div>
            <div class="result-pill"><small>Palabra secreta</small><strong>${escapeHtml(state.assignment.word)}</strong></div>
            <div class="result-pill"><small>Pista impostor</small><strong>${escapeHtml(state.assignment.clue)}</strong></div>
          </div>
        </div>
        <div class="action-grid">
          <button class="secondary-button" data-action="go-setup" type="button">Nueva partida</button>
          <button class="primary-button" data-action="next-round" type="button" ${canContinue ? "" : "disabled"}>${canContinue ? "Siguiente ronda" : "Fin"}</button>
        </div>
      </section>

      <section class="card round-panel" aria-label="Resumen de votos">
        <div class="panel-head">
          <div>
            <p class="section-title">Vuestra elección</p>
            <h2>${renderSelectedNames()}</h2>
            <p class="dark-muted">Ronda ${state.currentRound} de ${state.roundLimit}. Podéis seguir con los mismos jugadores o volver a configuración.</p>
          </div>
        </div>
        <div class="centered-block">
          <div class="result-list">
            <div class="result-pill"><small>Regla</small><strong>La palabra nunca aparece antes de empezar</strong></div>
            <div class="result-pill"><small>Siguiente</small><strong>${canContinue ? "Nueva palabra y nueva pista" : "Partida terminada"}</strong></div>
          </div>
        </div>
        <div class="action-grid">
          <button class="secondary-button" data-action="repeat-round" type="button">Repetir ronda</button>
        </div>
      </section>
    </div>
  `;
}

function renderSelectedNames() {
  const names = state.selectedVotes
    .map((id) => state.players.find((player) => player.id === id)?.name)
    .filter(Boolean);
  return escapeHtml(names.length ? names.join(", ") : "Sin voto");
}

function bindInputs() {
  const input = document.querySelector("#playerName");
  if (input) {
    input.addEventListener("input", (event) => {
      state.playerInput = event.target.value;
      saveState();
    });
  }

  const category = document.querySelector("#categorySelect");
  if (category) {
    category.addEventListener("change", (event) => {
      state.category = event.target.value;
      clearError();
      render();
    });
  }

  const timer = document.querySelector("#timerSelect");
  if (timer) {
    timer.addEventListener("change", (event) => {
      state.timerSeconds = Number(event.target.value);
      state.timerLeft = state.timerSeconds;
      render();
    });
  }

  const customRaw = document.querySelector("#customRaw");
  if (customRaw) {
    customRaw.addEventListener("input", (event) => {
      state.customRaw = event.target.value;
      saveState();
    });
    customRaw.addEventListener("blur", render);
  }

  const form = document.querySelector('[data-form="add-player"]');
  if (form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      addPlayer();
    });
  }

  bindDrag();
}

app.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action]");
  if (!target) return;
  const action = target.dataset.action;
  const id = target.dataset.id;

  const actions = {
    "go-setup": goSetup,
    "start-game": startGame,
    "dec-impostors": () => updateImpostors(-1),
    "inc-impostors": () => updateImpostors(1),
    "dec-rounds": () => updateRounds(-1),
    "inc-rounds": () => updateRounds(1),
    "mode-included": () => setMode("included"),
    "mode-custom": () => setMode("custom"),
    "remove-player": () => removePlayer(id),
    "move-player-up": () => movePlayer(id, -1),
    "move-player-down": () => movePlayer(id, 1),
    "open-reveal": () => { state.revealOpen = true; render(); },
    "hide-reveal": () => { state.revealOpen = false; render(); },
    "next-reveal": nextReveal,
    "toggle-timer": toggleTimer,
    "reset-timer": resetTimer,
    "go-vote": goVote,
    "go-discussion": goDiscussion,
    "back-to-reveal": backToReveal,
    "toggle-vote": () => toggleVote(id),
    "show-result": showResult,
    "cancel-round": cancelRound,
    "next-round": nextRound,
    "repeat-round": repeatRound
  };

  actions[action]?.();
});

function addPlayer() {
  const value = (state.playerInput || "").trim();
  if (!value) return setError("Escribe un nombre antes de añadir.");
  if (state.players.some((player) => player.name.toLowerCase() === value.toLowerCase())) {
    return setError("Ese nombre ya está en la lista.");
  }
  if (state.players.length >= 16) return setError("Máximo 16 jugadores para que la ronda siga siendo manejable.");
  state.players.push(createPlayer(value));
  state.playerInput = "";
  clearError();
  render();
  setTimeout(() => document.querySelector("#playerName")?.focus(), 0);
}

function removePlayer(id) {
  if (state.players.length <= 3) return setError("Necesitas al menos 3 jugadores.");
  state.players = state.players.filter((player) => player.id !== id);
  state.impostorCount = clamp(state.impostorCount, 1, Math.max(1, Math.min(3, state.players.length - 1)));
  clearError();
  render();
}

function movePlayer(id, direction) {
  const from = state.players.findIndex((player) => player.id === id);
  if (from < 0) return;
  const to = clamp(from + direction, 0, state.players.length - 1);
  if (from === to) return;
  const [player] = state.players.splice(from, 1);
  state.players.splice(to, 0, player);
  render();
}

function updateImpostors(delta) {
  const max = Math.max(1, Math.min(3, state.players.length - 1));
  state.impostorCount = clamp(state.impostorCount + delta, 1, max);
  clearError();
  render();
}

function updateRounds(delta) {
  state.roundLimit = clamp(state.roundLimit + delta, 1, 20);
  render();
}

function setMode(mode) {
  state.mode = mode;
  clearError();
  render();
}

function startGame() {
  stopTimer(false);
  if (state.players.length < 3) return setError("Necesitas al menos 3 jugadores.");
  if (state.impostorCount >= state.players.length) return setError("Debe haber más ciudadanos que impostores.");

  const deck = getDeck();
  if (deck.length < 1) return setError("El mazo personalizado necesita al menos una línea válida: Palabra - Pista.");

  const pair = pickRandom(deck);
  const impostorIds = shuffle(state.players).slice(0, state.impostorCount).map((player) => player.id);
  state.assignment = {
    word: pair.word,
    clue: pair.clue,
    roles: state.players.map((player) => ({
      playerId: player.id,
      type: impostorIds.includes(player.id) ? "impostor" : "citizen"
    }))
  };
  state.currentRevealIndex = 0;
  state.revealOpen = false;
  state.timerLeft = state.timerSeconds;
  state.selectedVotes = [];
  state.screen = "reveal";
  clearError();
  render();
}

function nextReveal() {
  if (state.currentRevealIndex < state.players.length - 1) {
    state.currentRevealIndex += 1;
    state.revealOpen = false;
    render();
    return;
  }
  state.revealOpen = false;
  state.screen = "discussion";
  state.timerLeft = state.timerSeconds;
  render();
}

function backToReveal() {
  stopTimer(false);
  state.currentRevealIndex = 0;
  state.revealOpen = false;
  state.screen = "reveal";
  render();
}

function toggleTimer() {
  if (state.timerRunning) stopTimer();
  else startTimer();
}

function resetTimer() {
  stopTimer(false);
  state.timerLeft = state.timerSeconds;
  render();
}

function goVote() {
  stopTimer(false);
  state.selectedVotes = [];
  state.screen = "vote";
  render();
}

function goDiscussion() {
  state.screen = "discussion";
  render();
}

function toggleVote(id) {
  const exists = state.selectedVotes.includes(id);
  if (exists) {
    state.selectedVotes = state.selectedVotes.filter((voteId) => voteId !== id);
  } else if (state.selectedVotes.length < state.impostorCount) {
    state.selectedVotes.push(id);
  } else {
    state.selectedVotes = [...state.selectedVotes.slice(1), id];
  }
  render();
}

function showResult() {
  if (state.selectedVotes.length !== state.impostorCount) return;
  state.screen = "result";
  render();
}

function nextRound() {
  if (state.currentRound >= state.roundLimit) return;
  state.currentRound += 1;
  startGame();
}

function repeatRound() {
  startGame();
}

function cancelRound() {
  stopTimer(false);
  state.assignment = null;
  state.screen = "setup";
  state.selectedVotes = [];
  render();
}

function goSetup() {
  stopTimer(false);
  state.screen = "setup";
  state.assignment = null;
  state.selectedVotes = [];
  state.revealOpen = false;
  state.currentRound = 1;
  render();
}

function bindDrag() {
  document.querySelectorAll(".player-row").forEach((row) => {
    row.addEventListener("dragstart", (event) => {
      event.dataTransfer.setData("text/plain", row.dataset.playerId);
      event.dataTransfer.effectAllowed = "move";
      row.classList.add("dragging");
    });

    row.addEventListener("dragend", () => {
      row.classList.remove("dragging");
    });

    row.addEventListener("dragover", (event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
    });

    row.addEventListener("drop", (event) => {
      event.preventDefault();
      const draggedId = event.dataTransfer.getData("text/plain");
      const targetId = row.dataset.playerId;
      reorderPlayers(draggedId, targetId);
    });
  });

  document.querySelectorAll("[data-drag-handle]").forEach((handle) => {
    handle.addEventListener("pointerdown", onPointerDragStart);
  });
}

function onPointerDragStart(event) {
  if (event.pointerType === "mouse" && event.button !== 0) return;
  const handle = event.currentTarget;
  const id = handle.dataset.dragHandle;
  const row = handle.closest(".player-row");
  dragState = { id, lastTarget: id };
  row?.classList.add("dragging");
  handle.setPointerCapture?.(event.pointerId);
  window.addEventListener("pointermove", onPointerDragMove);
  window.addEventListener("pointerup", onPointerDragEnd, { once: true });
}

function onPointerDragMove(event) {
  if (!dragState) return;
  const element = document.elementFromPoint(event.clientX, event.clientY);
  const targetRow = element?.closest?.(".player-row");
  if (!targetRow) return;
  const targetId = targetRow.dataset.playerId;
  if (!targetId || targetId === dragState.id || targetId === dragState.lastTarget) return;
  dragState.lastTarget = targetId;
  reorderPlayers(dragState.id, targetId, false);
}

function onPointerDragEnd() {
  dragState = null;
  window.removeEventListener("pointermove", onPointerDragMove);
  render();
}

function reorderPlayers(draggedId, targetId, shouldRender = true) {
  if (!draggedId || !targetId || draggedId === targetId) return;
  const from = state.players.findIndex((player) => player.id === draggedId);
  const to = state.players.findIndex((player) => player.id === targetId);
  if (from < 0 || to < 0 || from === to) return;
  const [player] = state.players.splice(from, 1);
  state.players.splice(to, 0, player);
  if (shouldRender) render();
  else {
    const list = document.querySelector("#playerList");
    if (!list) return;
    list.innerHTML = state.players.map((playerItem, index) => renderPlayerRow(playerItem, index)).join("");
    bindDrag();
  }
}

render();
