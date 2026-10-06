import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const keymap = fs.readFileSync('config/totem.keymap', 'utf8');
const layers = [...keymap.matchAll(/\n        (mir_\w+|sh_\w+) \{\n            display-name = "([^"]+)";\n            bindings = <([^]*?)>;/g)];
const keys = layer => layer[3].match(/&[a-z_][^&]*/g).map(k => k.trim());

test('stable base IDs and complete 38-key layers', () => {
  assert.equal(layers.length, 16);
  assert.deepEqual(layers.slice(0, 3).map(l => l[1]), ['mir_qwerty', 'mir_colemak', 'sh_base']);
  for (const layer of layers) assert.equal(keys(layer).length, 38, layer[1]);
  assert.deepEqual(keys(layers[0]).slice(0, 5), ['&kp Q', '&kp W', '&kp E', '&kp R', '&kp T']);
  assert.deepEqual(keys(layers[1]).slice(0, 5), ['&kp Q', '&kp W', '&kp F', '&kp P', '&kp B']);
  assert.deepEqual(keys(layers[0]).slice(32), [
    '&miryoku_lt MIR_MEDIA ESC', '&miryoku_lt MIR_NAV SPACE', '&miryoku_lt MIR_MOUSE TAB',
    '&miryoku_lt MIR_SYM RET', '&miryoku_lt MIR_NUM BSPC', '&miryoku_lt MIR_FUN DEL',
  ]);
  assert.deepEqual(keys(layers[0]).slice(32), keys(layers[1]).slice(32));
});

test('Shamal thumbs and encoder buttons occupy the intended TOTEM switches', () => {
  const sh = keys(layers[2]);
  assert.equal(sh[20], '&kp C_PLAY_PAUSE');
  assert.equal(sh[31], '&kp C_MUTE');
  assert.deepEqual(sh.slice(32), ['&kp RCTRL', '&kp LEFT_ALT', '&kp RIGHT_SHIFT', '&kp SPACE', '&profile_to SH_SYM', '&kp LEFT_WIN']);
});

test('combos use physical letter positions and only Shamal layers', () => {
  const expected = {
    enter: [[16, 17], 'SH_BASE'], tab: [[0, 1], 'SH_BASE'],
    ctrl_backspace: [[23, 24], 'SH_BASE'], quote: [[29, 28], 'SH_BASE'],
    ctrl_shift: [[21, 22], 'SH_BASE'], backspace: [[12, 13], 'SH_BASE'],
    alt_shift: [[13, 12], 'SH_NUM'],
  };
  const combos = [...keymap.matchAll(/sh_combo_(\w+) \{([^]*?)\};/g)];
  assert.equal(combos.length, 7);
  for (const [, name, body] of combos) {
    const positions = body.match(/key-positions = <([^>]+)>/)[1].split(' ').map(Number);
    const layer = body.match(/layers = <([^>]+)>/)[1];
    assert.deepEqual([positions, layer], expected[name]);
  }
  assert.doesNotMatch(keymap, /sensor-bindings|&to /);
});

test('every custom behavior reference has a definition', () => {
  const builtins = new Set(['kp', 'none', 'trans', 'mo', 'mmv', 'msc', 'mkp', 'bt', 'out', 'bootloader', 'sys_reset', 'studio_unlock', 'caps_word']);
  const definitions = new Set([...keymap.matchAll(/\b(\w+): \w+ \{/g)].map(m => m[1]));
  for (const [, behavior] of keymap.matchAll(/&([a-z_][a-z_0-9]*)/g)) {
    assert.ok(builtins.has(behavior) || definitions.has(behavior), behavior);
  }
});
