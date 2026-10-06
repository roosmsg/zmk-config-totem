// Convert the pinned upstream definitions to the 38-key TOTEM matrix.
// Run with: node scripts/generate-keymap.mjs [--check]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mir = fs.readFileSync(path.join(root, 'sources/miryoku_layers.h'), 'utf8');
const shamal = fs.readFileSync(path.join(root, 'sources/shamal.keymap'), 'utf8');
const mirLayers = { BASE: 'MIR_QWERTY', EXTRA: 'MIR_COLEMAK', TAP: 'MIR_TAP', BUTTON: 'MIR_BUTTON', NAV: 'MIR_NAV', MOUSE: 'MIR_MOUSE', MEDIA: 'MIR_MEDIA', NUM: 'MIR_NUM', SYM: 'MIR_SYM', FUN: 'MIR_FUN' };
const shLayers = ['SH_BASE', 'SH_SYM', 'SH_NAV', 'SH_NUM', 'SH_FUN', 'SH_SETTINGS'];

function splitArgs(text) {
  let depth = 0, start = 0;
  const result = [];
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '(') depth++;
    if (text[i] === ')') depth--;
    if (text[i] === ',' && depth === 0) { result.push(text.slice(start, i).trim()); start = i + 1; }
  }
  result.push(text.slice(start).trim());
  return result;
}

const tokens = {
  U_NP: '&none', U_NA: '&none', U_NU: '&none', U_BOOT: '&bootloader',
  U_UND: '&kp LC(Z)', U_CUT: '&kp LC(X)', U_CPY: '&kp LC(C)', U_PST: '&kp LC(V)', U_RDO: '&kp LC(Y)',
  U_BTN1: '&mkp MB1', U_BTN2: '&mkp MB2', U_BTN3: '&mkp MB3',
  U_MS_D: '&mmv MOVE_DOWN', U_MS_L: '&mmv MOVE_LEFT', U_MS_R: '&mmv MOVE_RIGHT', U_MS_U: '&mmv MOVE_UP',
  U_WH_D: '&msc SCRL_DOWN', U_WH_L: '&msc SCRL_LEFT', U_WH_R: '&msc SCRL_RIGHT', U_WH_U: '&msc SCRL_UP',
  U_RGB_TOG: '&none', U_RGB_EFF: '&none', U_RGB_HUI: '&none', U_RGB_SAI: '&none', U_RGB_BRI: '&none', U_EP_TOG: '&none',
};

function mirBinding(binding) {
  if (tokens[binding]) return tokens[binding];
  let match = binding.match(/^U_MT\((.*)\)$/);
  if (match) return '&miryoku_mt ' + splitArgs(match[1]).join(' ');
  match = binding.match(/^U_LT\(U_(\w+),\s*(.*)\)$/);
  if (match) return `&miryoku_lt ${mirLayers[match[1]]} ${match[2]}`;
  // Profile selection lives in Studio. Both original Base/Extra return keys
  // return to the selected profile instead of silently changing alphabets.
  if (/^&u_to_U_(BASE|EXTRA)$/.test(binding)) return '&mir_return';
  binding = binding.replace(/&u_to_U_(\w+)/g, (_, layer) => '&mir_lock_' + layer.toLowerCase());
  if (!binding.startsWith('&')) throw new Error('Unknown Miryoku token: ' + binding);
  return binding;
}

function mirBindings(name) {
  const marker = '#define MIRYOKU_ALTERNATIVES_' + name + ' ';
  const block = mir.slice(mir.indexOf(marker) + marker.length).split('\n\n')[0].replace(/\\\r?\n/g, ' ').trim();
  const keys = splitArgs(block).map(mirBinding);
  if (keys.length !== 40) throw new Error(`${name}: expected 40 source positions, got ${keys.length}`);
  // Official Miryoku TOTEM mapping duplicates the outer top-row keys on SW16.
  return [...keys.slice(0, 20), keys[0], ...keys.slice(20, 30), keys[9], ...keys.slice(32, 38)];
}

