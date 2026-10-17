/* md-docs render pipeline core (Phase 0 / T0.4). Pure: no document access —
 * the node tests load THIS file directly (no replica drift).
 * MDPipeline.render(src, transformers[, markedGlobal]):
 *   clean Marked instance -> enabled transformers applied in registry
 *   order (phase, then id) -> parse. Returns null when marked's instance
 *   API is absent (caller falls back to fallbackRender).
 */
(function (g) {
  'use strict';
  function orderKey(t) {
    return [(t && typeof t.phase === 'number' ? t.phase : 999), String(t && t.id ? t.id : '')];
  }
  function render(src, transformers, markedGlobal) {
    var mk = markedGlobal || (typeof g.marked !== 'undefined' ? g.marked : undefined);
    if (!mk || typeof mk.Marked !== 'function') return null;
    var inst = new mk.Marked();
    var list = (transformers || []).slice();
    list.sort(function (a, b) {
      var ka = orderKey(a);
      var kb = orderKey(b);
      if (ka[0] !== kb[0]) return ka[0] - kb[0];
      return ka[1].localeCompare(kb[1]);
    });
    list.forEach(function (t) { t.fn(inst); });
    return inst.parse(src);
  }
  g.MDPipeline = { render: render };
})(typeof window !== 'undefined' ? window : globalThis);