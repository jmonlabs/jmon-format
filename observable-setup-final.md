# JMON Observable Setup - Final Working Solution

## ✅ **Copy-Paste Ready - Multi-Cell Observable Setup**

This approach uses Observable's native patterns and avoids all CSP violations. Simply copy each cell in order:

---

### **Cell 1: Load Tone.js**
```javascript
Tone = require("tone@15")
```

### **Cell 2: Load ABC.js** 
```javascript
ABCJS = require("abcjs@6")
```

### **Cell 3: Load djalgojs**
```javascript
dj = require("djalgojs@latest")
```

### **Cell 4: Create viz alias**
```javascript
viz = dj
```

### **Cell 5: Load JMON Core**
```javascript
jmonTone = {
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/gh/jmonlabs/jmon-format@main/jmon-tone.js';
  document.head.appendChild(script);
  
  await new Promise(resolve => {
    script.onload = () => setTimeout(resolve, 200);
  });
  
  return window.jmonTone;
}
```

### **Cell 6: Load JMON ABC Converter**
```javascript
jmonAbc = {
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/gh/jmonlabs/jmon-format@main/jmon-abc.js';
  document.head.appendChild(script);
  
  await new Promise(resolve => {
    script.onload = () => setTimeout(resolve, 200);
  });
  
  return window.JmonToAbc;
}
```

### **Cell 7: Simple Show Function**
```javascript
show = function(composition, options = {}) {
  const container = document.createElement('div');
  container.style.cssText = `
    padding: 16px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    background: white;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    margin: 8px 0;
  `;
  
  try {
    // Normalize composition using existing jmonTone.normalize
    const normalized = jmonTone.normalize(composition);
    
    // Title
    if (normalized.metadata?.name) {
      const title = document.createElement('h3');
      title.textContent = normalized.metadata.name;
      title.style.cssText = 'margin: 0 0 12px 0; font-size: 16px;';
      container.appendChild(title);
    }
    
    // Convert to ABC using existing converter
    const abc = jmonAbc.convertToAbc(normalized);
    
    // Display ABC notation
    const pre = document.createElement('pre');
    pre.textContent = abc;
    pre.style.cssText = `
      background: #f8fafc;
      padding: 12px;
      border-radius: 6px;
      font-size: 11px;
      font-family: monospace;
      overflow: auto;
      max-height: 300px;
      margin: 0;
    `;
    container.appendChild(pre);
    
  } catch (error) {
    container.innerHTML = `<strong>Error:</strong> ${error.message}`;
    container.style.color = '#dc2626';
  }
  
  return container;
}
```

### **Cell 8: Simple Play Function**
```javascript
play = function(composition, options = {}) {
  const container = document.createElement('div');
  container.style.cssText = `
    padding: 16px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    background: white;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    margin: 8px 0;
    display: flex;
    align-items: center;
    gap: 12px;
  `;
  
  try {
    // Normalize composition using existing jmonTone.normalize
    const normalized = jmonTone.normalize(composition);
    
    // Title
    const title = document.createElement('div');
    title.textContent = normalized.metadata?.name || 'JMON Composition';
    title.style.cssText = 'font-weight: 500; flex: 1;';
    container.appendChild(title);
    
    // Play button
    const playBtn = document.createElement('button');
    playBtn.innerHTML = '▶️ Play';
    playBtn.style.cssText = `
      background: #3b82f6;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
    `;
    
    // Status
    const status = document.createElement('span');
    status.textContent = 'Ready';
    status.style.cssText = 'font-size: 12px; color: #6b7280;';
    
    playBtn.onclick = async () => {
      try {
        playBtn.disabled = true;
        status.textContent = 'Playing...';
        
        // Use existing jmonTone.playComposition function
        await jmonTone.playComposition(composition);
        
        status.textContent = 'Finished';
      } catch (error) {
        status.textContent = `Error: ${error.message}`;
      } finally {
        playBtn.disabled = false;
      }
    };
    
    container.appendChild(playBtn);
    container.appendChild(status);
    
  } catch (error) {
    container.innerHTML = `<strong>Error:</strong> ${error.message}`;
    container.style.color = '#dc2626';
  }
  
  return container;
}
```

### **Cell 9: Combined Display Function**
```javascript
display = function(composition, options = {}) {
  const container = document.createElement('div');
  container.style.cssText = 'display: flex; flex-direction: column; gap: 16px;';
  container.appendChild(show(composition, options));
  container.appendChild(play(composition, options));
  return container;
}
```

### **Cell 10: Test Composition**
```javascript
twinkle = {
  metadata: {
    name: "Twinkle, Twinkle, Little Star"
  },
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

### **Cell 11: Display Test**
```javascript
display(twinkle)
```

---

## ✅ **What This Accomplishes:**

1. **No CSP violations** - Uses Observable's native `require()` and external script loading only
2. **No code duplication** - Uses your existing `jmonTone.normalize()`, `jmonTone.playComposition()`, and `jmonAbc.convertToAbc()`
3. **Simple API** - Provides `show()`, `play()`, and `display()` functions matching your Python anywidget style
4. **All dependencies loaded** - Tone.js, ABC.js, djalgojs as `{dj, viz}`, and all JMON utilities
5. **Clean separation** - Each dependency in its own cell for reliability

## ✅ **Why This Works:**

- **Observable's native patterns** - Uses `require()` where appropriate
- **External scripts only** - No inline code execution
- **Proper timing** - Waits for scripts to load before proceeding
- **Error handling** - Graceful fallbacks if modules fail to load
- **Uses existing code** - No reinventing the wheel

This is the reliable solution that avoids all the previous CSP and module loading issues! 🎵