/* Shared stable layer IDs: all typing bases precede their auxiliary layers.
 * Layer 0 is ZMK's boot layer, so Shamal is the factory default profile. */
#pragma once
#define SH_BASE 0
#define MIR_COLEMAK 1
#define MIR_TAP 2
#define MIR_BUTTON 3
#define MIR_NAV 4
#define MIR_MOUSE 5
#define MIR_MEDIA 6
#define MIR_NUM 7
#define MIR_SYM 8
#define MIR_FUN 9
#define SH_SYM 10
#define SH_NAV 11
#define SH_NUM 12
#define SH_FUN 13
#define SH_SETTINGS 14
#define PROFILE_RETURN 255

#define PROFILE_COLEMAK_NAME "Miryoku Colemak-DH"
#define PROFILE_SHAMAL_NAME "Shamal QWERTY"
