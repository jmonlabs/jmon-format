
# JMON: JSON Musical Object Notation

## Overview

JMON (JSON Musical Object Notation) is a declarative JSON format for describing musical compositions, synthesizers, audio graphs, effects, automation, and note sequences. It serves as a backend-agnostic intermediate format, intended for use with converter libraries (e.g., `jmon-tone.js`).

## Root Structure

```json
{
  "format": "jmonTone",
  "version": "1.0",
  "bpm": 120,
  "timeSignature": "4/4",
  "tempoMap": [...],
  "transport": {...},
  "metadata": {...},
  "audioGraph": [...],
  "connections": [...],
  "sequence": {...},
  "automation": [...]
}
```

## Sequence

```json
"sequence": {
  "notes": [
    { "note": "C4", "time": "0:0", "duration": "4n", "velocity": 0.8 },
    { "note": "E4", "time": "0:1", "duration": "4n", "velocity": 0.8 },
    { "note": "G4", "time": "0:2", "duration": "4n", "velocity": 0.8 }
  ],
  "loop": true,
  "loopEnd": "4m"
}
```

- `notes`: Array of note event objects.
  - `note`: Note name, MIDI number, or chord array.
  - `time`: Start time (Tone.js time format or seconds).
  - `duration`: Duration (notation or seconds).
  - `velocity`: Optional (0.0â1.0).
  - `articulation`: Optional text marker.
  - `microtuning`: Optional microtonal adjustment.
- `loop`: Boolean or time string for looping.
- `loopEnd`: End time for loop.

## Example Composition

```json
{
  "format": "jmonTone",
  "version": "1.0",
  "bpm": 90,
  "timeSignature": "4/4",
  "audioGraph": [
    { "id": "poly1", "type": "PolySynth", "options": { "voice": "AMSynth", "maxPolyphony": 6 } },
    { "id": "reverb1", "type": "Reverb", "options": { "decay": 2 } },
    { "id": "bitcrusher1", "type": "BitCrusher", "options": { "bits": 4 } }
  ],
  "connections": [
    ["poly1", "bitcrusher1"],
    ["bitcrusher1", "reverb1"],
    ["reverb1", "destination"]
  ],
  "sequence": {
    "notes": [
      { "note": "C4", "time": "0:0", "duration": "2n" },
      { "note": "E4", "time": "0:1", "duration": "2n" },
      { "note": "G4", "time": "0:2", "duration": "2n" }
    ],
    "loop": true,
    "loopEnd": "4m"
  },
  "automation": [
    { "target": "reverb1.wet", "time": "0:0", "value": 0.2 },
    { "target": "reverb1.wet", "time": "2:0", "value": 0.5 }
  ],
  "metadata": {
    "name": "Worn Piano",
    "author": "Essi"
  }
}
```

## Design Principles

- Backend-agnostic format
- Graph-based routing
- Extensible for future features
- Clear separation of structure and musical data

## Time Formats

| Format | Example | Meaning |
|---------|---------|---------|
| Seconds | `1.5` | 1.5 seconds |
| Bars:Beats | `"2:0"` | Bar 2, beat 0 |
| Bars:Beats:Sixteenths | `"2:1:0"` | Bar 2, beat 1 |
| Notation | `"4n"` | Quarter note |
| Frequency | `"2hz"` | 2 cycles per second |
| Relative | `"+1m"` | 1 measure offset |

## Usage

JMON files are designed to be processed by converters such as:

- `jmon-tone.js`
- Future: `jmon-supercollider.js`, `jmon-midi.js`