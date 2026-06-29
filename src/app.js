const app = document.querySelector('#app');

const decks = {
  animales: {
    label: 'Animales',
    pairs: [
      ['Gato', 'Pelo'], ['Perro', 'Collar'], ['Caballo', 'Montura'], ['Tiburón', 'Aleta'],
      ['Abeja', 'Miel'], ['Búho', 'Noche'], ['Serpiente', 'Escamas'], ['Pingüino', 'Hielo'],
      ['Conejo', 'Zanahoria'], ['Elefante', 'Trompa'], ['Delfín', 'Ola'], ['Araña', 'Tela']
    ]
  },
  comida: {
    label: 'Comida',
    pairs: [
      ['Pizza', 'Queso'], ['Sushi', 'Arroz'], ['Tortilla', 'Huevo'], ['Hamburguesa', 'Pan'],
      ['Helado', 'Frío'], ['Paella', 'Azafrán'], ['Chocolate', 'Cacao'], ['Café', 'Taza'],
      ['Croissant', 'Mantequilla'], ['Ensalada', 'Lechuga'], ['Tacos', 'Maíz'], ['Pasta', 'Salsa']
    ]
  },
  objetos: {
    label: 'Objetos',
    pairs: [
      ['Llave', 'Cerradura'], ['Reloj', 'Hora'], ['Libro', 'Página'], ['Paraguas', 'Lluvia'],
      ['Vela', 'Fuego'], ['Maleta', 'Viaje'], ['Espejo', 'Reflejo'], ['Cámara', 'Foto'],
      ['Teléfono', 'Llamada'], ['Gafas', 'Vista'], ['Mapa', 'Ruta'], ['Carta', 'Sobre']
    ]
  },
  lugares: {
    label: 'Lugares',
    pairs: [
      ['Playa', 'Arena'], ['Biblioteca', 'Silencio'], ['Hospital', 'Bata'], ['Aeropuerto', 'Maleta'],
      ['Museo', 'Cuadro'], ['Cine', 'Pantalla'], ['Teatro', 'Escenario'], ['Mercado', 'Puesto'],
      ['Bosque', 'Árboles'], ['Castillo', 'Muralla'], ['Estación', 'Tren'], ['Hotel', 'Recepción']
    ]
  },
  acciones: {
    label: 'Acciones',
    pairs: [
      ['Dormir', 'Almohada'], ['Correr', 'Zapatillas'], ['Cocinar', 'Sartén'], ['Bailar', 'Música'],
      ['Leer', 'Libro'], ['Nadar', 'Agua'], ['Pintar', 'Pincel'], ['Viajar', 'Billete'],
      ['Cantar', 'Micrófono'], ['Comprar', 'Bolsa'], ['Escribir', 'Tinta'], ['Conducir', 'Volante']
    ]
  },
  famosos: {
    label: 'Personajes',
    pairs: [
      ['Vampiro', 'Colmillos'], ['Pirata', 'Tesoro'], ['Robot', 'Metal'], ['Fantasma', 'Sábana'],
      ['Mago', 'Varita'], ['Astronauta', 'Casco'], ['Ninja', 'Sombra'], ['Payaso', 'Nariz'],
      ['Sirena', 'Mar'], ['Caballero', 'Armadura'], ['Zombie', 'Cerebro'], ['Chef', 'Gorro']
    ]
  }
};

const defaultPlayers = [
  { id: cryptoId(), name: 'Clara', alive: true },
  { id: cryptoId(), name: 'Mateo', alive: true },
  { id: cryptoId(), name: 'Lucía', alive: true },
  { id: cryptoId(), name: 'Pablo', alive: true }
];

const savedSetup = readSetup();

let state = {
  stage: 'setup',
  players: savedSetup?.players?.length ? savedSetup.players.map(name => ({ id: cryptoId(), name, alive: true })) : defaultPlayers,
  impostorCount: savedSetup?.impostorCount || 1,
  category: savedSetup?.category || 'animales',
  pair: null,
  revealIndex: 0,
  revealOpen: false,
  selectedTargetId: null,
  eliminatedLog: [],
  round: 1,
  timerSeconds: 90,
  timerRunning: false,
  timerLeft: 90,
  timerId: null,
  error: ''
};

render();

