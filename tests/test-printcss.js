'use strict';
// T6.3 tests: the print/PDF control + the sheet itself
const assert = require('assert');
const fs = require('fs');
const path = require('path');
global.window = global;
require('../public/js/plug-printcss.js');
const E = global.MDPluginEnhancers.printcss;

// --- the control build + click -> print (fake DOM) ---
const clicks = [];
let printed = 0;
global.print = function () { printed++; };
global.document = {
  createElement: (tag) => ({
    tag: tag, className: '', id: '', innerHTML: '',
    addEventListener: (t, f) => { if (t === 'click') clicks.push(f); },
  }),
};
function fakeRoot() {
  return {
    _kids: [],
    querySelector: (s) => null,
    insertBefore: function (n) { this._kids.push(n); return n; },
  };
}
const root = fakeRoot();
E(root);
assert.strictEqual(root._kids.length, 1, 'one control inserted');
const btn = root._kids[0];
assert.strictEqual(btn.id, 'mdp-print-btn', 'button id');
assert.strictEqual(btn.className, 'mdp-print-ctl btn tiny', 'button class (print.css hides it)');
clicks[0]();
assert.strictEqual(printed, 1, 'click prints the live body');
clicks[0]();
assert.strictEqual(printed, 2, 'repeat clicks still print');

// idempotent enhance: the present control blocks a second insert
const root2 = fakeRoot();
root2.querySelector = (s) => (s === '#mdp-print-btn' ? {} : null);
E(root2);
assert.strictEqual(root2._kids.length, 0, 'no re-insert when present');

// safe on a null-ish root (the loader's guarded call shape)
global.MDPluginEnhancers.printcss(null); // must not throw

// --- the stylesheet: media-scoped + the chrome hides + the href rule ---
const css = fs.readFileSync(path.join(__dirname, '../public/css/print.css'), 'utf8');
assert(css.includes('@media print'), 'everything sits inside @media print');
assert(!/@media\s+screen/.test(css), 'no screen rules leak in');
assert(css.includes('.mdp-print-ctl'), 'the control hides under print');
assert(css.includes('.mdp-slides-ctl'), 'the deck control hides under print');
assert(css.includes('.topbar'), 'app chrome (topbar) hidden');
assert(css.includes('#view .copyrow'), 'the link row hidden');
assert(css.includes('attr(href)'), 'external hrefs expand on paper');
assert(css.includes('break-inside'), 'page-break awareness present');
assert(css.includes('print-color-adjust'), 'math/mermaid colors kept exact');
assert(css.includes('@page'), 'page margins declared');

console.log('ok test-printcss');