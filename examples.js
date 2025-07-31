/**
 * Examples demonstrating jmon format flexibility
 * All of these formats can now be used directly with jmon converters!
 */

// Your original twinkle format - now works directly!
const twinkleOriginal = {
  "title": "Twinkle, Twinkle, Little Star",
  "tracks": {
    "melody": [
      { "pitch": 60, "duration": 1, "time": 0 },
      { "pitch": 60, "duration": 1, "time": 1 },
      { "pitch": 67, "duration": 1, "time": 2 },
      { "pitch": 67, "duration": 1, "time": 3 },
      { "pitch": 69, "duration": 1, "time": 4 },
      { "pitch": 69, "duration": 1, "time": 5 },
      { "pitch": 67, "duration": 2, "time": 6 }
    ]
  }
};

// Simple array format
const simpleArray = [
  { pitch: 60, duration: 1.0, time: 0.0 },
  { pitch: 62, duration: 0.5, time: 1.0 },
  { pitch: 64, duration: 1.0, time: 1.5 }
];

// Note name format
const noteNameFormat = [
  { note: "C4", duration: "4n", time: "0:0:0" },
  { note: "D4", duration: "8n", time: "0:1:0" },
  { note: "E4", duration: "4n", time: "0:1.5:0" }
];

// Mixed format with different field names
const mixedFormat = {
  title: "Mixed Example",
  bpm: 140,
  sequences: [
    {
      name: "lead",
      notes: [
        { note: "A4", start: 0, length: "2n", volume: 0.8 },
        { pitch: 72, time: 2, duration: 1, velocity: 100 }
      ]
    }
  ]
};

// Frequency-based format
const frequencyFormat = [
  { frequency: 440, duration: 1, time: 0 },     // A4
  { frequency: 493.88, duration: 0.5, time: 1 }, // B4
  { frequency: 523.25, duration: 1, time: 1.5 }  // C5
];

// Usage examples for Observable:
/*
// All of these now work directly:
await jmonTone.playComposition(twinkleOriginal);
await jmonTone.playComposition(simpleArray);
await jmonTone.playComposition(noteNameFormat);
await jmonTone.playComposition(mixedFormat);
await jmonTone.playComposition(frequencyFormat);

// Export to different formats:
JmonToMidi.convertAndDownload(twinkleOriginal, "twinkle.mid");
JmonToAbc.convertAndDownload(simpleArray, "simple.abc");
JmonToSuperCollider.convertAndDownload(mixedFormat, "mixed.scd");

// Inspect normalized version:
console.log(jmonTone.normalize(twinkleOriginal));
*/

// Export for use in Observable or Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        twinkleOriginal,
        simpleArray,
        noteNameFormat,
        mixedFormat,
        frequencyFormat
    };
}

if (typeof window !== 'undefined') {
    window.jmonExamples = {
        twinkleOriginal,
        simpleArray,
        noteNameFormat,
        mixedFormat,
        frequencyFormat
    };
}