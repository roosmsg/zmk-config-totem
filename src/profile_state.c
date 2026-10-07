/* SPDX-License-Identifier: MIT */
#include "profile_state.h"

bool profile_request(struct profile_state *state, uint8_t base) {
    if (base != MIR_COLEMAK && base != SH_BASE) {
        return false;
    }
    state->requested = base;
    return true;
}

void profile_key(struct profile_state *state, uint32_t position, bool pressed) {
    if (position >= 38) {
        return; /* Ignore virtual combo positions. */
    }
    const uint64_t bit = UINT64_C(1) << position;
    if (pressed) {
        state->pressed |= bit;
    } else {
        state->pressed &= ~bit;
    }
}

bool profile_apply(struct profile_state *state, const struct profile_ops *ops) {
    if (state->pressed || state->current == state->requested) {
        return false;
    }
    state->current = state->requested;
    ops->to_layer(state->current);
    return true;
}

bool profile_to(struct profile_state *state, uint32_t layer, const struct profile_ops *ops) {
    const uint8_t base = state->current;
    if (layer == PROFILE_RETURN) {
        layer = base;
    }
    const bool allowed = layer == base ||
        (base == SH_BASE ? layer >= SH_SYM && layer <= SH_SETTINGS
                         : layer >= MIR_TAP && layer <= MIR_FUN);
    if (!allowed) {
        return false; /* Also ignores a delayed tap dance from the previous profile. */
    }
    ops->to_layer((uint8_t)layer);
    if (layer != base) {
        ops->activate_layer(base);
    }
    return true;
}
