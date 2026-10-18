'use strict';
const assert = require('assert');
global.window = global;
// DOM-shim: the enhancer must consume the right links with the right players
function linkEl(href) {
  return {
    dataset: {},
    attrs: { href: href },
    getAttribute: (k) => (k === 'href' ? href : null),
    closest: () => null,
    innerHTML: '',
    appendChild: function (c) { this.player = c; },
  };
}
function rootEl(links) {
  return { links, querySelectorAll: (sel) => links.filter((l) => sel.split(',').every((chunk) => true)) ? links : [] };
}
global.document = {
  createElement: (tag) => ({
    tag, controls: undefined, src: '', style: {}, dataset: {},
  }),
};
global.MDPluginLoader = undefined; // ensure the no-loader path exercised

require('../public/js/plug-media.js');
const M = global.MDPluginEnhancers.media;

const links = [
  linkEl('https://example.com/demo.mp4'),
  linkEl('https://example.com/talk.mp3'),
  linkEl('https://example.com/page.html'),
];
const R = {
  querySelectorAll: (sel) => {
    if (sel.indexOf('video') !== -1) return [];
    const exts = sel === global.MD_MEDIA_SEL_VID ? links.filter((l) => /mp4|webm|mov"/.test(l.attrs.href)) : [];
    return exts;
  },
};

// the shims can't fully emulate querySelectorAll's selector semantics —
// so exercise the two selector branches directly via the module's own data:
// instead patch querySelectorAll per-branch:
const selectorsSeen = [];
const R2 = {
  querySelectorAll: (sel) => {
    selectorsSeen.push(sel);
    if (sel.indexOf('mp4') !== -1) return [links[0]];
    if (sel.indexOf('mp3') !== -1) return [links[1]];
    return [];
  },
};
M(R2);
assert.deepStrictEqual(selectorsSeen.length, 2, 'two selector branches');
assert.strictEqual(links[0].player.tag, 'video', 'video created');
assert.strictEqual(links[0].player.src, 'https://example.com/demo.mp4', 'video src from href');
assert.strictEqual(links[0].player.controls, true, 'video controls');
assert.strictEqual(links[1].player.tag, 'audio', 'audio created');
assert.strictEqual(links[1].player.src, 'https://example.com/talk.mp3', 'audio src from href');
assert.strictEqual(links[2].player, undefined, 'non-media link untouched');
assert.strictEqual(links[0].dataset.mdpMedia, '1', 'idempotent mark');
console.log('ok test-media');