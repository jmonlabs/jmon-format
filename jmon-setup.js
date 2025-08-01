/**
 * jmon-setup.js - Complete JMON ecosystem setup for Observable
 * 
 * Imports and initializes:
 * - Tone.js for audio
 * - djalgojs as {dj, viz} 
 * - All JMON utilities (tone, abc, midi, supercollider)
 * - Clean Observable widgets
 * 
 * Single import for everything you need.
 */

// Dynamic import helper
async function loadModule(url) {
    try {
        if (url.endsWith('.js') && !url.includes('://')) {
            // Relative path, make it absolute to GitHub
            url = `https://cdn.jsdelivr.net/gh/jmonlabs/jmon-format@main/${url}`;
        }
        const response = await fetch(url);
        const code = await response.text();
        
        // Create module environment
        const module = { exports: {} };
        const exports = module.exports;
        const require = (name) => {
            if (name === 'tone') return window.Tone;
            throw new Error(`Module ${name} not found`);
        };
        
        // Execute module code
        const func = new Function('module', 'exports', 'require', 'window', 'global', 'globalThis', code);
        func(module, exports, require, window, window, window);
        
        return module.exports.default || module.exports || window[Object.keys(window).pop()];
    } catch (error) {
        console.warn(`Failed to load ${url}:`, error);
        return null;
    }
}

