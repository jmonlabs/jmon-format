/**
 * jmon-setup-simple.js - Simple JMON ecosystem setup for Observable
 * 
 * Just loads existing modules and exposes their existing functionality.
 * No duplication, uses what's already implemented.
 */

// Load external CDN script
async function loadScript(url, globalName) {
    return new Promise((resolve, reject) => {
        if (typeof window !== 'undefined' && window[globalName]) {
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

// Load JMON module by executing it and getting the global
async function loadJmonModule(url, globalName) {
    try {
        const response = await fetch(url);
        const code = await response.text();
        
        // Execute in global context
        const script = document.createElement('script');
        script.textContent = code;
        document.head.appendChild(script);
        
        // Wait for execution
        await new Promise(resolve => setTimeout(resolve, 100));
        
        return window[globalName];
    } catch (error) {
        console.warn(`Failed to load ${url}:`, error);
        return null;
    }
}

// Main setup function
export async function setup() {
    console.log('🎵 Setting up JMON ecosystem...');
    
    const results = {};
    
    try {
        // 1. Load Tone.js
        console.log('📦 Loading Tone.js...');
        try {
            results.Tone = await loadScript("https://unpkg.com/tone@15.1.22/build/Tone.js", 'Tone');
            window.Tone = results.Tone;
            console.log('✅ Tone.js loaded');
        } catch (e) {
            console.warn('⚠️ Tone.js failed, trying alternative...');
            try {
                results.Tone = await loadScript("https://cdn.skypack.dev/tone@latest", 'Tone');
                window.Tone = results.Tone;
                console.log('✅ Tone.js loaded (alternative)');
            } catch (e2) {
                console.warn('⚠️ Tone.js not available');
                results.Tone = null;
            }
        }
        
        // 2. Load ABC.js
        console.log('📦 Loading ABC.js...');
        try {
            results.ABCJS = await loadScript('https://unpkg.com/abcjs@6/dist/abcjs-basic-min.js', 'ABCJS');
            console.log('✅ ABC.js loaded');
        } catch (e) {
            console.warn('⚠️ ABC.js not loaded, scores will show as text');
            results.ABCJS = null;
        }
        
        // 3. Load djalgojs
        console.log('📦 Loading djalgojs...');
        try {
            // Try different possible URLs for djalgojs
            let djalgoModule = null;
            try {
                djalgoModule = await loadScript('https://unpkg.com/djalgojs@latest/dist/djalgojs.min.js', 'djalgojs');
            } catch (e1) {
                try {
                    djalgoModule = await loadScript('https://cdn.jsdelivr.net/npm/djalgojs@latest/dist/djalgojs.min.js', 'djalgojs');
                } catch (e2) {
                    djalgoModule = await loadScript('https://cdn.jsdelivr.net/gh/jmonlabs/djalgojs@main/dist/djalgojs.js', 'djalgojs');
                }
            }
            
            results.dj = djalgoModule;
            results.viz = djalgoModule;
            console.log('✅ djalgojs loaded as {dj, viz}');
        } catch (e) {
            console.warn('⚠️ djalgojs not available, continuing without it');
            results.dj = null;
            results.viz = null;
        }
        
        // 4. Load JMON modules
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
        
        // Load jmon-observable.js for existing widgets
        results.jmonObservable = await loadJmonModule(
            'https://cdn.jsdelivr.net/gh/jmonlabs/jmon-format@main/jmon-observable.js',
            'jmonObservable'
        );
        console.log(results.jmonObservable ? '✅ jmon-observable.js loaded' : '❌ jmon-observable.js failed');
        
        // 5. Initialize Tone.js context
        if (results.Tone && results.Tone.context.state !== 'running') {
            await results.Tone.start();
            console.log('✅ Tone.js context started');
        }
        
        // 6. Use existing functions from jmon-observable.js
        if (results.jmonObservable) {
            results.show = results.jmonObservable.show;
            results.play = results.jmonObservable.play;
            results.display = results.jmonObservable.display;
        }
        
        // 7. Create export functions using existing converters
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