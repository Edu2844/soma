/* Users (ADMIN only): create accounts, reset passwords and activate or deactivate access. */
(async function () {
  "use strict";
  const S = window.Soma;
  const user = S.requireAuth({ adminOnly: true });
  const main = document.getElementById("main");
  S.renderShell("users", user);

  const ROLE_HELP = {
    TRIPULANTE: "Crew member: sees and records only their own health data. Must be linked to an astronaut.",
    MEDICO: "Medical officer on board: sees the whole crew, reviews alerts and assigns activities, and records their own health data. Must be linked to an astronaut.",
    ADMIN: "Administrator: everything a crew medical officer can do, plus managing users, astronauts and missions."
  };

  let usuarios = [], astronautas = [], openReset = null, roleFilter = "ALL";

  try {
    await load();
  } catch (e) {
    S.showError(main, e);
  }

  async function load() {
    [usuarios, astronautas] = await Promise.all([S.api("/api/usuarios"), S.api("/api/astronautas")]);
    usuarios.sort((a, b) => (a.rol === b.rol ? a.codigo.localeCompare(b.codigo) : ["ADMIN", "MEDICO", "TRIPULANTE"].indexOf(a.rol) - ["ADMIN", "MEDICO", "TRIPULANTE"].indexOf(b.rol)));
    render();
  }

  function astronautName(id) {
    const a = astronautas.find(x => x.id === id);
    return a ? a.nombre : null;
  }

  function freeAstronauts() {
    const taken = new Set(usuarios.filter(u => u.astronautaId).map(u => u.astronautaId));
    return astronautas.filter(a => !taken.has(a.id));
  }

  function render() {
    const active = usuarios.filter(u => u.activo).length;
    const count = rol => usuarios.filter(u => u.rol === rol).length;
    const list = usuarios.filter(u => roleFilter === "ALL" || u.rol === roleFilter);
    const free = freeAstronauts();

    const rows = list.length ? list.map(u => {
      const self = u.id === user.id;
      const linked = u.astronautaId ? (astronautName(u.astronautaId) || "Unknown astronaut") : "—";
      const reset = openReset === u.id
        ? '<tr><td colspan="5" style="background:var(--field)"><form class="reset" data-id="' + S.esc(u.id) + '" style="display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap" novalidate>' +
          '<div style="flex:1;min-width:220px"><label class="lbl" for="np-' + S.esc(u.id) + '">New password for ' + S.esc(u.codigo) + "</label>" +
          '<input class="field" type="password" id="np-' + S.esc(u.id) + '" minlength="8" maxlength="64" autocomplete="new-password" placeholder="At least 8 characters"></div>' +
          '<button class="btn" type="submit">Save password</button><button class="btn secondary" type="button" data-cancel>Cancel</button></form></td></tr>'
        : "";
      return '<tr class="' + (u.activo ? "" : "dim") + '">' +
        '<td><span class="cell-strong">' + S.esc(u.codigo) + "</span>" + (self ? ' <span class="cell-sub">(you)</span>' : "") + "</td>" +
        "<td>" + S.esc(S.ROLES[u.rol] || u.rol) + "</td>" +
        "<td>" + S.esc(linked) + "</td>" +
        "<td>" + (u.activo ? S.status("ok", "Active") : S.status("none", "Deactivated")) + "</td>" +
        '<td style="text-align:right;white-space:nowrap">' +
        '<button class="btn secondary small" type="button" data-reset="' + S.esc(u.id) + '">Reset password</button> ' +
        '<button class="btn secondary small" type="button" data-toggle="' + S.esc(u.id) + '"' + (self ? ' disabled title="You cannot deactivate your own account"' : "") + ">" +
        (u.activo ? "Deactivate" : "Activate") + "</button></td></tr>" + reset;
    }).join("") : '<tr><td colspan="5" class="empty">No users with this role.</td></tr>';

    const filterChips = [["ALL", "All"], ["ADMIN", "Administrators"], ["MEDICO", "Medical officers"], ["TRIPULANTE", "Crew members"]]
      .map(([v, l]) => '<button type="button" class="chip" data-role="' + v + '" aria-pressed="' + (roleFilter === v) + '">' + l + "</button>").join("");
    const astroOptions = '<option value="">Select an astronaut</option>' + free.map(a =>
      '<option value="' + S.esc(a.id) + '">' + S.esc(a.nombre) + " · " + S.esc(S.CARGOS[a.cargo] || a.cargo || "") + "</option>").join("");

    main.innerHTML =
      '<section class="page-head"><div><h1>Users</h1><p>Manage who can sign in to SOMA and what each person can see.</p></div></section>' +
      '<div id="msg"></div>' +
      '<section class="tiles">' + tile("Users", usuarios.length, "") + tile("Active", active, "ok") +
      tile("Medical officers", count("MEDICO"), "") + tile("Crew members", count("TRIPULANTE"), "") + "</section>" +
      '<section class="row">' +
      '<form class="panel grow-1" id="create" style="flex-basis:320px;flex-grow:0" novalidate><h2>Create user</h2>' +
      '<div style="margin-top:14px"><label class="lbl" for="c-codigo">Crew code</label>' +
      '<input class="field" id="c-codigo" minlength="3" maxlength="30" autocomplete="off" placeholder="e.g. lucia.andrade"></div>' +
      '<div style="margin-top:14px"><label class="lbl" for="c-password">Temporary password</label>' +
      '<input class="field" id="c-password" type="password" minlength="8" maxlength="64" autocomplete="new-password" placeholder="At least 8 characters"></div>' +
      '<div style="margin-top:14px"><label class="lbl" for="c-rol">Role</label><select class="field" id="c-rol">' +
      '<option value="TRIPULANTE">Crew member</option><option value="MEDICO">Crew medical officer</option><option value="ADMIN">Administrator</option></select>' +
      '<p id="c-rol-help" style="font-size:13px;color:var(--faint);margin:6px 0 0">' + S.esc(ROLE_HELP.TRIPULANTE) + "</p></div>" +
      '<div style="margin-top:14px" id="c-astro-box"><label class="lbl" for="c-astro">Linked astronaut</label><select class="field" id="c-astro">' + astroOptions + "</select>" +
      '<p style="font-size:13px;color:var(--faint);margin:6px 0 0">' + (free.length ? "Only astronauts without an account are listed." : "Every astronaut already has an account. Create the astronaut first.") + "</p></div>" +
      '<div class="form-actions"><button class="btn" type="submit" id="c-submit">Create user</button></div></form>' +
      '<div class="panel grow-2"><div class="panel-head" style="margin-bottom:12px"><div class="chips" role="group" aria-label="Filter by role">' + filterChips + "</div>" +
      '<span class="note">' + list.length + " of " + usuarios.length + "</span></div>" +
      '<div class="table-wrap"><table class="data"><thead><tr><th>Crew code</th><th>Role</th><th>Astronaut</th><th>Access</th><th></th></tr></thead><tbody>' +
      rows + "</tbody></table></div></div></section>";

    wire();
  }

  function tile(label, value, cls) {
    return '<div class="tile"><div class="label">' + S.esc(label) + '</div><div class="value ' + cls + '">' + value + "</div></div>";
  }

  function message(level, text) {
    document.getElementById("msg").innerHTML = "<div class=\"notice " + level + "\"><div>" + S.esc(text) + "</div></div>";
  }

  function wire() {
    const rol = document.getElementById("c-rol");
    const astroBox = document.getElementById("c-astro-box");
    const syncRole = () => {
      document.getElementById("c-rol-help").textContent = ROLE_HELP[rol.value];
      astroBox.hidden = rol.value === "ADMIN";
    };
    rol.addEventListener("change", syncRole);
    syncRole();

    document.getElementById("create").addEventListener("submit", async ev => {
      ev.preventDefault();
      const codigo = document.getElementById("c-codigo").value.trim();
      const password = document.getElementById("c-password").value;
      const astronautaId = rol.value !== "ADMIN" ? document.getElementById("c-astro").value : "";
      if (codigo.length < 3 || codigo.length > 30) return message("warn", "The crew code must be 3 to 30 characters long.");
      if (/\s/.test(codigo)) return message("warn", "The crew code cannot contain spaces.");
      if (password.length < 8 || password.length > 64) return message("warn", "The password must be 8 to 64 characters long.");
      if (rol.value !== "ADMIN" && !astronautaId) return message("warn", "Select the astronaut this account belongs to. Crew members and medical officers are on board.");
      const btn = document.getElementById("c-submit");
      btn.disabled = true; btn.textContent = "Creating…";
      try {
        const created = await S.api("/api/usuarios", { method: "POST", body: { codigo, password, rol: rol.value, astronautaId: astronautaId || null } });
        usuarios.push(created);
        await load();
        message("ok", "User " + created.codigo + " created. Share the temporary password with them privately.");
      } catch (e) {
        btn.disabled = false; btn.textContent = "Create user";
        message("crit", e.status === 409 ? "The crew code " + codigo + " is already in use. Choose another one." : e.message);
      }
    });

    main.querySelectorAll("[data-role]").forEach(b => b.addEventListener("click", () => { roleFilter = b.dataset.role; render(); }));
    main.querySelectorAll("[data-reset]").forEach(b => b.addEventListener("click", () => {
      openReset = openReset === b.dataset.reset ? null : b.dataset.reset;
      render();
      const input = openReset && document.getElementById("np-" + openReset);
      if (input) input.focus();
    }));
    main.querySelectorAll("[data-cancel]").forEach(b => b.addEventListener("click", () => { openReset = null; render(); }));
    main.querySelectorAll("form.reset").forEach(f => f.addEventListener("submit", async ev => {
      ev.preventDefault();
      const id = f.dataset.id;
      const nueva = document.getElementById("np-" + id).value;
      if (nueva.length < 8 || nueva.length > 64) return message("warn", "The new password must be 8 to 64 characters long.");
      try {
        await S.api("/api/usuarios/" + encodeURIComponent(id) + "/password", { method: "PATCH", body: { nuevaPassword: nueva } });
        const u = usuarios.find(x => x.id === id);
        openReset = null;
        render();
        message("ok", "Password updated for " + (u ? u.codigo : "the user") + ".");
      } catch (e) {
        message("crit", e.message);
      }
    }));
    main.querySelectorAll("[data-toggle]").forEach(b => b.addEventListener("click", async () => {
      const u = usuarios.find(x => x.id === b.dataset.toggle);
      b.disabled = true;
      try {
        const updated = await S.api("/api/usuarios/" + encodeURIComponent(u.id) + "/estado?activo=" + (!u.activo), { method: "PATCH" });
        Object.assign(u, updated);
        render();
        message("ok", u.codigo + (u.activo ? " can sign in again." : " can no longer sign in."));
      } catch (e) {
        b.disabled = false;
        message("crit", e.message);
      }
    }));
  }
})();