function shPosition(position) {
  if (position < 20) return position;
  if (position < 30) return position + 1;
  return [20, 32, 33, 34, 35, 36, 37, 31][position - 30];
}

function shBindings(source) {
  const keys = source.match(/&[a-z_][^&]*/g)?.map(k => k.trim()) || [];
  if (keys.length !== 38) throw new Error('Shamal: expected 38 bindings');
  const result = Array(38);
  keys.forEach((binding, i) => {
    result[shPosition(i)] = binding.replace(/&to\s+(\d+)/g, (_, n) => '&profile_to ' + shLayers[Number(n)]);
  });
  return result;
}

function layer(name, label, keys) {
  if (keys.length !== 38 || keys.some(x => !x)) throw new Error(name + ': incomplete TOTEM layer');
  const row = (start, end, indent = '') => '            ' + indent + keys.slice(start, end).map(k => k.padEnd(30)).join('').trimEnd();
  return `        ${name} {\n            display-name = "${label}";\n            bindings = <\n${row(0, 10, '                              ')}\n${row(10, 20, '                              ')}\n${row(20, 32)}\n${row(32, 38, '                                                                                          ')}\n            >;\n        };\n`;
}

const shNames = ['default', 'symbol', 'nav', 'num', 'function', 'settings'];
const shLabels = ['SH Base', 'SH Symbols', 'SH Navigation', 'SH Numbers', 'SH Function', 'SH Settings'];
const shKeys = shNames.map(name => {
  const match = shamal.match(new RegExp(name + '_layer\\s*\\{[^]*?bindings\\s*=\\s*<([^]*?)>;'));
  if (!match) throw new Error('Missing Shamal layer ' + name);
  return shBindings(match[1]);
});

let combos = '';
for (const match of shamal.matchAll(/(combo_[\w+]+)\s*\{([^]*?)\};/g)) {
  let body = match[2].replace(/key-positions\s*=\s*<([^>]+)>/, (_, values) => 'key-positions = <' + values.trim().split(/\s+/).map(Number).map(shPosition).join(' ') + '>');
  body = body.replace(/layers\s*=\s*<(\d+)>/, (_, n) => 'layers = <' + shLayers[Number(n)] + '>');
  combos += `        sh_${match[1].replaceAll('+', '_')} {${body}        };\n`;
}

const mirDefinitions = [
  ['mir_qwerty', 'MIR QWERTY', 'BASE_QWERTY'], ['mir_colemak', 'MIR Colemak-DH', 'BASE_COLEMAKDH'],
  ['mir_tap', 'MIR Tap Colemak', 'TAP_COLEMAKDH'], ['mir_button', 'MIR Button', 'BUTTON'],
  ['mir_nav', 'MIR Navigation', 'NAV'], ['mir_mouse', 'MIR Mouse', 'MOUSE'], ['mir_media', 'MIR Media', 'MEDIA'],
  ['mir_num', 'MIR Numbers', 'NUM'], ['mir_sym', 'MIR Symbols', 'SYM'], ['mir_fun', 'MIR Function', 'FUN'],
];
const layers = mirDefinitions.map(([name, label, variant]) => layer(name, label, mirBindings(variant)));
layers.splice(2, 0, layer('sh_base', shLabels[0], shKeys[0]));
for (let i = 1; i < shKeys.length; i++) layers.push(layer('sh_' + shNames[i], shLabels[i], shKeys[i]));

let dances = '';
for (const [name, target] of [['return', 'PROFILE_RETURN'], ...Object.entries(mirLayers).filter(([k]) => !['BASE', 'EXTRA'].includes(k)).map(([k, v]) => ['lock_' + k.toLowerCase(), v])]) {
  dances += `        mir_${name}: mir_${name} {\n            compatible = "zmk,behavior-tap-dance";\n            #binding-cells = <0>;\n            tapping-term-ms = <200>;\n            bindings = <&none>, <&profile_to ${target}>;\n        };\n`;
}

