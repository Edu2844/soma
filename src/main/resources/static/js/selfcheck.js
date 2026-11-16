/* Daily self-check: the astronaut enters today's readings; they are saved as a DIARIO measurement. */
(async function () {
  "use strict";
  const S = window.Soma;
  const user = S.requireAuth();
  const main = document.getElementById("main");
  const staff = S.isStaff(user);
  const other = S.viewingOther(user);   // staff looking at someone else's record
  S.renderShell(other ? "crew" : "selfcheck", user);

  const astronautaId = S.targetAstronautId(user);
  if (!astronautaId) { window.location.href = "crew.html"; return; }
  const DRAFT_KEY = "soma.draft." + astronautaId;

  const HELP = {
    hr: ["how many times your heart beats per minute while at rest.",
      "sit or lie still for 5 minutes. Use the biometric vest, or count your wrist pulse for 30 seconds and multiply by 2.",
      "microgravity changes how the heart works. A high resting rate can mean dehydration, fever, stress or an arrhythmia."],
    bp: ["the force of blood against your arteries: the top number when the heart beats, the bottom number between beats.",
      "seated, after 5 minutes of rest, with the cuff on bare skin at heart level.",
      "body fluids shift toward the head; pressure changes can signal stress or cardiovascular adaptation."],
    spo2: ["the percentage of oxygen your blood is carrying.",
      "clip the pulse oximeter on a warm finger and stay still for 30 seconds until the number settles.",
      "high cabin CO2, a life-support issue or a spacewalk can lower your oxygen level."],
    temp: ["your core body temperature.",
      "digital thermometer under the tongue with your mouth closed for one minute. Do not drink for 15 minutes before.",
      "stress and radiation weaken your defenses; fever is an early sign of infection."],
    sleep: ["the hours you actually slept in your last rest period.",
      "use the sleep record from your wearable, or your best estimate.",
      "with 16 sunrises a day your body clock gets confused, and sleep loss affects judgment."],
    glucose: ["the sugar level in your blood.",
      "glucometer with a drop from your fingertip, ideally before a meal.",
      "packaged food and low appetite can unbalance your energy; very high or very low values need attention."],
    mood: ["how you feel overall today.",
      "choose the number that best fits your day.",
      "months of confinement far from family can affect mood; reporting it early helps."]
  };

  const FIELDS = [
    { key: "hr", id: "fcReposoBpm", min: 30, max: 220, step: 1, placeholder: "e.g. 62" },
    { key: "bp", id: "presionSistolica", id2: "presionDiastolica", min: 60, max: 250, step: 1, placeholder: "Sys", placeholder2: "Dia" },
    { key: "spo2", id: "spo2Pct", min: 50, max: 100, step: 0.1, placeholder: "e.g. 97.5" },
    { key: "temp", id: "temperaturaC", min: 30, max: 45, step: 0.1, placeholder: "e.g. 36.6" },
    { key: "sleep", id: "horasSueno", min: 0, max: 24, step: 0.1, placeholder: "e.g. 7" },
    { key: "glucose", id: "glucosaMgDl", min: 20, max: 600, step: 1, placeholder: "e.g. 95" }
  ];

  let params = S.params(null);
  let mood = null;
  // Previous self-checks: date filter and pagination
  const HIST_PAGE = 5;
  let history = [], histPage = 0, maxListHeight = 0;
  // Calendar filter, Google Calendar style: one calendar, three views
  let histMode = "all";            // "all" | "week" | "day"
  let histDay = "";                // YYYY-MM-DD selected (day view) or anchor of the week (week view)
  let pickerOpen = false, pickerYear = new Date().getFullYear();   // month/year picker under the title
  let calYear = new Date().getFullYear(), calMonth = new Date().getMonth();   // month shown in the calendar
  const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  try {
    const [ctx, historial] = await Promise.all([
      S.loadContext(astronautaId),
      S.metricsRange(astronautaId, 400).catch(() => [])
    ]);
    params = S.params(ctx.mision);
    if (!other) S.setRailName(ctx.astronauta.nombre);
    render(ctx, historial || []);
  } catch (e) {
    S.showError(main, e);
  }

  function readingRow(f, open) {
    const def = S.METRICS[f.key];
    const h = HELP[f.key];
    const inputs = f.id2
      ? '<input class="field half" type="number" inputmode="decimal" id="' + f.id + '" min="' + f.min + '" max="' + f.max + '" step="' + f.step + '" placeholder="' + f.placeholder + '" aria-label="Systolic">' +
        '<span aria-hidden="true">/</span><input class="field half" type="number" inputmode="decimal" id="' + f.id2 + '" min="30" max="150" step="1" placeholder="' + f.placeholder2 + '" aria-label="Diastolic">'
      : '<input class="field" type="number" inputmode="decimal" id="' + f.id + '" min="' + f.min + '" max="' + f.max + '" step="' + f.step + '" placeholder="' + f.placeholder + '" aria-labelledby="t-' + f.key + '">';
    return '<div class="reading" data-key="' + f.key + '">' +
      '<div><div class="title" id="t-' + f.key + '">' + S.esc(def.label) + "</div>" +
      '<div class="hint">' + S.esc(def.range(params)) + ' · <button type="button" data-help="' + f.key + '" aria-expanded="' + (open ? "true" : "false") + '">How to measure?</button></div></div>' +
      '<div class="input">' + inputs + '<span class="unit">' + S.esc(def.unit) + "</span></div>" +
      '<div class="state" id="s-' + f.key + '">' + S.status("none", "Not entered") + "</div>" +
      '<div class="help" id="h-' + f.key + '"' + (open ? "" : " hidden") + ">" +
      "<p><strong>What it is:</strong> " + S.esc(h[0]) + "</p><p><strong>How to measure:</strong> " + S.esc(h[1]) + "</p>" +
      "<p><strong>In space:</strong> " + S.esc(h[2]) + "</p></div></div>";
  }

  function render(ctx, historial) {
    const a = ctx.astronauta;
    const moodButtons = [1, 2, 3, 4, 5].map(n => '<button type="button" data-mood="' + n + '" aria-pressed="false">' + n + "</button>").join("");
    const today = new Date();
    main.innerHTML =
      (other ? S.viewingBanner(a, "selfcheck") : "") +
      '<section class="page-head"><div><h1>Daily self-check</h1><p>Takes about 3 minutes. Your values are checked against the mission thresholds.</p></div>' +
      '<div class="actions"><button class="btn secondary" type="button" id="clear">Clear form</button></div></section>' +
      '<div id="result"></div>' +
      '<section class="row">' +
      '<form class="panel grow-2" id="form" novalidate>' +
      '<div class="panel-head"><h2>Today\'s readings</h2><span class="note">' + S.esc(S.fmtDate(today)) + (other ? " · for " + S.esc(a.nombre) : "") + "</span></div>" +
      FIELDS.map((f, i) => readingRow(f, i === 0)).join("") +
      '<div class="reading" data-key="mood"><div><div class="title" id="t-mood">Mood</div>' +
      '<div class="hint">1 = very low · 5 = great · <button type="button" data-help="mood" aria-expanded="false">How to measure?</button></div></div>' +
      '<div class="mood" role="group" aria-labelledby="t-mood">' + moodButtons + "</div>" +
      '<div class="state" id="s-mood">' + S.status("none", "Not entered") + "</div>" +
      '<div class="help" id="h-mood" hidden><p><strong>What it is:</strong> ' + S.esc(HELP.mood[0]) + "</p><p><strong>How to measure:</strong> " +
      S.esc(HELP.mood[1]) + "</p><p><strong>In space:</strong> " + S.esc(HELP.mood[2]) + "</p></div></div>" +
      '<div style="padding-top:14px"><label class="lbl" for="notas">Symptoms or comments <span style="font-weight:400;color:var(--faint)">(optional)</span></label>' +
      '<textarea class="field" id="notas" maxlength="1000" placeholder="For example: headache since the evening shift"></textarea></div>' +
      '<div class="form-actions"><button class="btn secondary" type="button" id="draft">Save draft</button>' +
      '<button class="btn" type="submit" id="submit">Evaluate my status</button></div>' +
      "</form>" +
      '<div class="stack grow-1">' +
      '<div class="panel"><h2>Previous self-checks</h2><div id="history"></div></div>' +
      '<div class="panel"><h2>Why it matters</h2><p style="margin:8px 0 0;color:var(--muted);font-size:14px;line-height:1.6">' +
      "Your self-check fills the gaps the sensors cannot see: mood, glucose and symptoms. The crew medical officer reviews it together with the wearable data.</p></div>" +
      "</div></section>";

    renderHistory(historial);
    wire();
    restoreDraft();
    FIELDS.forEach(f => updateState(f.key));
  }

  /** Local calendar day (YYYY-MM-DD) of a measurement, used by the date filters. */
  function localDay(value) {
    const d = S.toDate(value);
    return d ? d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0") : "";
  }

  function renderHistory(historial) {
    history = historial.filter(m => m.frecuencia === "DIARIO").sort((a, b) => S.toDate(b.fecha) - S.toDate(a.fecha));
    document.getElementById("history").innerHTML =
      '<div class="cal" id="h-cal"></div>' +
      '<div id="h-note" style="font-size:13px;color:var(--faint);margin:10px 0 2px"></div>' +
      '<div id="h-list" class="h-list"></div><div id="h-pager"></div>';
    drawCalendar();
    drawHistory();
    // Clicking outside the month/year picker closes it and leaves the calendar where it was
    document.addEventListener("pointerdown", ev => {
      if (pickerOpen && !ev.target.closest(".cal-picker, .cal-title")) { pickerOpen = false; drawCalendar(); }
    });
    document.addEventListener("keydown", ev => {
      if (pickerOpen && ev.key === "Escape") { pickerOpen = false; drawCalendar(); document.querySelector(".cal-title").focus(); }
    });
  }

  /** Sunday-to-Saturday week containing a YYYY-MM-DD day, as [start, end] strings. */
  function weekOf(day) {
    const [y, m, d] = day.split("-").map(Number);
    const start = new Date(y, m - 1, d - new Date(y, m - 1, d).getDay());
    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
    return [localDay(start), localDay(end)];
  }

  /** Worst level of the self-check recorded on each local day, for the dots in the calendar. */
  function dayLevels() {
    const map = {};
    history.forEach(m => {
      const levels = Object.keys(S.METRICS).map(k => S.levelOf(k, S.METRICS[k].get(m), params));
      const d = localDay(m.fecha);
      map[d] = S.worst([map[d] || "none"].concat(levels));
    });
    return map;
  }

  function drawCalendar() {
    const box = document.getElementById("h-cal");
    const levels = dayLevels();
    const today = localDay(new Date());
    const first = new Date(calYear, calMonth, 1);
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const lead = first.getDay();               // weeks start on Sunday, like Google Calendar
    const isCurrentMonth = calYear === new Date().getFullYear() && calMonth === new Date().getMonth();
    const week = histMode === "week" && histDay ? weekOf(histDay) : null;
    let cells = "";
    for (let i = 0; i < lead; i++) cells += '<span class="cal-cell empty" aria-hidden="true"></span>';
    for (let d = 1; d <= daysInMonth; d++) {
      const key = calYear + "-" + String(calMonth + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0");
      const lv = levels[key];
      const future = key > today && !lv;   // a day with data is always selectable (UTC vs local time)
      const cls = ["cal-day"];
      if (key === today) cls.push("today");
      if (histMode === "day" && key === histDay) cls.push("selected");
      if (histMode === "week" && week && key >= week[0] && key <= week[1]) {
        cls.push("inweek");
        if (key === week[0] || d === 1) cls.push("wk-start");
        if (key === week[1] || d === daysInMonth) cls.push("wk-end");
      }
      if (lv) cls.push("has");
      const label = MONTH_NAMES[calMonth] + " " + d + (lv ? ", self-check " + S.LEVEL_NAME[lv].toLowerCase() : ", no self-check");
      cells += '<button type="button" class="' + cls.join(" ") + '" data-day="' + key + '"' + (future ? " disabled" : "") +
        ' aria-label="' + S.esc(label) + '"' + (histMode === "day" && key === histDay ? ' aria-pressed="true"' : "") + ">" +
        "<span>" + d + "</span>" + (lv ? '<i class="cal-dot ' + lv + '" aria-hidden="true"></i>' : "") + "</button>";
    }
    const view = (v, l) => '<button type="button" class="seg' + (histMode === v ? " on" : "") + '" data-view="' + v + '" aria-pressed="' + (histMode === v) + '">' + l + "</button>";
    box.innerHTML =
      '<div class="cal-head">' +
      '<button type="button" class="cal-nav" data-nav="-1" aria-label="Previous month">‹</button>' +
      '<button type="button" class="cal-title" data-picker aria-haspopup="dialog" aria-expanded="' + pickerOpen + '" title="Choose month or year">' +
      MONTH_NAMES[calMonth] + " " + calYear + ' <span aria-hidden="true">▾</span></button>' +
      '<button type="button" class="cal-nav" data-nav="1" aria-label="Next month"' + (isCurrentMonth ? " disabled" : "") + ">›</button>" +
      '<button type="button" class="btn secondary small cal-today" data-today>Today</button></div>' +
      (pickerOpen ? picker() : "") +
      '<div class="segmented" role="group" aria-label="Filter">' + view("all", "All") + view("week", "Week") + view("day", "Day") + "</div>" +
      '<div class="cal-grid" role="grid"><span class="cal-dow">S</span><span class="cal-dow">M</span><span class="cal-dow">T</span>' +
      '<span class="cal-dow">W</span><span class="cal-dow">T</span><span class="cal-dow">F</span><span class="cal-dow">S</span>' + cells + "</div>";

    box.querySelectorAll("[data-nav]").forEach(b => b.addEventListener("click", () => {
      calMonth += Number(b.dataset.nav);
      if (calMonth < 0) { calMonth = 11; calYear--; }
      if (calMonth > 11) { calMonth = 0; calYear++; }
      refresh();
    }));
    box.querySelectorAll("[data-day]").forEach(b => b.addEventListener("click", () => {
      if (histMode === "week") { histDay = b.dataset.day; }                                    // move to that day's week
      else if (histMode === "day" && histDay === b.dataset.day) { histMode = "all"; histDay = ""; }   // click again to clear
      else { histMode = "day"; histDay = b.dataset.day; }
      histPage = 0; refresh();
    }));
    box.querySelector("[data-picker]").addEventListener("click", () => {
      pickerOpen = !pickerOpen; pickerYear = calYear; drawCalendar();
      const first = box.querySelector(".cal-picker .on, .cal-picker [data-month]:not(:disabled)");
      if (first) first.focus();
    });
    if (pickerOpen) {
      box.querySelector("[data-close]").addEventListener("click", () => { pickerOpen = false; drawCalendar(); });
      box.querySelectorAll("[data-year]").forEach(b => b.addEventListener("click", () => { pickerYear += Number(b.dataset.year); drawCalendar(); }));
      box.querySelectorAll("[data-month]").forEach(b => b.addEventListener("click", () => {
        calYear = pickerYear; calMonth = Number(b.dataset.month); pickerOpen = false; refresh();
      }));
    }
    box.querySelectorAll("[data-view]").forEach(b => b.addEventListener("click", () => {
      const v = b.dataset.view;
      if ((v === "day" || v === "week") && !histDay) {
        // pick the latest self-check in the month shown, or today
        const inMonth = history.map(m => localDay(m.fecha)).find(d => d.slice(0, 7) === calYear + "-" + String(calMonth + 1).padStart(2, "0"));
        histDay = inMonth || today;
      }
      histMode = v; histPage = 0; refresh();
    }));
    box.querySelector("[data-today]").addEventListener("click", () => {
      const now = new Date();
      calYear = now.getFullYear(); calMonth = now.getMonth();
      histMode = "day"; histDay = today; histPage = 0; refresh();
    });
  }

  /** Month/year picker shown under the calendar title. */
  function picker() {
    const now = new Date();
    const short = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const months = short.map((m, i) => {
      const future = pickerYear > now.getFullYear() || (pickerYear === now.getFullYear() && i > now.getMonth());
      const on = pickerYear === calYear && i === calMonth;
      return '<button type="button" class="pk-month' + (on ? " on" : "") + '" data-month="' + i + '"' + (future ? " disabled" : "") + ">" + m + "</button>";
    }).join("");
    return '<div class="cal-picker" role="dialog" aria-label="Choose month and year">' +
      '<div class="pk-head"><button type="button" class="cal-nav" data-year="-1" aria-label="Previous year">‹</button>' +
      '<strong>' + pickerYear + "</strong>" +
      '<button type="button" class="cal-nav" data-year="1" aria-label="Next year"' + (pickerYear >= now.getFullYear() ? " disabled" : "") + ">›</button>" +
      '<button type="button" class="pk-close" data-close aria-label="Close">✕</button></div>' +
      '<div class="pk-grid">' + months + "</div></div>";
  }

  function refresh() { drawCalendar(); drawHistory(); }

  function drawHistory() {
    const list = document.getElementById("h-list");
    const items = history.filter(m => {
      const d = localDay(m.fecha);
      if (histMode === "day") return d === histDay;
      if (histMode === "week") { const w = weekOf(histDay); return d >= w[0] && d <= w[1]; }
      return true;
    });
    const pages = Math.max(1, Math.ceil(items.length / HIST_PAGE));
    if (histPage > pages - 1) histPage = pages - 1;
    const slice = items.slice(histPage * HIST_PAGE, histPage * HIST_PAGE + HIST_PAGE);
    const scope = histMode === "day" ? "on " + S.fmtDate(histDay) + " " + histDay.slice(0, 4)
      : histMode === "week" ? "in the week of " + S.fmtDate(weekOf(histDay)[0]) + " – " + S.fmtDate(weekOf(histDay)[1]) + " " + weekOf(histDay)[1].slice(0, 4)
      : "in the last 400 days";
    document.getElementById("h-note").textContent = items.length + (items.length === 1 ? " self-check " : " self-checks ") + scope;
    if (!slice.length) {
      list.innerHTML = '<p class="empty">' + (history.length ? "No self-checks for this date. Pick another day or month." : "No self-checks yet.") + "</p>";
      S.pager(document.getElementById("h-pager"), 0, 1, () => {}, true);
      return;
    }
    list.innerHTML = slice.map((m, i) => {
      const levels = Object.keys(S.METRICS).map(k => ({ k, v: S.METRICS[k].get(m) }))
        .filter(x => x.v !== null && x.v !== undefined)
        .map(x => ({ k: x.k, v: x.v, l: S.levelOf(x.k, x.v, params) }));
      const out = levels.filter(x => x.l === "warn" || x.l === "crit");
      const lv = S.worst(levels.map(x => x.l));
      const details = levels.map(x => {
        const d = S.METRICS[x.k];
        return '<div class="list-row" style="padding:5px 0">' + S.shape(x.l) + '<span class="grow">' + S.esc(d.label) + "</span><span>" +
          S.esc(S.fmtNum(x.v, d.decimals) + (d.unit.startsWith("/") ? d.unit : " " + d.unit)) + "</span></div>";
      }).join("") + (m.notas ? '<p style="font-size:13px;color:var(--muted);margin:6px 0 0">' + S.esc(m.notas) + "</p>" : "");
      return '<div class="list-row">' + S.shape(lv) + '<div class="grow"><div>' + S.esc(S.fmtDate(m.fecha)) + "</div>" +
        '<div style="font-size:13px;color:var(--faint)">' + (out.length ? out.length + (out.length === 1 ? " value" : " values") + " out of range" : "All values in range") + "</div>" +
        '<div id="d-' + i + '" hidden style="margin-top:6px">' + details + "</div></div>" +
        '<button type="button" class="btn secondary small" data-detail="' + i + '" aria-expanded="false">View</button></div>';
    }).join("") + '<div class="list-row filler" aria-hidden="true"></div>'.repeat(HIST_PAGE - slice.length);
    list.querySelectorAll("[data-detail]").forEach(b => b.addEventListener("click", () => {
      const d = document.getElementById("d-" + b.dataset.detail);
      d.hidden = !d.hidden;
      b.setAttribute("aria-expanded", String(!d.hidden));
      b.textContent = d.hidden ? "View" : "Hide";
    }));
    maxListHeight = Math.max(maxListHeight, list.offsetHeight);
    list.style.minHeight = maxListHeight + "px";
    S.pager(document.getElementById("h-pager"), histPage, pages, p => { histPage = p; drawHistory(); }, true);
  }

  function num(id) {
    const el = document.getElementById(id);
    if (!el || el.value.trim() === "") return null;
    const v = Number(el.value);
    return isNaN(v) ? null : v;
  }

  function updateState(key) {
    const f = FIELDS.find(x => x.key === key);
    const v = key === "mood" ? mood : num(f.id);
    const cell = document.getElementById("s-" + key);
    if (!cell) return;
    cell.innerHTML = v === null ? S.status("none", "Not entered") : S.status(S.levelOf(key, v, params));
  }

  function wire() {
    const form = document.getElementById("form");
    form.querySelectorAll("[data-help]").forEach(b => b.addEventListener("click", () => {
      const h = document.getElementById("h-" + b.dataset.help);
      h.hidden = !h.hidden;
      b.setAttribute("aria-expanded", String(!h.hidden));
    }));
    FIELDS.forEach(f => {
      [f.id, f.id2].filter(Boolean).forEach(id => document.getElementById(id).addEventListener("input", () => updateState(f.key)));
    });
    form.querySelectorAll("[data-mood]").forEach(b => b.addEventListener("click", () => setMood(Number(b.dataset.mood))));
    document.getElementById("clear").addEventListener("click", () => {
      form.reset(); setMood(null);
      try { localStorage.removeItem(DRAFT_KEY); } catch (e) { /* storage unavailable */ }
      FIELDS.forEach(f => updateState(f.key));
      document.getElementById("result").innerHTML = "";
    });
    document.getElementById("draft").addEventListener("click", saveDraft);
    form.addEventListener("submit", submit);
  }

  function setMood(n) {
    mood = n;
    document.querySelectorAll("[data-mood]").forEach(b => b.setAttribute("aria-pressed", String(Number(b.dataset.mood) === n)));
    updateState("mood");
  }

  function collect() {
    const draft = { mood, notas: document.getElementById("notas").value };
    FIELDS.forEach(f => { draft[f.id] = num(f.id); if (f.id2) draft[f.id2] = num(f.id2); });
    return draft;
  }
  function saveDraft() {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(collect()));
      notice("info", "Draft saved on this device. It stays here until you send it or clear the form.");
    } catch (e) {
      notice("warn", "This browser does not allow saving drafts.");
    }
  }
  function restoreDraft() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null"); } catch (e) { d = null; }
    if (!d) return;
    FIELDS.forEach(f => {
      [f.id, f.id2].filter(Boolean).forEach(id => { if (d[id] !== null && d[id] !== undefined) document.getElementById(id).value = d[id]; });
    });
    if (d.notas) document.getElementById("notas").value = d.notas;
    if (d.mood) setMood(d.mood);
  }

  function notice(level, html, isHtml) {
    document.getElementById("result").innerHTML = "<div class=\"notice " + level + "\"><div>" + (isHtml ? html : S.esc(html)) + "</div></div>";
    document.getElementById("result").scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  async function submit(ev) {
    ev.preventDefault();
    const d = collect();
    const cardiologia = {}, psicologiaSueno = {}, hematologia = {};
    if (d.fcReposoBpm !== null) cardiologia.fcReposoBpm = Math.round(d.fcReposoBpm);
    if (d.presionSistolica !== null) cardiologia.presionSistolica = Math.round(d.presionSistolica);
    if (d.presionDiastolica !== null) cardiologia.presionDiastolica = Math.round(d.presionDiastolica);
    if (d.spo2Pct !== null) cardiologia.spo2Pct = d.spo2Pct;
    if (d.temperaturaC !== null) cardiologia.temperaturaC = d.temperaturaC;
    if (d.horasSueno !== null) psicologiaSueno.horasSueno = d.horasSueno;
    if (d.mood !== null) psicologiaSueno.estadoAnimo = d.mood;
    if (d.glucosaMgDl !== null) hematologia.glucosaMgDl = d.glucosaMgDl;

    const metricasSalud = {};
    if (Object.keys(cardiologia).length) metricasSalud.cardiologia = cardiologia;
    if (Object.keys(psicologiaSueno).length) metricasSalud.psicologiaSueno = psicologiaSueno;
    if (Object.keys(hematologia).length) metricasSalud.hematologia = hematologia;
    if (!Object.keys(metricasSalud).length) { notice("warn", "Enter at least one reading before evaluating."); return; }

    const btn = document.getElementById("submit");
    btn.disabled = true; btn.textContent = "Saving…";
    try {
      await S.api("/api/metricas", {
        method: "POST",
        body: { astronautaId, frecuencia: "DIARIO", metricasSalud, notas: d.notas.trim() || null }
      });
      try { localStorage.removeItem(DRAFT_KEY); } catch (e) { /* storage unavailable */ }
      const levels = Object.keys(S.METRICS).map(k => {
        const v = k === "mood" ? d.mood : d[{ hr: "fcReposoBpm", bp: "presionSistolica", spo2: "spo2Pct", temp: "temperaturaC", sleep: "horasSueno", glucose: "glucosaMgDl" }[k]];
        return v === null || v === undefined ? "none" : S.levelOf(k, v, params);
      });
      const lv = S.worst(levels);
      const back = other ? "status.html?astronauta=" + encodeURIComponent(astronautaId) : "status.html";
      const text = lv === "crit" ? "Saved. Some readings are critical: contact the crew medical officer today."
        : lv === "warn" ? "Saved. Some readings need attention; follow the guide and repeat the measurement later."
        : "Saved. All your readings are within range.";
      notice(lv === "none" ? "ok" : lv, S.esc(text) + ' <a href="' + back + '">See my status</a>', true);
      btn.textContent = "Saved";
    } catch (e) {
      btn.disabled = false; btn.textContent = "Evaluate my status";
      if (e.status === 409) notice("warn", e.message.indexOf("diario") >= 0
        ? "Today's self-check was already sent. You can send the next one tomorrow."
        : e.message);
      else if (e.status === 400) notice("crit", "Some values are out of the allowed range. " + (e.details || []).join(" "));
      else notice("crit", e.message);
    }
  }
})();
