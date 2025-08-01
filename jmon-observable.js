/**
 * jmon-observable.js - Simple JMON integration for Observable notebooks
 * 
 * Provides easy visualization and playback for JMON compositions in Observable.
 * Inspired by the simplicity of djalgo's Python player and score widgets.
 * 
 * Usage:
 *   import { show, play } from './jmon-observable.js'
 *   show(composition)  // Display as ABC score
 *   play(composition)  // Simple playback widget
 */

// Simple show function for ABC notation display (like your Python score.py)
export function show(composition, options = {}) {
    const {
        title = true,
        clef = "treble",
        key = null,
        timeSignature = null,
        tempo = null,
        showTrackLabels = true,
        width = 800,
        height = 400
    } = options;

    try {
        // Convert to ABC notation
        const abc = JmonToAbc.convertToAbc(composition);
        
        // Create container
        const container = document.createElement('div');
        container.style.cssText = `
            width: ${width}px;
            min-height: ${height}px;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 20px;
            background: white;
            font-family: Arial, sans-serif;
        `;

        // Add title if enabled
        if (title && composition.metadata?.name) {
            const titleEl = document.createElement('h3');
            titleEl.textContent = composition.metadata.name;
            titleEl.style.cssText = 'margin: 0 0 15px 0; color: #333;';
            container.appendChild(titleEl);
        }

        // Create ABC.js render area
        const renderArea = document.createElement('div');
        renderArea.id = `abc-render-${Date.now()}`;
        container.appendChild(renderArea);

        // Render with ABC.js if available
        if (typeof ABCJS !== 'undefined') {
            ABCJS.renderAbc(renderArea, abc, {
                responsive: "resize",
                staffwidth: width - 40,
                scale: 0.8
            });
        } else {
            // Fallback: show ABC notation as text
            const pre = document.createElement('pre');
            pre.textContent = abc;
            pre.style.cssText = `
                background: #f8f9fa;
                padding: 15px;
                border-radius: 4px;
                font-size: 12px;
                overflow-x: auto;
                white-space: pre-wrap;
            `;
            renderArea.appendChild(pre);
            
            const note = document.createElement('div');
            note.innerHTML = '<small style="color: #666;">💡 Load ABC.js library to see rendered score</small>';
            renderArea.appendChild(note);
        }

        return container;

    } catch (error) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            padding: 20px;
            background: #f8d7da;
            border: 1px solid #f5c6cb;
            border-radius: 4px;
            color: #721c24;
        `;
        errorDiv.innerHTML = `<strong>Error displaying score:</strong> ${error.message}`;
        return errorDiv;
    }
}

// Simple play function (like your Python player.py)
export function play(composition, options = {}) {
    const {
        width = 400,
        height = 120,
        showTitle = true,
        defaultVolume = -6,
        theme = 'light'
    } = options;

    const isDark = theme === 'dark';
    const bgColor = isDark ? '#2d3748' : '#ffffff';
    const textColor = isDark ? '#e2e8f0' : '#2d3748';
    const buttonColor = isDark ? '#4a5568' : '#e2e8f0';
    const buttonHover = isDark ? '#718096' : '#cbd5e0';

    try {
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
            const title = document.createElement('div');
            title.textContent = composition.metadata?.name || composition.title || 'JMON Composition';
            title.style.cssText = `
                font-weight: 600;
                font-size: 14px;
                margin-bottom: 10px;
                color: ${textColor};
            `;
            widget.appendChild(title);
        }

        // Controls
        const controls = document.createElement('div');
        controls.style.cssText = 'display: flex; gap: 8px; align-items: center;';
        
        const playBtn = document.createElement('button');
        playBtn.innerHTML = '▶️';
        playBtn.style.cssText = `
            background: ${buttonColor};
            border: none;
            border-radius: 6px;
            padding: 8px 12px;
            cursor: pointer;
            font-size: 16px;
            transition: background 0.2s;
        `;
        playBtn.onmouseover = () => playBtn.style.background = buttonHover;
        playBtn.onmouseout = () => playBtn.style.background = buttonColor;

        const stopBtn = document.createElement('button');
        stopBtn.innerHTML = '⏹️';
        stopBtn.style.cssText = playBtn.style.cssText;
        stopBtn.onmouseover = () => stopBtn.style.background = buttonHover;
        stopBtn.onmouseout = () => stopBtn.style.background = buttonColor;
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

        // Simple playback logic
        let isPlaying = false;
        
        playBtn.onclick = async () => {
            if (isPlaying) return;
            
            try {
                playBtn.disabled = true;
                stopBtn.disabled = false;
                stopBtn.style.opacity = '1';
                playBtn.style.opacity = '0.5';
                status.textContent = 'Playing...';
                isPlaying = true;

                // Use jmonTone for playback
                if (typeof jmonTone !== 'undefined') {
                    await jmonTone.playComposition(composition);
                } else {
                    throw new Error('jmonTone library not loaded');
                }

                status.textContent = 'Finished';
            } catch (error) {
                status.textContent = `Error: ${error.message}`;
                console.error('Playback error:', error);
            } finally {
                // Reset buttons
                setTimeout(() => {
                    playBtn.disabled = false;
                    stopBtn.disabled = true;
                    stopBtn.style.opacity = '0.5';
                    playBtn.style.opacity = '1';
                    status.textContent = 'Ready';
                    isPlaying = false;
                }, 1000);
            }
        };

        stopBtn.onclick = () => {
            // Basic stop functionality
            playBtn.disabled = false;
            stopBtn.disabled = true;
            stopBtn.style.opacity = '0.5';
            playBtn.style.opacity = '1';
            status.textContent = 'Stopped';
            isPlaying = false;
        };

        return widget;

    } catch (error) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            padding: 15px;
            background: #fed7d7;
            border: 1px solid #feb2b2;
            border-radius: 8px;
            color: #c53030;
            font-size: 14px;
        `;
        errorDiv.innerHTML = `<strong>Player Error:</strong> ${error.message}`;
        return errorDiv;
    }
}

// Convenience function that shows both score and player
export function display(composition, options = {}) {
    const container = document.createElement('div');
    container.style.cssText = 'display: flex; flex-direction: column; gap: 20px;';
    
    // Add score
    const scoreEl = show(composition, options.score);
    container.appendChild(scoreEl);
    
    // Add player
    const playerEl = play(composition, options.player);
    container.appendChild(playerEl);
    
    return container;
}

// Export info for Observable
export const info = {
    name: "jmon-observable",
    version: "1.0.0",
    description: "Simple JMON visualization and playback for Observable notebooks",
    dependencies: ["jmon-tone.js", "jmon-abc.js", "abcjs (optional)", "Tone.js"],
    functions: {
        show: "Display JMON composition as ABC musical score",
        play: "Simple playback widget for JMON composition", 
        display: "Show both score and player together"
    },
    examples: {
        basic: `
// Basic usage
import { show, play, display } from './jmon-observable.js'

// Show score only
show(myComposition)

// Show player only  
play(myComposition)

// Show both
display(myComposition)
        `,
        options: `
// With options
show(myComposition, {
    title: true,
    clef: "treble", 
    width: 600,
    showTrackLabels: false
})

play(myComposition, {
    width: 300,
    theme: "dark",
    showTitle: false
})
        `
    }
};

// Make available globally for Observable notebooks
if (typeof window !== 'undefined') {
    window.jmonObservable = { show, play, display, info };
}