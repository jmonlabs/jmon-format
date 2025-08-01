# JMON Observable Integration Example

Simple integration for displaying and playing JMON compositions in Observable notebooks.

## Setup

```javascript
// Load Tone.js first (required for playback)
Tone = require("tone@15")

// Load JMON libraries
jmonTone = require("https://raw.githubusercontent.com/your-repo/jmon-format/main/jmon-tone.js")
jmonAbc = require("https://raw.githubusercontent.com/your-repo/jmon-format/main/jmon-abc.js") 
jmonObservable = require("https://raw.githubusercontent.com/your-repo/jmon-format/main/jmon-observable.js")

// Optional: Load ABC.js for better score rendering
abcjs = require("abcjs@6")
```

## Usage Examples

### 1. Simple Score Display

```javascript
// Your composition in any format
myComposition = {
  title: "Simple Melody",
  tracks: {
    melody: [
      { pitch: 60, duration: 1, time: 0 },  // C4
      { pitch: 62, duration: 1, time: 1 },  // D4
      { pitch: 64, duration: 1, time: 2 },  // E4
      { pitch: 60, duration: 2, time: 3 }   // C4
    ]
  }
}

// Display as musical score
jmonObservable.show(myComposition)
```

### 2. Simple Player Widget

```javascript
// Display playback widget
jmonObservable.play(myComposition)
```

### 3. Combined Display

```javascript
// Show both score and player
jmonObservable.display(myComposition)
```

### 4. With Options

```javascript
// Customized score
jmonObservable.show(myComposition, {
  width: 600,
  title: true,
  clef: "treble",
  showTrackLabels: false
})

// Customized player
jmonObservable.play(myComposition, {
  width: 350,
  theme: "dark",
  showTitle: true
})
```

### 5. Multiple Formats Work

```javascript
// Array format
simpleArray = [
  { note: "C4", duration: "4n", time: "0:0:0" },
  { note: "E4", duration: "4n", time: "0:1:0" },
  { note: "G4", duration: "2n", time: "0:2:0" }
]

jmonObservable.display(simpleArray)

// Full JMON format
fullJmon = {
  format: "jmon",
  version: "1.0",
  bpm: 120,
  metadata: { name: "Test Song" },
  sequences: [
    {
      label: "melody",
      synthRef: "synth1",
      notes: [
        { note: "A4", time: 0, duration: 1, velocity: 0.8 }
      ]
    }
  ],
  audioGraph: [
    { id: "synth1", type: "Synth" }
  ],
  connections: [["synth1", "master"]]
}

jmonObservable.display(fullJmon)
```

## Error Handling

The widgets gracefully handle errors and show helpful messages:

```javascript
// Invalid composition
badComposition = { invalid: "data" }
jmonObservable.show(badComposition)  // Shows error message

// Missing dependencies
// If libraries aren't loaded, fallbacks are provided
```

## Integration with Djalgo.js

Perfect for algorithmic composition:

```javascript
// Generate composition with djalgo.js
import { MotifBank, Polyloop } from "djalgojs"

motif = new MotifBank().createMotif([60, 62, 64, 65])
composition = new Polyloop(motif).generate()

// Display result
jmonObservable.display(composition)
```

## Benefits

- **🎯 Simple**: Just two functions - `show()` and `play()`
- **🔄 Universal**: Works with any JMON-compatible format
- **⚡ Lightweight**: Minimal dependencies, focused functionality  
- **🎨 Customizable**: Options for appearance and behavior
- **🛡️ Robust**: Graceful error handling and fallbacks
- **📱 Responsive**: Works on different screen sizes

This matches the simplicity of your Python djalgo player and score widgets while providing the flexibility needed for Observable notebooks.