function cryptoId() {
  if (window.crypto?.randomUUID) return crypto.randomUUID();
  return `id-${Math.random().toString(36).slice(2)}-${Date.now()}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function readSetup() {
  try {
    return JSON.parse(localStorage.getItem('impostor-setup-v3'));
  } catch {
    return null;
  }
}

function saveSetup() {
  const data = {
    players: state.players.map(p => p.name),
    category: state.category,
    impostorCount: state.impostorCount
  };
  localStorage.setItem('impostor-setup-v3', JSON.stringify(data));
}

function render() {
  stopTimerIfNeeded();
  normalizeSettings();

  const body = {
    setup: renderSetup,
    reveal: renderReveal,
    discussion: renderDiscussion,
    vote: renderVote,
    result: renderResult,
    end: renderEnd
  }[state.stage]();

  app.innerHTML = body;

  bindGlobalActions();
  if (state.stage === 'setup') bindSetupActions();
  if (state.stage === 'reveal') bindRevealActions();
  if (state.stage === 'discussion') bindDiscussionActions();
  if (state.stage === 'vote') bindVoteActions();
  if (state.stage === 'result') bindResultActions();
  if (state.stage === 'end') bindEndActions();
}

function header(extra = '') {
  return `
    <header class="topbar">
      <div class="brand">
        <div class="brand-mark" aria-hidden="true">EI</div>
        <div>
          <h1 class="brand-title">El Impostor</h1>
          <p class="brand-subtitle">Expediente cerrado. Pistas medidas.</p>
        </div>
      </div>
      <div class="top-actions">${extra}</div>
    </header>
  `;
}

function renderSetup() {
  const maxImp = maxImpostors();
  const canStart = state.players.length >= 3 && state.impostorCount < state.players.length;
  const playerItems = state.players.map((player, index) => `
    <li class="player-item" data-id="${player.id}">
      <button class="drag-handle" type="button" aria-label="Arrastrar ${escapeHtml(player.name)}">••</button>
      <span class="player-name">${index + 1}. ${escapeHtml(player.name)}</span>
      <button class="remove-btn" type="button" data-remove="${player.id}" aria-label="Quitar ${escapeHtml(player.name)}">×</button>
    </li>
  `).join('');

  const categoryButtons = Object.entries(decks).map(([key, deck]) => `
    <button class="category-btn ${state.category === key ? 'active' : ''}" type="button" data-category="${key}">
      ${escapeHtml(deck.label)}
    </button>
  `).join('');

  return `
    ${header('<button class="icon-button hide-mobile" type="button" data-help>Reglas</button>')}
    <section class="view workspace setup">
      <div class="folder">
        <div class="form-stack">
          <div>
            <p class="kicker">Preparar expediente</p>
            <h2 class="section-title">Crear partida</h2>
            <p class="text">Añade los jugadores en el orden en que se pasarán el móvil. Para cambiar el orden, arrastra el asa de cada nombre.</p>
          </div>

          <div class="row-box">
            <div class="label-block">
              <strong>Jugadores</strong>
              <span>Mínimo 3. El creador también juega.</span>
            </div>
            <div>
              <form class="inline-form" data-add-player>
                <input class="text-input" name="player" autocomplete="off" maxlength="18" placeholder="Nombre del jugador" />
                <button class="add-btn" type="submit">Añadir</button>
              </form>
              <ul class="player-list" data-player-list>${playerItems}</ul>
            </div>
          </div>

          <div class="row-box">
            <div class="label-block">
              <strong>Impostores</strong>
              <span>La partida continúa mientras queden más ciudadanos que impostores.</span>
            </div>
            <div class="segmented" role="group" aria-label="Número de impostores">
              ${[1, 2, 3].map(n => `
                <button type="button" data-impostors="${n}" class="${state.impostorCount === n ? 'active' : ''}" ${n > maxImp ? 'disabled' : ''}>${n}</button>
              `).join('')}
            </div>
          </div>

          <div class="row-box">
            <div class="label-block">
              <strong>Mazo</strong>
              <span>Solo mazos del juego. La palabra y la pista se eligen en secreto al empezar.</span>
            </div>
            <div class="category-grid">${categoryButtons}</div>
          </div>

          <div class="action-stack">
            <button class="primary-btn" type="button" data-start ${canStart ? '' : 'disabled'}>Iniciar reparto</button>
            <button class="secondary-btn" type="button" data-reset-names>Limpiar jugadores</button>
          </div>
          <div class="error-note">${escapeHtml(state.error)}</div>
        </div>
      </div>

      <aside class="dark-card help-card">
        <p class="kicker">Cómo funciona</p>
        <h2 class="section-title">Nadie ve el secreto antes de jugar.</h2>
        <p class="text">Al iniciar, la app escoge una palabra y una pista relacionada. Cada jugador mira su pantalla en privado. Los ciudadanos reciben la palabra. Los impostores reciben solo la pista.</p>
        <div class="rule-diagram">
          <div class="rule-slip">
            <span class="slip-label">Ciudadanos</span>
            <p>Ven la palabra secreta.</p>
          </div>
          <div class="rule-slip impostor">
            <span class="slip-label">Impostores</span>
            <p>Ven una pista relacionada.</p>
          </div>
        </div>
        <p class="private-note">Durante la votación se elimina a un jugador. Si era ciudadano, la partida no termina automáticamente: solo termina cuando los impostores igualan o superan a los ciudadanos, o cuando todos los impostores quedan fuera.</p>
      </aside>
    </section>
  `;
}

function renderReveal() {
  const current = alivePlayers()[state.revealIndex];
  const total = alivePlayers().length;
  if (!current) {
    state.stage = 'discussion';
    return renderDiscussion();
  }

  const player = current;
  const isImp = player.role === 'impostor';
  const value = isImp ? state.pair.clue : state.pair.word;

  return `
    ${header(`<span class="chip">Jugador ${state.revealIndex + 1} de ${total}</span>`)}
    <section class="view center-stage">
      <article class="paper reveal-card">
        <div class="compact-grid">
          <div class="mini-card"><span>Jugadores vivos</span><strong>${alivePlayers().length}</strong></div>
          <div class="mini-card"><span>Impostores</span><strong>${remainingImpostors()}</strong></div>
          <div class="mini-card"><span>Mazo</span><strong>${escapeHtml(decks[state.category].label)}</strong></div>
        </div>

        ${!state.revealOpen ? `
          <div class="player-pass">
            <p class="kicker">Turno privado</p>
            <h2 class="turn-name">${escapeHtml(player.name)}</h2>
            <p class="text">Entrega el móvil a esta persona. Nadie más debe mirar la pantalla.</p>
            <button class="primary-btn" type="button" data-open-role>Ver mi papel</button>
          </div>
        ` : `
          <div class="player-pass">
            <p class="kicker">${isImp ? 'Papel reservado' : 'Papel ciudadano'}</p>
            <h2 class="section-title">${isImp ? 'Eres impostor' : 'Eres ciudadano'}</h2>
            <p class="text">${isImp ? 'No conoces la palabra exacta. Usa la pista y disimula.' : 'Usa esta palabra para dar pistas sin decirla directamente.'}</p>
            <div class="role-box">
              <p class="role-label">${isImp ? 'Pista relacionada' : 'Palabra secreta'}</p>
              <p class="role-word ${isImp ? 'red' : ''}">${escapeHtml(value)}</p>
            </div>
            <button class="primary-btn" type="button" data-next-role>${state.revealIndex + 1 === total ? 'Empezar discusión' : 'Ocultar y pasar'}</button>
          </div>
        `}
      </article>
    </section>
  `;
}

function renderDiscussion() {
  const survivors = alivePlayers().map(player => `
    <li><span>${escapeHtml(player.name)}</span><strong>En juego</strong></li>
  `).join('');

  return `
    ${header(`
      <span class="chip">Ronda ${state.round}</span>
      <span class="chip">${alivePlayers().length} vivos</span>
    `)}
    <section class="view workspace game">
      <div class="discussion-layout">
        <article class="paper discussion-card">
          <p class="kicker">Discusión</p>
          <h2 class="section-title">Hablad sin revelar la palabra.</h2>
          <p class="text">Dad pistas, preguntad y detectad quién no habla con la misma seguridad. Los eliminados ya no votan ni participan.</p>
          <div class="clock" data-clock>${formatTime(state.timerLeft)}</div>
          <div class="timer-actions">
            <button class="small-btn" type="button" data-timer-toggle>${state.timerRunning ? 'Pausar' : 'Iniciar'}</button>
            <button class="small-btn secondary" type="button" data-timer-reset>Reiniciar</button>
          </div>
        </article>

        <aside class="paper vote-card">
          <p class="kicker">Jugadores activos</p>
          <h2 class="section-title">Mesa actual</h2>
          <ul class="survivor-list">${survivors}</ul>
          <div class="action-stack">
            <button class="primary-btn" type="button" data-go-vote>Abrir votación</button>
          </div>
        </aside>
      </div>
    </section>
  `;
}

function renderVote() {
  const options = alivePlayers().map(player => `
    <li>
      <button type="button" data-target="${player.id}" class="${state.selectedTargetId === player.id ? 'selected' : ''}">
        <span>${escapeHtml(player.name)}</span>
        <span class="vote-dot" aria-hidden="true"></span>
      </button>
    </li>
  `).join('');

  return `
    ${header(`<span class="chip">Ronda ${state.round}</span><span class="chip">Votación</span>`)}
    <section class="view center-stage">
      <article class="paper vote-card">
        <p class="kicker">Decisión de la mesa</p>
        <h2 class="section-title">Elegid a quién sacar de la partida.</h2>
        <p class="text">Seleccionad al jugador votado por el grupo. Su papel se revelará y la partida continuará si aún no hay ganador.</p>
        <ul class="vote-list">${options}</ul>
        <div class="action-stack">
          <button class="primary-btn" type="button" data-confirm-elimination ${state.selectedTargetId ? '' : 'disabled'}>Confirmar eliminado</button>
          <button class="secondary-btn" type="button" data-back-discussion>Volver a discutir</button>
        </div>
      </article>
    </section>
  `;
}

function renderResult() {
  const last = state.eliminatedLog[state.eliminatedLog.length - 1];
  const isImp = last?.role === 'impostor';
  const status = getWinStatus();

  return `
    ${header(`<span class="chip">Resultado</span>`)}
    <section class="view center-stage">
      <article class="paper result-card">
        <span class="result-seal stamp">Eliminado</span>
        <h2 class="result-title ${isImp ? 'red' : ''}">${escapeHtml(last.name)} ${isImp ? 'era impostor' : 'era ciudadano'}</h2>
        <p class="text">
          ${status ? status.message : `Quedan ${remainingCitizens()} ciudadanos y ${remainingImpostors()} impostor${remainingImpostors() === 1 ? '' : 'es'}. La partida continúa.`}
        </p>
        <div class="action-stack">
          ${status ? '<button class="primary-btn" type="button" data-show-end>Ver expediente final</button>' : '<button class="primary-btn" type="button" data-continue>Continuar partida</button>'}
          <button class="secondary-btn" type="button" data-end-now>Terminar y revelar</button>
        </div>
      </article>
    </section>
  `;
}

function renderEnd() {
  const impostors = state.players.filter(p => p.role === 'impostor').map(p => p.name).join(', ');
  const log = state.eliminatedLog.length ? state.eliminatedLog.map(item => `
    <li><span>${escapeHtml(item.name)}</span><strong>${item.role === 'impostor' ? 'Impostor' : 'Ciudadano'}</strong></li>
  `).join('') : '<li><span>Nadie fue eliminado</span><strong>—</strong></li>';

  return `
    ${header('<span class="chip">Expediente final</span>')}
    <section class="view center-stage">
      <article class="paper end-card">
        <p class="kicker">Solución</p>
        <h2 class="section-title">Partida cerrada</h2>
        <div class="solution-grid">
          <div class="solution-card"><span>Palabra secreta</span><strong>${escapeHtml(state.pair.word)}</strong></div>
          <div class="solution-card"><span>Pista impostor</span><strong>${escapeHtml(state.pair.clue)}</strong></div>
        </div>
        <p class="text"><strong>Impostores:</strong> ${escapeHtml(impostors)}</p>
        <ul class="log-list">${log}</ul>
        <div class="action-stack">
          <button class="primary-btn" type="button" data-new-game>Misma mesa, nueva partida</button>
          <button class="secondary-btn" type="button" data-setup>Volver a configuración</button>
        </div>
      </article>
    </section>
  `;
}

function bindGlobalActions() {
  document.querySelector('[data-help]')?.addEventListener('click', () => {
    state.error = 'Regla clave: nadie ve palabra ni pista al crear la partida. Solo se revelan en privado y al final.';
    render();
  });
}

function bindSetupActions() {
  document.querySelector('[data-add-player]')?.addEventListener('submit', event => {
    event.preventDefault();
    const input = event.currentTarget.elements.player;
    const name = input.value.trim();
    if (!name) return;
    if (state.players.some(p => p.name.toLowerCase() === name.toLowerCase())) {
      state.error = 'Ese nombre ya está en la mesa.';
      render();
      return;
    }
    if (state.players.length >= 12) {
      state.error = 'Máximo 12 jugadores.';
      render();
      return;
    }
    state.players.push({ id: cryptoId(), name, alive: true });
    state.error = '';
    input.value = '';
    saveSetup();
    render();
  });

  document.querySelectorAll('[data-remove]').forEach(button => {
    button.addEventListener('click', () => {
      state.players = state.players.filter(p => p.id !== button.dataset.remove);
      state.error = '';
      saveSetup();
      render();
    });
  });

  document.querySelectorAll('[data-impostors]').forEach(button => {
    button.addEventListener('click', () => {
      state.impostorCount = Number(button.dataset.impostors);
      state.error = '';
      saveSetup();
      render();
    });
  });

  document.querySelectorAll('[data-category]').forEach(button => {
    button.addEventListener('click', () => {
      state.category = button.dataset.category;
      state.error = '';
      saveSetup();
      render();
    });
  });

  document.querySelector('[data-reset-names]')?.addEventListener('click', () => {
    state.players = [];
    state.error = '';
    saveSetup();
    render();
  });

  document.querySelector('[data-start]')?.addEventListener('click', startGame);
  bindDragList();
}

function bindRevealActions() {
  document.querySelector('[data-open-role]')?.addEventListener('click', () => {
    state.revealOpen = true;
    render();
  });

  document.querySelector('[data-next-role]')?.addEventListener('click', () => {
    state.revealOpen = false;
    const total = alivePlayers().length;
    if (state.revealIndex + 1 >= total) {
      state.stage = 'discussion';
      state.revealIndex = 0;
      state.timerLeft = state.timerSeconds;
    } else {
      state.revealIndex += 1;
    }
    render();
  });
}

function bindDiscussionActions() {
  document.querySelector('[data-go-vote]')?.addEventListener('click', () => {
    state.stage = 'vote';
    state.selectedTargetId = null;
    state.timerRunning = false;
    render();
  });

  document.querySelector('[data-timer-toggle]')?.addEventListener('click', () => {
    state.timerRunning = !state.timerRunning;
    render();
  });

  document.querySelector('[data-timer-reset]')?.addEventListener('click', () => {
    state.timerRunning = false;
    state.timerLeft = state.timerSeconds;
    render();
  });

  if (state.timerRunning) startTimer();
}

function bindVoteActions() {
  document.querySelectorAll('[data-target]').forEach(button => {
    button.addEventListener('click', () => {
      state.selectedTargetId = button.dataset.target;
      render();
    });
  });

  document.querySelector('[data-back-discussion]')?.addEventListener('click', () => {
    state.stage = 'discussion';
    state.selectedTargetId = null;
    render();
  });

  document.querySelector('[data-confirm-elimination]')?.addEventListener('click', () => {
    const target = state.players.find(p => p.id === state.selectedTargetId);
    if (!target) return;
    target.alive = false;
    state.eliminatedLog.push({ id: target.id, name: target.name, role: target.role });
    state.selectedTargetId = null;
    state.stage = 'result';
    render();
  });
}

function bindResultActions() {
  document.querySelector('[data-continue]')?.addEventListener('click', () => {
    state.stage = 'discussion';
    state.round += 1;
    state.timerRunning = false;
    state.timerLeft = state.timerSeconds;
    render();
  });

  document.querySelector('[data-show-end]')?.addEventListener('click', () => {
    state.stage = 'end';
    render();
  });

  document.querySelector('[data-end-now]')?.addEventListener('click', () => {
    state.stage = 'end';
    render();
  });
}

function bindEndActions() {
  document.querySelector('[data-new-game]')?.addEventListener('click', () => {
    resetForNewGame(false);
    startGame();
  });

  document.querySelector('[data-setup]')?.addEventListener('click', () => {
    resetForNewGame(true);
    render();
  });
}

function bindDragList() {
  const list = document.querySelector('[data-player-list]');
  if (!list) return;

  let dragged = null;
  let pointerId = null;

  list.querySelectorAll('.drag-handle').forEach(handle => {
    handle.addEventListener('pointerdown', event => {
      const item = event.currentTarget.closest('.player-item');
      if (!item) return;
      dragged = item;
      pointerId = event.pointerId;
      dragged.classList.add('dragging');
      event.currentTarget.setPointerCapture(pointerId);
      event.preventDefault();
    });

    handle.addEventListener('pointermove', event => {
      if (!dragged || event.pointerId !== pointerId) return;
      const siblings = [...list.querySelectorAll('.player-item:not(.dragging)')];
      const next = siblings.find(item => {
        const rect = item.getBoundingClientRect();
        return event.clientY < rect.top + rect.height / 2;
      });
      if (next) list.insertBefore(dragged, next);
      else list.appendChild(dragged);
    });

    const finish = event => {
      if (!dragged || event.pointerId !== pointerId) return;
      dragged.classList.remove('dragging');
      const order = [...list.querySelectorAll('.player-item')].map(item => item.dataset.id);
      state.players.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
      dragged = null;
      pointerId = null;
      saveSetup();
      render();
    };

    handle.addEventListener('pointerup', finish);
    handle.addEventListener('pointercancel', finish);
  });
}

function startGame() {
  normalizeSettings();

  if (state.players.length < 3) {
    state.error = 'Añade al menos 3 jugadores.';
    render();
    return;
  }

  if (state.impostorCount >= state.players.length) {
    state.error = 'Debe haber más jugadores que impostores.';
    render();
    return;
  }

  const deck = decks[state.category];
  state.pair = pick(deck.pairs).reduce((acc, value, index) => {
    if (index === 0) acc.word = value;
    if (index === 1) acc.clue = value;
    return acc;
  }, {});

  state.players = state.players.map(player => ({ ...player, alive: true, role: 'citizen' }));
  const shuffledIds = shuffle(state.players.map(p => p.id));
  const impostorIds = new Set(shuffledIds.slice(0, state.impostorCount));
  state.players.forEach(player => {
    player.role = impostorIds.has(player.id) ? 'impostor' : 'citizen';
  });

  state.stage = 'reveal';
  state.revealIndex = 0;
  state.revealOpen = false;
  state.selectedTargetId = null;
  state.eliminatedLog = [];
  state.round = 1;
  state.timerRunning = false;
  state.timerLeft = state.timerSeconds;
  state.error = '';
  saveSetup();
  render();
}

function resetForNewGame(goSetup) {
  state.stage = goSetup ? 'setup' : 'setup';
  state.players = state.players.map(player => ({ id: cryptoId(), name: player.name, alive: true }));
  state.pair = null;
  state.revealIndex = 0;
  state.revealOpen = false;
  state.selectedTargetId = null;
  state.eliminatedLog = [];
  state.round = 1;
  state.timerRunning = false;
  state.timerLeft = state.timerSeconds;
  state.error = '';
  saveSetup();
}

function normalizeSettings() {
  const max = maxImpostors();
  if (state.impostorCount > max) state.impostorCount = max;
  if (state.impostorCount < 1) state.impostorCount = 1;
}

function maxImpostors() {
  return Math.max(1, Math.min(3, Math.floor((state.players.length - 1) / 2)));
}

function alivePlayers() {
  return state.players.filter(player => player.alive);
}

function remainingImpostors() {
  return alivePlayers().filter(player => player.role === 'impostor').length;
}

function remainingCitizens() {
  return alivePlayers().filter(player => player.role === 'citizen').length;
}

function getWinStatus() {
  const impostors = remainingImpostors();
  const citizens = remainingCitizens();

  if (impostors === 0) {
    return { winner: 'citizens', message: 'Todos los impostores han quedado fuera. Ganan los ciudadanos.' };
  }

  if (impostors >= citizens) {
    return { winner: 'impostors', message: 'Los impostores ya igualan o superan a los ciudadanos. Ganan los impostores.' };
  }

  return null;
}

function pick(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle(items) {
  const clone = [...items];
  for (let i = clone.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [clone[i], clone[j]] = [clone[j], clone[i]];
  }
  return clone;
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const rest = (seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${rest}`;
}

function startTimer() {
  clearInterval(state.timerId);
  state.timerId = setInterval(() => {
    if (!state.timerRunning) {
      clearInterval(state.timerId);
      return;
    }
    state.timerLeft = Math.max(0, state.timerLeft - 1);
    const clock = document.querySelector('[data-clock]');
    if (clock) clock.textContent = formatTime(state.timerLeft);
    if (state.timerLeft <= 0) {
      state.timerRunning = false;
      clearInterval(state.timerId);
      render();
    }
  }, 1000);
}

function stopTimerIfNeeded() {
  if (state.stage !== 'discussion') {
    state.timerRunning = false;
    clearInterval(state.timerId);
  }
}
