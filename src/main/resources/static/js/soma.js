/* SOMA frontend core: session, API client, app shell, health rules and body map.
   Plain JavaScript, no build step. Every page loads this file first. */
(function () {
  "use strict";

  const TOKEN_KEY = "soma.token";
  const USER_KEY = "soma.usuario";

  // ---------------------------------------------------------------- session
  function storage() {
    try { return window.sessionStorage; } catch (e) { return null; }
  }
  function getToken() {
    const s = storage();
    return s ? s.getItem(TOKEN_KEY) : null;
  }
  function getUser() {
    const s = storage();
    if (!s) return null;
    try { return JSON.parse(s.getItem(USER_KEY) || "null"); } catch (e) { return null; }
  }
  function saveSession(token, usuario) {
    const s = storage();
    if (!s) return;
    s.setItem(TOKEN_KEY, token);
    s.setItem(USER_KEY, JSON.stringify(usuario));
  }
  function clearSession() {
    const s = storage();
    if (!s) return;
    s.removeItem(TOKEN_KEY);
    s.removeItem(USER_KEY);
  }
  function logout() {
    clearSession();
    window.location.href = "index.html";
  }
  function isStaff(user) {
    return !!user && (user.rol === "MEDICO" || user.rol === "ADMIN");
  }
  function homeFor(user) {
    return isStaff(user) ? "crew.html" : "status.html";
  }

  /** Redirects to the login page when there is no session. Returns the user. */
  function requireAuth(options) {
    const user = getUser();
    if (!getToken() || !user) {
      window.location.href = "index.html";
      throw new Error("No session");
    }
    if (options && options.adminOnly && user.rol !== "ADMIN") {
      window.location.href = homeFor(user);
      throw new Error("Admin only");
    }
    if (options && options.staffOnly && !isStaff(user)) {
      window.location.href = homeFor(user);
      throw new Error("Staff only");
    }
    return user;
  }

  // ---------------------------------------------------------------- API
  class ApiError extends Error {
    constructor(status, message, details) {
      super(message);
      this.status = status;
      this.details = details || [];
    }
  }

  async function api(path, options) {
    const opts = options || {};
    const headers = { Accept: "application/json" };
    const token = getToken();
    if (token) headers.Authorization = "Bearer " + token;
    let body;
    if (opts.body !== undefined) {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(opts.body);
    }
    let res;
    try {
      res = await fetch(path, { method: opts.method || "GET", headers, body });
    } catch (e) {
      throw new ApiError(0, "Cannot reach the SOMA server. Check that the backend is running.");
    }
    if (res.status === 401 && !opts.allow401) {
      clearSession();
      window.location.href = "index.html?expired=1";
      throw new ApiError(401, "Your session expired. Sign in again.");
    }
    if (res.status === 204) return null;
    let data = null;
    const text = await res.text();
    if (text) {
      try { data = JSON.parse(text); } catch (e) { data = null; }
    }
    if (!res.ok) {
      const msg = (data && (data.mensaje || data.message)) || ("Request failed (" + res.status + ")");
      throw new ApiError(res.status, msg, data && data.detalles);
    }
    return data;
  }

  // ---------------------------------------------------------------- formatting
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  function esc(value) {
    return String(value === undefined || value === null ? "" : value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  /** Accepts ISO strings, epoch seconds/millis or [y,m,d,h,mi,s] arrays. */
  function toDate(value) {
    if (value === null || value === undefined || value === "") return null;
    if (value instanceof Date) return value;
    if (Array.isArray(value)) {
      const [y, m, d, h, mi, s] = value;
      return new Date(Date.UTC(y, (m || 1) - 1, d || 1, h || 0, mi || 0, s || 0));
    }
    if (typeof value === "number") return new Date(value < 1e12 ? value * 1000 : value);
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date(value + "T12:00:00Z");
    const d = new Date(value);
    return isNaN(d) ? null : d;
  }
  function fmtDate(value) {
    const d = toDate(value);
    return d ? MONTHS[d.getMonth()] + " " + d.getDate() : "—";
  }
  function fmtDateTime(value) {
    const d = toDate(value);
    if (!d) return "—";
    return fmtDate(d) + ", " + String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  }
  function fmtNum(value, decimals) {
    if (value === null || value === undefined || isNaN(value)) return "—";
    return Number(value).toFixed(decimals || 0);
  }
  function isoDay(date) {
    const d = date || new Date();
    return d.toISOString().slice(0, 10);
  }
  function firstName(nombre) {
    return String(nombre || "").replace(/^(Dra?\.|Dr\.)\s+/i, "").split(" ")[0] || "there";
  }
  function initials(nombre) {
    return String(nombre || "?").replace(/^(Dra?\.|Dr\.)\s+/i, "").split(/\s+/).slice(0, 2).map(w => w[0] || "").join("").toUpperCase();
  }

  const CARGOS = { COMANDANTE: "Commander", PILOTO: "Pilot", INGENIERO_VUELO: "Flight Engineer", ESPECIALISTA: "Mission Specialist", OFICIAL_MEDICO: "Crew Medical Officer" };
  const ROLES = { TRIPULANTE: "Crew member", MEDICO: "Crew medical officer", ADMIN: "Administrator" };
  const ALERT_STATES = { ACTIVA: "Active", RECONOCIDA: "Acknowledged", RESUELTA: "Resolved" };
  const ALERT_AREAS = {
    CARDIOLOGIA: "Heart", PSICOLOGIA: "Mind", RADIACION: "Radiation", DEPORTIVA: "Exercise",
    HEMATOLOGIA: "Blood", SUENO: "Sleep", SIGNOS_VITALES: "Vital signs", METABOLISMO: "Metabolism"
  };
  const SEVERITY_LEVEL = { CRITICA: "crit", PRECAUCION: "warn", INFO: "ok" };
  const SEVERITY_NAME = { CRITICA: "Critical", PRECAUCION: "Caution", INFO: "Info" };
  const LEVEL_NAME = { crit: "Critical", warn: "Caution", ok: "Normal", none: "No data" };
  const LEVEL_RANK = { none: 0, ok: 1, warn: 2, crit: 3 };

  // The backend writes alert messages in Spanish; the interface shows them in English.
  const ALERT_TRANSLATIONS = [
    [/^FC promedio (\S+) bpm supera el m[aá]ximo de (\S+)$/, "Average heart rate $1 bpm is above the $2 bpm limit"],
    [/^Presi[oó]n sist[oó]lica (\S+) supera el m[aá]ximo de (\S+)$/, "Systolic pressure $1 mmHg is above the $2 limit"],
    [/^Solo (\S+) h de sue[nñ]o \(m[ií]nimo (\S+)\)$/, "Only $1 h of sleep (minimum $2 h)"],
    [/^Nivel de estr[eé]s muy alto: (\S+)$/, "Very high stress level: $1"],
    [/^Radiaci[oó]n acumulada (\S+) mSv alcanz[oó] el l[ií]mite de (\S+)$/, "Accumulated radiation $1 mSv reached the $2 mSv limit"],
    [/^Radiaci[oó]n acumulada al (\S+)% del l[ií]mite$/, "Accumulated radiation is at $1% of the limit"],
    [/^Cardio por debajo de lo recomendado: (\S+) min$/, "Cardio below the recommended amount: $1 min"],
    [/^Hemoglobina muy baja: (\S+) g\/dL$/, "Very low hemoglobin: $1 g/dL"],
    [/^Hemoglobina baja: (\S+) g\/dL$/, "Low hemoglobin: $1 g/dL"],
    [/^Cortisol elevado: (\S+) nmol\/L$/, "High cortisol: $1 nmol/L"],
    [/^Saturaci[oó]n de ox[ií]geno muy baja: (\S+) % \(cr[ií]tico por debajo de (\S+) %\)$/, "Very low oxygen saturation: $1 % (critical below $2 %)"],
    [/^Saturaci[oó]n de ox[ií]geno baja: (\S+) % \(m[ií]nimo (\S+) %\)$/, "Low oxygen saturation: $1 % (minimum $2 %)"],
    [/^Fiebre alta: (\S+) °C$/, "High fever: $1 °C"],
    [/^Temperatura elevada: (\S+) °C \(m[aá]ximo (\S+) °C\)$/, "Elevated temperature: $1 °C (maximum $2 °C)"],
    [/^Temperatura corporal muy baja: (\S+) °C$/, "Very low body temperature: $1 °C"],
    [/^Glucosa muy baja: (\S+) mg\/dL$/, "Very low blood glucose: $1 mg/dL"],
    [/^Glucosa muy alta: (\S+) mg\/dL$/, "Very high blood glucose: $1 mg/dL"],
    [/^Glucosa baja: (\S+) mg\/dL \(m[ií]nimo (\S+)\)$/, "Low blood glucose: $1 mg/dL (minimum $2)"],
    [/^Glucosa alta: (\S+) mg\/dL \(m[aá]ximo (\S+)\)$/, "High blood glucose: $1 mg/dL (maximum $2)"],
    [/^Estado de [aá]nimo muy bajo: (\S+)$/, "Very low mood: $1"],
    [/^Estado de [aá]nimo bajo: (\S+)$/, "Low mood: $1"]
  ];
  function alertText(mensaje) {
    const text = String(mensaje || "");
    for (const [re, en] of ALERT_TRANSLATIONS) if (re.test(text)) return text.replace(re, en);
    return text;
  }
  // Activity names created by the backend seeder
  const ACTIVITY_NAMES = {
    "Cardio en cinta": "Treadmill cardio", "Entrenamiento ARED": "ARED resistance training", "Control de hidratación": "Hydration check"
  };
  function activityName(nombre) { return ACTIVITY_NAMES[nombre] || nombre; }

  function worst(levels) {
    let w = "none";
    for (const l of levels) if (LEVEL_RANK[l] > LEVEL_RANK[w]) w = l;
    return w;
  }
  function shape(level, big) {
    return '<span class="shape ' + level + (big ? " big" : "") + '" aria-hidden="true"></span>';
  }
  /** Status word in the level color (no symbol). */
  function status(level, text) {
    return '<span class="status ' + level + '">' + esc(text || LEVEL_NAME[level]) + "</span>";
  }

  // ---------------------------------------------------------------- health rules
  // Mission thresholds come from the mission; missing values fall back to these defaults.
  const DEFAULT_PARAMS = {
    limiteRadiacionMsv: 600, fcMaxBpm: 100, presionSistolicaMax: 130, horasSuenoMin: 6.5,
    spo2MinPct: 95, temperaturaMaxC: 37.5, glucosaMinMgDl: 70, glucosaMaxMgDl: 180
  };
  function params(mision) {
    const p = Object.assign({}, DEFAULT_PARAMS);
    const src = mision && mision.parametros;
    if (src) for (const k of Object.keys(DEFAULT_PARAMS)) if (src[k] > 0) p[k] = src[k];
    return p;
  }

  const ms = m => (m && m.metricasSalud) || {};
  /** Every reading the UI knows about: where it lives in the API and how it is judged. */
  const METRICS = {
    sleep: {
      label: "Sleep", unit: "h", decimals: 1, zone: "brain",
      get: m => (ms(m).psicologiaSueno || {}).horasSueno,
      level: (v, p) => v < 5 ? "crit" : v < p.horasSuenoMin ? "warn" : "ok",
      range: p => "Needs " + p.horasSuenoMin + " h or more"
    },
    hr: {
      label: "Resting heart rate", short: "Resting HR", unit: "bpm", decimals: 0, zone: "heart",
      get: m => (ms(m).cardiologia || {}).fcReposoBpm,
      level: v => (v >= 120 || v < 40) ? "crit" : (v > 85 || v < 45) ? "warn" : "ok",
      range: () => "Normal 50 to 85"
    },
    bp: {
      label: "Blood pressure", short: "BP", unit: "mmHg", decimals: 0, zone: "heart",
      get: m => (ms(m).cardiologia || {}).presionSistolica,
      extra: m => (ms(m).cardiologia || {}).presionDiastolica,
      level: (v, p) => v >= 160 ? "crit" : v > p.presionSistolicaMax ? "warn" : "ok",
      range: p => "Normal systolic up to " + p.presionSistolicaMax
    },
    spo2: {
      label: "Oxygen saturation", short: "SpO2", unit: "%", decimals: 1, zone: "lungs",
      get: m => (ms(m).cardiologia || {}).spo2Pct,
      level: (v, p) => v < 90 ? "crit" : v < p.spo2MinPct ? "warn" : "ok",
      range: p => "Normal " + p.spo2MinPct + " to 100"
    },
    temp: {
      label: "Body temperature", short: "Temperature", unit: "°C", decimals: 1, zone: "immune",
      get: m => (ms(m).cardiologia || {}).temperaturaC,
      level: (v, p) => (v >= 38.5 || v < 35.5) ? "crit" : v > p.temperaturaMaxC ? "warn" : "ok",
      range: p => "Normal 36.1 to " + p.temperaturaMaxC
    },
    glucose: {
      label: "Blood glucose", short: "Glucose", unit: "mg/dL", decimals: 0, zone: "metabolism",
      get: m => (ms(m).hematologia || {}).glucosaMgDl,
      level: (v, p) => (v < 54 || v > 250) ? "crit" : (v < p.glucosaMinMgDl || v > p.glucosaMaxMgDl) ? "warn" : "ok",
      range: p => "Normal " + p.glucosaMinMgDl + " to " + p.glucosaMaxMgDl
    },
    mood: {
      label: "Mood", unit: "/5", decimals: 0, zone: "brain",
      get: m => (ms(m).psicologiaSueno || {}).estadoAnimo,
      level: v => v <= 1 ? "crit" : v === 2 ? "warn" : "ok",
      range: () => "Normal 3 to 5"
    },
    stress: {
      label: "Stress level", short: "Stress", unit: "/10", decimals: 0, zone: "brain",
      get: m => (ms(m).psicologiaSueno || {}).nivelEstres,
      level: v => v >= 8 ? "crit" : v >= 6 ? "warn" : "ok",
      range: () => "Normal 1 to 5"
    },
    exercise: {
      label: "Cardio exercise", short: "Cardio", unit: "min", decimals: 0, zone: "muscles",
      get: m => (ms(m).medicinaDeportiva || {}).minCardio,
      level: v => v < 30 ? "warn" : "ok",
      range: () => "Aim for 30 min or more"
    },
    dose: {
      label: "Daily radiation dose", short: "Daily dose", unit: "mSv", decimals: 2, zone: "radiation",
      get: m => (ms(m).radiologia || {}).dosisDiariaMsv,
      level: () => "ok",
      range: () => "Measured by the dosimeter"
    }
  };

  function levelOf(key, value, p) {
    if (value === null || value === undefined || isNaN(value)) return "none";
    return METRICS[key].level(Number(value), p);
  }
  function radiationLevel(total, p) {
    if (total === null || total === undefined) return "none";
    return total >= p.limiteRadiacionMsv ? "crit" : total >= p.limiteRadiacionMsv * 0.8 ? "warn" : "ok";
  }

  /** Newest non-empty value of every metric across a list of measurements. */
  function latestValues(metricas) {
    const sorted = (metricas || []).slice().sort((a, b) => (toDate(b.fecha) || 0) - (toDate(a.fecha) || 0));
    const out = {};
    for (const key of Object.keys(METRICS)) {
      for (const m of sorted) {
        const v = METRICS[key].get(m);
        if (v !== null && v !== undefined) {
          out[key] = { value: v, fecha: m.fecha, extra: METRICS[key].extra ? METRICS[key].extra(m) : undefined };
          break;
        }
      }
    }
    return out;
  }

  const ZONES = [
    { id: "brain", name: "Brain & mind", metrics: ["sleep", "mood", "stress"] },
    { id: "heart", name: "Heart & circulation", metrics: ["hr", "bp"] },
    { id: "lungs", name: "Lungs & breathing", metrics: ["spo2"] },
    { id: "metabolism", name: "Blood & metabolism", metrics: ["glucose"] },
    { id: "muscles", name: "Bones & muscles", metrics: ["exercise"] },
    { id: "immune", name: "Immune system", metrics: ["temp"] },
    { id: "radiation", name: "Radiation exposure", metrics: ["radiation"] }
  ];

  /** Builds a full health picture for one astronaut from the API data. */
  function evaluate(latest, astronauta, mision) {
    const p = params(mision);
    const readings = {};
    for (const key of Object.keys(METRICS)) {
      const r = latest[key];
      readings[key] = {
        key, value: r ? r.value : null, extra: r ? r.extra : undefined, fecha: r ? r.fecha : null,
        level: levelOf(key, r ? r.value : null, p), range: METRICS[key].range(p)
      };
    }
    const total = astronauta && astronauta.acumulados ? astronauta.acumulados.radiacionAcumuladaMsv : null;
    readings.radiation = {
      key: "radiation", value: total, level: radiationLevel(total, p),
      range: "Mission limit " + p.limiteRadiacionMsv + " mSv"
    };
    const zones = {};
    for (const z of ZONES) zones[z.id] = worst(z.metrics.map(k => readings[k].level));
    const overall = worst(Object.values(zones));
    return { p, readings, zones, overall };
  }

  /** Short sentences describing every reading out of range, worst first. */
  function issues(evaluation) {
    const list = [];
    for (const r of Object.values(evaluation.readings)) {
      if (r.level !== "crit" && r.level !== "warn") continue;
      const def = METRICS[r.key];
      const label = def ? def.label : "Radiation dose";
      const unit = def ? def.unit : "mSv";
      const decimals = def ? def.decimals : 1;
      let value = fmtNum(r.value, decimals);
      if (r.key === "bp" && r.extra !== undefined && r.extra !== null) value += "/" + r.extra;
      list.push({ level: r.level, key: r.key, text: label + " " + value + (unit.startsWith("/") ? unit : " " + unit) + ". " + r.range + "." });
    }
    return list.sort((a, b) => LEVEL_RANK[b.level] - LEVEL_RANK[a.level]);
  }

  // ---------------------------------------------------------------- data loading
  async function loadContext(astronautaId) {
    const astronauta = await api("/api/astronautas/" + encodeURIComponent(astronautaId));
    let tripulacion = null, mision = null;
    if (astronauta.tripulacionId) {
      try {
        tripulacion = await api("/api/tripulaciones/" + encodeURIComponent(astronauta.tripulacionId));
        if (tripulacion.misionId) mision = await api("/api/misiones/" + encodeURIComponent(tripulacion.misionId));
      } catch (e) { /* mission info is optional for the screens */ }
    }
    return { astronauta, tripulacion, mision };
  }
  function metricsRange(astronautaId, days) {
    const hasta = new Date(Date.now() + 2 * 86400000);
    const desde = new Date(Date.now() - days * 86400000);
    return api("/api/metricas/astronauta/" + encodeURIComponent(astronautaId) + "/rango?desde="
      + encodeURIComponent(desde.toISOString()) + "&hasta=" + encodeURIComponent(hasta.toISOString()));
  }
  function missionDay(mision) {
    if (!mision || !mision.fechaInicio) return null;
    const start = toDate(mision.fechaInicio);
    const day = Math.max(1, Math.floor((Date.now() - start) / 86400000) + 1);
    const total = mision.parametros && mision.parametros.duracionDias;
    return { day, total };
  }
  /** Astronaut the page is about: own id for crew members, ?astronauta=ID for staff. */
  function targetAstronautId(user, options) {
    const fromUrl = new URLSearchParams(window.location.search).get("astronauta");
    if (isStaff(user)) {
      if (fromUrl) return fromUrl;
      // The medical officer is also on board: without ?astronauta= the page shows their own data,
      // except overview pages (alerts) that show the whole crew.
      return options && options.overview ? null : (user.astronautaId || null);
    }
    return user.astronautaId;
  }
  /** True when a staff member is looking at another astronaut's data. */
  function viewingOther(user) {
    const target = targetAstronautId(user);
    return isStaff(user) && !!target && target !== user.astronautaId;
  }

  // ---------------------------------------------------------------- app shell
  const ASTRO_TABS = [
    ["status", "My Status", "status.html"], ["selfcheck", "Self-check", "selfcheck.html"],
    ["trends", "Trends", "trends.html"], ["alerts", "Alerts", "alerts.html"], ["guide", "Guide", "guide.html"]
  ];
  const STAFF_TABS = [["crew", "Crew", "crew.html"], ["alerts", "Alerts", "alerts.html"], ["guide", "Guide", "guide.html"]];
  const ADMIN_TABS = STAFF_TABS.concat([["users", "Users", "users.html"]]);
  // Medical officer on board: crew overview plus their own health screens
  const ONBOARD_STAFF_TABS = [["crew", "Crew", "crew.html"]].concat(ASTRO_TABS);

  /** Draws the side rail. displayName is optional (astronaut name once loaded). */
  function renderShell(active, user, displayName) {
    const rail = document.getElementById("rail");
    if (!rail) return;
    let tabs = !isStaff(user) ? ASTRO_TABS : user.astronautaId ? ONBOARD_STAFF_TABS : STAFF_TABS;
    if (user.rol === "ADMIN") tabs = tabs.concat([["users", "Users", "users.html"]]);
    const links = tabs.map(([id, label, href]) =>
      '<a href="' + href + '"' + (id === active ? ' aria-current="page"' : "") + ">" + label + "</a>").join("");
    rail.innerHTML =
      '<a class="brand" href="' + homeFor(user) + '">' +
      '<span><span class="brand-name">SOMA</span><br><span class="brand-sub">Crew health file</span></span></a>' +
      '<nav aria-label="Main">' + links + "</nav>" +
      '<div class="rail-user"><div class="user-row"><strong id="rail-name">' + esc(displayName || user.codigo) + "</strong>" +
      (user.astronautaId ? '<button type="button" class="bell" id="bell" aria-label="Messages" title="Messages">' + BELL +
        '<span class="badge" id="bell-badge" hidden>0</span></button>' : "") + "</div>" +
      "<span>" + esc(ROLES[user.rol] || user.rol) + "</span>" +
      '<button type="button" id="logout">Sign out</button><br>' +
      '<button type="button" class="theme-toggle" id="theme-toggle"></button></div>';
    document.getElementById("logout").addEventListener("click", logout);
    if (window.SomaTheme) window.SomaTheme.bind(document.getElementById("theme-toggle"));
    if (user.astronautaId) initBell();
  }
  // ---------------------------------------------------------------- floating panels
  const BELL = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a6 6 0 0 0-6 6v3.6L4.3 16h15.4L18 12.6V9a6 6 0 0 0-6-6Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"></path><path d="M9.5 19a2.5 2.5 0 0 0 5 0" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path></svg>';
  let openPanel = null;
  function closeFloating() {
    if (!openPanel) return;
    openPanel.el.remove();
    document.removeEventListener("pointerdown", openPanel.onDown, true);
    document.removeEventListener("keydown", openPanel.onKey, true);
    const anchor = openPanel.anchor;
    openPanel = null;
    if (anchor) anchor.setAttribute("aria-expanded", "false");
  }
  /** Small floating window anchored to a button. Closes with the X, Esc or a click outside. */
  function floating(anchor, html, placement) {
    closeFloating();
    const el = document.createElement("div");
    el.className = "floating";
    el.setAttribute("role", "dialog");
    el.innerHTML = html;
    document.body.appendChild(el);
    const r = anchor.getBoundingClientRect();
    const mobile = window.innerWidth <= 860;
    if (placement === "rail" && !mobile) {
      el.style.left = (r.right + 12) + "px";
      el.style.bottom = Math.max(12, window.innerHeight - r.bottom) + "px";
    } else {
      if (mobile) { el.style.left = "12px"; el.style.right = "12px"; }
      else el.style.right = Math.max(12, window.innerWidth - r.right) + "px";
      // open below the button, or above it when there is no room below
      const h = el.offsetHeight;
      const below = r.bottom + 8;
      el.style.top = (below + h > window.innerHeight - 12 ? Math.max(12, r.top - 8 - h) : below) + "px";
    }
    const onDown = ev => { if (!el.contains(ev.target) && !anchor.contains(ev.target)) closeFloating(); };
    const onKey = ev => { if (ev.key === "Escape") { closeFloating(); anchor.focus(); } };
    document.addEventListener("pointerdown", onDown, true);
    document.addEventListener("keydown", onKey, true);
    el.querySelectorAll("[data-close]").forEach(b => b.addEventListener("click", () => { closeFloating(); anchor.focus(); }));
    anchor.setAttribute("aria-expanded", "true");
    openPanel = { el, anchor, onDown, onKey };
    return el;
  }

  // ---------------------------------------------------------------- messages (bell)
  async function refreshBadge() {
    const badge = document.getElementById("bell-badge");
    if (!badge) return;
    try {
      const r = await api("/api/mensajes/mios/no-leidos");
      const n = (r && r.cantidad) || 0;
      badge.textContent = n > 9 ? "9+" : String(n);
      badge.hidden = n === 0;
      document.getElementById("bell").setAttribute("aria-label", n ? "Messages, " + n + " unread" : "Messages");
    } catch (e) { /* messages are optional: keep the bell quiet */ }
  }
  function initBell() {
    const bell = document.getElementById("bell");
    refreshBadge();
    setInterval(refreshBadge, 60000);
    bell.addEventListener("click", async () => {
      if (openPanel && openPanel.anchor === bell) { closeFloating(); return; }
      const el = floating(bell, '<div class="fl-head"><strong>Messages</strong><button type="button" class="pk-close" data-close aria-label="Close">✕</button></div>' +
        '<div class="fl-body"><p class="loading">Loading…</p></div>', "rail");
      const body = el.querySelector(".fl-body");
      try {
        const list = await api("/api/mensajes/mios");
        body.innerHTML = list.length ? list.map(m =>
          '<div class="msg' + (m.leido ? "" : " unread") + '">' +
          '<div class="msg-top"><span class="msg-from">' + esc(m.remitenteNombre || "Medical officer") + "</span>" +
          '<span class="msg-when">' + esc(fmtDateTime(m.fecha)) + "</span></div>" +
          (m.prioridad === "URGENTE" ? '<div class="msg-urgent">Urgent</div>' : "") +
          '<div class="msg-text">' + esc(m.texto) + "</div>" + (m.leido ? "" : '<div class="msg-new">New</div>') + "</div>").join("")
          : '<p class="empty">No messages. Your crew medical officer will write here when they need you.</p>';
        if (list.some(m => !m.leido)) { await api("/api/mensajes/mios/leidos", { method: "PATCH" }); refreshBadge(); }
      } catch (e) {
        body.innerHTML = '<p class="empty">' + esc(e.message) + "</p>";
      }
    });
  }

  /** Medical officer writes to an astronaut (Contact astronaut). */
  function openCompose(anchor, astronauta, suggestion) {
    const el = floating(anchor,
      '<div class="fl-head"><strong>Message to ' + esc(astronauta.nombre) + '</strong><button type="button" class="pk-close" data-close aria-label="Close">✕</button></div>' +
      '<div class="fl-body"><div class="segmented" role="group" aria-label="Priority" style="margin-top:0">' +
      '<button type="button" class="seg on" data-prio="NORMAL" aria-pressed="true">Routine</button>' +
      '<button type="button" class="seg" data-prio="URGENTE" aria-pressed="false">Urgent</button></div>' +
      '<label class="lbl" for="msg-text" style="font-size:14px">Message</label>' +
      '<textarea class="field" id="msg-text" maxlength="500" style="min-height:96px">' + esc(suggestion || "") + "</textarea>" +
      '<div id="msg-feedback"></div><div class="form-actions" style="margin-top:10px"><button type="button" class="btn" id="msg-send">Send message</button></div>' +
      '<div class="kicker" style="margin-top:14px">Recent messages</div><div id="msg-recent"><p class="loading">Loading…</p></div></div>');
    let prio = "NORMAL";
    el.querySelectorAll("[data-prio]").forEach(b => b.addEventListener("click", () => {
      prio = b.dataset.prio;
      el.querySelectorAll("[data-prio]").forEach(x => { x.classList.toggle("on", x === b); x.setAttribute("aria-pressed", String(x === b)); });
    }));
    const recent = async () => {
      try {
        const list = await api("/api/mensajes/astronauta/" + encodeURIComponent(astronauta.id));
        el.querySelector("#msg-recent").innerHTML = list.length ? list.slice(0, 3).map(m =>
          '<div class="msg"><div class="msg-top"><span class="msg-when">' + esc(fmtDateTime(m.fecha)) + "</span>" +
          '<span class="msg-when">' + (m.leido ? "Read " + esc(fmtDateTime(m.fechaLectura)) : "Not read yet") + "</span></div>" +
          '<div class="msg-text">' + esc(m.texto) + "</div></div>").join("") : '<p class="empty" style="padding:6px 0">No messages sent yet.</p>';
      } catch (e) { el.querySelector("#msg-recent").innerHTML = ""; }
    };
    recent();
    const text = el.querySelector("#msg-text");
    text.focus();
    el.querySelector("#msg-send").addEventListener("click", async ev => {
      const btn = ev.currentTarget;
      const value = text.value.trim();
      const fb = el.querySelector("#msg-feedback");
      if (!value) { fb.innerHTML = '<p class="val-warn" style="font-size:14px;margin:8px 0 0">Write a message first.</p>'; return; }
      btn.disabled = true; btn.textContent = "Sending…";
      try {
        await api("/api/mensajes", { method: "POST", body: { astronautaId: astronauta.id, texto: value, prioridad: prio } });
        fb.innerHTML = '<p class="val-ok" style="font-size:14px;margin:8px 0 0">Sent. ' + esc(firstName(astronauta.nombre)) + " will see it under the bell.</p>";
        text.value = ""; btn.textContent = "Send message"; btn.disabled = false;
        recent();
      } catch (e) {
        fb.innerHTML = '<p class="val-crit" style="font-size:14px;margin:8px 0 0">' + esc(e.message) + "</p>";
        btn.disabled = false; btn.textContent = "Send message";
      }
    });
  }

  function setRailName(name) {
    const el = document.getElementById("rail-name");
    if (el && name) el.textContent = name;
  }
  /** Banner shown to staff when they open an astronaut's screens. */
  function viewingBanner(astronauta, current) {
    const id = encodeURIComponent(astronauta.id);
    const link = (page, label) => page === current ? "<strong>" + label + "</strong>"
      : '<a href="' + page + ".html?astronauta=" + id + '">' + label + "</a>";
    return '<div class="viewing"><span>Viewing <strong>' + esc(astronauta.nombre) + "</strong></span>" +
      "<span>" + link("status", "Status") + " · " + link("trends", "Trends") + " · " + link("alerts", "Alerts") +
      " · " + link("selfcheck", "Self-check") + '</span><a href="crew.html" style="margin-left:auto">Back to crew</a></div>';
  }
  function showError(container, error) {
    const msg = error && error.message ? error.message : String(error);
    container.innerHTML = '<div class="notice crit"><div>' + esc(msg) + "</div></div>";
  }

  // ---------------------------------------------------------------- theme-aware SVG
  /** SVG attributes cannot read CSS variables, but style can: move fill/stroke="var(..)" into style. */
  function svgVars(svg) {
    return svg.replace(/<([a-zA-Z]+)((?:\s+[\w:-]+="[^"]*")*)\s*(\/?)>/g, function (all, tag, attrs, slash) {
      const styles = [];
      const rest = attrs.replace(/\s(fill|stroke)="(var\([^"]*\))"/g, function (m, prop, val) { styles.push(prop + ":" + val); return ""; });
      if (!styles.length) return all;
      return "<" + tag + rest + ' style="' + styles.join(";") + '"' + (slash ? "/" : "") + ">";
    });
  }

  // ---------------------------------------------------------------- body map
  const LEVEL_FILL = { crit: "var(--crit)", warn: "var(--warn)", ok: "var(--ok-fill)", none: "var(--none-fill)" };
  const LEVEL_RING = { crit: "var(--crit)", warn: "var(--warn)", ok: "var(--ok)", none: "var(--none)" };
  const HALF = "M100,62 L108,62 C108,70 110,75 118,78 L138,84 C150,88 156,97 157,110 L160,158 C162,180 165,200 169,222 C172,232 174,246 169,251 C165,255 159,250 159,241 L155,223 C149,201 145,181 143,163 L139,128 L137,172 C135,192 139,206 141,224 C143,242 141,264 137,292 L133,352 C132,372 133,396 133,410 C135,420 139,428 131,430 L116,430 C112,426 113,416 113,410 L111,352 C109,322 105,292 102,256 L100,252 Z";
  const LUNG = "M105,96 C115,91 125,100 127,118 C129,134 127,148 119,150 C111,152 105,146 105,134 Z";
  const MIRROR = 'transform="translate(200 0) scale(-1 1)"';

  /** Front-view human figure; each organ is filled by the level of its body zone. */
  let bodySvg = function (zones, width, height) {
    const z = id => LEVEL_FILL[zones[id] || "none"];
    const body = "var(--body-fill)";
    const label = ZONES.map(zz => zz.name + " " + LEVEL_NAME[zones[zz.id] || "none"].toLowerCase()).join(", ");
    return '<svg width="' + width + '" height="' + height + '" viewBox="0 0 200 440" role="img" aria-label="Body map: ' + esc(label) + '">' +
      '<ellipse cx="100" cy="224" rx="94" ry="208" fill="none" stroke="' + LEVEL_RING[zones.radiation || "none"] + '" stroke-width="2" stroke-dasharray="5 6"></ellipse>' +
      '<ellipse cx="100" cy="36" rx="21" ry="26" fill="' + body + '"></ellipse>' +
      '<path d="' + HALF + '" fill="' + body + '"></path><path d="' + HALF + '" fill="' + body + '" ' + MIRROR + "></path>" +
      '<ellipse cx="100" cy="30" rx="16" ry="15" fill="' + z("brain") + '"></ellipse>' +
      '<path d="M92,26 q4,-6 8,0 q4,6 8,0" fill="none" stroke="var(--page)" stroke-width="2" opacity=".7"></path>' +
      '<g fill="' + z("muscles") + '" opacity=".95">' +
      '<ellipse cx="151" cy="128" rx="6" ry="22"></ellipse><ellipse cx="151" cy="128" rx="6" ry="22" ' + MIRROR + "></ellipse>" +
      '<ellipse cx="122" cy="300" rx="10" ry="42"></ellipse><ellipse cx="122" cy="300" rx="10" ry="42" ' + MIRROR + "></ellipse>" +
      '<ellipse cx="124" cy="385" rx="6" ry="22"></ellipse><ellipse cx="124" cy="385" rx="6" ry="22" ' + MIRROR + "></ellipse></g>" +
      '<g fill="' + z("lungs") + '"><path d="' + LUNG + '"></path><path d="' + LUNG + '" ' + MIRROR + "></path></g>" +
      '<path d="M95,116 c-6,-7 -16,-1 -11,8 l11,12 l11,-12 c5,-9 -5,-15 -11,-8 Z" fill="' + z("heart") + '" stroke="' + body + '" stroke-width="2.5"></path>' +
      '<ellipse cx="100" cy="176" rx="21" ry="14" fill="' + z("metabolism") + '"></ellipse>' +
      '<g fill="' + z("immune") + '" stroke="' + body + '" stroke-width="1.5">' +
      '<circle cx="91" cy="70" r="3.5"></circle><circle cx="109" cy="70" r="3.5"></circle><circle cx="136" cy="100" r="3.5"></circle>' +
      '<circle cx="64" cy="100" r="3.5"></circle><circle cx="114" cy="238" r="3.5"></circle><circle cx="86" cy="238" r="3.5"></circle></g>' +
      "</svg>";
  }
  const bodySvgRaw = bodySvg;
  bodySvg = function (zones, width, height) { return svgVars(bodySvgRaw(zones, width, height)); };

  // ---------------------------------------------------------------- line chart
  /** Single-series line chart with a shaded normal band; marks colored and shaped by level. */
  function lineChart(points, opts) {
    const W = opts.width || 560, H = opts.height || 210;
    const L = 44, R = 14, T = 12, B = 28;
    const pw = W - L - R, ph = H - T - B;
    if (!points.length) return '<p class="empty">No readings in this period.</p>';
    const vals = points.map(p => p.v);
    let lo = Math.min.apply(null, vals.concat(opts.band ? [opts.band[0]] : []));
    let hi = Math.max.apply(null, vals.concat(opts.band ? [opts.band[1]] : []));
    if (opts.min !== undefined) lo = Math.min(lo, opts.min);
    if (opts.max !== undefined) hi = Math.max(hi, opts.max);
    const pad = (hi - lo) * 0.12 || 1;
    lo -= pad; hi += pad;
    const X = i => L + (points.length === 1 ? pw / 2 : pw * i / (points.length - 1));
    const Y = v => T + ph * (1 - (v - lo) / (hi - lo));
    let s = '<svg class="chart" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' + esc(opts.label || "Chart") + '">';
    for (let k = 0; k <= 4; k++) {
      const v = lo + (hi - lo) * k / 4, y = Y(v);
      s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) + '" stroke="var(--chart-grid)"></line>' +
        '<text x="' + (L - 8) + '" y="' + (y + 4).toFixed(1) + '" text-anchor="end" font-size="11" fill="var(--chart-text)">' + fmtNum(v, opts.decimals > 1 ? 2 : opts.decimals) + "</text>";
    }
    if (opts.band) {
      const yt = Y(Math.min(opts.band[1], hi)), yb = Y(Math.max(opts.band[0], lo));
      s += '<rect x="' + L + '" y="' + yt.toFixed(1) + '" width="' + pw + '" height="' + Math.max(0, yb - yt).toFixed(1) + '" fill="var(--ok)" opacity=".12"></rect>' +
        '<text x="' + (W - R - 4) + '" y="' + (yt + 14).toFixed(1) + '" text-anchor="end" font-size="11" fill="var(--ok-ink)">normal range</text>';
    }
    s += '<polyline points="' + points.map((p, i) => X(i).toFixed(1) + "," + Y(p.v).toFixed(1)).join(" ") +
      '" fill="none" stroke="var(--chart-line)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"></polyline>';
    points.forEach((p, i) => {
      const x = X(i), y = Y(p.v), c = LEVEL_RING[p.level] || "var(--chart-line)";
      const tip = "<title>" + esc(fmtDate(p.t) + ": " + fmtNum(p.v, opts.decimals) + " " + (opts.unit || "")) + "</title>";
      s += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + (p.level === "crit" || p.level === "warn" ? 5 : 4) + '" fill="' + c + '" stroke="var(--page)" stroke-width="2">' + tip + "</circle>";
    });
    const step = Math.max(1, Math.ceil(points.length / 6));
    points.forEach((p, i) => {
      if (i % step === 0 || i === points.length - 1)
        s += '<text x="' + X(i).toFixed(1) + '" y="' + (H - 8) + '" text-anchor="' + (points.length > 1 && i === 0 ? "start" : points.length > 1 && i === points.length - 1 ? "end" : "middle") +
          '" font-size="11" fill="var(--chart-text)">' + esc(fmtDate(p.t)) + "</text>";
    });
    return svgVars(s + "</svg>");
  }

  // ---------------------------------------------------------------- pagination
  /** Page buttons. page is 0-based; clicking a button calls onChange(newPage). */
  function pager(container, page, pages, onChange, always) {
    if (!container) return;
    if (pages <= 1 && !always) { container.innerHTML = ""; return; }
    pages = Math.max(1, pages);
    const nums = [];
    for (let i = 0; i < pages; i++) {
      if (i === 0 || i === pages - 1 || Math.abs(i - page) <= 1) nums.push(i);
      else if (nums[nums.length - 1] !== "…") nums.push("…");
    }
    container.innerHTML = '<nav class="pager" aria-label="Pages">' +
      '<button type="button" class="chip" data-page="' + (page - 1) + '"' + (page === 0 ? " disabled" : "") + '>Previous</button>' +
      nums.map(n => n === "…" ? '<span class="gap">…</span>' :
        '<button type="button" class="chip" data-page="' + n + '" aria-pressed="' + (n === page) + '"' + (n === page ? ' aria-current="page"' : "") + ">" + (n + 1) + "</button>").join("") +
      '<button type="button" class="chip" data-page="' + (page + 1) + '"' + (page >= pages - 1 ? " disabled" : "") + ">Next</button></nav>";
    container.querySelectorAll("[data-page]").forEach(b => b.addEventListener("click", () => onChange(Number(b.dataset.page))));
  }

  // ---------------------------------------------------------------- sources
  /** Datasets and references the health rules and guide content are based on. */
  const SOURCES = [
    { title: "Risks of Human Spaceflight: Human Physiology", org: "NASA Human Research Program",
      url: "https://www.nasa.gov/hrp/risks/#Human-Physiology",
      use: "Reference for the body zones, spaceflight hazards and health risks shown in the guide." },
    { title: "OSD-569: SpaceX Inspiration4 crew blood data", org: "NASA Open Science Data Repository",
      url: "https://osdr.nasa.gov/bio/repo/data/studies/OSD-569",
      use: "Dataset of clinical blood measurements (complete blood count) from a real crew, used as reference for the blood readings." }
  ];
  function sourcesHtml() {
    return SOURCES.map(s => '<div class="list-row"><div class="grow">' +
      '<a href="' + esc(s.url) + '" target="_blank" rel="noopener noreferrer"><strong>' + esc(s.title) + "</strong></a>" +
      '<div style="font-size:13px;color:var(--faint)">' + esc(s.org) + " · " + esc(s.use) + "</div></div></div>").join("");
  }

  window.Soma = {
    api, ApiError, getUser, getToken, saveSession, clearSession, logout, isStaff, homeFor, requireAuth,
    esc, toDate, fmtDate, fmtDateTime, fmtNum, isoDay, firstName, initials,
    CARGOS, ROLES, ALERT_STATES, ALERT_AREAS, SEVERITY_LEVEL, SEVERITY_NAME, LEVEL_NAME, LEVEL_RANK,
    alertText, activityName, worst, shape, status, params, METRICS, ZONES, levelOf, radiationLevel, latestValues, evaluate, issues,
    loadContext, metricsRange, missionDay, targetAstronautId, viewingOther,
    SOURCES, sourcesHtml, pager, floating, closeFloating, openCompose, renderShell, setRailName, viewingBanner, showError, bodySvg, lineChart, svgVars
  };
})();
