# JMON: JSON Musical Object Notation

## Overview

JMON (JSON Musical Object Notation) is a declarative JSON format for describing musical compositions, synthesizers, audio graphs, effects, timing, automation, and note sequences. It is designed as a backend-agnostic intermediate format, intended to be converted by dedicated converter libraries (e.g., `jmon-tone.js`) into audio synthesis frameworks such as Tone.js or SuperCollider.

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

- `format`: Target backend identifier (e.g., `jmonTone`)
- `version`: Format version (e.g., `1.0`)
- `bpm`: Global tempo in beats per minute
- `timeSignature`: Global time signature (e.g., `4/4`)
- `tempoMap`: Optional array defining tempo changes over time
- `transport`: Optional transport-level properties
- `metadata`: Optional metadata (e.g., name, author)
- `audioGraph`: List of synths, effects, modulators
- `connections`: List of signal routing connections
- `sequence`: Note data and timing
- `automation`: Optional parameter automation

## Audio Graph

### Node Structure

```json
{
  "id": "poly1",
  "type": "PolySynth",
  "options": { ... },
  "target": "poly1.detune"
}
```

- `id`: Unique node identifier
- `type`: Tone.js class name (e.g., `Synth`, `PolySynth`, `Reverb`, `LFO`, `Sampler`)
- `options`: Node options
- `target`: Target parameter for modulators (optional)

## Connections

Defines signal flow between nodes.

```json
[
  ["poly1", "reverb1"],
  ["reverb1", "destination"]
]
```

## Sequence

Defines musical note data.

```json
{
  "notes": ["C4", "E4", "G4"],
  "duration": "2n",
  "time": 0,
  "velocity": 0.8,
  "articulation": "staccato",
  "microtuning": -12,
  "loop": true,
  "loopEnd": "4m"
}
```

## Automation

```json
[
  { "target": "filter1.frequency", "time": "0:0", "value": 2000 },
  { "target": "filter1.frequency", "time": "2:0", "value": 500 }
]
```

## Tempo Map

```json
[
  { "time": "0:0", "bpm": 120 },
  { "time": "4:0", "bpm": 90 }
]
```

## Transport

```json
{
  "startOffset": "1m",
  "globalLoop": true,
  "globalLoopEnd": "8m",
  "swing": 0.2
}
```

## Time Formats

| Format | Example | Meaning |
|---------|---------|---------|
| Seconds (number) | `1.5` | 1.5 seconds |
| Bars:Beats:Sixteenths | `"2:1:0"` | Bar 2, beat 1 |
| Bars:Beats | `"3:0"` | Bar 3, beat 0 |
| Notation | `"4n"`, `"8t"`, `"1m"` | Quarter note, eighth triplet, one measure |
| Frequency | `"2hz"` | 2 cycles per second |
| Relative | `"+1m"` | 1 measure after current position |

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
    "notes": ["C4", "E4", "G4"],
    "duration": "2n",
    "time": 0,
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
- Graph-based signal routing
- Extensible specification
- Clean separation of audio structure and musical data

## Converter Responsibilities

Converters are responsible for:

- Schema validation and error reporting
- Graph construction and routing
- Note timing and loop expansion
- Parameter automation processing
- Backend-specific mapping (e.g., Tone.js)

