# JMON Single-Cell Observable Setup

## ✅ **Copy This Single Cell Into Observable**

```javascript
jmon = {
  const module = await import('https://cdn.jsdelivr.net/gh/jmonlabs/jmon-format@main/jmon-setup-single.js');
  return await module.setup();
}
```

That's it! One cell, one import. Then use:

- `jmon.show(composition)` - Display composition as ABC notation
- `jmon.play(composition)` - Interactive play button  
- `jmon.display(composition)` - Combined show + play
- `jmon.dj` and `jmon.viz` - djalgojs algorithms
- `jmon.Tone` - Tone.js for audio
- `jmon.ABCJS` - ABC.js for notation

## ✅ **Test It**

```javascript
twinkle = {
  metadata: { name: "Twinkle, Twinkle, Little Star" },
  tracks: {
    melody: [
      { pitch: 60, duration: 1.0, time: 0.0 },
      { pitch: 60, duration: 1.0, time: 1.0 },
      { pitch: 67, duration: 1.0, time: 2.0 },
      { pitch: 67, duration: 1.0, time: 3.0 },
      { pitch: 69, duration: 1.0, time: 4.0 },
      { pitch: 69, duration: 1.0, time: 5.0 },
      { pitch: 67, duration: 2.0, time: 6.0 }
    ]
  }
}
```

```javascript
jmon.display(twinkle)
```

## ✅ **Why This Works**

- **Dynamic ES6 import** instead of `require()` 
- **External script loading only** - no CSP violations
- **Fallback CDNs** for reliability
- **Uses your existing functions** - no code duplication
- **Single cell** - exactly what you asked for!

This avoids all the previous CSP and `require()` scope issues while giving you the single-import experience you wanted.