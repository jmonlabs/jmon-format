/**
 * jmon-simple.js - Ultra-simple JMON integration for Observable notebooks
 * 
 * No external dependencies, just pure HTML/JS like Python's anywidget.
 * Provides basic visualization and Web Audio API playback.
 */

// Simple show function - just display as formatted JSON or ABC text
export function show(composition, options = {}) {
    const {
        format = 'abc', // 'abc' or 'json'
        width = 800,
        height = 400,
        title = true
    } = options;

    try {
        // Normalize composition
        let normalized;
        if (typeof jmonTone !== 'undefined' && jmonTone.normalize) {
            normalized = jmonTone.normalize(composition);
        } else if (typeof window !== 'undefined' && window.jmonTone && window.jmonTone.normalize) {
            normalized = window.jmonTone.normalize(composition);
        } else {
            // Simple fallback normalization
            normalized = simpleNormalize(composition);
        }

        // Create container
        const container = document.createElement('div');
        container.style.cssText = `
            width: ${width}px;
            min-height: ${height}px;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 20px;
            background: white;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        `;

        // Add title
        if (title && normalized.metadata?.name) {
            const titleEl = document.createElement('h3');
            titleEl.textContent = normalized.metadata.name;
            titleEl.style.cssText = 'margin: 0 0 15px 0; color: #333; font-size: 18px;';
            container.appendChild(titleEl);
        }

        if (format === 'abc') {
            // Try to convert to ABC
            let abcText;
            try {
                if (typeof JmonToAbc !== 'undefined') {
                    abcText = JmonToAbc.convertToAbc(normalized);
                } else if (typeof window !== 'undefined' && window.JmonToAbc) {
                    abcText = window.JmonToAbc.convertToAbc(normalized);
                } else {
                    throw new Error('ABC converter not available');
                }
            } catch (e) {
                abcText = generateSimpleABC(normalized);
            }

            // Display ABC text
            const pre = document.createElement('pre');
            pre.textContent = abcText;
            pre.style.cssText = `
                background: #f8f9fa;
                padding: 15px;
                border-radius: 6px;
                font-size: 12px;
                font-family: 'Monaco', 'Cascadia Code', monospace;
                overflow-x: auto;
                line-height: 1.4;
                margin: 0;
            `;
            container.appendChild(pre);

            // Add note
            const note = document.createElement('div');
            note.innerHTML = '<small style="color: #666; margin-top: 10px; display: block;">📝 ABC notation - copy/paste into abc2svg or similar tools for rendering</small>';
            container.appendChild(note);

        } else {
            // Show as formatted JSON
            const pre = document.createElement('pre');
            pre.textContent = JSON.stringify(normalized, null, 2);
            pre.style.cssText = `
                background: #2d3748;
                color: #e2e8f0;
                padding: 15px;
                border-radius: 6px;
                font-size: 11px;
                font-family: 'Monaco', 'Cascadia Code', monospace;
                overflow-x: auto;
                line-height: 1.4;
                margin: 0;
                max-height: 400px;
                overflow-y: auto;
            `;
            container.appendChild(pre);
        }

        return container;

    } catch (error) {
        return createErrorDiv(`Error displaying composition: ${error.message}`);
    }
}

