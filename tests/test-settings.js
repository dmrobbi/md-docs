'use strict';
const assert = require('assert');
global.window = global;
require('../public/js/plugin-loader.js');
const loader = global.MDPluginLoader;
require('../public/js/plugins.js');

// store host override (node has no localStorage)
let savedState = null;
loader.setStoreHost({
  get: () => savedState,
  set: (v) => { savedState = v; },
});

// defaults: unset keys = the registry defaults
let en = loader.getEnabled();
assert.strictEqual(en.footnotes, true, 'default footnotes');
assert.strictEqual(en.katex, true, 'default katex');
assert.ok(!en.mermaid, 'mermaid not default-on');
assert.ok(!en.prism, 'gated prism never defaulted');

// set/get round-trip, idempotence
loader.setEnabled('alerts', true);
assert.strictEqual(loader.getEnabled().alerts, true, 'alerts on');
loader.setEnabled('alerts', true);
assert.strictEqual(loader.getEnabled().alerts, true, 'idempotent on');
loader.setEnabled('alerts', false);
assert.strictEqual(loader.getEnabled().alerts, false, 'alerts off persists');
loader.setEnabled('alerts', false);
assert.strictEqual(loader.getEnabled().alerts, false, 'idempotent off');
loader.setEnabled('footnotes', false);
assert.strictEqual(loader.getEnabled().footnotes, false, 'default-true overridable off');
assert.strictEqual(JSON.parse(savedState).footnotes, false, 'saved override recorded');
assert.strictEqual(JSON.parse(savedState).alerts, false, 'saved override recorded');

// unknown id = error
assert.throws(() => loader.setEnabled('nope-real', true), /unknown plugin/);

// gated = not toggleable
assert.throws(() => loader.setEnabled('prism', true), /not toggleable/);

// registered transformers only, registry order
global.MDPluginTransformers = {
  zplugin: (m) => m.use('z'),
  aplugin: (m) => m.use('a'),
  mplugin: (m) => m.use('m'),
  disabled: (m) => m.use('disabled-never'),
};
global.MDPlugins.rows.push(
  { kind: 'plugin', id: 'zplugin', census: 900, title: 'z', category: 'syntax', urls: null, egress: false, gated: false, default: false, phase: 5 },
  { kind: 'plugin', id: 'aplugin', census: 901, title: 'a', category: 'syntax', urls: null, egress: false, gated: false, default: false, phase: 4 },
  { kind: 'plugin', id: 'mplugin', census: 902, title: 'm', category: 'syntax', urls: null, egress: false, gated: false, default: false, phase: 4 },
  { kind: 'plugin', id: 'disabled', census: 903, title: 'x', category: 'syntax', urls: null, egress: false, gated: false, default: false, phase: 4 },
);
savedState = JSON.stringify({ zplugin: true, aplugin: true, mplugin: true, disabled: false });
const list = loader.transformers();
assert.deepStrictEqual(list.map((t) => t.id), ['aplugin', 'mplugin', 'zplugin'], 'registry order (phase, id; disabled excluded)');

let enhanced = [];
global.MDPluginEnhancers = {
  aplugin: (el) => enhanced.push('a:' + el),
  zplugin: (el) => enhanced.push('z:' + el),
  mplugin: (el) => enhanced.push('m:' + el),
};
loader.enhance('fixture-root');
assert.deepStrictEqual(enhanced, ['a:fixture-root', 'm:fixture-root', 'z:fixture-root'], 'enhance in registry order');

// async rejection paths (awaited — racy in sync flow otherwise)
(async () => {
  await loader.ensureLoaded('prism').then(
    () => { throw new Error('should have rejected'); },
    (e) => assert.ok(/not loadable/.test(String(e)), 'gated ensureLoaded rejects')
  );
  // egress = deny until confirm
  savedState = JSON.stringify({});
  let deniedMsg = '';
  await loader.ensureLoaded('kroki').then(
    () => { throw new Error('should have rejected'); },
    (e) => { deniedMsg = String(e); assert.ok(/not loadable|egress/.test(deniedMsg), 'kroki refuses without loadable data'); }
  );
  loader.confirmEgress();
  loader.setEnabled('kroki', true);
  assert.strictEqual(loader.getEnabled().kroki, true, 'egress-on after confirm');
  loader.setEnabled('kroki', false);
  console.log('ok test-settings');
})().catch((e) => { console.error(e); process.exit(1); });