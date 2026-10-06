/* SPDX-License-Identifier: MIT */
#include <assert.h>
#include <stdio.h>
#include "profile_state.h"

static uint32_t active;
static unsigned int moves;
static void to_layer(uint8_t layer) { active = 1U | (1U << layer); moves++; }
static void activate_layer(uint8_t layer) { active |= 1U << layer; }
static const struct profile_ops ops = {to_layer, activate_layer};

int main(void) {
    struct profile_state s = {0};
    active = 1U;
    assert(!profile_apply(&s, &ops));
    assert(profile_request(&s, MIR_COLEMAK));
    assert(profile_apply(&s, &ops));
    assert(s.current == MIR_COLEMAK && active == 3U);

    // Locking a Miryoku auxiliary layer keeps the selected alphabet underneath.
    assert(profile_to(&s, MIR_NAV, &ops));
    assert(active == (3U | (1U << MIR_NAV)));
    assert(profile_to(&s, PROFILE_RETURN, &ops));
    assert(active == 3U);

    // The last requested profile wins, after ALL real keys have been released.
    profile_key(&s, 12, true);
    profile_key(&s, 37, true);
    profile_key(&s, 37, true); // An event replay cannot double-count the key.
    assert(profile_request(&s, MIR_QWERTY));
    assert(!profile_apply(&s, &ops));
    assert(profile_request(&s, SH_BASE));
    profile_key(&s, 12, false);
    assert(!profile_apply(&s, &ops));
    profile_key(&s, 37, false);
    assert(profile_apply(&s, &ops));
    assert(active == (1U | (1U << SH_BASE)));

    // Shamal transparent keys must resolve through Shamal, never Miryoku.
    assert(profile_to(&s, SH_SYM, &ops));
    assert(active == (1U | (1U << SH_BASE) | (1U << SH_SYM)));
    assert(profile_to(&s, SH_NAV, &ops));
    assert(active == (1U | (1U << SH_BASE) | (1U << SH_NAV)));
    assert(profile_to(&s, SH_BASE, &ops));
    assert(active == (1U | (1U << SH_BASE)));

    // A delayed dance from the old profile cannot reactivate its layers.
    const unsigned int before = moves;
    assert(!profile_to(&s, MIR_NAV, &ops));
    assert(!profile_to(&s, 256, &ops));
    assert(!profile_request(&s, 99));
    assert(moves == before && s.requested == SH_BASE);

    // Restoring/discarding a layout choice selects its typing base and clears
    // any locked auxiliary layers. The keyboard's implicit layer 0 remains.
    assert(profile_to(&s, SH_SETTINGS, &ops));
    assert(profile_request(&s, MIR_QWERTY));
    assert(profile_apply(&s, &ops));
    assert(active == 1U);
    assert(profile_to(&s, MIR_NUM, &ops));
    assert(profile_to(&s, PROFILE_RETURN, &ops));
    assert(active == 1U);

    // Virtual positions and duplicate releases cannot prevent future switches.
    profile_key(&s, UINT32_MAX, true);
    profile_key(&s, 38, true);
    profile_key(&s, 0, false);
    assert(s.pressed == 0);
    assert(profile_request(&s, MIR_COLEMAK));
    assert(profile_apply(&s, &ops));

    // Cancel an in-flight selection by returning to the current profile.
    profile_key(&s, 0, true);
    assert(profile_request(&s, SH_BASE));
    assert(profile_request(&s, MIR_COLEMAK));
    profile_key(&s, 0, false);
    assert(!profile_apply(&s, &ops));
    assert(s.current == MIR_COLEMAK);
    puts("Profile switching, held keys, layer isolation and profile return: PASS");
    return 0;
}
