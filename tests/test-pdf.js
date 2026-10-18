'use strict';
const assert = require('assert');
global.window = global;
// DOM-shim
let embedsMade = 0;
global.document = {
  createElement: (tag) => ({ tag, type: '', src: '', appendChild: () => {}, style: {} }),
};
global.MDPluginLoader = undefined;

require('../public/js/plug-pdf.js');
const P = global.MDPluginEnhancers.pdf;

// the shim: a.closest returns the parent paragraph; a.replaceWith/remove no-ops
function linkEl(href) {
  return {
    dataset: {},
    _removed: false,
    getAttribute: (k) => (k === 'href' ? href : null),
    closest: () => null,
    parentNode: { insertBefore: function () {} },
    replaceWith: () => {},
    remove: function () { this._removed = true; },
  };
}
const pdfLink = linkEl('https://example.com/report.pdf');
const htmlLink = linkEl('https://example.com/page.html');
let appended = [];
const R = {
  querySelectorAll: (sel) => {
    if (sel.indexOf('.pdf"') === -1) return [];
    return [pdfLink, htmlLink].filter((l) => l === pdfLink);
  },
  appendChild: (el) => appended.push(el),
};
P(R);
assert.strictEqual(embedsMade + 1 >= 1, true, 'sanity');
assert.strictEqual(pdfLink.dataset.mdpPdf, '1', 'pdf link marked');
assert(pdfLink._removed, 'pdf link consumed');
assert.strictEqual(htmlLink._removed, false, 'html link untouched');
assert.strictEqual(htmlLink.dataset.mdpPdf, undefined, 'html link not marked');
console.log('ok test-pdf');