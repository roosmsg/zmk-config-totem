/* SPDX-License-Identifier: MIT */
#pragma once
#include <stdbool.h>
#include <stdint.h>
#include <totem_profiles.h>

struct profile_state {
    uint64_t pressed;
    uint8_t current;
    uint8_t requested;
};

struct profile_ops {
    void (*to_layer)(uint8_t layer);
    void (*activate_layer)(uint8_t layer);
};

bool profile_request(struct profile_state *state, uint8_t base);
void profile_key(struct profile_state *state, uint32_t position, bool pressed);
bool profile_apply(struct profile_state *state, const struct profile_ops *ops);
bool profile_to(struct profile_state *state, uint32_t layer, const struct profile_ops *ops);
