/* SPDX-License-Identifier: MIT */
#define DT_DRV_COMPAT roosmsg_profile_to

#include <string.h>
#include <zephyr/device.h>
#include <zephyr/kernel.h>
#include <drivers/behavior.h>
#include <zmk/behavior.h>
#include <zmk/event_manager.h>
#include <zmk/events/position_state_changed.h>
#include <zmk/keymap.h>
#include <zmk/physical_layouts.h>
#include "profile_state.h"

static struct profile_state state = {.current = MIR_QWERTY, .requested = MIR_QWERTY};
K_MUTEX_DEFINE(profile_mutex);

static void to_layer(uint8_t layer) { zmk_keymap_layer_to(layer); }
static void activate_layer(uint8_t layer) { zmk_keymap_layer_activate(layer); }
static const struct profile_ops ops = {.to_layer = to_layer, .activate_layer = activate_layer};

/* DT instance numbers are not guaranteed to follow source order. Match the
 * immutable layout names, never Studio's layer names or display order. */
static uint8_t selected_base(void) {
    const struct zmk_physical_layout *const *layouts;
    const size_t count = zmk_physical_layouts_get_list(&layouts);
    const int selected = zmk_physical_layouts_get_selected();
    if (selected >= 0 && (size_t)selected < count) {
        const char *name = layouts[selected]->display_name;
        if (strcmp(name, PROFILE_COLEMAK_NAME) == 0) {
            return MIR_COLEMAK;
        }
        if (strcmp(name, PROFILE_SHAMAL_NAME) == 0) {
            return SH_BASE;
        }
    }
    return MIR_QWERTY;
}

static void sync_profile(void) {
    profile_request(&state, selected_base());
    profile_apply(&state, &ops);
}

static void apply_pending(struct k_work *work) {
    k_mutex_lock(&profile_mutex, K_FOREVER);
    sync_profile();
    k_mutex_unlock(&profile_mutex);
}
K_WORK_DELAYABLE_DEFINE(profile_work, apply_pending);

static int profile_listener(const zmk_event_t *event) {
    const struct zmk_position_state_changed *key = as_zmk_position_state_changed(event);
    const struct zmk_physical_layout_selection_changed *layout =
        as_zmk_physical_layout_selection_changed(event);

    k_mutex_lock(&profile_mutex, K_FOREVER);
    if (layout) {
        sync_profile();
    } else if (key) {
        if (key->state) {
            /* Also catches v0.3 Discard Changes, which changes the physical
             * layout without raising a layout-selection event. */
            sync_profile();
        }
        profile_key(&state, key->position, key->state);
        if (!key->state && !state.pressed) {
            /* Let downstream hold-tap/combo/keymap listeners finish releasing
             * the old bindings before changing the typing base. */
            k_work_reschedule(&profile_work, K_MSEC(1));
        }
    }
    k_mutex_unlock(&profile_mutex);
    return ZMK_EV_EVENT_BUBBLE;
}

ZMK_LISTENER(totem_profiles, profile_listener);
ZMK_SUBSCRIPTION(totem_profiles, zmk_position_state_changed);
ZMK_SUBSCRIPTION(totem_profiles, zmk_physical_layout_selection_changed);

static int binding_pressed(struct zmk_behavior_binding *binding,
                           struct zmk_behavior_binding_event event) {
    k_mutex_lock(&profile_mutex, K_FOREVER);
    profile_to(&state, binding->param1, &ops);
    k_mutex_unlock(&profile_mutex);
    return ZMK_BEHAVIOR_OPAQUE;
}

static int binding_released(struct zmk_behavior_binding *binding,
                            struct zmk_behavior_binding_event event) {
    return ZMK_BEHAVIOR_OPAQUE;
}

#if IS_ENABLED(CONFIG_ZMK_BEHAVIOR_METADATA)
static const struct behavior_parameter_value_metadata param_values[] = {
    {.display_name = "Layer", .type = BEHAVIOR_PARAMETER_VALUE_TYPE_LAYER_ID},
};
static const struct behavior_parameter_metadata_set param_sets[] = {
    {.param1_values = param_values, .param1_values_len = ARRAY_SIZE(param_values)},
};
static const struct behavior_parameter_metadata metadata = {
    .sets_len = ARRAY_SIZE(param_sets), .sets = param_sets,
};
#endif

static const struct behavior_driver_api profile_driver_api = {
    .binding_pressed = binding_pressed,
    .binding_released = binding_released,
#if IS_ENABLED(CONFIG_ZMK_BEHAVIOR_METADATA)
    .parameter_metadata = &metadata,
#endif
};

BEHAVIOR_DT_INST_DEFINE(0, NULL, NULL, NULL, NULL, POST_KERNEL,
                       CONFIG_KERNEL_INIT_PRIORITY_DEFAULT, &profile_driver_api);
