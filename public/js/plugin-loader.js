/* md-docs plugin settings store + lazy loader (T0.3; composite rewrite + ensureActive = T2.8).
 * localStorage['md-docs.plugins'] = {pluginId: bool} overrides; unset keys
 * merge with the registry defaults. Egress rows load only after
 * confirmEgress(). Script/link nodes are injected ONCE (id-tagged).
 * Test hooks: setStoreHost(o) / setInjectHost(o) override the closures.
 *
 * Registration shapes (plugins):
 *   MDPluginUseObjects[id] = a full marked use-object ({hooks, renderer,
 *     extensions, ...}) — hooks are CHAINED by the composite transformer
 *     (marked v12 hooks are single-fn-per-instance; one shared
 *     preprocess/postprocess pipeline in registry order).
 *   MDPluginEnhancers[id] = (rootEl) => void — post-render DOM pass.
 *   MDPluginTransformers[id] = (inst) => void — legacy direct path.
 */
(function (g) {
  'use strict';
  var PREFIX = 'md-docs.plugins';
  var store = {
    get: function () {
      try { return g.localStorage ? g.localStorage.getItem(PREFIX) : null; } catch (e) { return null; }
    },
    set: function (v) {
      try { if (g.localStorage) g.localStorage.setItem(PREFIX, v); } catch (e) { /* ignore */ }
    },
  };
  var inject = {
    node: function (n) {
      if (typeof document !== 'undefined') document.head.appendChild(n);
    },
  };
  var injected = new Set();
  var egressConfirmed = false;

  function registry() {
    return (g.MDPlugins && g.MDPlugins.byId) ? g.MDPlugins : null;
  }
  function overrides() {
    var raw = store.get();
    var o = {};
    try { o = raw ? JSON.parse(raw) : {}; } catch (e) { o = {}; }
    if (!o || typeof o !== 'object' || Array.isArray(o)) o = {};
    return o;
  }
  function getEnabled() {
    var reg = registry();
    var out = {};
    if (reg) reg.rows.forEach(function (r) {
      if (r.kind === 'plugin' && !r.gated && r.default) out[r.id] = true;
    });
    var saved = overrides();
    Object.keys(saved).forEach(function (k) { out[k] = !!saved[k]; });
    return out;
  }
  function setEnabled(id, on) {
    var reg = registry();
    var row = reg ? reg.byId[id] : null;
    if (!row) throw new Error('unknown plugin: ' + id);
    if (row.kind !== 'plugin' || row.gated) throw new Error('not toggleable: ' + id);
    if (row.egress && on && !egressConfirmed) throw new Error('egress row needs confirmEgress() first: ' + id);
    var saved = overrides();
    saved[id] = !!on;
    store.set(JSON.stringify(saved));
  }
  function ensureLoaded(id) {
    var reg = registry();
    var row = reg ? reg.byId[id] : null;
    if (!row || row.kind !== 'plugin' || row.gated) return Promise.reject(new Error('not loadable: ' + id));
    if (row.egress && !egressConfirmed) return Promise.reject(new Error('egress required (badge): ' + id));
    var jobs = [];
    var urls = row.urls || {};
    (urls.js || []).forEach(function (u) { jobs.push(injectScript(u, id)); });
    (urls.css || []).forEach(function (u) { jobs.push(injectCss(u, id)); });
    return Promise.all(jobs);
  }
  function injectScript(u, id) {
    var key = id + '|js|' + u;
    if (injected.has(key)) return Promise.resolve();
    injected.add(key);
    return new Promise(function (res, rej) {
      try {
        var s = document.createElement('script');
        s.src = u;
        s.dataset.mdp = id;
        if (u.endsWith('.mjs')) s.type = 'module';
        s.onload = function () { res(); };
        s.onerror = function () { rej(new Error('script load failed: ' + u)); };
        inject.node(s);
      } catch (e) { rej(e); }
    });
  }
  function injectCss(u, id) {
    var key = id + '|css|' + u;
    if (injected.has(key)) return Promise.resolve();
    injected.add(key);
    return new Promise(function (res, rej) {
      try {
        var l = document.createElement('link');
        l.rel = 'stylesheet';
        l.href = u;
        l.dataset.mdp = id;
        l.onload = function () { res(); };
        l.onerror = function () { rej(new Error('css load failed: ' + u)); };
        inject.node(l);
      } catch (e) { rej(e); }
    });
  }
  /* ensureActive(): load every enabled plugin's module + assets, resolving
   * even when some fail (degraded = plain marked rendering for those). */
  function ensureActive() {
    var reg = registry();
    if (!reg) return Promise.resolve();
    var enabled = getEnabled();
    var ids = Object.keys(enabled).filter(function (k) { return enabled[k]; });
    var jobs = ids.map(function (k) {
      return ensureLoaded(k).catch(function (e) {
        if (g.console && typeof console.warn === 'function') console.warn('[md-docs] plugin load failed:', k, e && e.message);
      });
    });
    return Promise.all(jobs).then(function () { return ids.length; });
  }
  function activeOrder(reg) {
    var enabled = getEnabled();
    var list = Object.keys(enabled).filter(function (k) { return enabled[k]; });
    list.sort(function (x, y) {
      var px = reg.byId[x] ? reg.byId[x].phase : 999;
      var py = reg.byId[y] ? reg.byId[y].phase : 999;
      return (px - py) || String(x).localeCompare(String(y));
    });
    return list;
  }
  /* the ONE composite transformer: chains hooks, applies the rest direct */
  function transformers() {
    var reg = registry();
    var ids = reg ? activeOrder(reg) : [];
    var pres = [];
    var posts = [];
    var others = [];
    ids.forEach(function (id) {
      var use = (g.MDPluginUseObjects && g.MDPluginUseObjects[id]) ? g.MDPluginUseObjects[id] : null;
      if (use && typeof use === 'object') {
        if (use.hooks) {
          if (typeof use.hooks.preprocess === 'function') pres.push(use.hooks.preprocess);
          if (typeof use.hooks.postprocess === 'function') posts.push(use.hooks.postprocess);
          var copy = Object.assign({}, use);
          delete copy.hooks;
          if (Object.keys(copy).length) others.push(copy);
        } else {
          others.push(use);
        }
      } else if (g.MDPluginTransformers && typeof g.MDPluginTransformers[id] === 'function') {
        var legacy = g.MDPluginTransformers[id];
        others.push(function (inst) { legacy(inst); });
      }
    });
    var composite = function (inst) {
      others.forEach(function (o) {
        if (typeof o === 'function') o(inst);
        else if (o && Object.keys(o).length) inst.use(o);
      });
      if (pres.length || posts.length) {
        inst.use({
          hooks: {
            preprocess: function (src) {
              return pres.length ? pres.reduce(function (acc, fn) { return fn(acc); }, src) : src;
            },
            postprocess: function (html) {
              return posts.length ? posts.reduce(function (acc, fn) { return fn(acc); }, html) : html;
            },
          },
        });
      }
    };
    return [{ id: 'md-composite', phase: 0, fn: composite }];
  }
  function enhance(rootEl) {
    var reg = registry();
    if (!reg || !rootEl) return;
    activeOrder(reg).forEach(function (id) {
      if (g.MDPluginEnhancers && typeof g.MDPluginEnhancers[id] === 'function') g.MDPluginEnhancers[id](rootEl);
    });
  }
  function confirmEgress() { egressConfirmed = true; }
  function setStoreHost(o) { store = o; }
  function setInjectHost(o) { inject = o; }

  g.MDPluginLoader = {
    getEnabled: getEnabled,
    setEnabled: setEnabled,
    ensureLoaded: ensureLoaded,
    ensureActive: ensureActive,
    transformers: transformers,
    enhance: enhance,
    confirmEgress: confirmEgress,
    setStoreHost: setStoreHost,
    setInjectHost: setInjectHost,
  };
})(typeof window !== 'undefined' ? window : globalThis);