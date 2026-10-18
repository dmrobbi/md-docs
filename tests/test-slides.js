'use strict';
// T6.2 tests: the slideshow deck math (pure; deck DOM = manual battery)
const assert = require('assert');
global.window = global;
require('../public/js/plug-slides.js');
const S = global.MDSlides;

// no hr = the whole doc as one slide
assert.deepStrictEqual(S.groupIndices(['P', 'P']), [{ start: 0, end: 1 }], 'no hr = one slide');

// the basic --- split
assert.deepStrictEqual(
  S.groupIndices(['P', 'HR', 'P', 'P']),
  [{ start: 0, end: 0 }, { start: 2, end: 3 }],
  'hr splits');

// leading hr, adjacent hrs (the *** form), trailing hr = empties dropped
assert.deepStrictEqual(
  S.groupIndices(['HR', 'P', 'HR', 'HR', 'P', 'HR']),
  [{ start: 1, end: 1 }, { start: 4, end: 4 }],
  'edge + adjacent hrs dropped');

// empty doc / hr-only doc: the pure math stays total ([] / the whole group,
// which the DOM deck builder then drops as whitespace-only)
assert.deepStrictEqual(S.groupIndices([]), [], 'empty doc = no slides');
assert.deepStrictEqual(S.groupIndices(['HR']), [{ start: 0, end: 0 }], 'hr-only = whole-group fallback');

// the fixture shape used in the battery
assert.deepStrictEqual(
  S.groupIndices(['H1', 'P', 'HR', 'P', 'HR', 'P']),
  [{ start: 0, end: 1 }, { start: 3, end: 3 }, { start: 5, end: 5 }],
  'fixture grouping');

// key map: exit reachable + the module state survives a caller mutation
const km = S.keyMap();
assert(km.exit.indexOf('Escape') !== -1, 'Escape = exit');
assert(km.next.indexOf('ArrowRight') !== -1, 'next arrow');
assert(km.prev.indexOf('ArrowLeft') !== -1, 'prev arrow');
km.next.push('MUTANT');
assert(S.keyMap().next.indexOf('MUTANT') === -1, 'keyMap returns a copy');

console.log('ok test-slides');