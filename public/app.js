const state = {
  currentUser: null,
  currentPool: null,
  pendingLoginUser: null,
  pools: [],
  users: [],
  groups: [],
  teams: [],
  games: [],
  bets: [],
  ranking: [],
  prizes: null
};

const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

const sessionKey = "bolaocopa.currentUser";
const poolSessionKey = "bolaocopa.currentPool";

const pageLabels = {
  dashboard: {
    title: "Dashboard",
    subtitle: "Resumo geral do BolaoCopa"
  },
  grupos: {
    title: "Grupos",
    subtitle: "Cadastro dos grupos da competicao"
  },
  boloes: {
    title: "Boloes",
    subtitle: "Cadastro e manutencao dos boloes"
  },
  times: {
    title: "Times",
    subtitle: "Cadastro das selecoes e brasoes"
  },
  participantes: {
    title: "Participantes",
    subtitle: "Cadastro e consulta de participantes"
  },
  jogos: {
    title: "Jogos",
    subtitle: "Cadastro e consulta das partidas"
  },
  apostas: {
    title: "Apostas",
    subtitle: "Registro dos palpites por participante"
  },
  resultados: {
    title: "Resultados",
    subtitle: "Lancamento do placar final"
  },
  ranking: {
    title: "Ranking",
    subtitle: "Classificacao geral por pontos"
  },
  premiacao: {
    title: "Premiacao",
    subtitle: "Distribuicao dos premios do bolao"
  }
};

function qs(selector, root = document) {
  return root.querySelector(selector);
}

function toast(message) {
  const el = qs("#toast");
  el.textContent = message;
  el.classList.add("visible");
  window.setTimeout(() => el.classList.remove("visible"), 3200);
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  const body = await response.json();

  if (!response.ok || body.success === false) {
    throw new Error(body.error?.message || "Erro na requisicao.");
  }

  return body.data;
}

function setCurrentUser(user) {
  state.currentUser = user;
  if (user) {
    localStorage.setItem(sessionKey, JSON.stringify(user));
  } else {
    localStorage.removeItem(sessionKey);
  }
}

function setCurrentPool(pool) {
  state.currentPool = pool;
  if (pool) {
    localStorage.setItem(poolSessionKey, JSON.stringify(pool));
  } else {
    localStorage.removeItem(poolSessionKey);
  }
}

function loadCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem(sessionKey));
  } catch {
    return null;
  }
}

function loadCurrentPool() {
  try {
    return JSON.parse(localStorage.getItem(poolSessionKey));
  } catch {
    return null;
  }
}

function renderAuth() {
  const isLogged = Boolean(state.currentUser && state.currentPool);
  document.body.classList.toggle("logged-out", !isLogged);
  qs("#loggedUserName").textContent = isLogged ? state.currentUser.name : "";
  renderPoolSelectors();
}

function renderPoolSelectors() {
  const pools = state.currentUser?.pools || state.pendingLoginUser?.pools || [];
  const activeSelect = qs("#activePoolSelect");
  const loginSelect = qs("#loginPoolSelect");

  if (activeSelect) {
    activeSelect.innerHTML = pools.map(pool => `<option value="${pool.id}">${pool.name}</option>`).join("");
    activeSelect.value = state.currentPool?.id || "";
  }

  if (loginSelect) {
    loginSelect.innerHTML = pools.map(pool => `<option value="${pool.id}">${pool.name}</option>`).join("");
  }
}

