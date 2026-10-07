import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const keymap = fs.readFileSync('config/totem.keymap', 'utf8');
const layers = [...keymap.matchAll(/\n        (mir_\w+|sh_\w+) \{\n            display-name = "([^"]+)";\n            bindings = <([^]*?)>;/g)];
const keys = layer => layer[3].match(/&[a-z_][^&]*/g).map(k => k.trim());

test('stable base IDs and complete 38-key layers', () => {
  assert.equal(layers.length, 15);
  // Layer 0 is ZMK's boot layer, so Shamal is the factory default profile.
  assert.deepEqual(layers.slice(0, 3).map(l => l[1]), ['sh_base', 'mir_colemak', 'mir_tap']);
  for (const layer of layers) assert.equal(keys(layer).length, 38, layer[1]);
  assert.deepEqual(keys(layers[1]).slice(0, 5), ['&kp Q', '&kp W', '&kp F', '&kp P', '&kp B']);
  assert.deepEqual(keys(layers[1]).slice(32), [
    '&miryoku_lt MIR_MEDIA ESC', '&miryoku_lt MIR_NAV SPACE', '&miryoku_lt MIR_MOUSE TAB',
    '&miryoku_lt MIR_SYM RET', '&miryoku_lt MIR_NUM BSPC', '&miryoku_lt MIR_FUN DEL',
  ]);
  // The Miryoku Tap layer must use the same alphabet as the only Miryoku base.
  assert.deepEqual(keys(layers[2]).slice(0, 5), keys(layers[1]).slice(0, 5));
});

test('layer IDs in totem_profiles.h match the generated layer order', () => {
  const header = fs.readFileSync('dts/totem_profiles.h', 'utf8');
  const ids = Object.fromEntries([...header.matchAll(/#define ((?:SH|MIR)_\w+) (\d+)/g)].map(m => [m[1], Number(m[2])]));
  const expected = ['SH_BASE', 'MIR_COLEMAK', 'MIR_TAP', 'MIR_BUTTON', 'MIR_NAV', 'MIR_MOUSE', 'MIR_MEDIA', 'MIR_NUM', 'MIR_SYM', 'MIR_FUN', 'SH_SYM', 'SH_NAV', 'SH_NUM', 'SH_FUN', 'SH_SETTINGS'];
  expected.forEach((name, index) => assert.equal(ids[name], index, name));
  assert.equal(Object.keys(ids).length, expected.length);
});

test('Shamal thumbs and encoder buttons occupy the intended TOTEM switches', () => {
  const sh = keys(layers[0]);
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
