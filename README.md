# jmon: JSON Musical Object Notation (Extended Schema)

**jmon** (JSON Musical Object Notation) is a declarative, backend-agnostic JSON format for multi-track musical compositions, modular audio graphs, effects, automation, looping, and advanced timing.

## To do

[ ] Revise effect processing (delay, reverb, chorus, etc.)
[ ] Revise tremolo (audibly not working)
[ ] Clarify relation between synthConfig and audioGraph
[ ] Add a demo with full composition

## Key Features

### Core Structure
- **Multi-track compositions** with labels, synths, samplers, and per-track effects
- **Audio graph system** with nodes and connections for complex signal routing
- **Custom presets** for reusable synthesizer and effect configurations
- **MIDI channel support** with per-note and per-sequence channel assignments

### Advanced Timing & Modulation
- **Tempo maps** (`tempoMap`) for tempo changes throughout the composition
- **Key signature maps** (`keySignatureMap`) for key changes
- **Time signature maps** (`timeSignatureMap`) for meter changes
- **MIDI modulation events** (CC, pitch bend, aftertouch) per note
- **Automation** for parameter changes over time

### Audio Processing
- **Modular audio routing** with `audioGraph` and `connections`
- **Per-sequence effects** and global effects processing
- **Synthesis engines** including sampler synths with advanced envelopes
- **Microtuning support** for microtonal compositions
- **Transport controls** with global looping and swing

### Composition Tools
- **Annotations system** for lyrics, rehearsal marks, and comments
- **Loop controls** per sequence with musical time durations
- **Velocity and articulation** support for expressive performances
- **Musical time notation** (bar:beat:subdivision, note values)

## Schema & Implementation

- **Schema:** [jmon_schema.json](jmon_schema.json) - Complete JSON Schema validation
- **JavaScript Library:** [jmon-tone.js](jmon-tone.js) - Core parsing and validation
- **Examples:** [jmon-tone-examples.js](jmon-tone-examples.js) - Usage demonstrations

## Quick Start

```javascript
const jmonTone = require('./jmon-tone.js');

// Create a basic composition
const composition = jmonTone.createBasicComposition({
    name: "My Composition",
    bpm: 120,
    keySignature: "C"
});

// Add a synthesizer to the audio graph
jmonTone.addAudioGraphNode(composition, {
    id: "lead_synth",
    type: "PolySynth",
    options: { polyphony: 4 }
});

// Connect to master output
jmonTone.addConnection(composition, "lead_synth", "master");

// Add a musical sequence
jmonTone.addSequence(composition, {
    label: "Lead Melody",
    synthRef: "lead_synth",
    notes: [
        { note: "C4", time: "0:0:0", duration: "4n", velocity: 0.8 },
        { note: "E4", time: "0:1:0", duration: "4n", velocity: 0.7 }
    ]
});

// Validate the composition
const validation = jmonTone.validate(composition);
console.log('Valid:', validation.success);
```

## Schema Compliance

This implementation follows the extended jmonTone schema which includes:

- **Required fields:** `format`, `version`, `bpm`, `audioGraph`, `connections`, `sequences`
- **Audio graph nodes** with `id`, `type`, and `options`
- **Connections array** defining signal routing `[source, target]`
- **Enhanced sequences** with MIDI channels, modulation events, and synth references
- **Custom presets** for reusable configurations
- **Automation events** for parameter control over time
- **Comprehensive validation** against the JSON schema

The library provides full validation, parsing, and conversion utilities for working with jmonTone compositions in JavaScript environments.

## Mapping MIDI vers Tone.js

La bibliothèque jmonTone prend en charge le mapping automatique des contrôles MIDI vers les paramètres Tone.js :

### Contrôles MIDI Supportés

#### 🎚️ **Pitch Bend**
- **Valeurs MIDI :** -8192 à +8191
- **Mapping Tone.js :** `oscillator.detune` (en cents)
- **Usage :** Modulation de hauteur en temps réel

```javascript
{
    type: "pitchBend",
    value: 4096,  // +1 semitone
    time: "4n"    // Appliqué à la croche
}
```

#### 🎡 **Roue de Modulation (CC1)**
- **Valeurs MIDI :** 0-127
- **Mapping Tone.js :** Varie selon le type de synthé :
  - `Synth` → `filter.frequency`
  - `AMSynth` → `modulation.frequency`
  - `FMSynth` → `modulation.index`
  - `DuoSynth` → `vibratoAmount`

#### 🎛️ **Autres Contrôleurs CC**
- **CC11 (Expression) :** `volume` (-40dB à 0dB)
- **CC71 (Resonance) :** `filter.Q` (0.1 à 30)
- **CC72 (Release) :** `envelope.release` (0.001s à 4s)
- **CC73 (Attack) :** `envelope.attack` (0.001s à 4s)
- **CC74 (Cutoff) :** `filter.frequency` (20Hz à 20kHz)

#### 👆 **Aftertouch**
- **Mapping :** `filter.frequency` par défaut
- **Usage :** Contrôle expressif par pression

### Utilisation Pratique

```javascript
// 1. Créer une composition avec modulations MIDI
const composition = jmonTone.createBasicComposition();

// 2. Ajouter une note avec modulations
jmonTone.addSequence(composition, {
    label: "Lead",
    notes: [{
        note: "C4",
        time: "0:0:0",
        duration: "1n",
        modulations: [
            {
                type: "pitchBend",
                value: 4096,     // Bend vers le haut
                time: "4n"
            },
            {
                type: "cc",
                controller: 1,   // Mod wheel
                value: 100,      // Valeur élevée
                time: "8n"
            }
        ]
    }]
});

// 3. Mapper vers Tone.js
const toneFormat = jmonTone.convertToToneFormat(composition);
const note = toneFormat.sequences[0].notes[0];

// 4. Appliquer à un synthé Tone.js
const synth = new Tone.Synth().toDestination();
jmonTone.applyMIDIModulationsToTone(synth, note.automationEvents);

// 5. Générer du code Tone.js
const code = jmonTone.generateToneJSModulationCode(composition);
console.log(code);
```

### Ranges de Conversion

| Contrôle MIDI | Valeur MIDI | Paramètre Tone.js | Range Tone.js |
|---------------|-------------|-------------------|---------------|
| Pitch Bend | -8192 → +8191 | `detune` | -200 → +200 cents |
| Mod Wheel (CC1) | 0 → 127 | `filter.frequency` | 20Hz → 20kHz |
| Expression (CC11) | 0 → 127 | `volume` | -40dB → 0dB |
| Cutoff (CC74) | 0 → 127 | `filter.frequency` | 20Hz → 20kHz |
| Resonance (CC71) | 0 → 127 | `filter.Q` | 0.1 → 30 |
| Attack (CC73) | 0 → 127 | `envelope.attack` | 0.001s → 4s |
| Release (CC72) | 0 → 127 | `envelope.release` | 0.001s → 4s |

### Exemple Complet

Voir `jmon-tone-midi-examples.js` et `demo-midi-modulations.html` pour des exemples complets d'utilisation avec interface interactive.
