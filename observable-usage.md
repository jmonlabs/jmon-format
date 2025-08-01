# JMON Setup for Observable - Correct Syntax

## ✅ Single Setup Cell (Method 1: Simple)

```javascript
// Cell 1: Import everything into jmon object (FIXED VERSION)
jmon = {
  const setupModule = await import("https://cdn.jsdelivr.net/gh/jmonlabs/jmon-format@main/jmon-setup-fixed.js");
  return await setupModule.default();
}
```

Then use as: `jmon.show(composition)`, `jmon.dj.motif.create()`, etc.

## ✅ Single Setup Cell (Method 2: Destructured)

```javascript
// Cell 1: Import setup function
setupJmon = {
  const setupModule = await import("https://cdn.jsdelivr.net/gh/jmonlabs/jmon-format@main/jmon-setup.js");
  return await setupModule.default();
}

// Cell 2: Destructure the result
{dj, viz, Tone, jmonTone, jmonAbc, jmonMidi, jmonSuperCollider, show, play, display, export: jmonExport} = setupJmon
```

Then use directly: `show(composition)`, `dj.motif.create()`, etc.

## Usage Examples

### Method 1 (jmon object)
```javascript
// Cell 2: Your composition
twinkle = {
  metadata: { name: "Twinkle, Twinkle, Little Star" },
  tracks: {
    melody: [
      { pitch: 60, duration: 1.0, time: 0.0 },
      { pitch: 60, duration: 1.0, time: 1.0 },
      { pitch: 67, duration: 1.0, time: 2.0 }
    ]
  }
}

// Cell 3: Use widgets
jmon.show(twinkle)    // Score display
jmon.play(twinkle)    // Player widget
jmon.display(twinkle) // Both together

// Cell 4: Use djalgojs
melody = jmon.dj.motif.create([60, 62, 64, 65])
composition = jmon.dj.polyloop(melody).generate()
jmon.play(composition)

// Cell 5: Export
jmon.export.toMidi(twinkle, "twinkle.mid")
```

### Method 2 (destructured)
```javascript
// Cell 2: Direct usage
show(twinkle)
play(twinkle) 
display(twinkle)

// Cell 3: djalgojs direct
melody = dj.motif.create([60, 62, 64, 65])
play(melody)

// Cell 4: Export direct
jmonExport.toMidi(twinkle, "twinkle.mid")
```

## Debug: Check What's Loaded

```javascript
// Cell: Debug info
md`## Loaded Modules
**dj**: ${jmon.dj ? '✅' : '❌'}  
**viz**: ${jmon.viz ? '✅' : '❌'}  
**Tone**: ${jmon.Tone ? '✅' : '❌'}  
**jmonTone**: ${jmon.jmonTone ? '✅' : '❌'}  
**show**: ${typeof jmon.show === 'function' ? '✅' : '❌'}  
**play**: ${typeof jmon.play === 'function' ? '✅' : '❌'}`
```

The key fix is wrapping the import and setup in a block `{}` so you can use `return` to get the result of the async setup function.