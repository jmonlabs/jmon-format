/**
 * jmon-setup-single.js - Single-cell JMON ecosystem setup for Observable
 * 
 * This file should be used like this in Observable:
 * 
 * jmon = {
 *   const module = await import('https://cdn.jsdelivr.net/gh/jmonlabs/jmon-format@main/jmon-setup-single.js');
 *   return await module.setup();
 * }
 * 
 * Then use: jmon.show(composition), jmon.play(composition), etc.
 */

// Load external script via dynamic import or script tag
async function loadScript(url, globalName, timeout = 10000) {
    return new Promise((resolve, reject) => {
        // Check if already loaded
        if (typeof window !== 'undefined' && window[globalName]) {
            resolve(window[globalName]);
            return;
        }
        
        const script = document.createElement('script');
        script.src = url;
        script.crossOrigin = 'anonymous';
        
        const timeoutId = setTimeout(() => {
            reject(new Error(`Timeout loading ${url}`));
        }, timeout);
        
        script.onload = () => {
            clearTimeout(timeoutId);
            // Give it a moment to set globals
            setTimeout(() => {
                resolve(window[globalName]);
            }, 100);
        };
        
        script.onerror = () => {
            clearTimeout(timeoutId);
            reject(new Error(`Failed to load ${url}`));
        };
        
        document.head.appendChild(script);
    });
}

// Try multiple CDN sources for a library
async function loadWithFallbacks(sources, globalName) {
    for (const url of sources) {
        try {
            const result = await loadScript(url, globalName);
            if (result) return result;
        } catch (e) {
            console.warn(`Failed to load from ${url}:`, e.message);
        }
    }
    throw new Error(`Could not load ${globalName} from any source`);
}

// Main setup function
export async function setup() {
    console.log('🎵 Setting up JMON ecosystem (single cell)...');
    
    const results = {};
    
    try {
        // 1. Load Tone.js with fallbacks
        console.log('📦 Loading Tone.js...');
        try {
            results.Tone = await loadWithFallbacks([
                'https://unpkg.com/tone@15.1.22/build/Tone.js',
                'https://cdn.jsdelivr.net/npm/tone@15.1.22/build/Tone.js',
                'https://cdn.skypack.dev/tone@15'
            ], 'Tone');
            window.Tone = results.Tone;
            console.log('✅ Tone.js loaded');
        } catch (e) {
            console.warn('⚠️ Tone.js not available, audio playback disabled');
            results.Tone = null;
        }
        
        // 2. Load ABC.js with fallbacks
        console.log('📦 Loading ABC.js...');
        try {
            results.ABCJS = await loadWithFallbacks([
                'https://unpkg.com/abcjs@6/dist/abcjs-basic-min.js',
                'https://cdn.jsdelivr.net/npm/abcjs@6/dist/abcjs-basic-min.js'
            ], 'ABCJS');
            console.log('✅ ABC.js loaded');
        } catch (e) {
            console.warn('⚠️ ABC.js not available, scores will show as text');
            results.ABCJS = null;
        }
        
        // 3. Load djalgojs with fallbacks
        console.log('📦 Loading djalgojs...');
        try {
            results.dj = await loadWithFallbacks([
                'https://cdn.jsdelivr.net/gh/jmonlabs/djalgojs@main/dist/djalgojs.js',
                'https://unpkg.com/djalgojs@latest/dist/djalgojs.min.js'
            ], 'djalgojs');
            results.viz = results.dj;
            console.log('✅ djalgojs loaded as {dj, viz}');
        } catch (e) {
            console.warn('⚠️ djalgojs not available');
            results.dj = null;
            results.viz = null;
        }
        
        // 4. Load JMON modules
        console.log('📦 Loading JMON utilities...');
        
        try {
            results.jmonTone = await loadScript(
                'https://cdn.jsdelivr.net/gh/jmonlabs/jmon-format@main/jmon-tone.js',
                'jmonTone'
            );
            console.log('✅ jmon-tone.js loaded');
        } catch (e) {
            console.warn('❌ jmon-tone.js failed:', e.message);
            results.jmonTone = null;
        }
        
        try {
            results.jmonAbc = await loadScript(
                'https://cdn.jsdelivr.net/gh/jmonlabs/jmon-format@main/jmon-abc.js',
                'JmonToAbc'
            );
            console.log('✅ jmon-abc.js loaded');
        } catch (e) {
            console.warn('❌ jmon-abc.js failed:', e.message);
            results.jmonAbc = null;
        }
        
        // 5. Initialize Tone.js context if available
        if (results.Tone && results.Tone.context && results.Tone.context.state !== 'running') {
            await results.Tone.start();
            console.log('✅ Tone.js context started');
        }
        
        // 6. Create simple show function using existing jmonTone.normalize and jmonAbc.convertToAbc
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
                // Use existing normalize function
                let normalized = composition;
                if (results.jmonTone && results.jmonTone.normalize) {
                    normalized = results.jmonTone.normalize(composition);
                }
                
                // Title
                if (normalized.metadata?.name) {
                    const title = document.createElement('h3');
                    title.textContent = normalized.metadata.name;
                    title.style.cssText = 'margin: 0 0 12px 0; font-size: 16px;';
                    container.appendChild(title);
                }
                
                // Convert to ABC using existing converter
                let content = '';
                if (results.jmonAbc && results.jmonAbc.convertToAbc) {
                    content = results.jmonAbc.convertToAbc(normalized);
                } else {
                    content = JSON.stringify(normalized, null, 2);
                }
                
                // Display
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
                    margin: 0;
                `;
                container.appendChild(pre);
                
            } catch (error) {
                container.innerHTML = `<strong>Error:</strong> ${error.message}`;
                container.style.color = '#dc2626';
            }
            
            return container;
        };
        
        // 7. Create simple play function using existing jmonTone.playComposition
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
                // Use existing normalize function
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
                status.textContent = results.Tone ? 'Ready' : 'Tone.js not available';
                status.style.cssText = 'font-size: 12px; color: #6b7280;';
                
                playBtn.onclick = async () => {
                    if (!results.Tone || !results.jmonTone) {
                        status.textContent = 'Audio not available';
                        return;
                    }
                    
                    try {
                        playBtn.disabled = true;
                        status.textContent = 'Playing...';
                        
                        // Use existing playComposition function
                        await results.jmonTone.playComposition(composition);
                        
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
        
        // 8. Combined display function
        results.display = function(composition, options = {}) {
            const container = document.createElement('div');
            container.style.cssText = 'display: flex; flex-direction: column; gap: 16px;';
            container.appendChild(results.show(composition, options));
            container.appendChild(results.play(composition, options));
            return container;
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