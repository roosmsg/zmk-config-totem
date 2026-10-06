# Drie profielen via ZMK Studio

Deze firmware biedt in **Layout:** drie keuzes voor dezelfde Totem met 38 toetsen:

| Layout | Gebruik | Basislaag onder Layers |
| --- | --- | --- |
| Miryoku QWERTY | Dagelijks typen; oorspronkelijke standaard | MIR QWERTY |
| Miryoku Colemak-DH | Oefenen met Colemak-DH | MIR Colemak-DH |
| Shamal QWERTY | Shamal-lagen en combo's | SH Base |

De extra firmwaremodule koppelt de fysieke layoutkeuze aan het actieve profiel.
ZMK Studio zelf hoeft niet aangepast te worden. Alleen de profielkeuze verandert;
de 38 posities en de opgeslagen toetsbewerkingen blijven op hun plaats.

## Installeren

1. Download `firmware.zip` uit een geslaagde **Build TOTEM profiles**-run op de
   branch `codex/studio-three-profiles` en pak die uit.
2. Leg eventuele eigen Studio-aanpassingen eerst vast. **Restore Stock Settings**
   wist die wijzigingen. De oude firmwarebestanden in je lokale `totem-firmware`
   map zijn niet gewijzigd door deze update.
3. Gebruik de firmware die bij je bestaande opstelling hoort:

   | Opstelling | Bord | Bestand |
   | --- | --- | --- |
   | Linkerhelft direct via USB/Bluetooth | Links | `totem_left-seeeduino_xiao_ble-zmk.uf2` |
   | Linkerhelft direct via USB/Bluetooth | Rechts | `totem_right-seeeduino_xiao_ble-zmk.uf2` |
   | Aparte dongle | Dongle | `totem_dongle-seeeduino_xiao_ble-zmk.uf2` |
   | Aparte dongle | Links | `totem_left_for_dongle-seeeduino_xiao_ble-zmk.uf2` |
   | Aparte dongle | Rechts | `totem_right-seeeduino_xiao_ble-zmk.uf2` |

4. Zet elk bij te werken bord in de UF2-bootloader volgens de Totem/XIAO-procedure
   (gebruikelijk: tweemaal kort op reset) en kopieer het bijbehorende bestand naar
   het USB-station. De centrale helft of dongle bevat de keymap en Studio-module.
5. Verbind Studio via USB met de linkerhelft of, bij de dongle-opstelling, de dongle.
6. Kies **Restore Stock Settings**, zodat oude Studio-bindings niet de nieuwe
   keymaps overschrijven. Maak zo nodig opnieuw verbinding om de lijst te verversen.
7. Kies **Miryoku QWERTY** onder **Layout:** en klik op het opslagpictogram.

Voor deze keymap-update is `settings_reset` normaal niet nodig. Dat bestand is
alleen bedoeld voor het resetten van instellingen, bijvoorbeeld bij het wisselen
tussen een directe opstelling en een dongle-opstelling. Zo'n wissel vereist ook
de bijpassende peripheral-firmware en opnieuw koppelen.

## Wisselen en bewerken

- Klik onder **Layout:** op het gewenste profiel. Dat verandert waarmee je typt.
- Een wijziging gaat direct in, tenzij er toetsen ingedrukt zijn. In dat geval
  wacht de firmware tot die toetsen losgelaten zijn.
- Klik op het **opslagpictogram** om de keuze te onthouden na herstart. Zonder
  opslaan is de keuze tijdelijk; na herstart wordt de eerder opgeslagen keuze
  hersteld. De oorspronkelijke fabriekskeuze is Miryoku QWERTY.
- **Layers** toont alle 16 lagen. Selecteer daar de bijbehorende basislaag om die
  te bekijken of te bewerken; Studio selecteert die editorlaag niet automatisch
  wanneer je een ander profiel kiest.
- De twee Miryoku-alfabetten delen hun navigatie-, nummer-, symbool-, muis- en
  medialagen. Een wijziging aan zo'n laag geldt voor beide Miryoku-profielen.
- Laat de volgorde en het aantal lagen intact. Basissen horen onder hun
  functielagen te blijven; de Shamal-combo's gebruiken vaste laagnummers.
