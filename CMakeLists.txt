# Add this listener to app before ZMK's hold-tap, combo and keymap listeners.
# Zephyr loads this module during find_package(), before ZMK adds its sources.
if(CONFIG_TOTEM_STUDIO_PROFILES)
  target_sources(app PRIVATE ${CMAKE_CURRENT_SOURCE_DIR}/src/profiles.c
                             ${CMAKE_CURRENT_SOURCE_DIR}/src/profile_state.c)
  target_include_directories(app PRIVATE ${CMAKE_CURRENT_SOURCE_DIR}/dts)
endif()