function poolQuery(path) {
  if (!state.currentPool?.id) return path;
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}poolId=${encodeURIComponent(state.currentPool.id)}`;
}

function enterPool(user, pool) {
  setCurrentUser(user);
  setCurrentPool(pool);
  state.pendingLoginUser = null;
  qs("#poolChoice").hidden = true;
  renderAuth();
  return refresh();
}

function updateCurrentUserPool(pool) {
  if (!state.currentUser?.pools) return;

  state.currentUser.pools = state.currentUser.pools.map(item => (
    item.id === pool.id ? { id: pool.id, name: pool.name, entryFee: Number(pool.entryFee) } : item
  ));
  setCurrentUser(state.currentUser);
}

function serializeForm(form) {
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());
  form.querySelectorAll("input[type='checkbox']").forEach(input => {
    data[input.name] = input.checked;
  });
  return data;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Nao foi possivel ler o arquivo do brasao."));
    reader.readAsDataURL(file);
  });
}

function toDateTimeInput(value) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function formatDateTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function gameLabel(game) {
  const home = game.homeTeamRef?.name || game.homeTeam;
  const away = game.awayTeamRef?.name || game.awayTeam;
  return `${home} x ${away}`;
}

function resultLabel(game) {
  if (game.status !== "FINISHED") return "Pendente";
  return `${game.homeScore} x ${game.awayScore}`;
}

function fillSelect(select, items, labelFn) {
  select.innerHTML = "";
  items.forEach(item => {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = labelFn(item);
    select.appendChild(option);
  });
}

const icons = {
  edit: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4l10.5-10.5-4-4L4 16v4z"></path><path d="M13.5 6.5l4 4"></path></svg>`,
  trash: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M6 7l1 14h10l1-14"></path><path d="M9 7V4h6v3"></path></svg>`
};

function actionButton(kind, dataAttr, id, title) {
  return `<button class="icon-action ${kind === "trash" ? "danger" : ""}" type="button" ${dataAttr}="${id}" title="${title}" aria-label="${title}">${icons[kind]}</button>`;
}

function crestHtml(team) {
  return team?.crestUrl
    ? `<img src="${team.crestUrl}" alt="Brasao ${team.name}">`
    : `<span class="crest-placeholder">-</span>`;
}

function teamCell(team, fallbackName) {
  const name = team?.name || fallbackName || "-";
  return `
    <div class="match-team">
      ${team ? crestHtml(team) : `<span class="crest-placeholder">-</span>`}
      <span>${name}</span>
    </div>
  `;
}

function renderTeamPicker(picker, selectedId = "") {
  const fieldName = picker.dataset.teamPicker;
  const hidden = qs(`#matchForm input[name="${fieldName}"]`);
  const selected = state.teams.find(team => team.id === selectedId);

  picker.innerHTML = `
    <button class="team-picker-button" type="button" data-toggle-team-picker="${fieldName}">
      <span class="team-picker-selected">
        ${selected ? crestHtml(selected) : ""}
        <span>${selected ? selected.name : "Selecione um time"}</span>
      </span>
      <span>v</span>
    </button>
    <div class="team-picker-menu" hidden>
      ${state.teams.map(team => `
        <button class="team-option" type="button" data-select-team="${fieldName}" data-team-id="${team.id}">
          ${crestHtml(team)}
          <span>${team.name}</span>
        </button>
      `).join("")}
    </div>
  `;

  hidden.value = selectedId;
}

function renderTeamPickers(homeTeamId = "", awayTeamId = "") {
  renderTeamPicker(qs("#homeTeamPicker"), homeTeamId);
  renderTeamPicker(qs("#awayTeamPicker"), awayTeamId);
}

function renderUsers() {
  const table = qs("#participantsTable");
  if (!state.users.length) {
    table.innerHTML = `<tr><td class="empty" colspan="5">Nenhum participante cadastrado.</td></tr>`;
    return;
  }

  table.innerHTML = state.users.map(user => `
    <tr>
      <td>${user.name}</td>
      <td>${user.email || "-"}</td>
      <td>${money.format(Number(user.entryFee || 0))}</td>
      <td>
        <div class="row-actions">
          ${actionButton("edit", "data-edit-user", user.id, "Alterar")}
          ${actionButton("trash", "data-delete-user", user.id, "Excluir")}
        </div>
      </td>
    </tr>
  `).join("");
}

function renderGroups() {
  const table = qs("#groupsTable");
  if (!state.groups.length) {
    table.innerHTML = `<tr><td class="empty" colspan="2">Nenhum grupo cadastrado.</td></tr>`;
    return;
  }

  table.innerHTML = state.groups.map(group => `
    <tr>
      <td>${group.name}</td>
      <td>
        <div class="row-actions">
          ${actionButton("edit", "data-edit-group", group.id, "Alterar")}
          ${actionButton("trash", "data-delete-group", group.id, "Excluir")}
        </div>
      </td>
    </tr>
  `).join("");
}

