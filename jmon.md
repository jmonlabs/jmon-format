# JMON: JSON Musical Object Notation

## Technical Specification v1.0

### Abstract

JMON (JSON Musical Object Notation) is a declarative, JSON-based format for representing musical compositions with comprehensive synthesis and audio processing capabilities. JMON serves as a universal musical notation system that can be converted to various audio synthesis backends through dedicated converter libraries. The format is designed for extensibility to target multiple frameworks including Tone.js, SuperCollider, MIDI, and abc.js.

### Core Architecture

#### Format Identifier and Versioning

```json
{
  "format": "jmonTone",
  "version": "1.0"
}
```

The format identifier `jmonTone` denotes the current specification targeted for Tone.js conversion. While JMON itself is backend-agnostic, format identifiers help converters understand the intended target and feature set.

#### Composition Root Schema

```typescript
interface JMONComposition {
  format: "jmonTone";
  version: string;
  bpm: number;
  keySignature?: string;
  metadata?: CompositionMetadata;
  globalEffects?: GlobalEffectsChain;
  sequences: SequenceDefinition[];
}
```

### Temporal Representation

JMON employs a dual temporal representation system:

1. **Absolute Time**: Floating-point seconds from composition start
2. **Musical Time**: Bar:beat notation (e.g., `"4:2"` = bar 4, beat 2)

Time parsing is handled by converter libraries (e.g., `_parseTimeString()` in jmon-tone.js), which convert musical notation to absolute time using the composition's BPM and time signature.

### Sequence Definition Architecture

```typescript
interface SequenceDefinition {
  label: string;
  group?: string;
  loop: boolean | string;
  synth: SynthesizerConfiguration;
  effects?: EffectChain[];
  notes: NoteEvent[];
}
```

#### Loop Semantics

- `loop: false` - Single playthrough
- `loop: true` - Infinite loop based on calculated sequence duration
- `loop: "8:0"` - Loop until specified musical time

Loop expansion is computed by converter libraries (e.g., `expandNotesWithLoop()` in jmon-tone.js), which generate repeated note events with temporal offsets.

### Synthesizer Configuration

JMON supports polymorphic synthesizer definitions mapped to Tone.js synthesizer classes:

#### PolySynth Configuration

```json
{
  "type": "PolySynth",
  "voice": "FMSynth",
  "polyphony": 8,
  "oscillator": {
    "type": "sine",
    "harmonicity": 2,
    "modulationType": "triangle",
    "modulationIndex": 12
  }
}
```

#### Specialized Synthesizers

- **AMSynth**: Amplitude modulation with `modulation` and `modulationEnvelope` parameters
- **DuoSynth**: Dual-voice synthesis with `voice0`, `voice1`, `harmonicity`, and vibrato control
- **MonoSynth**: Monophonic synthesis optimized for bass and lead lines
- **NoiseSynth**: Noise-based percussion synthesis with configurable noise types
- **Sampler**: Sample-based synthesis for realistic instruments and custom sounds

#### Sampler Configuration

```json
{
  "type": "Sampler",
  "urls": {
    "C4": "piano-C4.wav",
    "D#4": "piano-Ds4.wav",
    "F#4": "piano-Fs4.wav",
    "A4": "piano-A4.wav"
  },
  "baseUrl": "./samples/piano/",
  "sampleManipulation": {
    "attack": 0.01,
    "release": 0.5,
    "curve": "exponential"
  },
  "effects": [
    {
      "type": "Reverb",
      "roomSize": 0.4,
      "wet": 0.2
    }
  ]
}
```

#### Sampler Parameters

- **urls**: Object mapping note names to sample file paths
- **baseUrl**: Base directory path for sample files (optional)
- **sampleManipulation**: Sample playback configuration
  - `attack`: Sample fade-in time
  - `release`: Sample fade-out time
  - `curve`: Envelope curve type ("linear", "exponential")
- **Standard parameters**: `envelope`, `filter`, `filterEnvelope`, `effects`

#### Universal Parameters

All synthesizers support:
- `oscillator`: Waveform and modulation configuration (not applicable to Sampler)
- `envelope`: ADSR envelope (Attack, Decay, Sustain, Release)
- `filter`: Frequency filtering with type, frequency, Q, and rolloff
- `filterEnvelope`: Time-varying filter modulation
- `effects`: Effects chain array (see Effects Processing section)

**Note**: Samplers use pre-recorded audio files instead of oscillators, so oscillator parameters are ignored for Sampler type.

### Note Event Specification

```typescript
interface NoteEvent {
  note: string | number | Array<string | number>;
  time: number | string;
  duration: string | number;
  velocity?: number; // 0.0-1.0
  start?: number;    // Alias for time (Tone.js compatibility)
}
```

#### Note Representation

JMON supports multiple note input formats:
- **String notation**: `"C4"`, `"A#3"`, `"Bb5"`
- **MIDI numbers**: `60` (C4), `69` (A4)
- **Chord arrays**: `["C4", "E4", "G4"]`, `[60, 64, 67]`

Note conversion is handled by converter libraries (e.g., `midiNoteToNoteName()` and `noteNameToMidiNote()` in jmon-tone.js) with range validation (0-127).

#### Duration Notation

