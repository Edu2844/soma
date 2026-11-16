/* Health guide: how spaceflight affects each body zone, what your readings mean and today's routine. */
(async function () {
  "use strict";
  const S = window.Soma;
  const user = S.requireAuth();
  const main = document.getElementById("main");
  const staff = S.isStaff(user);
  const other = S.viewingOther(user);
  S.renderShell("guide", user);

  const astronautaId = S.targetAstronautId(user);
  const POINTS = { CONTROL_MEDICO: 20, CARDIO: 15, FUERZA: 15, HIDRATACION: 10, SUENO: 10, OTRA: 5 };

  const INFO = {
    brain: { does: "Controls sleep, mood, focus and decision-making.", hazard: "Isolation and confinement",
      risk: "Sleep loss, a disrupted body clock, stress and mood changes after months confined, far from family, with a heavy workload." },
    heart: { does: "Pumps blood and keeps your blood pressure stable.", hazard: "Gravity",
      risk: "In microgravity fluids shift toward the head and the heart works less; back in gravity you may feel dizzy or faint when standing up." },
    lungs: { does: "Bring oxygen into the blood and remove carbon dioxide.", hazard: "Hostile, closed environment",
      risk: "Cabin air is recycled: a life-support failure, high CO2 or a spacewalk can lower your oxygen level." },
    metabolism: { does: "Regulates energy (glucose), fluids and nutrition.", hazard: "Distance from Earth",
      risk: "Food is limited and packaged; eating or drinking too little leads to weight loss, dehydration and kidney stones." },
    muscles: { does: "Support the body and let you move.", hazard: "Gravity",
      risk: "Without body weight, bones lose density and muscles waste away. Daily exercise is the main defense." },
    immune: { does: "Defends the body against infection.", hazard: "Hostile, closed environment",
      risk: "Stress and radiation weaken your defenses and can reactivate dormant viruses; fever is an early warning sign." },
    radiation: { does: "Your whole body receives space radiation; dosimeters measure it.", hazard: "Space radiation",
      risk: "Outside Earth's protection, radiation raises the long-term risk of cancer and can affect the nervous system and eyes." }
  };
  const ADVICE = {
    sleep: { ok: "Your sleep is on target. Keep a fixed rest schedule.", warn: "Dim cabin lights an hour before rest and avoid screens. Tell the crew if you keep sleeping less.", crit: "Tell the crew so critical tasks can be reassigned and talk to the crew medical officer today. Dim cabin lights 1 h before rest." },
    mood: { ok: "Keep in touch with family and take short breaks.", warn: "Schedule a private call with family or the psychologist. Short breaks and looking at Earth help.", crit: "Talk to the crew medical officer or the psychologist today. You do not have to wait for the next scheduled call." },
    stress: { ok: "Your stress is manageable. Keep your breaks in the schedule.", warn: "Take a 10-minute break with breathing exercises or music, and share the load with the crew.", crit: "Tell the commander and the crew medical officer. Your workload needs to be reviewed today." },
    hr: { ok: "In range. Keep your exercise routine.", warn: "Repeat the measurement after 10 minutes of rest. Drink water and avoid intense effort.", crit: "Stop physical activity, rest and contact the crew medical officer now." },
    bp: { ok: "In range. Keep your exercise and hydration routine.", warn: "Repeat seated after 5 minutes of rest. Reduce salt and caffeine today.", crit: "Rest and contact the crew medical officer now." },
    spo2: { ok: "Your oxygen level is good.", warn: "Check the finger sensor and repeat. Report it if it stays low and check the cabin CO2 reading.", crit: "Follow the oxygen procedure and contact the crew medical officer now." },
    glucose: { ok: "In range. Keep regular meals.", warn: "Repeat before your next meal. Eat on schedule and stay hydrated.", crit: "If it is low, take fast sugar now. Contact the crew medical officer." },
    exercise: { ok: "Daily exercise is your main defense against bone and muscle loss. Keep it up.", warn: "Aim for at least 30 minutes of cardio plus resistance training today.", crit: "Aim for at least 30 minutes of cardio plus resistance training today." },
    temp: { ok: "No fever.", warn: "Rest, drink water and measure again in 2 hours.", crit: "Limit contact with the crew and contact the crew medical officer now." },
    radiation: { ok: "Your dose is within the mission limit. Wear the dosimeter at all times.", warn: "You are close to the mission limit. Avoid optional time in less shielded areas.", crit: "Limit reached. Follow the crew medical officer's instructions and stay in the shielded area." }
  };

  let ev = null, actividades = [], selected = "brain";

  try {
    if (astronautaId) {
      const [ctx, metricas, acts] = await Promise.all([
        S.loadContext(astronautaId),
        S.metricsRange(astronautaId, 30),
        S.api("/api/actividades/astronauta/" + encodeURIComponent(astronautaId) + "?fecha=" + S.isoDay()).catch(() => [])
      ]);
      if (!other) S.setRailName(ctx.astronauta.nombre);
      ev = S.evaluate(S.latestValues(metricas), ctx.astronauta, ctx.mision);
      actividades = acts || [];
      // Open the most affected zone first
      selected = S.ZONES.slice().sort((a, b) => S.LEVEL_RANK[ev.zones[b.id]] - S.LEVEL_RANK[ev.zones[a.id]])[0].id;
    }
    render();
  } catch (e) {
    S.showError(main, e);
  }

  function zoneLevel(id) { return ev ? ev.zones[id] : "none"; }

  function indicator(key) {
    const def = S.METRICS[key];
    const label = def ? def.label : "Radiation dose";
    const unit = def ? def.unit : "mSv";
    const r = ev ? ev.readings[key] : null;
    const lv = r ? r.level : "none";
    let value = r && r.value !== null ? S.fmtNum(r.value, def ? def.decimals : 1) : null;
    if (value && key === "bp" && r.extra) value += "/" + r.extra;
    const range = r ? r.range : (def ? def.range(S.params(null)) : "");
    const advice = lv === "none"
      ? (ev ? "No reading yet. Add it in your self-check." : "Open an astronaut's record to see their values.")
      : ADVICE[key][lv];
    return '<div class="box"><div class="panel-head" style="margin:0"><strong>' + S.esc(label) + "</strong>" + (ev ? S.status(lv) : "") + "</div>" +
      '<div style="font-size:13px;color:var(--faint);margin:4px 0 8px">' + S.esc(range) +
      (value ? ' · you: <strong style="color:var(--ink)">' + S.esc(value + (unit.startsWith("/") ? unit : " " + unit)) + "</strong>" : "") + "</div>" +
      '<div style="font-size:14px;color:var(--muted);line-height:1.55">' + S.esc(advice) + "</div></div>";
  }

  function render() {
    const zone = S.ZONES.find(z => z.id === selected);
    const info = INFO[selected];
    const idx = S.ZONES.indexOf(zone) + 1;
    const list = S.ZONES.map((z, i) => {
      const lv = zoneLevel(z.id);
      return '<button type="button" class="' + lv + '" data-zone="' + z.id + '"' + (z.id === selected ? ' aria-current="true"' : "") + ">" +
        '<span class="txt-' + lv + '">' + S.esc(z.name) + "</span>" + '<span class="n">' + (i + 1) + "</span></button>";
    }).join("");

    const done = actividades.filter(x => x.estado === "COMPLETADA");
    const pts = actividades.reduce((s, x) => s + (POINTS[x.tipo] || 5), 0);
    const donePts = done.reduce((s, x) => s + (POINTS[x.tipo] || 5), 0);
    const routine = astronautaId ? '<section class="panel"><div class="panel-head" style="margin-bottom:12px"><h2>Daily health routine</h2>' +
      '<div style="display:flex;align-items:center;gap:12px"><div class="progress" aria-hidden="true"><span style="width:' + (pts ? Math.round(donePts / pts * 100) : 0) + '%"></span></div>' +
      '<span style="font-size:14px;color:var(--muted)">' + donePts + " of " + pts + " pts today</span></div></div>" +
      (actividades.length ? '<div class="routine">' + actividades.map(x => {
        const isDone = x.estado === "COMPLETADA";
        return '<label class="check"><input type="checkbox" data-id="' + S.esc(x.id) + '"' + (isDone ? " checked" : "") + ">" +
          '<span class="grow"><strong class="' + (isDone ? "done" : "") + '">' + S.esc(S.activityName(x.nombre)) + "</strong>" +
          '<br><span class="desc">' + S.esc(x.descripcion || (x.duracionMin ? x.duracionMin + " minutes" : "")) + "</span></span>" +
          '<span class="pts">+' + (POINTS[x.tipo] || 5) + " pts</span></label>";
      }).join("") + "</div>" : '<p class="empty">No activities planned for today. Your crew medical officer assigns them.</p>') +
      '<div id="routine-msg"></div></section>' : "";

    main.innerHTML =
      '<section class="page-head"><div><h1>Health guide</h1><p>How spaceflight affects each part of the body, and what you can do.</p></div>' +
      (astronautaId ? '<div class="actions"><a class="btn" href="selfcheck.html' + (other ? "?astronauta=" + encodeURIComponent(astronautaId) : "") + '">Open self-check</a></div>' : "") + "</section>" +
      '<section class="row">' +
      '<div class="panel grow-1" style="flex-basis:300px;flex-grow:0"><h2 style="margin-bottom:10px">Body zones</h2><div class="zone-list">' + list + "</div></div>" +
      '<div class="panel grow-2"><div class="panel-head" style="align-items:flex-start"><div><div class="kicker">Zone ' + idx + " of 7</div><h2 style=\"font-size:26px\">" + S.esc(zone.name) + "</h2></div>" +
      (ev ? S.status(zoneLevel(selected)) : "") + "</div>" +
      '<div class="two-col" style="margin:14px 0 18px;line-height:1.6"><div><div class="kicker">What it does</div><div style="color:var(--muted)">' + S.esc(info.does) + "</div></div>" +
      '<div><div class="kicker">Spaceflight hazard: ' + S.esc(info.hazard.toLowerCase()) + '</div><div style="color:var(--muted)">' + S.esc(info.risk) + "</div></div></div>" +
      '<div class="two-col">' + zone.metrics.map(indicator).join("") + "</div></div></section>" + routine +
      '<section class="panel"><h2>Sources and references</h2><p style="margin:6px 0 4px;font-size:14px;color:var(--muted)">' +
      "SOMA's thresholds and guidance are educational and based on these NASA resources. They do not replace the judgment of the crew medical officer.</p>" +
      S.sourcesHtml() + "</section>";

    main.querySelectorAll("[data-zone]").forEach(b => b.addEventListener("click", () => { selected = b.dataset.zone; render(); }));
    main.querySelectorAll(".routine input").forEach(box => box.addEventListener("change", async () => {
      box.disabled = true;
      try {
        const updated = await S.api("/api/actividades/" + encodeURIComponent(box.dataset.id) + "/estado", {
          method: "PATCH", body: { estado: box.checked ? "COMPLETADA" : "PENDIENTE" }
        });
        const i = actividades.findIndex(x => x.id === box.dataset.id);
        if (i >= 0 && updated) actividades[i] = updated;
        render();
      } catch (e) {
        box.checked = !box.checked; box.disabled = false;
        S.showError(document.getElementById("routine-msg"), e);
      }
    }));
  }
})();