function renderPools() {
  const table = qs("#poolsTable");
  if (!state.pools.length) {
    table.innerHTML = `<tr><td class="empty" colspan="3">Nenhum bolao cadastrado.</td></tr>`;
    return;
  }

  table.innerHTML = state.pools.map(pool => `
    <tr>
      <td>${pool.name}</td>
      <td>${money.format(Number(pool.entryFee || 0))}</td>
      <td>
        <div class="row-actions">
          ${actionButton("edit", "data-edit-pool", pool.id, "Alterar")}
          ${actionButton("trash", "data-delete-pool", pool.id, "Excluir")}
        </div>
      </td>
    </tr>
  `).join("");
}

function renderTeams() {
  const table = qs("#teamsTable");
  if (!state.teams.length) {
    table.innerHTML = `<tr><td class="empty" colspan="4">Nenhum time cadastrado.</td></tr>`;
    return;
  }

  table.innerHTML = state.teams.map(team => `
    <tr>
      <td>
        ${team.crestUrl ? `<img class="team-crest" src="${team.crestUrl}" alt="Brasao ${team.name}">` : `<span class="crest-placeholder">-</span>`}
      </td>
      <td>${team.name}</td>
      <td>
        <div class="row-actions">
          ${actionButton("edit", "data-edit-team", team.id, "Alterar")}
          ${actionButton("trash", "data-delete-team", team.id, "Excluir")}
        </div>
      </td>
    </tr>
  `).join("");
}

function renderDashboard() {
  const finishedGames = state.games.filter(game => game.status === "FINISHED").length;
  qs("#metricUsers").textContent = state.users.length;
  qs("#metricTeams").textContent = state.teams.length;
  qs("#metricGroups").textContent = state.groups.length;
  qs("#metricGames").textContent = state.games.length;
  qs("#metricFinished").textContent = finishedGames;
  qs("#metricCollected").textContent = money.format(state.prizes?.totalCollected || 0);

  const rankingTable = qs("#dashboardRankingTable");
  const topRanking = state.ranking.slice(0, 5);
  rankingTable.innerHTML = topRanking.length
    ? topRanking.map(item => `
      <tr>
        <td>${item.position}</td>
        <td>${item.name}</td>
        <td class="score">${item.totalPoints}</td>
      </tr>
    `).join("")
    : `<tr><td class="empty" colspan="3">Ranking vazio.</td></tr>`;

  const gamesTable = qs("#dashboardGamesTable");
  const nextGames = state.games
    .filter(game => game.status !== "FINISHED")
    .slice(0, 5);
  gamesTable.innerHTML = nextGames.length
    ? nextGames.map(game => `
      <tr>
        <td>${formatDateTime(game.gameDate)}</td>
        <td>${game.stadiumName || "-"}</td>
        <td>${game.group?.name || "-"}</td>
        <td>${gameLabel(game)}</td>
      </tr>
    `).join("")
    : `<tr><td class="empty" colspan="3">Nenhum jogo pendente.</td></tr>`;
}

function renderGames() {
  const table = qs("#matchesTable");
  if (!state.games.length) {
    table.innerHTML = `<tr><td class="empty" colspan="7">Nenhum jogo cadastrado.</td></tr>`;
    return;
  }

  table.innerHTML = state.games.map(game => `
    <tr>
      <td>${formatDateTime(game.gameDate)}</td>
      <td>${game.stadiumName || "-"}</td>
      <td>${game.group?.name || "-"}</td>
      <td>${teamCell(game.homeTeamRef, game.homeTeam)}</td>
      <td class="score">${resultLabel(game)}</td>
      <td>${teamCell(game.awayTeamRef, game.awayTeam)}</td>
      <td>
        <div class="row-actions">
          ${actionButton("edit", "data-edit-game", game.id, "Alterar")}
          ${actionButton("trash", "data-delete-game", game.id, "Excluir")}
        </div>
      </td>
    </tr>
  `).join("");
}

