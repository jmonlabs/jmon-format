# JMON: JSON Musical Object Notation

JMON (JSON Musical Object Notation) is a declarative, backend-agnostic JSON format for describing musical compositions, synthesizers, audio graphs, effects, automation, and note sequences. It is designed as an intermediate format between algorithmic generators (e.g., Djalgo) and audio synthesis frameworks (e.g., Tone.js).

## Features

- Graph-based audio structure (synths, effects, modulators)
- Clean separation of structure, notes, and control data
- Support for advanced timing: BPM, time signature, tempo map
- Looping and transport-level control
- Parameter automation
- Extensible and versioned

## Example

```json
{
  "format": "jmonTone",
  "version": "1.0",
  "bpm": 120,
  "timeSignature": "4/4",
  "audioGraph": [
    { "id": "synth1", "type": "PolySynth", "options": { "voice": "AMSynth", "maxPolyphony": 6 } },
    { "id": "reverb1", "type": "Reverb", "options": { "decay": 2 } }
  ],
  "connections": [
    ["synth1", "reverb1"],
    ["reverb1", "destination"]
  ],
  "sequence": {
    "notes": [
      { "note": "C4", "time": "0:0", "duration": "4n", "velocity": 0.8 },
      { "note": "E4", "time": "0:1", "duration": "4n", "velocity": 0.8 },
      { "note": "G4", "time": "0:2", "duration": "4n", "velocity": 0.8 }
    ],
    "loop": true,
    "loopEnd": "4m"
  },
  "automation": [
    { "target": "reverb1.wet", "time": "0:0", "value": 0.3 }
  ],
  "metadata": {
    "name": "Example Composition",
    "author": "Essi"
  }
}
```

## File Structure

| Field | Description |
|--------|-------------|
| `format` | Target backend identifier |
| `version` | Specification version |
| `bpm` | Beats per minute |
| `timeSignature` | Global time signature |
| `tempoMap` | Optional tempo changes |
| `transport` | Transport-level controls |
| `metadata` | Composition metadata |
| `audioGraph` | Synths, effects, modulators |
| `connections` | Signal routing |
| `sequence` | Contains `notes`, `loop`, `loopEnd` |
| `automation` | Parameter automation |

## Usage

JMON files are intended to be processed by converter libraries, such as:

- `jmon-tone.js`: Converts JMON to Tone.js objects
- Future: `jmon-supercollider.js`, `jmon-midi.js`, etc.

## License

JMON specification is open and intended for free use in music technology projects.