// Ultra-simple player using Web Audio API (no Tone.js dependency)
export function play(composition, options = {}) {
    const {
        width = 400,
        height = 120,
        showTitle = true,
        theme = 'light'
    } = options;

    const isDark = theme === 'dark';
    const bgColor = isDark ? '#2d3748' : '#ffffff';
    const textColor = isDark ? '#e2e8f0' : '#2d3748';
    const buttonBg = isDark ? '#4a5568' : '#e2e8f0';
    const buttonHover = isDark ? '#718096' : '#cbd5e0';

    try {
        // Normalize composition
        let normalized;
        try {
            if (typeof jmonTone !== 'undefined' && jmonTone.normalize) {
                normalized = jmonTone.normalize(composition);
            } else if (typeof window !== 'undefined' && window.jmonTone && window.jmonTone.normalize) {
                normalized = window.jmonTone.normalize(composition);
            } else {
                normalized = simpleNormalize(composition);
            }
        } catch (e) {
            normalized = simpleNormalize(composition);
        }

        // Create player widget
        const widget = document.createElement('div');
        widget.style.cssText = `
            width: ${width}px;
            height: ${height}px;
            background: ${bgColor};
            color: ${textColor};
            border: 1px solid ${isDark ? '#4a5568' : '#e2e8f0'};
            border-radius: 8px;
            padding: 15px;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        `;

        // Title
        if (showTitle) {
            const titleEl = document.createElement('div');
            titleEl.textContent = normalized.metadata?.name || 'JMON Composition';
            titleEl.style.cssText = `
                font-weight: 600;
                font-size: 14px;
                margin-bottom: 10px;
                color: ${textColor};
            `;
            widget.appendChild(titleEl);
        }

        // Controls
        const controls = document.createElement('div');
        controls.style.cssText = 'display: flex; gap: 8px; align-items: center;';
        
        const playBtn = createButton('▶️', buttonBg, buttonHover);
        const stopBtn = createButton('⏹️', buttonBg, buttonHover);
        stopBtn.disabled = true;
        stopBtn.style.opacity = '0.5';

        const status = document.createElement('span');
        status.textContent = 'Ready';
        status.style.cssText = `
            font-size: 12px;
            color: ${isDark ? '#a0aec0' : '#718096'};
            margin-left: auto;
        `;

        controls.appendChild(playBtn);
        controls.appendChild(stopBtn);
        controls.appendChild(status);
        widget.appendChild(controls);

        // Simple Web Audio playback
        let audioContext = null;
        let isPlaying = false;
        let scheduledNotes = [];

        playBtn.onclick = async () => {
            if (isPlaying) return;
            
            try {
                playBtn.disabled = true;
                stopBtn.disabled = false;
                stopBtn.style.opacity = '1';
                playBtn.style.opacity = '0.5';
                status.textContent = 'Playing...';
                isPlaying = true;

                // Initialize Web Audio API
                if (!audioContext) {
                    audioContext = new (window.AudioContext || window.webkitAudioContext)();
                }

                if (audioContext.state === 'suspended') {
                    await audioContext.resume();
                }

                // Play composition using simple Web Audio
                await playWithWebAudio(normalized, audioContext, status);

                status.textContent = 'Finished';
            } catch (error) {
                status.textContent = `Error: ${error.message}`;
                console.error('Playback error:', error);
            } finally {
                // Reset buttons after delay
                setTimeout(() => {
                    playBtn.disabled = false;
                    stopBtn.disabled = true;
                    stopBtn.style.opacity = '0.5';
                    playBtn.style.opacity = '1';
                    if (status.textContent !== 'Stopped') {
                        status.textContent = 'Ready';
                    }
                    isPlaying = false;
                }, 1000);
            }
        };

        stopBtn.onclick = () => {
            // Stop playback
            if (audioContext) {
                // Cancel all scheduled notes
                scheduledNotes.forEach(note => {
                    if (note.stop) note.stop();
                });
                scheduledNotes = [];
            }
            
            playBtn.disabled = false;
            stopBtn.disabled = true;
            stopBtn.style.opacity = '0.5';
            playBtn.style.opacity = '1';
            status.textContent = 'Stopped';
            isPlaying = false;
        };

        return widget;

    } catch (error) {
        return createErrorDiv(`Player error: ${error.message}`);
    }
}

// Helper functions
function createButton(text, bg, hoverBg) {
    const btn = document.createElement('button');
    btn.innerHTML = text;
    btn.style.cssText = `
        background: ${bg};
        border: none;
        border-radius: 6px;
        padding: 8px 12px;
        cursor: pointer;
        font-size: 16px;
        transition: background 0.2s;
    `;
    btn.onmouseover = () => btn.style.background = hoverBg;
    btn.onmouseout = () => btn.style.background = bg;
    return btn;
}