function renderBets() {
  const table = qs("#betsTable");
  if (!state.bets.length) {
    table.innerHTML = `<tr><td class="empty" colspan="10">Nenhuma aposta cadastrada.</td></tr>`;
    return;
  }

  table.innerHTML = state.bets.map(bet => `
    <tr>
      <td>${formatDateTime(bet.game?.gameDate)}</td>
      <td>${bet.game?.stadiumName || "-"}</td>
      <td>${bet.game?.group?.name || "-"}</td>
      <td>${teamCell(bet.game?.homeTeamRef, bet.game?.homeTeam)}</td>
      <td class="score">${bet.homeScore} x ${bet.awayScore}</td>
      <td>${teamCell(bet.game?.awayTeamRef, bet.game?.awayTeam)}</td>
      <td>${bet.user?.name || "-"}</td>
      <td>${bet.points}</td>
      <td>${formatDateTime(bet.updatedAt || bet.createdAt)}</td>
      <td>
        <div class="row-actions">
          ${actionButton("edit", "data-edit-bet", bet.id, "Alterar")}
          ${actionButton("trash", "data-delete-bet", bet.id, "Excluir")}
        </div>
      </td>
    </tr>
  `).join("");
}

function renderResults() {
  const table = qs("#resultsTable");
  if (!state.games.length) {
    table.innerHTML = `<tr><td class="empty" colspan="7">Nenhum jogo cadastrado.</td></tr>`;
    return;
  }

  table.innerHTML = state.games.map(game => `
    <tr>
      <td>${formatDateTime(game.gameDate)}</td>
      <td>${game.stadiumName || "-"}</td>
      <td>${game.group?.name || "-"}</td>
      <td>${teamCell(game.homeTeamRef, game.homeTeam)}</td>
      <td class="score">${resultLabel(game)}</td>
      <td>${teamCell(game.awayTeamRef, game.awayTeam)}</td>
      <td>
        <div class="row-actions">
          ${actionButton("edit", "data-edit-result", game.id, "Alterar")}
        </div>
      </td>
    </tr>
  `).join("");
}

function renderRanking() {
  const table = qs("#rankingTable");
  if (!state.ranking.length) {
    table.innerHTML = `<tr><td class="empty" colspan="3">Ranking vazio.</td></tr>`;
    return;
  }

  table.innerHTML = state.ranking.map(item => `
    <tr>
      <td>${item.position}</td>
      <td>${item.name}</td>
      <td class="score">${item.totalPoints}</td>
    </tr>
  `).join("");
}

function renderPrizes() {
  const panel = qs("#prizesPanel");
  const prizes = state.prizes;

  if (!prizes) {
    panel.innerHTML = "";
    return;
  }

  const prizeRows = prizes.prizes.length
    ? prizes.prizes.map(prize => `
      <tr>
        <td>${prize.position} lugar</td>
        <td>${prize.name}</td>
        <td class="score">${money.format(prize.amount)}</td>
      </tr>
    `).join("")
    : `<tr><td class="empty" colspan="3">Sem premiacao calculada.</td></tr>`;

  panel.innerHTML = `
    <div class="prize-summary">
      <strong>Total arrecadado:</strong> ${money.format(prizes.totalCollected || 0)}
      <br>
      <span>${prizes.rule}</span>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Posicao</th><th>Participante</th><th>Premio</th></tr></thead>
        <tbody>${prizeRows}</tbody>
      </table>
    </div>
  `;
}

function renderSelects() {
  document.querySelectorAll("select[name='participantId']").forEach(select => {
    const current = select.value;
    fillSelect(select, state.users, user => user.name);
    select.value = current;
  });

  document.querySelectorAll("select[name='matchId']").forEach(select => {
    const current = select.value;
    fillSelect(select, state.games, gameLabel);
    select.value = current;
  });

  document.querySelectorAll("select[name='groupId']").forEach(select => {
    const current = select.value;
    fillSelect(select, state.groups, group => group.name);
    select.value = current;
  });
}

function renderAll() {
  renderDashboard();
  renderPools();
  renderGroups();
  renderTeams();
  renderUsers();
  renderGames();
  renderBets();
  renderResults();
  renderRanking();
  renderPrizes();
  renderSelects();
}

