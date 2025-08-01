/**
 * jmon-setup.js - Working Observable setup with jmon-display.js (anywidget equivalent)
 * 
 * Cell 1 - Load modules:
 * loadJmon = {
 *   const jmonTone = await import(
 *     "https://cdn.jsdelivr.net/gh/jmonlabs/jmon-format@main/jmon-tone.js"
 *   );
 *   const jmonAbc = await import(
 *     "https://cdn.jsdelivr.net/gh/jmonlabs/jmon-format@main/jmon-abc.js"
 *   );
 *   const jmonDisplay = await import(
 *     "https://cdn.jsdelivr.net/gh/jmonlabs/jmon-format@main/jmon-display.js"
 *   );
 *   const djalgojs = await import(
 *     "https://cdn.jsdelivr.net/gh/jmonlabs/djalgojs@main/dist/djalgojs.js"
 *   );
 *   return { jmonTone, jmonAbc, jmonDisplay, djalgojs };
 * }
 * 
 * Cell 2 - Create simple anywidget-style API:
 * jm = {
 *   const Tone = require("tone@latest");
 *   const ABCJS = require("abcjs@latest");
 *   
 *   if (Tone && Tone.context && Tone.context.state !== "running") {
 *     await Tone.start();
 *   }
 * 
 *   // Make globals available for jmon-display.js
 *   window.Tone = Tone;
 *   window.ABCJS = ABCJS;
 *   window.jmonTone = loadJmon.jmonTone;
 *   window.JmonToAbc = loadJmon.jmonAbc;
 * 
 *   return {
 *     Tone, ABCJS,
 *     dj: loadJmon.djalgojs.dj,
 *     viz: loadJmon.djalgojs.viz,
 *     to_tone: loadJmon.jmonTone,
 *     to_abc: loadJmon.jmonAbc,
 *     // Simple anywidget-style functions from jmon-display.js
 *     show: loadJmon.jmonDisplay.show,
 *     play: loadJmon.jmonDisplay.play,
 *     display: loadJmon.jmonDisplay.display
 *   };
 * }
 * 
 * Usage (exactly like Python anywidget):
 * jm.show(composition) - Simple ABC score display
 * jm.play(tracks, {tempo: 120, showDebug: false}) - Full player widget like Python
 * jm.display(composition) - Combined score + player
 * 
 * Examples:
 * // Simple usage
 * twinkle = {
 *   metadata: {name: "Twinkle Star"},
 *   tracks: {
 *     melody: [[60, 1.0, 0.0], [60, 1.0, 1.0], [67, 1.0, 2.0]]
 *   }
 * }
 * jm.display(twinkle)
 * 
 * // Player with multiple tracks (like Python)
 * tracks = {
 *   "Piano": [[60, 1.0, 0.0], [64, 1.0, 1.0]],
 *   "Bass": [[48, 2.0, 0.0]]
 * }
 * jm.play(tracks, {tempo: 140, width: 500})
 */