Durations support both absolute and relative formats:
- **Absolute**: Seconds as floating-point numbers
- **Relative**: Tone.js notation (`"4n"` = quarter note, `"8n"` = eighth note, `"1m"` = whole measure)

### Effects Processing Chain

JMON implements a hierarchical effects architecture:

#### Local Effects (Per-Sequence)

```json
"effects": [
  {
    "type": "Reverb",
    "roomSize": 0.9,
    "decay": 3.0,
    "wet": 0.4
  },
  {
    "type": "Delay",
    "delayTime": "8n",
    "feedback": 0.4,
    "wet": 0.3
  }
]
```

#### Global Effects (Master Chain)

```json
"globalEffects": {
  "masterReverb": {
    "type": "Reverb",
    "roomSize": 0.8,
    "decay": 2.5,
    "wet": 0.3
  },
  "masterCompressor": {
    "type": "Compressor",
    "threshold": -12,
    "ratio": 4,
    "attack": 0.1,
    "release": 0.2
  }
}
```

Effects are processed sequentially within each chain. Converter libraries handle the translation to target-specific effect implementations (e.g., `processEffectsChain()` in jmon-tone.js converts JMON effect definitions to Tone.js-compatible parameter objects).

### Validation and Error Handling

JMON defines validation requirements that converter libraries should implement. The reference implementation in `jmon-tone.js` provides a comprehensive validation system through the `validate()` method:

#### Required Field Validation
- Root fields: `format`, `version`, `bpm`, `sequences`
- Sequence fields: `label`, synthesizer definition, `notes`
- Note fields: `time`, `note`, `duration`

#### Range Validation
- BPM: Recommended 60-240 range with warnings for outliers
- Velocity: 0.0-1.0 range with boundary enforcement
- MIDI notes: 0-127 range with fallback to C4 (60)

#### Return Schema
```typescript
interface ValidationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
}
```

### Converter Integration

JMON files are designed to be processed by converter libraries that translate the format to specific audio frameworks. Converters handle:

1. **Schema Validation**: Verify JMON format compliance
2. **Synthesizer Mapping**: Translate JMON synth definitions to target framework constructors
3. **Note Processing**: Convert between note formats and temporal representations
4. **Effects Translation**: Map JMON effects to target-specific implementations
5. **Context Integration**: Apply composition metadata and global settings

### Extensibility Architecture

JMON's modular design facilitates backend abstraction through converter libraries:

#### Format Core (Backend-Agnostic)
- Musical notation and temporal representation
- Synthesizer parameter definitions
- Effects chain specifications
- Validation schema

#### Converter Libraries
- `jmon-tone.js`: Tone.js compatibility layer with `convertToToneFormat()`
- Future: `jmon-supercollider.js`, `jmon-midi.js`, etc.

#### Plugin Architecture
The effects processing system supports arbitrary effect types through the polymorphic effect definition schema, enabling custom effect implementations without format modifications.

### Performance Considerations

#### Memory Optimization
- Loop expansion is computed on-demand rather than stored
- Note arrays use shallow copying for loop iterations
- Validation caching prevents redundant schema checks

#### Computational Complexity
- Note processing: O(n) where n = total note events
- Loop expansion: O(n×l) where l = loop iterations
- Validation: O(s×n) where s = sequence count

### Implementation Notes

The reference converter implementation (`jmon-tone.js` class) provides:
- Static method architecture for functional programming compatibility
- Cross-platform compatibility (Node.js and browser environments)
- Defensive programming with fallback values for malformed input
- Comprehensive error logging with context preservation

Other converter libraries should follow similar patterns for consistency across the JMON ecosystem.

## JMON vs Converter Libraries

**JMON** is the musical notation format itself - a JSON schema for representing musical compositions with synthesizer configurations, note sequences, and effects chains. It is backend-agnostic and serves as a universal intermediate representation.

**jmon-tone.js** is a converter library that translates JMON files into Tone.js-compatible format. It handles:
- Format validation and error checking
- Note format conversion (MIDI numbers ↔ note names)
- Temporal calculations (bar:beat → absolute time)
- Synthesizer parameter mapping
- Effects chain processing
- Loop expansion for playback

Future converter libraries (jmon-supercollider.js, jmon-midi.js, etc.) will provide similar translation capabilities for their respective target platforms while working with the same JMON source format.

### Example Usage Patterns

#### Minimal Composition
```json
{
  "format": "jmonTone",
  "version": "1.0",
  "bpm": 120,
  "sequences": [{
    "label": "Simple Melody",
    "synth": { "type": "Synth" },
    "notes": [
      { "note": "C4", "time": 0, "duration": "4n" }
    ]
  }]
}
```

#### Advanced Synthesis
```json
{
  "synth": {
    "type": "PolySynth",
    "voice": "FMSynth",
    "oscillator": {
      "type": "sine",
      "harmonicity": 2,
      "modulationType": "triangle"
    },
    "envelope": {
      "attack": 0.1,
      "decay": 0.3,
      "sustain": 0.4,
      "release": 1.2
    },
    "effects": [
      { "type": "Reverb", "roomSize": 0.9 },
      { "type": "Chorus", "frequency": 2 }
    ]
  }
}
```

This specification defines JMON as a comprehensive, extensible format for musical composition representation with strong typing, validation, and multi-backend compatibility.