function showSection(sectionId) {
  const nextSection = qs(`#${sectionId}`);
  if (!nextSection) return;

  document.querySelectorAll(".page-section").forEach(section => {
    section.classList.toggle("active", section.id === sectionId);
  });

  document.querySelectorAll(".nav-item").forEach(item => {
    item.classList.toggle("active", item.dataset.section === sectionId);
  });

  const label = pageLabels[sectionId] || pageLabels.dashboard;
  qs("#pageTitle").textContent = label.title;
  qs("#pageSubtitle").textContent = label.subtitle;

  if (window.innerWidth <= 980) {
    document.body.classList.remove("sidebar-open");
  }
}

async function loadBetsForSelectedUser() {
  const select = qs("#betForm select[name='participantId']");
  if (!select.value) {
    state.bets = [];
    renderBets();
    return;
  }
  state.bets = await api(poolQuery(`/bets/user/${select.value}`));
  renderBets();
}

async function refresh() {
  if (!state.currentUser || !state.currentPool) return;

  const [pools, users, groups, teams, games, bets, ranking, prizes] = await Promise.all([
    api("/pools"),
    api(poolQuery("/users")),
    api("/groups"),
    api("/teams"),
    api("/games"),
    api(poolQuery("/bets")),
    api(poolQuery("/ranking")),
    api(poolQuery("/prizes"))
  ]);

  Object.assign(state, { pools, users, groups, teams, games, bets, ranking, prizes });
  renderAll();
}

function bindForm(selector, handler) {
  qs(selector).addEventListener("submit", async event => {
    event.preventDefault();
    const form = event.currentTarget;
    try {
      await handler(serializeForm(form));
      form.reset();
      await refresh();
    } catch (error) {
      toast(error.message);
    }
  });
}

bindForm("#participantForm", data => {
  const isEdit = Boolean(data.id);
  return api(isEdit ? `/users/${data.id}` : "/users", {
    method: isEdit ? "PUT" : "POST",
    body: JSON.stringify({
      name: data.name,
      email: data.email,
      entryFee: data.entryFee,
      poolId: state.currentPool.id
    })
  }).then(() => {
    closeModal();
    toast(isEdit ? "Participante alterado." : "Participante cadastrado.");
  });
});

bindForm("#poolForm", data => {
  const isEdit = Boolean(data.id);
  return api(isEdit ? `/pools/${data.id}` : "/pools", {
    method: isEdit ? "PUT" : "POST",
    body: JSON.stringify({
      name: data.name,
      entryFee: data.entryFee
    })
  }).then(async pool => {
    if (isEdit && state.currentPool?.id === pool.id) {
      updateCurrentUserPool(pool);
      setCurrentPool({ id: pool.id, name: pool.name, entryFee: Number(pool.entryFee) });
    }
    closeModal();
    toast(isEdit ? "Bolao alterado." : "Bolao cadastrado.");
  });
});

bindForm("#groupForm", data => {
  const isEdit = Boolean(data.id);
  return api(isEdit ? `/groups/${data.id}` : "/groups", {
    method: isEdit ? "PUT" : "POST",
    body: JSON.stringify({ name: data.name })
  }).then(() => {
    closeModal();
    toast(isEdit ? "Grupo alterado." : "Grupo cadastrado.");
  });
});

bindForm("#teamForm", data => {
  const isEdit = Boolean(data.id);
  const form = qs("#teamForm");
  const file = form.elements.crestFile.files[0];
  const saveTeam = crestUrl => api(isEdit ? `/teams/${data.id}` : "/teams", {
    method: isEdit ? "PUT" : "POST",
    body: JSON.stringify({
      name: data.name,
      crestUrl
    })
  });

  const request = file ? fileToDataUrl(file).then(saveTeam) : saveTeam(data.crestUrl);

  return request.then(() => {
    closeModal();
    toast(isEdit ? "Time alterado." : "Time cadastrado.");
  });
});

