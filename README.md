# jmon

jmon (JSON Musical Object Notation) is a musical notation format that allows you to write music using JSON. It's designed to be:

- **Readable**: Musical compositions written in familiar JSON syntax
- **Comprehensive**: Supports complex synthesizers, effects chains, and musical structures
- **Universal**: Backend-agnostic format that can target multiple audio frameworks
- **Extensible**: Easy to add new synthesizer types and effects

## jmon-tone.js

`jmon-tone.js` is a converter library that translates JMON files into [Tone.js](https://tonejs.github.io/) format for web audio playback. It handles all the complexity of converting jmon's musical notation into audio synthesis instructions.

## other synthetizer?

Although based on Tone.js capabiilties, jmon is an agnostic format. We will first focus on jmon-tone.js, but if everything goes smoothly, we intend to support other formats like SuperCollider.

## Example

Here's a simple jmon composition:

```json
{
  "format": "jmonTone",
  "version": "1.0",
  "bpm": 120,
  "sequences": [
    {
      "label": "Simple Melody",
      "synth": {
        "type": "Synth",
        "oscillator": { "type": "sine" },
        "envelope": {
          "attack": 0.1,
          "decay": 0.2,
          "sustain": 0.5,
          "release": 0.8
        }
      },
      "notes": [
        { "note": ["C4", "E4", "G4"], "time": "0:0", "duration": "4n", "velocity": 0.8 },
        { "note": "E4", "time": "0:1", "duration": "4n", "velocity": 0.7 },
        { "note": "G4", "time": "0:2", "duration": "4n", "velocity": 0.6 },
        { "note": "C5", "time": "0:3", "duration": "4n", "velocity": 0.5 }
      ]
    }
  ]
}
```

## Features

### Musical Notation
- **Multiple note formats**: String notation (`"C4"`), MIDI numbers (`60`), chord arrays (`["C4", "E4", "G4"]`)
- **Flexible timing**: Bar:beat notation (`"4:2"`) or absolute seconds
- **Duration support**: Tone.js notation (`"4n"`, `"8n"`) or absolute values

### Synthesizers
- **PolySynth**: Polyphonic synthesis with configurable voices
- **AMSynth**: Amplitude modulation synthesis
- **DuoSynth**: Dual-voice synthesis with harmonicity control
- **MonoSynth**: Monophonic synthesis for bass and leads
- **NoiseSynth**: Noise-based percussion synthesis

### Effects Processing
- **Local Effects**: Per-sequence effect chains
- **Global Effects**: Master effects applied to entire composition
- **Effect Types**: Reverb, Delay, Chorus, Filter, Distortion, Compressor

### Advanced Features
- **Loop Support**: Automatic sequence looping with configurable durations
- **Velocity Control**: Dynamic expression with 0.0-1.0 velocity range
- **Key Signatures**: Musical context for harmonic analysis
- **Metadata**: Title, composer, description, and version tracking

## Getting Started

1. **Write your music** in jmon format (see `porcelain.json` for a complete example)
2. **Convert to Tone.js** using jmon-tone.js:

```javascript
// Load the converter
const jmonTone = require('./jmon-tone.js');

// Load your JMON file
const composition = require('./your-music.json');

// Convert to Tone.js format
const toneFormat = jmonTone.convertToToneFormat(composition);

// Validate (optional but recommended)
const validation = jmonTone.validate(composition);
if (!validation.success) {
  console.error('Validation errors:', validation.errors);
}
```

## File Structure

- `jmon.md` - Complete technical specification of the JMON format
- `jmon-tone.js` - Converter library for Tone.js compatibility
- `porcelain.json` - Comprehensive demo composition showcasing all features
- `LICENSE` - GPL3 License

## Future Roadmap

JMON is designed for extensibility. Planned converter libraries include:
- `jmon-supercollider.js` - SuperCollider backend
- `jmon-midi.js` - MIDI file export
- `jmon-abc.js` - ABC notation conversion

## Contributing

Contributions welcome! Whether it's:
- General structure
- New synthesizer types
- Additional effect implementations
- Backend converters for other audio frameworks
- Documentation improvements
- Bug fixes

## License

GPL3 License - see LICENSE file for details.