// Load external CDN script
async function loadScript(url, globalName) {
    return new Promise((resolve, reject) => {
        if (window[globalName]) {
            resolve(window[globalName]);
            return;
        }
        
        const script = document.createElement('script');
        script.src = url;
        script.onload = () => resolve(window[globalName]);
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Main setup function
export async function setup() {
    console.log('🎵 Setting up JMON ecosystem...');
    
    const results = {};
    
    try {
        // 1. Load Tone.js
        console.log('📦 Loading Tone.js...');
        results.Tone = await loadScript('https://unpkg.com/tone@15.1.22/build/Tone.js', 'Tone');
        console.log('✅ Tone.js loaded');
        
        // 2. Load djalgojs and extract dj, viz
        console.log('📦 Loading djalgojs...');
        try {
            const djalgoModule = await loadScript('https://unpkg.com/djalgojs@latest/dist/djalgojs.min.js', 'djalgojs');
            results.dj = djalgoModule;
            results.viz = djalgoModule; // Same module, different alias for visualization functions
            console.log('✅ djalgojs loaded as {dj, viz}');
        } catch (e) {
            console.warn('⚠️ djalgojs not available, continuing without it');
            results.dj = null;
            results.viz = null;
        }
        
        // 3. Load JMON core utilities
        console.log('📦 Loading JMON utilities...');
        
        // Load jmon-tone.js
        results.jmonTone = await loadModule('jmon-tone.js');
        console.log('✅ jmon-tone.js loaded');
        
        // Load jmon-abc.js  
        results.jmonAbc = await loadModule('jmon-abc.js');
        console.log('✅ jmon-abc.js loaded');
        
        // Load jmon-midi.js
        results.jmonMidi = await loadModule('jmon-midi.js');
        console.log('✅ jmon-midi.js loaded');
        
        // Load jmon-supercollider.js
        results.jmonSuperCollider = await loadModule('jmon-supercollider.js');
        console.log('✅ jmon-supercollider.js loaded');
        
        // 4. Initialize Tone.js context
        if (results.Tone && results.Tone.context.state !== 'running') {
            await results.Tone.start();
            console.log('✅ Tone.js context started');
        }
        
        // 5. Create convenience functions using the loaded utilities
        results.show = createShowFunction(results);
        results.play = createPlayFunction(results);
        results.display = createDisplayFunction(results);
        results.export = createExportFunctions(results);
        
        console.log('🎉 JMON ecosystem ready!');
        console.log('📋 Available:', Object.keys(results));
        
        return results;
        
    } catch (error) {
        console.error('❌ Setup failed:', error);
        throw error;
    }
}

// Create show function using loaded ABC converter
function createShowFunction(modules) {
    return function show(composition, options = {}) {
        const {
            width = 600,
            height = 300,
            showTitle = true,
            format = 'abc'
        } = options;

        try {
            // Normalize composition
            let normalized = composition;
            if (modules.jmonTone && modules.jmonTone.normalize) {
                normalized = modules.jmonTone.normalize(composition);
            }

            // Create container
            const container = document.createElement('div');
            container.style.cssText = `
                width: ${width}px;
                min-height: ${height}px;
                background: #ffffff;
                border: 1px solid #d1d5db;
                border-radius: 8px;
                padding: 16px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                margin: 8px 0;
            `;

            // Title
            if (showTitle) {
                const titleDiv = document.createElement('div');
                titleDiv.textContent = normalized.metadata?.name || 'JMON Score';
                titleDiv.style.cssText = `
                    font-size: 16px;
                    font-weight: 500;
                    color: #374151;
                    margin-bottom: 12px;
                    border-bottom: 1px solid #e5e7eb;
                    padding-bottom: 8px;
                `;
                container.appendChild(titleDiv);
            }

            // Convert to ABC
            let content = '';
            if (modules.jmonAbc && modules.jmonAbc.convertToAbc) {
                content = modules.jmonAbc.convertToAbc(normalized);
            } else {
                content = JSON.stringify(normalized, null, 2);
            }

            // Display content
            const pre = document.createElement('pre');
            pre.textContent = content;
            pre.style.cssText = `
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 6px;
                padding: 12px;
                font-size: 11px;
                font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
                color: #1e293b;
                line-height: 1.4;
                margin: 0;
                overflow: auto;
                max-height: 400px;
            `;
            container.appendChild(pre);

            return container;

        } catch (error) {
            return createErrorDiv(`Score error: ${error.message}`);
        }
    };
}

// Create play function using loaded Tone.js
function createPlayFunction(modules) {
    return function play(composition, options = {}) {
        const {
            width = 480,
            height = 140,
            showTitle = true
        } = options;

        try {
            // Normalize composition
            let normalized = composition;
            if (modules.jmonTone && modules.jmonTone.normalize) {
                normalized = modules.jmonTone.normalize(composition);
            }

            // Create player widget
            const container = document.createElement('div');
            container.style.cssText = `
                width: ${width}px;
                height: ${height}px;
                background: #ffffff;
                border: 1px solid #d1d5db;
                border-radius: 8px;
                padding: 16px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                display: flex;
                flex-direction: column;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                margin: 8px 0;
            `;

            // Title
            if (showTitle) {
                const titleDiv = document.createElement('div');
                titleDiv.textContent = normalized.metadata?.name || 'JMON Composition';
                titleDiv.style.cssText = `
                    font-size: 14px;
                    font-weight: 500;
                    color: #374151;
                    margin-bottom: 12px;
                    border-bottom: 1px solid #e5e7eb;
                    padding-bottom: 8px;
                `;
                container.appendChild(titleDiv);
            }

            // Controls
            const controlsDiv = document.createElement('div');
            controlsDiv.style.cssText = `
                display: flex;
                align-items: center;
                gap: 12px;
                flex: 1;
            `;

            // Buttons
            const playBtn = createButton('▶️', '#3b82f6', '#2563eb');
            const stopBtn = createButton('⏹️', '#6b7280', '#4b5563');
            stopBtn.disabled = true;
            stopBtn.style.opacity = '0.5';

            const statusSpan = document.createElement('span');
            statusSpan.textContent = 'Ready';
            statusSpan.style.cssText = `
                font-size: 12px;
                color: #6b7280;
                flex: 1;
                text-align: right;
            `;

            controlsDiv.appendChild(playBtn);
            controlsDiv.appendChild(stopBtn);
            controlsDiv.appendChild(statusSpan);
            container.appendChild(controlsDiv);

            // Playback logic
            let isPlaying = false;
            let synths = [];

            playBtn.onclick = async () => {
                if (isPlaying || !modules.Tone) return;
                
                try {
                    playBtn.disabled = true;
                    stopBtn.disabled = false;
                    stopBtn.style.opacity = '1';
                    playBtn.innerHTML = '⏸️';
                    statusSpan.textContent = 'Playing...';
                    isPlaying = true;

                    // Use jmonTone.playComposition if available
                    if (modules.jmonTone && modules.jmonTone.playComposition) {
                        await modules.jmonTone.playComposition(composition);
                    } else {
                        // Fallback to simple playback
                        const synth = new modules.Tone.PolySynth().toDestination();
                        synths.push(synth);

                        for (const sequence of normalized.sequences || []) {
                            for (const note of sequence.notes || []) {
                                const startTime = modules.Tone.now() + (note.time || 0);
                                synth.triggerAttackRelease(
                                    note.note, 
                                    note.duration || 1, 
                                    startTime, 
                                    note.velocity || 0.8
                                );
                            }
                        }
                    }

                    statusSpan.textContent = 'Finished';
                } catch (error) {
                    statusSpan.textContent = `Error: ${error.message}`;
                    console.error('Playback error:', error);
                } finally {
                    setTimeout(() => {
                        playBtn.disabled = false;
                        stopBtn.disabled = true;
                        stopBtn.style.opacity = '0.5';
                        playBtn.innerHTML = '▶️';
                        if (statusSpan.textContent !== 'Stopped') {
                            statusSpan.textContent = 'Ready';
                        }
                        isPlaying = false;
                    }, 1000);
                }
            };

            stopBtn.onclick = () => {
                synths.forEach(synth => {
                    if (synth.dispose) synth.dispose();
                });
                synths = [];
                
                playBtn.disabled = false;
                stopBtn.disabled = true;
                stopBtn.style.opacity = '0.5';
                playBtn.innerHTML = '▶️';
                statusSpan.textContent = 'Stopped';
                isPlaying = false;
            };

            return container;

        } catch (error) {
            return createErrorDiv(`Player error: ${error.message}`);
        }
    };
}

// Create display function (combines show + play)
function createDisplayFunction(modules) {
    return function display(composition, options = {}) {
        const container = document.createElement('div');
        container.style.cssText = 'display: flex; flex-direction: column; gap: 16px;';
        
        const show = createShowFunction(modules);
        const play = createPlayFunction(modules);
        
        const scoreEl = show(composition, options.score);
        const playerEl = play(composition, options.player);
        
        container.appendChild(scoreEl);
        container.appendChild(playerEl);
        
        return container;
    };
}

// Create export functions for different formats
function createExportFunctions(modules) {
    return {
        toMidi: (composition, filename) => {
            if (modules.jmonMidi && modules.jmonMidi.convertAndDownload) {
                return modules.jmonMidi.convertAndDownload(composition, filename);
            }
            throw new Error('MIDI export not available');
        },
        
        toAbc: (composition, filename) => {
            if (modules.jmonAbc && modules.jmonAbc.convertAndDownload) {
                return modules.jmonAbc.convertAndDownload(composition, filename);
            }
            throw new Error('ABC export not available');
        },
        
        toSuperCollider: (composition, filename) => {
            if (modules.jmonSuperCollider && modules.jmonSuperCollider.convertAndDownload) {
                return modules.jmonSuperCollider.convertAndDownload(composition, filename);
            }
            throw new Error('SuperCollider export not available');
        }
    };
}

// Helper functions
function createButton(text, bg, hoverBg) {
    const btn = document.createElement('button');
    btn.innerHTML = text;
    btn.style.cssText = `
        background: ${bg};
        color: white;
        border: none;
        border-radius: 6px;
        padding: 8px 12px;
        font-size: 16px;
        cursor: pointer;
        transition: background 0.2s;
        min-width: 44px;
        height: 36px;
    `;
    btn.onmouseover = () => btn.style.background = hoverBg;
    btn.onmouseout = () => btn.style.background = bg;
    return btn;
}

function createErrorDiv(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        padding: 15px;
        background: #fef2f2;
        border: 1px solid #fecaca;
        border-radius: 8px;
        color: #dc2626;
        font-size: 14px;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    `;
    errorDiv.innerHTML = `<strong>Error:</strong> ${message}`;
    return errorDiv;
}

// Export for direct use
export default setup;