bindForm("#matchForm", data => {
  const isEdit = Boolean(data.id);
  return api(isEdit ? `/games/${data.id}` : "/games", {
    method: isEdit ? "PUT" : "POST",
    body: JSON.stringify({
      homeTeamId: data.homeTeamId,
      awayTeamId: data.awayTeamId,
      groupId: data.groupId,
      stadiumName: data.stadiumName,
      gameDate: data.matchDate
    })
  }).then(() => {
    closeModal();
    toast(isEdit ? "Jogo alterado." : "Jogo cadastrado.");
  });
});

bindForm("#betForm", data => {
  const isEdit = Boolean(data.id);
  return api(isEdit ? `/bets/${data.id}` : "/bets", {
    method: isEdit ? "PUT" : "POST",
    body: JSON.stringify({
      poolId: state.currentPool.id,
      userId: data.participantId,
      gameId: data.matchId,
      homeScore: data.homeScore,
      awayScore: data.awayScore
    })
  }).then(() => {
    closeModal();
    toast(isEdit ? "Aposta alterada." : "Aposta salva.");
  });
});

bindForm("#resultForm", data => {
  return api(`/games/${data.matchId}/result`, {
    method: "PUT",
    body: JSON.stringify({
      homeScore: data.homeScore,
      awayScore: data.awayScore
    })
  }).then(() => {
    closeModal();
    toast("Resultado oficial salvo.");
  });
});

bindForm("#passwordForm", data => {
  if (data.password !== data.confirmPassword) {
    throw new Error("A confirmacao da senha nao confere.");
  }

  return api("/auth/password", {
    method: "PUT",
    body: JSON.stringify({
      userId: state.currentUser.id,
      password: data.password
    })
  }).then(() => {
    closeModal();
    toast("Senha alterada.");
  });
});

qs("#betForm select[name='participantId']").addEventListener("change", () => {
  loadBetsForSelectedUser().catch(error => toast(error.message));
});

qs("#sidebarToggle").addEventListener("click", () => {
  document.body.classList.toggle("sidebar-open");
});

document.querySelectorAll(".nav-item").forEach(item => {
  item.addEventListener("click", () => showSection(item.dataset.section));
});

qs("#loginForm").addEventListener("submit", async event => {
  event.preventDefault();
  const data = serializeForm(event.currentTarget);
  try {
    const user = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: data.email, password: data.password })
    });
    const pools = user.pools || [];
    if (!pools.length) {
      throw new Error("Participante nao esta vinculado a nenhum bolao.");
    }

    if (pools.length === 1) {
      await enterPool(user, pools[0]);
      return;
    }

    state.pendingLoginUser = user;
    qs("#poolChoice").hidden = false;
    renderPoolSelectors();
  } catch (error) {
    toast(error.message);
  }
});

qs("#continuePoolButton").addEventListener("click", async () => {
  const user = state.pendingLoginUser;
  const poolId = qs("#loginPoolSelect").value;
  const pool = user?.pools?.find(item => item.id === poolId);
  if (!user || !pool) return;

  try {
    await enterPool(user, pool);
  } catch (error) {
    toast(error.message);
  }
});

qs("#activePoolSelect").addEventListener("change", async event => {
  const pool = state.currentUser?.pools?.find(item => item.id === event.target.value);
  if (!pool) return;

  try {
    setCurrentPool(pool);
    renderAuth();
    await refresh();
    toast(`Bolao ativo: ${pool.name}`);
  } catch (error) {
    toast(error.message);
  }
});

qs("#logoutButton").addEventListener("click", () => {
  setCurrentUser(null);
  setCurrentPool(null);
  renderAuth();
});

qs("#changePasswordButton").addEventListener("click", () => {
  openModal("password");
});

const modalTitles = {
  pool: "Bolao",
  group: "Grupo",
  team: "Time",
  participant: "Participante",
  game: "Jogo",
  bet: "Aposta",
  result: "Placar Final",
  password: "Trocar senha"
};

function closeModal() {
  document.querySelectorAll(".modal-backdrop").forEach(backdrop => {
    backdrop.hidden = true;
  });
}

