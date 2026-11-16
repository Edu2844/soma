/* Light / dark theme. Loaded in <head> so the page never flashes the wrong colors. */
(function () {
  "use strict";
  var KEY = "soma.theme";
  var root = document.documentElement;
  function apply(theme) {
    if (theme === "dark") root.setAttribute("data-theme", "dark");
    else root.removeAttribute("data-theme");
  }
  var saved = null;
  try { saved = window.localStorage.getItem(KEY); } catch (e) { saved = null; }
  if (!saved && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) saved = "dark";
  apply(saved);

  var MOON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" fill="currentColor"></path></svg>';
  var SUN = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.5" fill="currentColor"></circle><g stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"></path></g></svg>';

  function isDark() { return root.getAttribute("data-theme") === "dark"; }
  /** Fills a button with the right icon and label and makes it switch the theme. */
  function bind(button) {
    if (!button) return;
    function paint() {
      var dark = isDark();
      button.innerHTML = (dark ? SUN : MOON) + "<span>" + (dark ? "Light mode" : "Dark mode") + "</span>";
      button.setAttribute("aria-pressed", String(dark));
      button.title = dark ? "Switch to light mode" : "Switch to dark mode";
    }
    button.addEventListener("click", function () {
      var next = isDark() ? "light" : "dark";
      apply(next);
      try { window.localStorage.setItem(KEY, next); } catch (e) { /* storage unavailable: applies to this page only */ }
      paint();
    });
    paint();
  }
  window.SomaTheme = { isDark: isDark, bind: bind };
})();
