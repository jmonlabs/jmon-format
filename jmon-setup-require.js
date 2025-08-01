/**
 * jmon-setup-require.js - Observable-native JMON ecosystem setup
 * 
 * Uses Observable's require() function for external dependencies
 * and direct script loading for JMON modules.
 */

// Load JMON module as external script (these work fine)
async function loadJmonModule(url, globalName) {
    try {
        const script = document.createElement('script');
        script.src = url;
        
        return new Promise((resolve, reject) => {
            script.onload = () => {
                setTimeout(() => {
                    resolve(window[globalName]);
                }, 200);
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    } catch (error) {
        console.warn(`Failed to load ${url}:`, error);
        return null;
    }
}

// Main setup function
export async function setup() {
    console.log('🎵 Setting up JMON ecosystem (Observable-native)...');
    
    const results = {};
    
    try {
        // 1. Load Tone.js using Observable's require (this works better)
        console.log('📦 Loading Tone.js...');
        try {
            // Try to use Observable's require if available
            if (typeof require !== 'undefined') {
                results.Tone = await require('tone@15');
                window.Tone = results.Tone;
                console.log('✅ Tone.js loaded via require');
            } else {
                throw new Error('require not available');
            }
        } catch (e) {
            console.warn('⚠️ Observable require failed, skipping Tone.js');
            results.Tone = null;
        }
        
        // 2. Load ABC.js using Observable's require
        console.log('📦 Loading ABC.js...');
        try {
            if (typeof require !== 'undefined') {
                results.ABCJS = await require('abcjs@6');
                window.ABCJS = results.ABCJS;
                console.log('✅ ABC.js loaded via require');
            } else {
                throw new Error('require not available');
            }
        } catch (e) {
            console.warn('⚠️ ABC.js require failed, scores will show as text');
            results.ABCJS = null;
        }
        
        // 3. Load djalgojs using Observable's require
        console.log('📦 Loading djalgojs...');
        try {
            if (typeof require !== 'undefined') {
                results.dj = await require('djalgojs@latest');
                results.viz = results.dj;
                console.log('✅ djalgojs loaded via require');
            } else {
                throw new Error('require not available');
            }
        } catch (e) {
            console.warn('⚠️ djalgojs require failed, continuing without it');
            results.dj = null;
            results.viz = null;
        }
        
        // 4. Load JMON modules (these work fine as scripts)
        console.log('📦 Loading JMON utilities...');
        
        results.jmonTone = await loadJmonModule(
            'https://cdn.jsdelivr.net/gh/jmonlabs/jmon-format@main/jmon-tone.js',
            'jmonTone'
        );
        console.log(results.jmonTone ? '✅ jmon-tone.js loaded' : '❌ jmon-tone.js failed');
        
        results.jmonAbc = await loadJmonModule(
            'https://cdn.jsdelivr.net/gh/jmonlabs/jmon-format@main/jmon-abc.js', 
            'JmonToAbc'
        );
        console.log(results.jmonAbc ? '✅ jmon-abc.js loaded' : '❌ jmon-abc.js failed');
        
        results.jmonMidi = await loadJmonModule(
            'https://cdn.jsdelivr.net/gh/jmonlabs/jmon-format@main/jmon-midi.js',
            'JmonToMidi'
        );
        console.log(results.jmonMidi ? '✅ jmon-midi.js loaded' : '❌ jmon-midi.js failed');
        
        results.jmonSuperCollider = await loadJmonModule(
            'https://cdn.jsdelivr.net/gh/jmonlabs/jmon-format@main/jmon-supercollider.js',
            'JmonToSuperCollider'
        );
        console.log(results.jmonSuperCollider ? '✅ jmon-supercollider.js loaded' : '❌ jmon-supercollider.js failed');
        
        // 5. Initialize Tone.js context
        if (results.Tone && results.Tone.context && results.Tone.context.state !== 'running') {
            await results.Tone.start();
            console.log('✅ Tone.js context started');
        }
        
        // 6. Create simple show/play functions using loaded modules
        results.show = function(composition, options = {}) {
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
                // Normalize composition
                let normalized = composition;
                if (results.jmonTone && results.jmonTone.normalize) {
                    normalized = results.jmonTone.normalize(composition);
                }
                
                // Show title
                if (normalized.metadata?.name) {
                    const title = document.createElement('h3');
                    title.textContent = normalized.metadata.name;
                    title.style.cssText = 'margin: 0 0 12px 0; font-size: 16px;';
                    container.appendChild(title);
                }
                
                // Convert to ABC
                let content = '';
                if (results.jmonAbc && results.jmonAbc.convertToAbc) {
                    content = results.jmonAbc.convertToAbc(normalized);
                } else {
                    content = JSON.stringify(normalized, null, 2);
                }
                
                // Display content
                const pre = document.createElement('pre');
                pre.textContent = content;
                pre.style.cssText = `
                    background: #f8fafc;
                    padding: 12px;
                    border-radius: 6px;
                    font-size: 11px;
                    font-family: monospace;
                    overflow: auto;
                    max-height: 300px;
                `;
                container.appendChild(pre);
                
            } catch (error) {
                container.innerHTML = `<strong>Error:</strong> ${error.message}`;
                container.style.color = '#dc2626';
            }
            
            return container;
        };
        
        results.play = function(composition, options = {}) {
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
                // Normalize composition
                let normalized = composition;
                if (results.jmonTone && results.jmonTone.normalize) {
                    normalized = results.jmonTone.normalize(composition);
                }
                
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
                    if (!results.Tone) {
                        status.textContent = 'Tone.js not available';
                        return;
                    }
                    
                    try {
                        playBtn.disabled = true;
                        status.textContent = 'Playing...';
                        
                        // Use jmonTone.playComposition if available
                        if (results.jmonTone && results.jmonTone.playComposition) {
                            await results.jmonTone.playComposition(composition);
                        } else {
                            // Simple fallback
                            const synth = new results.Tone.PolySynth().toDestination();
                            for (const sequence of normalized.sequences || []) {
                                for (const note of sequence.notes || []) {
                                    const startTime = results.Tone.now() + (note.time || 0);
                                    synth.triggerAttackRelease(
                                        note.note, 
                                        note.duration || 1, 
                                        startTime, 
                                        note.velocity || 0.8
                                    );
                                }
                            }
                        }
                        
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
        };
        
        results.display = function(composition, options = {}) {
            const container = document.createElement('div');
            container.style.cssText = 'display: flex; flex-direction: column; gap: 16px;';
            container.appendChild(results.show(composition, options));
            container.appendChild(results.play(composition, options));
            return container;
        };
        
        // 7. Export functions
        results.export = {
            toMidi: (composition, filename) => {
                if (results.jmonMidi && results.jmonMidi.convertAndDownload) {
                    return results.jmonMidi.convertAndDownload(composition, filename);
                }
                throw new Error('MIDI export not available');
            },
            
            toAbc: (composition, filename) => {
                if (results.jmonAbc && results.jmonAbc.convertAndDownload) {
                    return results.jmonAbc.convertAndDownload(composition, filename);
                }
                throw new Error('ABC export not available');
            },
            
            toSuperCollider: (composition, filename) => {
                if (results.jmonSuperCollider && results.jmonSuperCollider.convertAndDownload) {
                    return results.jmonSuperCollider.convertAndDownload(composition, filename);
                }
                throw new Error('SuperCollider export not available');
            }
        };
        
        console.log('🎉 JMON ecosystem ready!');
        console.log('📋 Available:', Object.keys(results).filter(k => results[k]));
        
        return results;
        
    } catch (error) {
        console.error('❌ Setup failed:', error);
        throw error;
    }
}

// Export for direct use
export default setup;