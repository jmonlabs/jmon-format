# jmon: JSON musical object notation

**jmon** is a declarative, extensible JSON format for describing multi-track musical projects, synth/effect graphs, sample mapping, time-based events, automation, and more. It is backend-agnostic and designed for robust conversion to platforms such as Tone.js, SuperCollider, MIDI, and beyond.

---

## Table of Contents

- [Top-level Structure](#top-level-structure)
- [Timing: BPM, Tempo and Time Signature Mapping](#timing-bpm-tempo-and-time-signature-mapping)
- [Audio Graph and Connections](#audio-graph-and-connections)
- [Sequences (Tracks)](#sequences-tracks)
  - [Synth, Sampler, or Reference](#synth-sampler-or-reference)
  - [Per-sequence Effects](#per-sequence-effects)
  - [Looping](#looping)
  - [Notes and Chords](#notes-and-chords)
- [Parameter Automation](#parameter-automation)
- [Complete jmon Example](#complete-jmon-example)
- [Common Patterns and Best Practices](#common-patterns-and-best-practices)
- [Supported Time Formats](#supported-time-formats)

---

## Top-level Structure

Every jmon file is a single JSON object:

```json
{
  "format": "jmon",
  "version": "1.0",
  "bpm": 120,
  "timeSignature": "4/4",
  "timeSignatureMap": [ ... ],
  "tempoMap": [ ... ],
  "audioGraph": [ ... ],
  "connections": [ ... ],
  "sequences": [ ... ],
  "automation": [ ... ],
  "transport": { ... },
  "metadata": { ... }
}

Required fields:
	•	format: always "jmon"
	•	version: format version
	•	bpm: initial tempo
	•	audioGraph: array of synth/effect/modulator definitions
	•	connections: array of audio routing pairs
	•	sequences: array of tracks

Optional fields:
	•	timeSignature: initial time signature (e.g. "4/4")
	•	timeSignatureMap: array of { time, timeSignature } objects for mid-piece changes
	•	tempoMap: array of { time, bpm } for tempo changes
	•	automation: array of parameter change events
	•	transport: playback controls
	•	metadata: composition info

⸻

Timing: BPM, Tempo and Time Signature Mapping

bpm sets the initial tempo; use tempoMap for mid-composition changes.

"bpm": 120,
"tempoMap": [
  { "time": "0:0", "bpm": 120 },
  { "time": "8:0", "bpm": 90 }
],
"timeSignature": "4/4",
"timeSignatureMap": [
  { "time": "0:0", "timeSignature": "4/4" },
  { "time": "16:0", "timeSignature": "7/8" }
]

Interpretation:
	•	At measure 0:0, use 120 bpm and 4/4.
	•	At 8:0, switch to 90 bpm.
	•	At 16:0, switch to 7/8 time.

⸻

Audio Graph and Connections

audioGraph defines modular nodes (synths, samplers, effects, master bus, etc.), each with a unique "id".
connections specifies signal routing pairs.

"audioGraph": [
  { "id": "leadSynth", "type": "polySynth", "options": { "voice": "fmSynth" } },
  { "id": "sampler1", "type": "sampler", "options": {
      "urls": { "C4": "piano-C4.wav", "D#4": "piano-Ds4.wav" },
      "baseUrl": "./samples/piano/",
      "envelope": { "attack": 0.01, "release": 0.3 }
  }},
  { "id": "chorus1", "type": "chorus", "options": { "frequency": 1.5 } },
  { "id": "compressor", "type": "compressor", "options": { "threshold": -18 } },
  { "id": "reverb1", "type": "reverb", "options": { "decay": 2.5 } },
  { "id": "mixbus", "type": "gain", "options": {} }
],
"connections": [
  ["leadSynth", "chorus1"],
  ["chorus1", "mixbus"],
  ["sampler1", "mixbus"],
  ["mixbus", "compressor"],
  ["compressor", "reverb1"],
  ["reverb1", "destination"]
]


⸻

Sequences (Tracks)

Each sequence (track) is an object with:
	•	label: name of the track
	•	synth: inline synth/sampler definition (OR synthRef to an audioGraph node)
	•	effects: optional array of per-track effect nodes
	•	notes: array of musical events
	•	loop, loopEnd: looping controls

Example:

{
  "label": "lead",
  "synthRef": "leadSynth",
  "effects": [
    { "type": "autoFilter", "options": { "baseFrequency": 200 } }
  ],
  "notes": [
    { "note": "C4", "time": "0:0", "duration": "4n", "velocity": 0.8 },
    { "note": ["E4", "G4"], "time": "0:2", "duration": "8n", "velocity": 0.7 }
  ],
  "loop": true,
  "loopEnd": "8m"
}

Or, with a sampler and effects:

{
  "label": "piano",
  "synth": {
    "type": "sampler",
    "options": {
      "urls": { "C4": "piano-C4.wav", "D#4": "piano-Ds4.wav" },
      "baseUrl": "./samples/piano/",
      "envelope": { "attack": 0.01, "release": 0.5 }
    }
  },
  "effects": [
    { "type": "reverb", "options": { "decay": 2.2, "wet": 0.4 } }
  ],
  "notes": [
    { "note": "C4", "time": "1:0", "duration": "2n", "velocity": 1.0 }
  ]
}


⸻

Synth, Sampler, or Reference
	•	synth: object, inline synth/sampler (see audioGraph structure for options)
	•	synthRef: string, references a synth node in audioGraph
	•	effects: array of effects, applied after the synth for this sequence

Synth Example

"synth": { "type": "polySynth", "options": { "voice": "fmSynth" } }

Sampler Example

"synth": {
  "type": "sampler",
  "options": {
    "urls": { "C2": "kick.wav", "D2": "snare.wav" },
    "baseUrl": "./samples/drums/"
  }
}


⸻

Looping
	•	loop: true/false, or a time string (e.g., "8:0")
	•	loopEnd: time string where the loop ends (e.g., "16:0")

⸻

Notes and Chords

Each event in notes is:

{
  "note": "A4",              // string (e.g. "C4") or MIDI number (e.g. 60) or array for chords
  "time": "0:1",             // musical (bar:beat), absolute (number), or string (e.g. "4n")
  "duration": "8n",          // string ("8n", "4n", "1m") or number (seconds)
  "velocity": 0.7,           // optional, 0.0 to 1.0
  "articulation": "staccato",// optional, free text
  "microtuning": 5           // optional, in cents or semitones (implementation defined)
}

Chords: "note": ["C4", "E4", "G4"]

⸻

Parameter Automation

Automate any parameter on a node or sequence:

"automation": [
  { "target": "reverb1.wet", "time": "2:0", "value": 0.5 },
  { "target": "leadSynth.detune", "time": "+1m", "value": -12 }
]

	•	target: parameter path
	•	time: when to apply
	•	value: new value

⸻

Transport

Control playback behavior:

"transport": {
  "startOffset": "2m",
  "globalLoop": true,
  "globalLoopEnd": "16m",
  "swing": 0.15
}


⸻

Metadata

"metadata": {
  "name": "My Demo Project",
  "author": "your_name"
}


⸻

Complete jmon Example

{
  "format": "jmon",
  "version": "1.0",
  "bpm": 112,
  "timeSignature": "4/4",
  "timeSignatureMap": [
    { "time": "0:0", "timeSignature": "4/4" },
    { "time": "8:0", "timeSignature": "5/4" }
  ],
  "tempoMap": [
    { "time": "0:0", "bpm": 112 },
    { "time": "16:0", "bpm": 90 }
  ],
  "audioGraph": [
    { "id": "leadSynth", "type": "polySynth", "options": { "voice": "fmSynth" } },
    { "id": "drumSampler", "type": "sampler", "options": {
        "urls": { "C2": "kick.wav", "D2": "snare.wav" },
        "baseUrl": "./samples/drums/"
    }},
    { "id": "reverb1", "type": "reverb", "options": { "decay": 2.5, "wet": 0.4 } },
    { "id": "compressor", "type": "compressor", "options": { "threshold": -14 } },
    { "id": "mixbus", "type": "gain", "options": {} }
  ],
  "connections": [
    ["leadSynth", "mixbus"],
    ["drumSampler", "mixbus"],
    ["mixbus", "compressor"],
    ["compressor", "reverb1"],
    ["reverb1", "destination"]
  ],
  "sequences": [
    {
      "label": "lead",
      "synthRef": "leadSynth",
      "effects": [
        { "type": "chorus", "options": { "frequency": 1.7 } }
      ],
      "notes": [
        { "note": "C4", "time": "0:0", "duration": "4n", "velocity": 0.85 },
        { "note": ["E4", "G4"], "time": "0:2", "duration": "8n", "velocity": 0.7 },
        { "note": "D4", "time": "1:0", "duration": "2n", "velocity": 0.8, "microtuning": -10 }
      ],
      "loop": true,
      "loopEnd": "8m"
    },
    {
      "label": "drums",
      "synthRef": "drumSampler",
      "notes": [
        { "note": "C2", "time": "0:0", "duration": "16n", "velocity": 1.0 },
        { "note": "D2", "time": "0:2", "duration": "16n", "velocity": 0.6 }
      ],
      "loop": true,
      "loopEnd": "4m"
    }
  ],
  "automation": [
    { "target": "reverb1.wet", "time": "2:0", "value": 0.7 }
  ],
  "transport": {
    "startOffset": "1m",
    "globalLoop": false
  },
  "metadata": {
    "name": "JMON Example",
    "author": "you"
  }
}


⸻

Common Patterns and Best Practices
	•	Use audioGraph + connections for all master FX, sidechains, and global routing.
	•	For simple tracks, define synth or sampler inline; for shared/complex setups, use synthRef.
	•	Per-sequence effects is a shortcut for “insert” FX after synth, before routing to the graph.
	•	Automate any parameter (including per-track FX and global FX).
	•	Use timeSignatureMap and tempoMap for “prog” or orchestral scores.
	•	Organize notes with explicit velocity and articulation for realism.

⸻

Supported Time Formats

Format	Example	Meaning
Absolute (seconds)	1.5	1.5 seconds from start
Bar:Beat:Sixteenth	"3:2:0"	Bar 3, beat 2, 16th 0
Bar:Beat	"2:1"	Bar 2, beat 1
Notation	"4n"	Quarter note
Triplet Notation	"8t"	Eighth-note triplet
Measure	"1m"	One full measure
Frequency	"2hz"	2 hertz, for LFOs
Relative Offset	"+1m"	One measure later


⸻

For conversion and execution, refer to converter implementations (e.g. jmon-tone.js).
For advanced usage, see the schema and this specification.

⸻


**This file is self-sufficient, covers the entire format, and can serve as your official specification and teaching doc!**  
If you’d like it as a downloadable file, just say the word.