function openModal(type, mode = "create", item = null) {
  closeModal();
  const backdrop = qs(`#${type}Modal`);
  const form = qs(`[data-modal-form="${type}"]`);
  if (!form) return;

  form.reset();

  if (form.elements.id) {
    form.elements.id.value = item?.id || "";
  }
  qs(`[data-modal-title="${type}"]`).textContent = type === "result"
    ? modalTitles[type]
    : `${mode === "edit" ? "Alterar" : "Incluir"} ${modalTitles[type]}`;

  if (type === "participant" && item) {
    form.elements.name.value = item.name || "";
    form.elements.email.value = item.email || "";
    form.elements.entryFee.value = Number(item.entryFee || 0);
  }

  if (type === "participant" && !item) {
    form.elements.entryFee.value = state.currentPool?.entryFee ?? 50;
  }

  if (type === "pool" && item) {
    form.elements.name.value = item.name || "";
    form.elements.entryFee.value = Number(item.entryFee || 0);
  }

  if (type === "pool" && !item) {
    form.elements.entryFee.value = 50;
  }

  if (type === "group" && item) {
    form.elements.name.value = item.name || "";
  }

  if (type === "team" && item) {
    form.elements.name.value = item.name || "";
    form.elements.crestUrl.value = item.crestUrl || "";
    qs("#teamCrestPreview").innerHTML = item.crestUrl ? `<img src="${item.crestUrl}" alt="Brasao ${item.name}">` : "";
  }

  if (type === "team" && !item) {
    qs("#teamCrestPreview").innerHTML = "";
  }

  if (type === "game" && item) {
    renderTeamPickers(item.homeTeamId || "", item.awayTeamId || "");
    form.elements.groupId.value = item.groupId || "";
    form.elements.stadiumName.value = item.stadiumName || "";
    form.elements.matchDate.value = toDateTimeInput(item.gameDate);
  }

  if (type === "game" && !item) {
    renderTeamPickers();
  }

  if (type === "bet" && item) {
    form.elements.participantId.value = item.userId || "";
    form.elements.matchId.value = item.gameId || "";
    form.elements.homeScore.value = item.homeScore;
    form.elements.awayScore.value = item.awayScore;
  }

  if (type === "result" && item) {
    form.elements.matchId.value = item.id || "";
    form.elements.matchLabel.value = gameLabel(item);
    form.elements.homeScore.value = item.homeScore ?? "";
    form.elements.awayScore.value = item.awayScore ?? "";
  }

  backdrop.hidden = false;
}

document.querySelectorAll("[data-open-modal]").forEach(button => {
  button.addEventListener("click", () => openModal(button.dataset.openModal));
});

qs("#teamForm input[name='crestFile']").addEventListener("change", async event => {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const dataUrl = await fileToDataUrl(file);
    qs("#teamCrestPreview").innerHTML = `<img src="${dataUrl}" alt="Previa do brasao">`;
  } catch (error) {
    toast(error.message);
  }
});

document.querySelectorAll("[data-close-modal]").forEach(button => {
  button.addEventListener("click", closeModal);
});

document.querySelectorAll(".modal-backdrop").forEach(backdrop => {
  backdrop.addEventListener("click", event => {
    if (event.target === backdrop) closeModal();
  });
});

