TODO
- Ajuster pour un time strict "bar:beat:tick"


# jmon: JSON Musical Object Notation

**jmon** (JSON Musical Object Notation) is a declarative, human-readable JSON format for describing musical compositions. It provides a powerful, backend-agnostic way to represent multi-track music with advanced features like modular audio routing, real-time effects, MIDI modulation, and complex timing.

## 🎵 The jmon Format

The jmon format is designed to be both comprehensive and intuitive, allowing composers and developers to describe music in a structured, declarative way. A jmon composition consists of:

### Core Structure
```json
{
  "format": "jmonTone",
  "version": "1.0",
  "bpm": 120,
  "metadata": {
    "name": "My Composition",
    "author": "Composer Name",
    "description": "A beautiful piece of music"
  },
  "audioGraph": [
    {
      "id": "synth1",
      "type": "PolySynth", 
      "options": { "polyphony": 4 }
    },
    {
      "id": "reverb",
      "type": "Reverb",
      "options": { "decay": 1.5, "wet": 0.3 }
    },
    {
      "id": "master",
      "type": "Destination"
    }
  ],
  "connections": [
    ["synth1", "reverb"],
    ["reverb", "master"]
  ],
  "sequences": [
    {
      "label": "Main Melody",
      "synthRef": "synth1",
      "notes": [
        {
          "note": "C4",
          "time": 0,
          "duration": 1,
          "velocity": 0.8,
          "modulations": [
            { "type": "cc", "controller": 1, "value": 64, "time": 0.5 }
          ]
        }
      ]
    }
  ]
}
```

### Key Features

#### 🎹 **Multi-Track Compositions**
- **Sequences**: Individual musical parts with labels and synth assignments
- **MIDI Channels**: Per-sequence and per-note channel support
- **Synth References**: Link sequences to specific audio graph nodes

#### 🔀 **Modular Audio Graph**
- **Nodes**: Synthesizers, samplers, effects, and destinations
- **Connections**: Define signal routing between nodes
- **Effects Chain**: Complex audio processing pipelines

#### 🎛️ **Advanced Modulation**
- **MIDI CC**: Continuous controller modulation
- **Pitch Bend**: Real-time pitch modulation  
- **Aftertouch**: Pressure-sensitive control
- **Automation**: Parameter changes over time

#### ⏱️ **Flexible Timing**
- **Tempo Maps**: Tempo changes throughout the composition
- **Key Signatures**: Key changes with musical notation
- **Time Signatures**: Meter changes (4/4, 3/4, etc.)
- **Musical Time**: Support for bar:beat:subdivision notation

#### 🎼 **Rich Musical Features**
- **Custom Presets**: Reusable synthesizer and effect configurations
- **Annotations**: Lyrics, rehearsal marks, and comments
- **Loop Controls**: Per-sequence looping with musical durations
- **Microtuning**: Support for microtonal compositions

## 🔧 Converting to Tone.js with jmon-tone.js

The `jmon-tone.js` library provides seamless conversion from the jmon format to working Tone.js audio code:

### Basic Usage

```javascript
// Load the jmon-tone converter
const jmonTone = require('./jmon-tone.js');

// Load a jmon composition
const composition = await fetch('demo/demo-01-basic-synth.json').then(r => r.json());

// Convert to Tone.js and play
const player = new jmonTone.Player();
await player.loadComposition(composition);
await player.play();
```

### Advanced Features

#### Audio Graph Creation
```javascript
// The converter automatically creates Tone.js nodes from the audioGraph
const nodes = jmonTone.createAudioGraph(composition.audioGraph);
// Result: { synth1: Tone.PolySynth, reverb: Tone.Reverb, master: Tone.Destination }

// And connects them according to the connections array
jmonTone.connectAudioGraph(nodes, composition.connections);
```

#### MIDI Modulation Mapping
```javascript
// MIDI controllers are automatically mapped to Tone.js parameters
const modulations = [
  { type: "cc", controller: 1, value: 100, time: 0.5 }  // Mod wheel
];

// Automatically maps to appropriate Tone.js parameters:
// - CC1 → filter.frequency, vibratoAmount, modulationIndex (synth-dependent)
// - CC11 → volume
// - Pitch Bend → detune
// - CC74 → filter.frequency
```

#### Sampler Support
```javascript
// Automatic sample loading and natural envelope application
{
  "id": "trumpet", 
  "type": "Sampler",
  "options": {
    "urls": {
      "C4": "./samples/trumpet-c4.wav",
      "D4": "./samples/trumpet-d4.wav"
    },
    "envelope": { "attack": 0.01, "release": 0.6 }
  }
}
```

### Conversion Features

- ✅ **Complete audioGraph support** - All synth and effect types
- ✅ **Automatic routing** - Signal flow from connections array  
- ✅ **MIDI modulation** - CC, pitch bend, aftertouch mapping
- ✅ **Sampler integration** - Sample loading with natural envelopes
- ✅ **Effects processing** - Real-time audio effects
- ✅ **Timing precision** - Musical time and tempo handling

## 🎪 Interactive Demos

**[→ Try the Live Demos](demo.html)**

The repository includes 15 comprehensive demos showcasing all jmon features:

- **Basic Synths** - Simple oscillator-based synthesis
- **Polyphonic** - Multi-voice compositions  
- **Modulation** - MIDI CC, pitch bend, vibrato, tremolo
- **FM Synthesis** - Frequency modulation techniques
- **Samplers** - Multi-sample instruments with envelopes
- **Effects** - Reverb, delay, chorus, distortion, filters
- **Complex Compositions** - Multi-track arrangements
- **Masterpiece** - Full symphonic composition with all features

