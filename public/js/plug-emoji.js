/* md-docs plugin: emoji shortcodes (census 28). Self-authored; a curated
 * common-shortcode map inline (the full gemoji set = owner-gated later).
 * :name: found in the html becomes the emoji; unknown names stay literal
 * (no false rewrites of times like 10:30:45 — mapped names only, and a
 * name must be lowercase alnum/underscore/plus/minus). */
(function (g) {
  'use strict';
  var MAP = {
    tada: '🎉', smile: '😄', smiley: '😃', grinning: '😀', heart: '❤️',
    star: '⭐', sparkles: '✨', rocket: '🚀', fire: '🔥', zap: '⚡',
    bulb: '💡', memo: '📝', pushpin: '📌', paperclip: '📎', calendar: '📅',
    check: '✅', x: '❌', warning: '⚠️', question: '❓', thinking: '🤔',
    eyes: '👀', muscle: '💪', wave: '👋', pray: '🙏', ok_hand: '👌',
    thumbsup: '👍', thumbsdown: '👎', clap: '👏', wrench: '🔧', gear: '⚙️',
    lock: '🔒', key: '🔑', bug: '🐛', mag: '🔍', book: '📖', books: '📚',
    computer: '💻', email: '📧', bell: '🔔', hourglass: '⌛', dart: '🎯',
    trophy: '🏆', crown: '👑', gift: '🎁', cake: '🎂', coffee: '☕',
    beer: '🍺', beers: '🍻', sunny: '☀️', cloud: '☁️', umbrella: '☔',
    snowflake: '❄️', dog: '🐶', cat: '🐱', turtle: '🐢', '+1': '👍', '-1': '👎',
  };
  function emojiHook(html) {
    return String(html).replace(/:([a-z0-9_+-]+):/g, function (m, name) {
      return Object.prototype.hasOwnProperty.call(MAP, name) ? MAP[name] : m;
    });
  }
  g.MDPluginUseObjects = g.MDPluginUseObjects || {};
  g.MDPluginUseObjects.emoji = { hooks: { postprocess: emojiHook } };
})(typeof window !== 'undefined' ? window : globalThis);