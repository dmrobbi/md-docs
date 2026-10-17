/* md-docs renderer pane UI (Phase 1 / T1.1 + T1.2).
 * buildRows(reg, enabled) = PURE (the node tests load this file directly);
 * renderPane/wire = the DOM side.
 * Row state: gated -> checked:false + disabled + "not built" badge;
 * egress -> "requires network" warn badge; the toggle = setEnabled +
 * MDApp.rerender; egress-on = the inline confirm then confirmEgress().
 */
(function (g) {
  'use strict';
  var GROUPS = ['diagrams', 'services', 'math', 'code', 'syntax', 'charts', 'media', 'embeds', 'maps', 'experience'];
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function buildRows(reg, enabled) {
    enabled = enabled || {};
    var out = [];
    GROUPS.forEach(function (grp) {
      var rows = reg.rows.filter(function (r) { return r.kind === 'plugin' && r.category === grp; })
        .map(function (r) {
          var row = {
            id: r.id,
            title: r.title,
            checked: !!enabled[r.id],
            disabled: !!r.gated,
            badge: null,
            kind: null,
          };
          if (r.gated) {
            row.checked = false;
            row.badge = 'not built';
            row.kind = 'info';
            row.tooltip = r.phase === null || r.phase === undefined
              ? 'unscheduled - promote from the todo'
              : 'scheduled for phase ' + r.phase + ' of the todo';
          }
          if (r.egress) {
            row.badge = 'requires network';
            row.kind = 'warn';
            row.tooltip = "the document's text goes to a remote service";
          }
          return row;
        });
      if (rows.length) out.push({ group: grp, rows: rows });
    });
    return out;
  }
  function enabledCount(enabled) {
    return Object.keys(enabled).filter(function (k) { return enabled[k]; }).length;
  }
  function pluginTotal(reg) {
    return reg.rows.filter(function (r) { return r.kind === 'plugin'; }).length;
  }
  function renderPane() {
    if (typeof g.document === 'undefined' || !g.MDPlugins) return;
    var pane = g.document.getElementById('rendererPane');
    if (!pane) return;
    var enabled = (g.MDPluginLoader && typeof g.MDPluginLoader.getEnabled === 'function')
      ? g.MDPluginLoader.getEnabled() : {};
    var data = buildRows(g.MDPlugins, enabled);
    var rowsEl = g.document.getElementById('rpRows');
    var html = '';
    data.forEach(function (d) {
      html += '<div class="rp-group">' + esc(d.group) + '</div>';
      d.rows.forEach(function (r) {
        html += '<div class="rp-row' + (r.disabled ? ' disabled' : '') + '">' +
          '<label>' +
          '<input type="checkbox" data-mdp-id="' + esc(r.id) + '"' +
          (r.checked ? ' checked' : '') + (r.disabled ? ' disabled' : '') + ' title="' + esc(r.tooltip || '') + '">' +
          ' ' + esc(r.title) +
          '</label>' +
          (r.badge ? '<span class="rp-badge' + (r.kind === 'warn' ? ' warn' : '') + '" title="' + esc(r.tooltip || '') + '">' + esc(r.badge) + '</span>' : '') +
          '</div>';
      });
    });
    rowsEl.innerHTML = html;
    var count = g.document.getElementById('rpCount');
    if (count) count.textContent = enabledCount(enabled) + ' of ' + pluginTotal(g.MDPlugins) + ' on';
  }
  function wire() {
    if (typeof g.document === 'undefined') return;
    var btn = g.document.getElementById('rendererBtn');
    var pane = g.document.getElementById('rendererPane');
    var closeBtn = g.document.getElementById('rpClose');
    if (!btn || !pane) return;
    btn.addEventListener('click', function () {
      pane.hidden = !pane.hidden;
      if (!pane.hidden) renderPane();
    });
    if (closeBtn) closeBtn.addEventListener('click', function () { pane.hidden = true; });
    var rowsEl = g.document.getElementById('rpRows');
    if (!rowsEl) return;
    rowsEl.addEventListener('change', function (e) {
      var cb = e.target.closest('input[data-mdp-id]');
      if (!cb || cb.disabled) return;
      var id = cb.getAttribute('data-mdp-id');
      var on = cb.checked;
      try {
        g.MDPluginLoader.setEnabled(id, on);
      } catch (err) {
        if (/egress/.test(String(err)) && on) {
          if (!g.confirm("The document's text will be sent to a remote service. Allow?")) { cb.checked = false; return; }
          g.MDPluginLoader.confirmEgress();
          g.MDPluginLoader.setEnabled(id, true);
        } else { cb.checked = false; return; }
      }
      if (g.MDApp && typeof g.MDApp.rerender === 'function') g.MDApp.rerender();
      renderPane();
    });
  }
  g.MDRendererUI = { buildRows: buildRows, enabledCount: enabledCount, renderPane: renderPane };
  if (typeof g.document !== 'undefined') { renderPane(); wire(); }
})(typeof window !== 'undefined' ? window : globalThis);