function createErrorDiv(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        padding: 15px;
        background: #fed7d7;
        border: 1px solid #feb2b2;
        border-radius: 8px;
        color: #c53030;
        font-size: 14px;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    `;
    errorDiv.innerHTML = `<strong>Error:</strong> ${message}`;
    return errorDiv;
}

// Simple composition normalization (fallback)
function simpleNormalize(composition) {
    // Handle array format
    if (Array.isArray(composition)) {
        return {
            format: "jmon",
            version: "1.0",
            bpm: 120,
            metadata: { name: "Array Composition" },
            sequences: [{
                label: "melody",
                notes: composition.map(note => ({
                    note: note.note || midiToNoteName(note.pitch || 60),
                    time: note.time || 0,
                    duration: note.duration || 1,
                    velocity: note.velocity || 0.8
                }))
            }]
        };
    }

    // Handle tracks format
    if (composition.tracks) {
        const sequences = Object.entries(composition.tracks).map(([name, notes]) => ({
            label: name,
            notes: notes.map(note => ({
                note: note.note || midiToNoteName(note.pitch || 60),
                time: note.time || 0,
                duration: note.duration || 1,
                velocity: note.velocity || 0.8
            }))
        }));

        return {
            format: "jmon",
            version: "1.0",
            bpm: composition.bpm || 120,
            metadata: { 
                name: composition.metadata?.name || composition.title || "Composition" 
            },
            sequences
        };
    }

    // Assume it's already normalized
    return composition;
}

// Simple MIDI to note name conversion
function midiToNoteName(midi) {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(midi / 12) - 1;
    const noteIndex = midi % 12;
    return notes[noteIndex] + octave;
}

// Note name to frequency conversion
function noteToFrequency(noteName) {
    const noteRegex = /^([A-G])(#|b)?(-?\d+)$/;
    const match = noteName.match(noteRegex);
    if (!match) return 440; // Default A4
    
    const [, note, accidental, octave] = match;
    const noteValues = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
    
    let midiNote = noteValues[note] + (parseInt(octave) + 1) * 12;
    if (accidental === '#') midiNote += 1;
    else if (accidental === 'b') midiNote -= 1;
    
    return 440 * Math.pow(2, (midiNote - 69) / 12);
}

// Simple Web Audio playback
async function playWithWebAudio(composition, audioContext, statusEl) {
    const startTime = audioContext.currentTime;
    
    for (const sequence of composition.sequences || []) {
        for (const note of sequence.notes || []) {
            const frequency = noteToFrequency(note.note);
            const noteStartTime = startTime + (note.time || 0);
            const duration = note.duration || 1;
            const velocity = note.velocity || 0.8;
            
            // Create simple oscillator
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(frequency, noteStartTime);
            oscillator.type = 'sine';
            
            // Simple envelope
            gainNode.gain.setValueAtTime(0, noteStartTime);
            gainNode.gain.linearRampToValueAtTime(velocity * 0.3, noteStartTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, noteStartTime + duration);
            
            oscillator.start(noteStartTime);
            oscillator.stop(noteStartTime + duration);
        }
    }
    
    // Calculate total duration
    let maxDuration = 0;
    for (const sequence of composition.sequences || []) {
        for (const note of sequence.notes || []) {
            const endTime = (note.time || 0) + (note.duration || 1);
            maxDuration = Math.max(maxDuration, endTime);
        }
    }
    
    // Wait for playback to finish
    return new Promise(resolve => {
        setTimeout(resolve, maxDuration * 1000);
    });
}

// Simple ABC generation (fallback)
function generateSimpleABC(composition) {
    let abc = 'X:1\n';
    abc += `T:${composition.metadata?.name || 'Untitled'}\n`;
    abc += 'M:4/4\n';
    abc += 'L:1/4\n';
    abc += `Q:1/4=${composition.bpm || 120}\n`;
    abc += 'K:C\n';
    
    // Simple melody line from first sequence
    const firstSeq = composition.sequences?.[0];
    if (firstSeq && firstSeq.notes) {
        const notes = firstSeq.notes
            .sort((a, b) => (a.time || 0) - (b.time || 0))
            .map(note => {
                const noteName = note.note?.replace(/\d+$/, '') || 'C';
                const duration = note.duration || 1;
                if (duration >= 2) return noteName + '2';
                if (duration >= 1) return noteName;
                if (duration >= 0.5) return noteName + '/2';
                return noteName + '/4';
            });
        abc += notes.join(' ') + ' |]';
    }
    
    return abc;
}

// Convenience function
export function display(composition, options = {}) {
    const container = document.createElement('div');
    container.style.cssText = 'display: flex; flex-direction: column; gap: 20px;';
    
    const scoreEl = show(composition, options.score);
    const playerEl = play(composition, options.player);
    
    container.appendChild(scoreEl);
    container.appendChild(playerEl);
    
    return container;
}

// Make available globally for Observable
if (typeof window !== 'undefined') {
    window.jmonSimple = { show, play, display };
}