document.addEventListener("click", async event => {
  const togglePicker = event.target.closest("[data-toggle-team-picker]");
  const selectTeam = event.target.closest("[data-select-team]");
  const poolButton = event.target.closest("[data-edit-pool]");
  const deletePoolButton = event.target.closest("[data-delete-pool]");
  const userButton = event.target.closest("[data-edit-user]");
  const deleteUserButton = event.target.closest("[data-delete-user]");
  const groupButton = event.target.closest("[data-edit-group]");
  const deleteGroupButton = event.target.closest("[data-delete-group]");
  const teamButton = event.target.closest("[data-edit-team]");
  const deleteTeamButton = event.target.closest("[data-delete-team]");
  const gameButton = event.target.closest("[data-edit-game]");
  const deleteGameButton = event.target.closest("[data-delete-game]");
  const betButton = event.target.closest("[data-edit-bet]");
  const deleteBetButton = event.target.closest("[data-delete-bet]");
  const resultButton = event.target.closest("[data-edit-result]");

  try {
    if (togglePicker) {
      const picker = togglePicker.closest(".team-picker");
      const menu = picker.querySelector(".team-picker-menu");
      document.querySelectorAll(".team-picker-menu").forEach(item => {
        if (item !== menu) item.hidden = true;
      });
      menu.hidden = !menu.hidden;
      return;
    }

    if (selectTeam) {
      const fieldName = selectTeam.dataset.selectTeam;
      const teamId = selectTeam.dataset.teamId;
      const form = qs("#matchForm");
      const otherField = fieldName === "homeTeamId" ? "awayTeamId" : "homeTeamId";

      if (form.elements[otherField].value === teamId) {
        toast("Mandante e visitante nao podem ser o mesmo time.");
        return;
      }

      form.elements[fieldName].value = teamId;
      renderTeamPickers(form.elements.homeTeamId.value, form.elements.awayTeamId.value);
      return;
    }

    if (poolButton) {
      openModal("pool", "edit", state.pools.find(pool => pool.id === poolButton.dataset.editPool));
    }

    if (userButton) {
      openModal("participant", "edit", state.users.find(user => user.id === userButton.dataset.editUser));
    }

    if (groupButton) {
      openModal("group", "edit", state.groups.find(group => group.id === groupButton.dataset.editGroup));
    }

    if (teamButton) {
      openModal("team", "edit", state.teams.find(team => team.id === teamButton.dataset.editTeam));
    }

    if (gameButton) {
      openModal("game", "edit", state.games.find(game => game.id === gameButton.dataset.editGame));
    }

    if (betButton) {
      openModal("bet", "edit", state.bets.find(bet => bet.id === betButton.dataset.editBet));
    }

    if (resultButton) {
      openModal("result", "edit", state.games.find(game => game.id === resultButton.dataset.editResult));
    }

    if (deletePoolButton && window.confirm("Excluir este bolao? A exclusao so sera permitida se nao houver dados vinculados.")) {
      const deletePoolId = deletePoolButton.dataset.deletePool;
      await api(`/pools/${deletePoolId}`, { method: "DELETE" });
      if (state.currentPool?.id === deletePoolId) {
        setCurrentPool(null);
      }
      toast("Bolao excluido.");
      await refresh();
    }

    if (deleteUserButton && window.confirm("Excluir este participante e suas apostas?")) {
      const deleteUserId = deleteUserButton.dataset.deleteUser;
      await api(poolQuery(`/users/${deleteUserId}`), { method: "DELETE" });
      toast("Participante excluido.");
      await refresh();
    }

    if (deleteGroupButton && window.confirm("Excluir este grupo? Os jogos vinculados ficarao sem grupo.")) {
      const deleteGroupId = deleteGroupButton.dataset.deleteGroup;
      await api(`/groups/${deleteGroupId}`, { method: "DELETE" });
      toast("Grupo excluido.");
      await refresh();
    }

    if (deleteTeamButton && window.confirm("Excluir este time?")) {
      const deleteTeamId = deleteTeamButton.dataset.deleteTeam;
      await api(`/teams/${deleteTeamId}`, { method: "DELETE" });
      toast("Time excluido.");
      await refresh();
    }

    if (deleteGameButton && window.confirm("Excluir este jogo e as apostas vinculadas?")) {
      const deleteGameId = deleteGameButton.dataset.deleteGame;
      await api(`/games/${deleteGameId}`, { method: "DELETE" });
      toast("Jogo excluido.");
      await refresh();
    }

    if (deleteBetButton && window.confirm("Excluir esta aposta?")) {
      const deleteBetId = deleteBetButton.dataset.deleteBet;
      await api(`/bets/${deleteBetId}`, { method: "DELETE" });
      toast("Aposta excluida.");
      await refresh();
    }
  } catch (error) {
    toast(error.message);
  }
});

state.currentUser = loadCurrentUser();
state.currentPool = loadCurrentPool();
if (state.currentUser && state.currentPool) {
  const stillAllowed = state.currentUser.pools?.some(pool => pool.id === state.currentPool.id);
  if (!stillAllowed) setCurrentPool(null);
}
renderAuth();
refresh().catch(error => toast(error.message));