let btBehaviors = '';
for (let i = 0; i < 5; i++) {
  btBehaviors += `        u_bt_sel_${i}: u_bt_sel_${i} {\n            compatible = "zmk,behavior-mod-morph";\n            #binding-cells = <0>;\n            bindings = <&bt BT_SEL ${i}>, <&bt_clear_${i}>;\n            mods = <(MOD_LSFT|MOD_RSFT)>;\n        };\n`;
}
const btMacros = Array.from({length: 5}, (_, i) => `        bt_clear_${i}: bt_clear_${i} {\n            compatible = "zmk,behavior-macro";\n            #binding-cells = <0>;\n            wait-ms = <0>;\n            bindings = <&bt BT_SEL ${i} &bt BT_CLR>;\n        };\n`).join('');

const content = `// Generated by scripts/generate-keymap.mjs from sources/.\n// Miryoku: Copyright 2022 Manna Harbour; Shamal: ShamalLakshan.\n// See docs/studio-profiles.md for provenance and TOTEM adaptations.\n\n#define ZMK_POINTING_DEFAULT_MOVE_VAL 1250\n#define ZMK_POINTING_DEFAULT_SCRL_VAL 100\n#include <behaviors.dtsi>\n#include <dt-bindings/zmk/keys.h>\n#include <dt-bindings/zmk/bt.h>\n#include <dt-bindings/zmk/outputs.h>\n#include <dt-bindings/zmk/pointing.h>\n#include <totem_profiles.h>\n\n&mmv { acceleration-exponent = <1>; time-to-max-speed-ms = <1500>; delay-ms = <0>; };\n&caps_word { continue-list = <UNDERSCORE MINUS>; };\n\n/ {\n    behaviors {\n        profile_to: profile_to {\n            compatible = "roosmsg,profile-to";\n            display-name = "Profile: To Layer";\n            #binding-cells = <1>;\n        };\n        miryoku_mt: miryoku_mt {\n            compatible = "zmk,behavior-hold-tap";\n            display-name = "Miryoku Mod Tap";\n            #binding-cells = <2>;\n            tapping-term-ms = <200>;\n            flavor = "tap-preferred";\n            bindings = <&kp>, <&kp>;\n        };\n        miryoku_lt: miryoku_lt {\n            compatible = "zmk,behavior-hold-tap";\n            display-name = "Miryoku Layer Tap";\n            #binding-cells = <2>;\n            tapping-term-ms = <200>;\n            flavor = "tap-preferred";\n            bindings = <&mo>, <&kp>;\n        };\n        u_caps_word: u_caps_word {\n            compatible = "zmk,behavior-mod-morph";\n            #binding-cells = <0>;\n            bindings = <&caps_word>, <&kp CAPS>;\n            mods = <(MOD_LSFT|MOD_RSFT)>;\n        };\n        u_out_tog: u_out_tog {\n            compatible = "zmk,behavior-mod-morph";\n            #binding-cells = <0>;\n            bindings = <&out OUT_TOG>, <&out OUT_USB>;\n            mods = <(MOD_LSFT|MOD_RSFT)>;\n        };\n${btBehaviors}${dances}    };\n    macros {\n${btMacros}    };\n    combos {\n        compatible = "zmk,combos";\n${combos}    };\n    keymap {\n        compatible = "zmk,keymap";\n${layers.join('\n')}    };\n};\n`;
const output = path.join(root, 'config/totem.keymap');
if (process.argv.includes('--check')) {
  if (fs.readFileSync(output, 'utf8').replaceAll('\r\n', '\n') !== content) throw new Error('Run node scripts/generate-keymap.mjs to update config/totem.keymap');
} else {
  fs.writeFileSync(output, content);
}
console.log('Verified 16 layers of 38 keys and 7 remapped Shamal combos.');
