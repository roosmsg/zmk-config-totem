import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const keymap = fs.readFileSync('config/totem.keymap', 'utf8');
const layers = [...keymap.matchAll(/\n        (mir_\w+|sh_\w+|s2_\w+) \{\n            display-name = "([^"]+)";\n            bindings = <([^]*?)>;/g)];
const keys = layer => layer[3].match(/&[a-z_][^&]*/g).map(k => k.trim());

test('stable base IDs and complete 38-key layers', () => {
  assert.equal(layers.length, 20);
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
  const ids = Object.fromEntries([...header.matchAll(/#define ((?:SH|MIR|S2)_\w+) (\d+)/g)].map(m => [m[1], Number(m[2])]));
  const expected = ['SH_BASE', 'MIR_COLEMAK', 'MIR_TAP', 'MIR_BUTTON', 'MIR_NAV', 'MIR_MOUSE', 'MIR_MEDIA', 'MIR_NUM', 'MIR_SYM', 'MIR_FUN', 'SH_SYM', 'SH_NAV', 'SH_NUM', 'SH_FUN', 'SH_SETTINGS',
    'S2_BASE', 'S2_SYMBOLS', 'S2_NUM', 'S2_FKEYS', 'S2_SETTINGS'];
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
  const builtins = new Set(['kp', 'none', 'trans', 'mo', 'tog', 'lt', 'mt', 'mmv', 'msc', 'mkp', 'bt', 'out', 'bootloader', 'sys_reset', 'studio_unlock', 'caps_word']);
  const definitions = new Set([...keymap.matchAll(/\b(\w+): \w+ \{/g)].map(m => m[1]));
  for (const [, behavior] of keymap.matchAll(/&([a-z_][a-z_0-9]*)/g)) {
    assert.ok(builtins.has(behavior) || definitions.has(behavior), behavior);
  }
});

test('Shamal2 keeps Shamal letters and uses Rolio thumbs and outer keys', () => {
  const byName = Object.fromEntries(layers.map(l => [l[1], keys(l)]));
  const sh = byName.sh_base, s2 = byName.s2_base;
  assert.deepEqual(layers.slice(15).map(l => l[1]), ['s2_base', 's2_symbols', 's2_numpad', 's2_fkeys', 's2_settings']);
  for (let i = 0; i < 32; i++) if (![9, 19, 20, 31].includes(i)) assert.equal(s2[i], sh[i], 'letter position ' + i);
  assert.equal(s2[9], '&s2_bspc_del');
  // Without Ctrl: Rolio Backspace. With Ctrl: Delete (tap) / Ctrl+Delete (hold).
  assert.match(keymap, /s2_bspc_del: s2_bspc_del \{[^}]*bindings = <&s2_erase LC\(BSPC\) BSPC>, <&s2_erase LC\(DEL\) DEL>;[^}]*mods = <\(MOD_LCTL\|MOD_RCTL\)>;/);
  // Erasing words needs a deliberate hold: not ZMK's eager 200 ms hold-preferred &mt.
  assert.match(keymap, /s2_erase: s2_erase \{[^}]*flavor = "tap-preferred";\s*tapping-term-ms = <350>;\s*quick-tap-ms = <250>;/);
  assert.equal(s2[19], '&kp P');
  assert.equal(s2[20], '&kp LSHIFT');
  assert.equal(s2[31], '&mt RSHIFT SEMI');
  assert.deepEqual(s2.slice(32), ['&kp LGUI', '&kp LCTRL', '&lt S2_FKEYS ENTER', '&lt S2_NUM SPACE', '&s2_sym_num', '&kp LALT']);
  // A locked number pad can always be left from the same thumb key.
  assert.equal(byName.s2_numpad[36], '&tog S2_NUM');
  // Plain Bluetooth/USB keys only: no Rolio Bluetooth-or-key / USB-or-key behaviors.
  assert.doesNotMatch(keymap, /btkp|usb_tog|btclr_kp|&scw/);
  assert.match(keymap, /if-layers = <S2_FKEYS S2_NUM>;\s*then-layer = <S2_SETTINGS>;/);
});

test('Shamal2 shares the Shamal base combos, with Rolio word-delete Backspace', () => {
  const combos = [...keymap.matchAll(/s2_combo_(\w+) \{([^]*?)\};/g)];
  assert.deepEqual(combos.map(c => c[1]).sort(), ['backspace', 'ctrl_backspace', 'ctrl_shift', 'enter', 'quote', 'tab']);
  const positions = body => body.match(/key-positions = <([^>]+)>/)[1];
  for (const [, name, body] of combos) {
    assert.match(body, /layers = <S2_BASE>/, name);
    const shBody = keymap.match(new RegExp(`sh_combo_${name} \\{([^]*?)\\};`))[1];
    assert.equal(positions(body), positions(shBody), name);
  }
  assert.match(combos.find(c => c[1] === 'backspace')[2], /bindings = <&s2_erase LC\(BSPC\) BSPC>/);
});
