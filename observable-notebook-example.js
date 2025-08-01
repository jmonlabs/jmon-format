// Complete Observable Notebook Example
// Copy these cells into your Observable notebook

// Cell 1: Load Dependencies
Tone = require("tone@15")

// Cell 2: Load JMON Libraries  
jmonTone = {
  const response = await fetch("https://cdn.jsdelivr.net/gh/jmonlabs/jmon-format@main/jmon-tone.js");
  const code = await response.text();
  const module = new Function('exports', 'require', 'module', code);
  const exports = {};
  module(exports, require, { exports });
  return exports.default || exports;
}

// Cell 3: Load JMON ABC Converter
jmonAbc = {
  const response = await fetch("https://cdn.jsdelivr.net/gh/jmonlabs/jmon-format@main/jmon-abc.js");
  const code = await response.text();
  const module = new Function('exports', 'require', 'module', 'JmonToAbc', code);
  const exports = {};
  module(exports, require, { exports }, {});
  return exports.JmonToAbc || window.JmonToAbc;
}

// Cell 4: Load JMON Observable Integration
jmonObservable = {
  const response = await fetch("https://cdn.jsdelivr.net/gh/jmonlabs/jmon-format@main/jmon-observable.js");
  const code = await response.text();
  
  // Create a module environment
  const module = { exports: {} };
  const exports = module.exports;
  
  // Execute the code
  const func = new Function('module', 'exports', 'jmonTone', 'JmonToAbc', 'Tone', 'ABCJS', code);
  func(module, exports, jmonTone, jmonAbc, Tone, window.ABCJS);
  
  return {
    show: window.jmonObservable?.show || function(comp, opts) {
      return html`<div>jmonObservable not loaded properly</div>`;
    },
    play: window.jmonObservable?.play || function(comp, opts) {
      return html`<div>jmonObservable not loaded properly</div>`;
    },
    display: window.jmonObservable?.display || function(comp, opts) {
      return html`<div>jmonObservable not loaded properly</div>`;
    }
  };
}

// Cell 5: Your Twinkle Composition
twinkle = {
  metadata: {
    name: "Twinkle, Twinkle, Little Star"
  },
  tracks: {
    melody: [
      { pitch: 60, duration: 1.0, time: 0.0 },   // C4
      { pitch: 60, duration: 1.0, time: 1.0 },   // C4
      { pitch: 67, duration: 1.0, time: 2.0 },   // G4
      { pitch: 67, duration: 1.0, time: 3.0 },   // G4
      { pitch: 69, duration: 1.0, time: 4.0 },   // A4
      { pitch: 69, duration: 1.0, time: 5.0 },   // A4
      { pitch: 67, duration: 2.0, time: 6.0 },   // G4
      { pitch: 65, duration: 1.0, time: 8.0 },   // F4
      { pitch: 65, duration: 1.0, time: 9.0 },   // F4
      { pitch: 64, duration: 1.0, time: 10.0 },  // E4
      { pitch: 64, duration: 1.0, time: 11.0 },  // E4
      { pitch: 62, duration: 1.0, time: 12.0 },  // D4
      { pitch: 62, duration: 1.0, time: 13.0 },  // D4
      { pitch: 60, duration: 2.0, time: 14.0 }   // C4
    ]
  }
}

// Cell 6: Display Score
jmonObservable.show(twinkle)

// Cell 7: Display Player
jmonObservable.play(twinkle)

// Cell 8: Display Both
jmonObservable.display(twinkle)

// Cell 9: Different Formats Work Too
simpleArray = [
  { pitch: 60, duration: 1.0, time: 0.0 },  // C4
  { pitch: 64, duration: 0.5, time: 1.0 },  // E4
  { pitch: 67, duration: 1.0, time: 1.5 },  // G4
  { pitch: 72, duration: 2.0, time: 2.5 }   // C5
]

// Cell 10: Show Array Format
jmonObservable.display(simpleArray)

// Cell 11: Note Names Format
noteNames = [
  { note: "C4", duration: "4n", time: "0:0:0" },
  { note: "E4", duration: "4n", time: "0:1:0" },
  { note: "G4", duration: "4n", time: "0:2:0" },  
  { note: "C5", duration: "2n", time: "0:3:0" }
]

// Cell 12: Show Note Names
jmonObservable.display(noteNames)

// Cell 13: Advanced JMON Format
fullJmon = {
  format: "jmon",
  version: "1.0", 
  bpm: 128,
  metadata: {
    name: "Advanced Example",
    author: "Observable User"
  },
  sequences: [
    {
      label: "lead",
      synthRef: "synth1",
      notes: [
        { note: "A4", time: 0, duration: 0.5, velocity: 0.8 },
        { note: "C5", time: 0.5, duration: 0.5, velocity: 0.7 },
        { note: "E5", time: 1, duration: 0.5, velocity: 0.9 }
      ]
    }
  ],
  audioGraph: [
    { id: "synth1", type: "Synth" }
  ],
  connections: [["synth1", "master"]]
}

// Cell 14: Show Advanced Format
jmonObservable.display(fullJmon)

// Cell 15: Debugging Helper
md`## Debug Info

**Tone.js loaded:** ${Tone ? '✅' : '❌'}  
**jmonTone loaded:** ${jmonTone ? '✅' : '❌'}  
**jmonAbc loaded:** ${jmonAbc ? '✅' : '❌'}  
**jmonObservable loaded:** ${jmonObservable ? '✅' : '❌'}

If any are ❌, check the loading cells above.`