Each demo includes:
- Complete jmon JSON source
- Real-time audio playback
- Schema validation
- Generated Tone.js code view

## 📝 Schema & Validation

### Complete JSON Schema
The format is fully validated by [jmon_schema.json](jmon_schema.json), ensuring:
- **Type safety** - All properties have correct types
- **Required fields** - Essential composition elements
- **Conditional schemas** - Context-dependent validation
- **Enum constraints** - Valid values for node types, modulation types, etc.

### Validation in Code
```javascript
// Validate any jmon composition
const validation = jmonTone.validate(composition);
if (validation.success) {
  console.log('✅ Valid jmon composition');
} else {
  console.log('❌ Validation errors:', validation.errors);
}
```

## 🚀 Quick Start

```javascript
// 1. Create a basic composition
const composition = {
  "format": "jmonTone",
  "version": "1.0", 
  "bpm": 120,
  "audioGraph": [
    { "id": "synth", "type": "Synth", "options": {} },
    { "id": "master", "type": "Destination", "options": {} }
  ],
  "connections": [["synth", "master"]],
  "sequences": [{
    "label": "Simple Melody",
    "synthRef": "synth", 
    "notes": [
      { "note": "C4", "time": 0, "duration": 0.5, "velocity": 0.8 },
      { "note": "E4", "time": 0.5, "duration": 0.5, "velocity": 0.7 },
      { "note": "G4", "time": 1.0, "duration": 1.0, "velocity": 0.9 }
    ]
  }]
};

// 2. Convert to Tone.js and play
const player = new jmonTone.Player();
await player.loadComposition(composition);
await player.play();
```

## 📋 MIDI to Tone.js Mapping

The jmon-tone.js converter provides intelligent mapping from MIDI controls to Tone.js parameters:

### Supported MIDI Controls

| MIDI Control | Range | Tone.js Target | Description |
|--------------|-------|----------------|-------------|
| **Pitch Bend** | -8192 to +8191 | `detune` (cents) | Real-time pitch modulation |
| **CC1 (Mod Wheel)** | 0-127 | Synth-dependent | Vibrato, filter, FM index |
| **CC11 (Expression)** | 0-127 | `volume` (-40dB to 0dB) | Dynamic expression |
| **CC71 (Resonance)** | 0-127 | `filter.Q` (0.1 to 30) | Filter resonance |
| **CC72 (Release)** | 0-127 | `envelope.release` | Release time |
| **CC73 (Attack)** | 0-127 | `envelope.attack` | Attack time |
| **CC74 (Cutoff)** | 0-127 | `filter.frequency` | Filter cutoff |
| **Aftertouch** | 0-127 | `filter.frequency` | Pressure control |

### Context-Aware Mapping
The converter intelligently maps CC1 (Mod Wheel) based on synthesizer type:
- **Synth/MonoSynth** → `filter.frequency`
- **AMSynth** → `modulation.frequency` 
- **FMSynth** → `modulationIndex`
- **DuoSynth** → `vibratoAmount`
- **Sampler** → Custom vibrato via playbackRate LFO

## 🎯 Advanced Features

### Effect Node Targeting
Use `converterHints` to target specific effect parameters:

```json
{
  "converterHints": {
    "tone": {
      "cc11": { 
        "target": "tremoloEffect", 
        "parameter": "depth", 
        "depthRange": [0, 0.8] 
      }
    }
  }
}
```

### Sampler Modulations
Special handling for sample-based instruments:
- **Pitch Bend** → `playbackRate` (affects pitch + speed)
- **Vibrato** → LFO connected to `playbackRate`
- **Natural Envelopes** → Smooth attack/release on samples

### Complex Audio Graphs
```json
{
  "audioGraph": [
    { "id": "lead", "type": "MonoSynth" },
    { "id": "filter", "type": "Filter" },
    { "id": "delay", "type": "FeedbackDelay" },
    { "id": "reverb", "type": "Reverb" },
    { "id": "compressor", "type": "Compressor" },
    { "id": "master", "type": "Destination" }
  ],
  "connections": [
    ["lead", "filter"],
    ["filter", "delay"], 
    ["delay", "reverb"],
    ["reverb", "compressor"],
    ["compressor", "master"]
  ]
}
```

## 🔬 Development & Validation

```javascript
// Validate compositions against the schema
const validation = jmonTone.validate(composition);
console.log('Valid:', validation.success);

// Generate Tone.js code for inspection
const toneCode = jmonTone.generateToneJSCode(composition);
console.log(toneCode);

// Create compositions programmatically
const comp = jmonTone.createBasicComposition({
    name: "Generated Music",
    bpm: 140
});

jmonTone.addAudioGraphNode(comp, {
    id: "bass",
    type: "FMSynth", 
    options: { harmonicity: 0.5 }
});

jmonTone.addSequence(comp, {
    label: "Bass Line",
    synthRef: "bass",
    notes: [/* ... */]
});
```

## 📚 Resources

- **[JSON Schema](jmon_schema.json)** - Complete format specification
- **[Converter Library](jmon-tone.js)** - Tone.js conversion engine  
- **[Live Demos](demo.html)** - Interactive examples and playground
- **[Demo Files](demo/)** - 15 example compositions

## 🎉 Getting Started

1. **Explore** the [interactive demos](demo.html) to see jmon in action
2. **Study** the demo JSON files in the `demo/` folder
3. **Validate** your compositions using the JSON schema
4. **Convert** to Tone.js using the jmon-tone.js library
5. **Create** your own musical compositions!

The jmon format makes it easy to describe complex musical ideas in a structured, reusable way, while jmon-tone.js handles all the technical details of converting to working audio code.
