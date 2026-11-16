/* My Status: anatomical figure with the latest readings, today's checklist and latest events. */
(async function () {
  "use strict";
  const S = window.Soma;
  const user = S.requireAuth();
  const main = document.getElementById("main");
  const staff = S.isStaff(user);
  const other = S.viewingOther(user);   // staff looking at someone else's record
  S.renderShell(other ? "crew" : "status", user);

  let ev_ = null, leaders = "";

  const astronautaId = S.targetAstronautId(user);
  if (!astronautaId) { window.location.href = "crew.html"; return; }

  // Points per activity type for the daily checklist
  const POINTS = { CONTROL_MEDICO: 20, CARDIO: 15, FUERZA: 15, HIDRATACION: 10, SUENO: 10, OTRA: 5 };
  // Whether an out-of-range value is "low" or "high", for the headline
  const DIRECTION = {
    sleep: () => "low", spo2: () => "low", mood: () => "low", exercise: () => "low",
    bp: () => "high", stress: () => "high", radiation: () => "high",
    hr: v => v > 85 ? "high" : "low", temp: v => v >= 37.3 ? "high" : "low",
    glucose: (v, p) => v > p.glucosaMaxMgDl ? "high" : "low"
  };
  const LABEL_IN_SENTENCE = {
    sleep: "sleep", hr: "resting heart rate", bp: "blood pressure", spo2: "oxygen saturation",
    temp: "body temperature", glucose: "blood glucose", mood: "mood", stress: "stress level",
    exercise: "cardio exercise", radiation: "radiation dose"
  };

  // Callouts around the figure: [metric, side, top, organ point in body coordinates]
  const W = 660, H = 560, OX = 210, OY = 14, SC = 1.2;
  const CALLOUTS = [
    ["sleep", "left", 6, [100, 30]], ["hr", "left", 196, [95, 124]], ["bp", "left", 386, [49, 135]],
    ["temp", "right", 6, [109, 70]], ["spo2", "right", 196, [120, 122]], ["radiation", "right", 386, [194, 300]]
  ];

  try {
    const [ctx, metricas, actividades, alertas] = await Promise.all([
      S.loadContext(astronautaId),
      S.metricsRange(astronautaId, 30),
      S.api("/api/actividades/astronauta/" + encodeURIComponent(astronautaId) + "?fecha=" + S.isoDay()).catch(() => []),
      S.api("/api/alertas/astronauta/" + encodeURIComponent(astronautaId) + "?size=5").catch(() => ({ contenido: [] }))
    ]);
    const a = ctx.astronauta;
    if (!other) S.setRailName(a.nombre);
    const ev = S.evaluate(S.latestValues(metricas), a, ctx.mision);
    const day = S.missionDay(ctx.mision);
    render(a, ctx.mision, ev, day, actividades || [], (alertas && alertas.contenido) || [], metricas.length);
  } catch (e) {
    S.showError(main, e);
  }

  /** Default text for "Contact astronaut", built from the readings out of range. */
  function suggestionFor(ev) {
    const keys = S.issues(ev).map(i => LABEL_IN_SENTENCE[i.key]).filter(Boolean).slice(0, 3);
    return keys.length
      ? "Please come to the medical bay today for a review of your " + keys.join(", ").replace(/, ([^,]*)$/, " and $1") + " readings."
      : "Please come to the medical bay for a routine check-up when you have a moment.";
  }

  function headline(a, ev) {
    const name = S.firstName(a.nombre);
    const top = S.issues(ev)[0];
    if (other) {
      // The medical officer reads about the astronaut in the third person
      if (!top) return ev.overall === "none" ? a.nombre + " has no readings yet." : "All of " + a.nombre + "'s readings are within range.";
      const rs = ev.readings[top.key];
      const ds = DIRECTION[top.key] ? DIRECTION[top.key](Number(rs.value), ev.p) : "out of range";
      return a.nombre + "'s " + (LABEL_IN_SENTENCE[top.key] || "reading") + " is " + (top.level === "crit" ? "critically " : "") + ds + ".";
    }
    if (!top) return ev.overall === "none" ? name + ", no readings yet." : name + ", all readings are within range.";
    const r = ev.readings[top.key];
    const dir = DIRECTION[top.key] ? DIRECTION[top.key](Number(r.value), ev.p) : "out of range";
    const what = LABEL_IN_SENTENCE[top.key] || "reading";
    return top.level === "crit"
      ? name + ", your " + what + " is critically " + dir + "."
      : name + ", your " + what + " is " + dir + ".";
  }

  function subline(mision, ev, day) {
    const where = day ? "Day " + day.day + (day.total ? " of " + day.total : "") + (mision ? " on " + mision.nombre + ". " : ". ") : "";
    if (ev.overall === "crit") return where + (other ? "Review the readings below and contact the astronaut today." : "Talk to the crew medical officer today and hand off critical tasks to the crew.");
    if (ev.overall === "warn") return where + "Some readings need attention. Repeat the measurement and follow the guide.";
    if (ev.overall === "ok") return where + "Keep up your daily routine.";
    return where + "Start your first self-check to see your status here.";
  }

  function callout(key, side, top, point) {
    const r = key === "radiation" ? ev_.readings.radiation : ev_.readings[key];
    const def = S.METRICS[key];
    const label = def ? def.label : "Radiation dose";
    const unit = def ? def.unit : "mSv";
    const decimals = def ? def.decimals : 1;
    let value = S.fmtNum(r.value, decimals);
    if (key === "bp" && r.value !== null && r.extra !== undefined && r.extra !== null) value += "/" + r.extra;
    const px = OX + point[0] * SC, py = OY + point[1] * SC;
    const ax = side === "left" ? 186 : W - 186, ay = top + 52;
    leaders += '<polyline points="' + ax + "," + ay + " " + (ax + (side === "left" ? 22 : -22)) + "," + ay + " " + px.toFixed(0) + "," + py.toFixed(0) +
      '" fill="none" stroke="var(--leader)" stroke-width="1.25"></polyline><circle cx="' + px.toFixed(0) + '" cy="' + py.toFixed(0) +
      '" r="4" fill="var(--ink)" stroke="var(--page)" stroke-width="2"></circle>';
    const when = r.fecha ? '<div class="meta" style="margin-top:2px">' + S.esc(S.fmtDate(r.fecha)) + "</div>" : "";
    return '<div class="callout ' + side + '" style="top:' + top + 'px">' +
      '<div class="name">' + S.esc(label) + "</div>" +
      '<div class="num ' + r.level + '">' + S.esc(value) + (r.value !== null ? " <small>" + S.esc(unit) + "</small>" : "") + "</div>" +
      '<div class="meta"><span>' + (r.value === null ? "No reading yet" :
        '<strong class="status ' + r.level + '" style="font-size:13px">' + S.LEVEL_NAME[r.level] + ".</strong> " + S.esc(r.range)) + "</span></div>" + when + "</div>";
  }

  function render(a, mision, ev, day, actividades, alertas, count) {
    ev_ = ev;
    const blocks = CALLOUTS.map(c => callout(c[0], c[1], c[2], c[3])).join("");
    const figure = '<div class="figure"><div class="body">' + S.bodySvg(ev.zones, 240, 528) + "</div>" +
      '<svg class="leaders" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + " " + H + '" aria-hidden="true">' + S.svgVars(leaders) + "</svg>" + blocks + "</div>";

    const done = actividades.filter(x => x.estado === "COMPLETADA");
    const totalPts = actividades.reduce((s, x) => s + (POINTS[x.tipo] || 5), 0);
    const donePts = done.reduce((s, x) => s + (POINTS[x.tipo] || 5), 0);
    const checklist = actividades.length ? actividades.map(x => {
      const isDone = x.estado === "COMPLETADA";
      return '<label class="check"><input type="checkbox" data-id="' + S.esc(x.id) + '"' + (isDone ? " checked" : "") + ">" +
        '<span class="grow"><span class="' + (isDone ? "done" : "") + '">' + S.esc(S.activityName(x.nombre)) + "</span>" +
        (x.duracionMin ? '<br><span class="desc">' + x.duracionMin + " min</span>" : "") + "</span>" +
        '<span class="pts">' + (POINTS[x.tipo] || 5) + " pts</span></label>";
    }).join("") : '<p class="empty">No activities planned for today.</p>';

    const events = alertas.length ? alertas.slice(0, 4).map(al =>
      '<div class="list-row"><span class="grow txt-' + (S.SEVERITY_LEVEL[al.severidad] || "none") + '">' + S.esc(S.alertText(al.mensaje)) + "</span>" +
      '<span class="when">' + S.esc(S.fmtDateTime(al.fecha)) + "</span></div>").join("") : '<p class="empty">No alerts so far.</p>';

    const id = encodeURIComponent(a.id);
    main.innerHTML =
      (other ? S.viewingBanner(a, "status") : "") +
      '<section class="page-head"><div class="headline"><div>' +
      '<h1 class="txt-' + (ev.overall === "ok" || ev.overall === "none" ? "none" : ev.overall) + '" style="' + (ev.overall === "ok" || ev.overall === "none" ? "color:var(--ink)" : "") + '">' + S.esc(headline(a, ev)) + "</h1><p>" + S.esc(subline(mision, ev, day)) + "</p>" +
      '<p style="font-size:14px;margin-top:4px">' + S.esc((S.CARGOS[a.cargo] || a.cargo || "") + " · " + count + " measurements in the last 30 days") + "</p></div></div>" +
      '<div class="actions">' + (other ? '<button type="button" class="btn secondary" id="contact" aria-haspopup="dialog">Contact astronaut</button>' : "") +
      '<a class="btn" href="selfcheck.html' + (other ? "?astronauta=" + id : "") + '">Start self-check</a></div></section>' +
      '<section class="row">' +
      '<div class="panel figure-panel grow-2" style="flex-basis:680px">' + figure + "</div>" +
      '<div class="stack grow-1">' +
      '<div class="panel"><h2>Today\'s checklist</h2><div style="font-size:14px;color:var(--muted);margin-top:2px">' +
      done.length + " of " + actividades.length + " done, " + donePts + " of " + totalPts + " points</div>" +
      '<div id="checklist">' + checklist + '</div><div id="check-msg"></div></div>' +
      '<div class="panel"><div class="panel-head"><h2>Latest events</h2><a href="alerts.html' + (other ? "?astronauta=" + id : "") + '" style="font-size:14px">All alerts</a></div>' + events + "</div>" +
      "</div></section>";

    const contact = document.getElementById("contact");
    if (contact) contact.addEventListener("click", () => S.openCompose(contact, a, suggestionFor(ev)));
    main.querySelectorAll("#checklist input").forEach(box => box.addEventListener("change", async () => {
      box.disabled = true;
      try {
        await S.api("/api/actividades/" + encodeURIComponent(box.dataset.id) + "/estado", {
          method: "PATCH", body: { estado: box.checked ? "COMPLETADA" : "PENDIENTE" }
        });
        window.location.reload();
      } catch (e) {
        box.checked = !box.checked; box.disabled = false;
        S.showError(document.getElementById("check-msg"), e);
      }
    }));
  }
})();
