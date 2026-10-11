// Shamal2 QWERTY: Shamal letters and combos merged with the Rolio46 (Windows)
// thumb keys and layers, reduced from Rolio's 46 keys to the 38-key TOTEM.
// Rolio source: https://github.com/MickiusMousius/RolioFirmware
// boards/shields/rolio/rolio.keymap (windows_* layers) and keymap_behaviors.dtsi.
//
// TOTEM positions: 0-9 top row, 10-19 home row, 20 left outer, 21-30 bottom
// row, 31 right outer, 32-34 left thumbs (outer to inner), 35-37 right thumbs
// (inner to outer). Each layer lists exactly 38 bindings in that order.

const ___ = '&trans';

// Base: positions 0-19 and 21-30 take Shamal's letters (filled in by the
// generator); only the outer keys and thumbs below differ from Shamal.
export const s2BaseOverrides = {
  // Replaces P. Tap Backspace, hold Ctrl+Backspace (Rolio); with Ctrl held:
  // tap Delete, hold Ctrl+Delete. Ctrl is masked for the tap, so it sends Delete.
  9: '&s2_bspc_del',
  19: '&kp P', // P moved here from position 9 (replaces ;)
  20: '&kp LSHIFT', // Rolio outer column: Shift
  31: '&kp RSHIFT', // right Shift (Rolio had ' here; ' stays on the , + . combo)
  32: '&kp LGUI',
  33: '&kp LCTRL',
  34: '&lt S2_FKEYS ENTER', // Rolio: tap Enter, hold F-keys/navigation
  35: '&lt S2_NUM SPACE', // Rolio: tap Space, hold Number Pad
  36: '&s2_sym_num', // Rolio td2: tap/hold Symbols, double tap Number Pad on/off
  37: '&kp LALT',
};

// Rolio "Symbols (Win)". Rolio's outer column (_, -, Del) moved onto the
// outer keys, the duplicate % and the rightmost thumb.
export const s2Sym = [
  '&kp N1', '&kp N2', '&kp N3', '&kp N4', '&kp N5', '&kp N6', '&kp N7', '&kp N8', '&kp N9', '&kp N0',
  '&kp EXCL', '&kp AT', '&kp HASH', '&kp DLLR', '&kp PRCNT', '&kp CARET', '&kp AMPERSAND', '&kp STAR', '&kp LPAR', '&kp RPAR',
  ___, '&kp LG(DOT)', '&kp LEFT_BRACE', '&kp RIGHT_BRACE', '&kp PIPE', '&kp EQUAL',
  '&kp MINUS', '&kp PLUS', '&kp LBKT', '&kp RBKT', '&kp BACKSLASH', '&kp UNDER',
  ___, ___, ___, ___, ___, '&kp DEL',
];

// Rolio "Number Pad". Rolio's outer-column minus moved to the left outer key,
// its 0 to the rightmost thumb; double tap or &tog leaves a locked numpad.
export const s2Num = [
  '&kp N1', '&kp N2', '&kp N3', '&kp N4', '&kp N5', '&kp N6', '&kp N7', '&kp N8', '&kp N9', '&kp N0',
  '&kp EXCL', '&kp AT', '&kp HASH', '&kp DLLR', '&kp PRCNT', '&kp CARET', '&kp N4', '&kp N5', '&mt LPAR N6', '&mt RPAR PLUS',
  '&kp MINUS', ___, '&kp LEFT_BRACE', '&kp RIGHT_BRACE', '&kp PIPE', '&kp EQUAL',
  '&kp PRCNT', '&kp N1', '&mt COMMA N2', '&mt DOT N3', '&kp KP_DIVIDE', '&kp KP_MULTIPLY',
  ___, ___, ___, ___, '&tog S2_NUM', '&kp N0',
];

// Rolio "F Keys (Win)" with Windows navigation. Rolio's Bluetooth-or-key and
// USB-or-key keys become plain F1-F5 and Esc; backlight keys (no backlight on
// the TOTEM) become F11/F12; macOS dictation becomes Windows dictation (Win+H).
export const s2Fkeys = [
  '&kp F1', '&kp F2', '&kp F3', '&kp F4', '&kp F5', '&kp F6', '&kp F7', '&kp F8', '&kp F9', '&kp F10',
  '&kp LG(H)', ___, '&kp C_PREV', '&kp C_PP', '&kp C_NEXT', '&kp HOME', '&kp UP', '&kp END', '&kp LA(PSCRN)', '&kp PG_UP',
  '&kp ESC', '&kp F11', '&kp F12', '&kp C_VOL_DN', '&kp C_MUTE', '&kp C_VOL_UP',
  '&kp LEFT', '&kp DOWN', '&kp RIGHT', '&kp LG(LS(S))', '&kp PG_DN', '&kp LS(TAB)',
  ___, ___, ___, ___, ___, ___,
];

// Rolio "Settings", Windows only: plain Bluetooth/USB keys, digits for
// Bluetooth passkeys. Reached by holding Enter and Space together.
export const s2Settings = [
  '&bt BT_SEL 0', '&bt BT_SEL 1', '&bt BT_SEL 2', '&bt BT_SEL 3', '&bt BT_SEL 4', '&kp N6', '&kp N7', '&kp N8', '&kp N9', '&kp N0',
  ___, ___, ___, ___, ___, ___, '&kp N4', '&kp N5', '&kp N6', ___,
  '&out OUT_TOG', ___, '&bt BT_CLR', ___, ___, ___,
  ___, '&kp N1', '&kp N2', '&kp N3', ___, ___,
  ___, ___, ___, ___, ___, '&kp N0',
];

// Shamal combos also apply to Shamal2's base layer. Rolio's Backspace key
// (tap Backspace, hold Ctrl+Backspace) lives on the D+F Backspace combo.
export const s2ComboOverrides = {
  backspace: '&mt LC(BSPC) BSPC',
};