- Gebruik bij Shamal **Profile: To Layer** voor een blijvende laagwissel. Die
  bewaart Shamal als onderliggende basis voor transparante toetsen.

Studio's **Discard Changes** keert in ZMK v0.3 voor de fysieke layout terug naar
de fabriekskeuze. De module synchroniseert het profiel opnieuw voor de volgende
toetsaanslag. Gebruik de layoutkeuze om een ander profiel opnieuw te selecteren.

## Wat is overgenomen en aangepast?

### Miryoku

Bron: [Miryoku ZMK](https://github.com/manna-harbour/miryoku_zmk), commit
`559aa4beae75cb3206ab411b7da2adb9665c6896`. Copyright 2022 Manna Harbour.
De geselecteerde laagdefinities staan in `sources/miryoku_layers.h`.

- QWERTY en Colemak-DH gebruiken de standaard Miryoku-duimfuncties en
  tap-preferred hold-taps met 200 ms. De aparte Tap-laag gebruikt Colemak-DH.
- De twee extra Totem-toetsen dupliceren de buitenste bovenste toetsen, conform
  de officiële Miryoku-Totem-mapping.
- Clipboard-acties gebruiken de Windows-variant (Ctrl+C/V/X/Z/Y).
- RGB- en externe voedingsfuncties zijn leeg omdat deze Totem-definitie daarvoor
  geen hardware heeft. Muisbesturing, media en Bluetooth zijn behouden.
- De oorspronkelijke Base/Extra-dubbeltikfuncties keren beide terug naar de
  momenteel in Studio gekozen Miryoku-basis. Ze veranderen het profiel niet.
  Dubbeltikken om andere Miryoku-lagen vast te zetten blijft beschikbaar.

### Shamal

Bron: [36-QWERTY-Tap-Switch-Keymap](https://github.com/ShamalLakshan/36-QWERTY-Tap-Switch-Keymap/blob/main/keymap/zmk.keymap),
upstream blob `c7671a407f1490ab7ac606b735f79c6f7ad59e02`, auteur ShamalLakshan.
Het oorspronkelijke bestand staat in `sources/shamal.keymap`.

- De bron heeft 38 bindings: 30 letters/tekens en 8 toetsen op de onderste rij.
- De buitenste bindings van die onderste rij zijn op de extra buitenste Totem-
  toetsen geplaatst. De middelste zes worden de zes duimtoetsen.
- De draaifuncties van encoders zijn weggelaten; de play/pause- en mute-bindings
  blijven beschikbaar op de extra buitenste toetsen.
- Alle zeven combo's zijn naar de Totem-posities vertaald en blijven beperkt
  tot de oorspronkelijke Shamal-lagen.
- Ongebruikte upstream hold-tap-behaviors zijn weggelaten. Laagwisselingen
  bewaren SH Base als onderliggende basis.

## Ontwikkeling en verificatie

`config/totem.keymap` wordt gegenereerd uit de bewaarde brondefinities:

```sh
node scripts/generate-keymap.mjs
node scripts/generate-keymap.mjs --check
node --test tests/keymap.test.mjs
gcc -std=c11 -Wall -Wextra -Werror -Isrc -Idts src/profile_state.c tests/profile_state_test.c -o /tmp/test-totem-profiles
/tmp/test-totem-profiles
```

De GitHub-workflow voert de controles uit en bouwt alle vijf bestaande targets.
De module wordt alleen in de centrale Studio-builds opgenomen. De bronvolgorde
in `CMakeLists.txt` zorgt dat echte toetsaanslagen vóór de ZMK hold-tap/combo-
listeners worden gevolgd; latere virtuele combo-posities worden genegeerd.

Voor controle op het toetsenbord: selecteer ieder profiel, typ de bovenste rij,
probeer een tijdelijke/vaste laag, wissel terug, sla op en herstart. Controleer
ook dat Shamal's D+F-backspace-combo alleen in SH Base werkt en dat wijzigingen
in Studio behouden blijven na profielwisselen. Een geslaagde build vervangt deze
hardwarecontrole niet.
