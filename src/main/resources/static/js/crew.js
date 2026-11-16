/* Crew (medical officer): two tabs, Crew overview (paginated table) and Crew health (totals + pie chart),
   the astronaut that needs review as a list, messaging and a formatted Excel report. */
(async function () {
  "use strict";
  const S = window.Soma;
  const user = S.requireAuth({ staffOnly: true });
  const main = document.getElementById("main");
  S.renderShell("crew", user);

  const PAGE_SIZE = 5;
  const LEVELS = [
    ["crit", "Critical", "var(--crit)"], ["warn", "Needs attention", "var(--warn)"],
    ["ok", "Normal", "var(--ok)"], ["none", "No data", "var(--none)"]
  ];
  let rows = [], mision = null, tab = "overview", page = 0;
  try { tab = sessionStorage.getItem("soma.crewTab") || "overview"; } catch (e) { /* default tab */ }

  try {
    const [astronautas, tripulaciones, misiones] = await Promise.all([
      S.api("/api/astronautas"),
      S.api("/api/tripulaciones").catch(() => []),
      S.api("/api/misiones").catch(() => [])
    ]);
    const misionPorTripulacion = {};
    (tripulaciones || []).forEach(t => { misionPorTripulacion[t.id] = (misiones || []).find(m => m.id === t.misionId) || null; });
    mision = (misiones || []).find(m => m.fase === "EN_CURSO") || (misiones || [])[0] || null;

    rows = await Promise.all((astronautas || []).map(async a => {
      const m = misionPorTripulacion[a.tripulacionId] || mision;
      const [metricas, alertas] = await Promise.all([
        S.metricsRange(a.id, 30).catch(() => []),
        S.api("/api/alertas/astronauta/" + encodeURIComponent(a.id) + "?size=500").catch(() => ({ contenido: [] }))
      ]);
      const ev = S.evaluate(S.latestValues(metricas), a, m);
      const lastDaily = metricas.filter(x => x.frecuencia === "DIARIO").map(x => S.toDate(x.fecha)).sort((x, y) => y - x)[0] || null;
      const active = (alertas.contenido || []).filter(x => x.estado === "ACTIVA");
      return { a, ev, lastDaily, active, activeCrit: active.filter(x => x.severidad === "CRITICA").length };
    }));
    rows.sort((x, y) => (S.LEVEL_RANK[y.ev.overall] - S.LEVEL_RANK[x.ev.overall]) || (y.active.length - x.active.length));
    render();
  } catch (e) {
    S.showError(main, e);
  }

  function value(r, key, unit) {
    const reading = r.ev.readings[key];
    const def = S.METRICS[key];
    if (reading.value === null || reading.value === undefined) return '<span class="cell-sub">—</span>';
    let v = S.fmtNum(reading.value, def ? def.decimals : 1);
    if (key === "bp" && reading.extra) v += "/" + reading.extra;
    const cls = reading.level === "crit" ? "val-crit cell-strong" : reading.level === "warn" ? "val-warn cell-strong" : "";
    return '<span class="' + cls + '">' + S.esc(v + (unit ? " " + unit : "")) + "</span>";
  }

  function count(lv) { return rows.filter(r => r.ev.overall === lv).length; }

  // ---------------------------------------------------------------- tab: Crew overview
  function overview() {
    const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    if (page > pages - 1) page = pages - 1;
    const slice = rows.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
    const body = slice.length ? slice.map(r => {
      const id = encodeURIComponent(r.a.id);
      return '<tr class="clickable" data-href="status.html?astronauta=' + id + '">' +
        '<td><div class="who"><span class="avatar none">' + S.esc(S.initials(r.a.nombre)) + "</span>" +
        '<div><a class="cell-strong" href="status.html?astronauta=' + id + '" style="color:var(--ink);text-decoration:none">' + S.esc(r.a.nombre) + "</a>" +
        '<div class="cell-sub">' + S.esc(S.CARGOS[r.a.cargo] || r.a.cargo || "") + "</div></div></div></td>" +
        "<td>" + S.status(r.ev.overall) + "</td>" +
        "<td>" + value(r, "sleep", "h") + "</td><td>" + value(r, "hr", "bpm") + "</td><td>" + value(r, "bp", "") + "</td>" +
        "<td>" + value(r, "spo2", "%") + "</td><td>" + value(r, "temp", "°C") + "</td><td>" + value(r, "radiation", "mSv") + "</td>" +
        '<td><a href="alerts.html?astronauta=' + id + '">' + (r.active.length ? r.active.length + " active" : "None") + "</a></td>" +
        '<td class="cell-sub">' + S.esc(r.lastDaily ? S.fmtDate(r.lastDaily) : "Never") + "</td></tr>";
    }).join("") : '<tr><td colspan="10" class="empty">No astronauts registered yet.</td></tr>';
    const fillers = '<tr class="filler crew-filler" aria-hidden="true"><td colspan="10"></td></tr>'.repeat(Math.max(0, PAGE_SIZE - Math.max(slice.length, 1)));
    const from = rows.length ? page * PAGE_SIZE + 1 : 0, to = Math.min(rows.length, (page + 1) * PAGE_SIZE);
    return '<div class="panel-head" style="margin-bottom:12px"><h2>Crew overview</h2><span class="note">Sorted by severity · showing ' + from + "–" + to + " of " + rows.length + "</span></div>" +
      '<div class="table-wrap"><table class="data"><thead><tr><th>Astronaut</th><th>Status</th><th>Sleep</th><th>Resting HR</th><th>BP</th><th>SpO2</th><th>Temperature</th><th>Radiation</th><th>Alerts</th><th>Self-check</th></tr></thead><tbody>' +
      body + fillers + '</tbody></table></div><div id="crew-pager"></div>';
  }

  // ---------------------------------------------------------------- tab: Crew health
  function pie(size) {
    const total = rows.length;
    const r = size / 2 - 4, c = size / 2;
    if (!total) return '<p class="empty">No astronauts yet.</p>';
    let angle = -Math.PI / 2, paths = "";
    const slices = LEVELS.map(([lv, label, color]) => ({ lv, label, color, n: count(lv) })).filter(s => s.n > 0);
    slices.forEach(s => {
      const frac = s.n / total;
      if (frac >= 0.9999) {
        paths += '<circle cx="' + c + '" cy="' + c + '" r="' + r + '" fill="' + s.color + '" stroke="var(--page)" stroke-width="2"><title>' + s.label + ": " + s.n + "</title></circle>";
        return;
      }
      const a2 = angle + frac * Math.PI * 2;
      const x1 = c + r * Math.cos(angle), y1 = c + r * Math.sin(angle), x2 = c + r * Math.cos(a2), y2 = c + r * Math.sin(a2);
      paths += '<path d="M' + c + "," + c + " L" + x1.toFixed(2) + "," + y1.toFixed(2) + " A" + r + "," + r + " 0 " + (frac > 0.5 ? 1 : 0) + " 1 " +
        x2.toFixed(2) + "," + y2.toFixed(2) + ' Z" fill="' + s.color + '" stroke="var(--page)" stroke-width="2"><title>' + s.label + ": " + s.n + "</title></path>";
      // direct label with the count, inside the slice
      const mid = (angle + a2) / 2;
      if (frac >= 0.08) paths += '<text x="' + (c + r * 0.62 * Math.cos(mid)).toFixed(1) + '" y="' + (c + r * 0.62 * Math.sin(mid) + 6).toFixed(1) +
        '" text-anchor="middle" font-size="17" font-weight="700" fill="var(--page)">' + s.n + "</text>";
      angle = a2;
    });
    const label = "Crew status: " + slices.map(s => s.label + " " + s.n).join(", ");
    return S.svgVars('<svg width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + " " + size + '" role="img" aria-label="' + S.esc(label) + '">' + paths + "</svg>");
  }

  function health() {
    const total = rows.length;
    const activeAlerts = rows.reduce((s, r) => s + r.active.length, 0);
    const pct = n => total ? Math.round(n / total * 100) + "%" : "0%";
    const stat = (label, n, cls) => '<div class="stat"><span>' + S.esc(label) + '</span><b class="' + cls + '">' + n + "</b></div>";
    const legend = LEVELS.map(([lv, label, color]) =>
      '<div><span class="sw" style="background:' + color + '"></span>' + S.esc(label) + ": <strong>" + count(lv) + "</strong> (" + pct(count(lv)) + ")</div>").join("");
    return '<div class="panel-head" style="margin-bottom:6px"><h2>Crew health</h2><span class="note">Latest values from the last 30 days</span></div>' +
      '<div class="row" style="align-items:center">' +
      '<div class="stats grow-1" style="flex-basis:260px">' +
      stat("Crew monitored", total, "") + stat("Critical", count("crit"), count("crit") ? "txt-crit" : "") +
      stat("Needs attention", count("warn"), count("warn") ? "txt-warn" : "") + stat("Normal", count("ok"), count("ok") ? "txt-ok" : "") +
      stat("Active alerts", activeAlerts, activeAlerts ? "txt-warn" : "") + "</div>" +
      '<div class="grow-1" style="flex-basis:300px;display:flex;gap:24px;align-items:center;justify-content:center;flex-wrap:wrap">' +
      pie(250) + '<div class="pie-legend">' + legend + "</div></div></div>";
  }

  // ---------------------------------------------------------------- needs review (list)
  function review() {
    const focus = rows.find(r => r.ev.overall === "crit" || r.ev.overall === "warn");
    if (!focus) {
      return rows.length ? '<section class="panel"><h2>Needs your review</h2><p class="empty">Every crew member is within range. Nothing needs your review right now.</p></section>' : "";
    }
    const items = S.issues(focus.ev).slice(0, 8);
    const list = items.map(i => '<div class="review-row"><span class="lvl txt-' + i.level + '">' + S.LEVEL_NAME[i.level] + '</span><span class="grow">' + S.esc(i.text) + "</span></div>").join("") +
      (focus.activeCrit ? '<div class="review-row"><span class="lvl txt-crit">Alerts</span><span class="grow">' + focus.activeCrit + " critical alert" +
        (focus.activeCrit > 1 ? "s" : "") + ' waiting. <a href="alerts.html?astronauta=' + encodeURIComponent(focus.a.id) + '">Review alerts</a></span></div>' : "");
    return '<section class="panel"><div class="panel-head" style="margin-bottom:6px"><h2>Needs your review: ' + S.esc(focus.a.nombre) + "</h2>" +
      '<div style="display:flex;gap:10px;flex-wrap:wrap"><a class="btn secondary" href="status.html?astronauta=' + encodeURIComponent(focus.a.id) + '">Open full record</a>' +
      '<button class="btn" type="button" id="contact" data-id="' + S.esc(focus.a.id) + '" aria-haspopup="dialog">Contact astronaut</button></div></div>' + list + "</section>";
  }

  function render() {
    const day = S.missionDay(mision);
    const sub = (mision ? mision.nombre + " · " : "") + (day ? "Day " + day.day + (day.total ? " of " + day.total : "") + " · " : "") + "medical officer view";
    const tabBtn = (id, label) => '<button type="button" role="tab" id="tab-' + id + '" aria-controls="panel-' + id + '" aria-selected="' + (tab === id) + '" data-tab="' + id + '"' +
      (tab === id ? "" : ' tabindex="-1"') + ">" + label + "</button>";
    main.innerHTML =
      '<section class="page-head"><div><h1>Crew health</h1><p>' + S.esc(sub) + "</p></div>" +
      '<div class="actions"><button class="btn secondary" type="button" id="export"' + (rows.length ? "" : " disabled") + ">Export Excel report</button></div></section>" +
      '<section><div class="tabs" role="tablist" aria-label="Crew views">' + tabBtn("overview", "Crew overview") + tabBtn("health", "Crew health") + "</div>" +
      '<div class="panel tab-panel" role="tabpanel" id="panel-' + tab + '" aria-labelledby="tab-' + tab + '">' + (tab === "overview" ? overview() : health()) + "</div></section>" +
      review();

    if (tab === "overview") {
      S.pager(document.getElementById("crew-pager"), page, Math.ceil(rows.length / PAGE_SIZE), p => { page = p; render(); }, true);
      main.querySelectorAll("tr[data-href]").forEach(tr => tr.addEventListener("click", ev => {
        if (ev.target.closest("a")) return;
        window.location.href = tr.dataset.href;
      }));
    }
    main.querySelectorAll("[data-tab]").forEach(b => b.addEventListener("click", () => {
      tab = b.dataset.tab;
      try { sessionStorage.setItem("soma.crewTab", tab); } catch (e) { /* keep in memory */ }
      render();
      document.getElementById("tab-" + tab).focus();
    }));
    main.querySelector('[role="tablist"]').addEventListener("keydown", ev => {
      if (ev.key !== "ArrowRight" && ev.key !== "ArrowLeft") return;
      tab = tab === "overview" ? "health" : "overview"; render(); document.getElementById("tab-" + tab).focus();
    });
    const contact = document.getElementById("contact");
    if (contact) contact.addEventListener("click", () => {
      const r = rows.find(x => x.a.id === contact.dataset.id);
      const labels = S.issues(r.ev).map(i => (S.METRICS[i.key] ? S.METRICS[i.key].label : "radiation dose").toLowerCase()).slice(0, 3);
      S.openCompose(contact, r.a, labels.length
        ? "Please come to the medical bay today for a review of your " + labels.join(", ").replace(/, ([^,]*)$/, " and $1") + " readings."
        : "Please come to the medical bay for a routine check-up.");
    });
    const exp = document.getElementById("export");
    if (exp) exp.addEventListener("click", exportXlsx);
  }

  // ---------------------------------------------------------------- Excel report
  function exportXlsx() {
    const X = window.SomaXlsx, ST = X.STYLE;
    const day = S.missionDay(mision);
    const now = new Date();
    const head = ["Astronaut", "Role", "Status", "Sleep (h)", "Resting HR (bpm)", "Systolic (mmHg)", "Diastolic (mmHg)",
      "SpO2 (%)", "Temperature (°C)", "Glucose (mg/dL)", "Radiation (mSv)", "Active alerts", "Last self-check"];
    const statusStyle = { crit: ST.statusCrit, warn: ST.statusWarn, ok: ST.statusOk, none: ST.statusNone };
    const num = (r, key, decimals) => {
      const rd = r.ev.readings[key];
      if (rd.value === null || rd.value === undefined) return { v: "—", s: ST.statusNone };
      const one = decimals === 1;
      const s = rd.level === "crit" ? (one ? ST.num1Crit : ST.num0Crit) : rd.level === "warn" ? (one ? ST.num1Warn : ST.num0Warn) : (one ? ST.num1 : ST.num0);
      return { v: Number(rd.value), s };
    };
    const sheet = [
      [{ v: "SOMA · Crew health report", s: ST.title }],
      [{ v: (mision ? mision.nombre + " · " : "") + (day ? "Day " + day.day + (day.total ? " of " + day.total : "") + " · " : "") +
        "Generated " + S.isoDay(now) + " " + String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0") + " by " + user.codigo, s: ST.subtitle }],
      [],
      head.map(h => ({ v: h, s: ST.header }))
    ];
    rows.forEach(r => {
      const dia = r.ev.readings.bp.extra;
      sheet.push([
        { v: r.a.nombre, s: ST.textBold }, { v: S.CARGOS[r.a.cargo] || r.a.cargo || "", s: ST.text },
        { v: S.LEVEL_NAME[r.ev.overall], s: statusStyle[r.ev.overall] },
        num(r, "sleep", 1), num(r, "hr", 0), num(r, "bp", 0),
        dia === null || dia === undefined ? { v: "—", s: ST.statusNone } : { v: Number(dia), s: ST.num0 },
        num(r, "spo2", 1), num(r, "temp", 1), num(r, "glucose", 0), num(r, "radiation", 1),
        { v: r.active.length, s: r.active.length ? ST.num0Warn : ST.num0 },
        { v: r.lastDaily ? S.isoDay(r.lastDaily) : "Never", s: ST.text }
      ]);
    });
    const last = sheet.length;
    sheet.push([]);
    sheet.push([{ v: "Summary", s: ST.label }]);
    [["Crew monitored", rows.length, ST.num0], ["Critical", count("crit"), ST.num0Crit], ["Needs attention", count("warn"), ST.num0Warn],
      ["Normal", count("ok"), ST.num0], ["No data", count("none"), ST.num0]].forEach(([l, n, s]) => sheet.push([{ v: l, s: ST.textBold }, { v: n, s }]));
    sheet.push([]);
    sheet.push([{ v: "Thresholds: SOMA mission parameters. Educational reference based on NASA HRP human physiology risks and NASA OSDR OSD-569.", s: ST.subtitle }]);
    const blob = X.workbook(sheet, {
      sheetName: "Crew report",
      widths: [26, 20, 16, 11, 16, 15, 16, 10, 16, 15, 15, 13, 16],
      merges: ["A1:M1", "A2:M2"],
      heights: { 0: 26, 3: 32 },
      freezeRow: 4,
      autoFilter: "A4:" + X.col(head.length - 1) + last
    });
    X.download(blob, "soma-crew-report-" + S.isoDay(now) + ".xlsx");
  }
})();
