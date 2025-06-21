/**
 * jmon-to-supercollider.js - Convert jmon format to SuperCollider code
 * 
 * Converts jmon compositions to SuperCollider script for advanced synthesis and audio processing.
 * Supports synthesis, effects, routing, and real-time parameter control.
 */

class JmonToSuperCollider {
    /**
     * Convert a jmon composition to SuperCollider code
     * @param {Object} composition - jmon composition object
     * @returns {string} SuperCollider script
     */
    static convertToSuperCollider(composition) {
        // Validate jmon composition
        if (!jmonTone.validate(composition).success) {
            throw new Error('Invalid jmon composition');
        }

        let sc = '';
        
        // Header comments
        sc += this.generateHeader(composition);
        
        // Server setup and cleanup
        sc += this.generateServerSetup();
        
        // SynthDef definitions
        sc += this.generateSynthDefs(composition);
        
        // Effects definitions
        sc += this.generateEffectDefs(composition);
        
        // Pattern definitions
        sc += this.generatePatterns(composition);
        
        // Main execution block
        sc += this.generateMainExecution(composition);
        
        return sc;
    }

    /**
     * Generate SuperCollider header and comments
     * @param {Object} composition - jmon composition
     * @returns {string} Header section
     */
    static generateHeader(composition) {
        let header = `// SuperCollider script generated from jmon format\n`;
        header += `// Generated on: ${new Date().toISOString()}\n`;
        
        if (composition.metadata) {
            if (composition.metadata.name) {
                header += `// Title: ${composition.metadata.name}\n`;
            }
            if (composition.metadata.author) {
                header += `// Composer: ${composition.metadata.author}\n`;
            }
            if (composition.metadata.description) {
                header += `// Description: ${composition.metadata.description}\n`;
            }
        }
        
        header += `// Tempo: ${composition.bpm || 120} BPM\n`;
        header += `// Key: ${composition.keySignature || 'C'}\n`;
        header += `// Time Signature: ${composition.timeSignature || '4/4'}\n`;
        header += `\n`;
        
        return header;
    }

    /**
     * Generate server setup code
     * @returns {string} Server setup code
     */
    static generateServerSetup() {
        return `// Server setup
(
s.waitForBoot({
    // Clear any existing synths
    s.freeAll;
    
    // Set up global variables
    ~tempo = TempoClock.default;
    ~busses = ();
    ~synths = ();
    ~effects = ();
    ~patterns = ();
    
    // Wait for SynthDefs to load
    s.sync;
    
`;
    }

    /**
     * Generate SynthDef definitions from audio graph
     * @param {Object} composition - jmon composition
     * @returns {string} SynthDef code
     */
    static generateSynthDefs(composition) {
        let synthDefs = `    // SynthDef definitions\n`;
        
        // Default synth if no audio graph
        if (!composition.audioGraph || composition.audioGraph.length === 0) {
            synthDefs += this.generateDefaultSynthDef();
            return synthDefs;
        }

        // Generate SynthDefs from audio graph
        const synthNodes = composition.audioGraph.filter(node => 
            this.isSynthNode(node.type) && node.type !== 'Destination'
        );

        synthNodes.forEach(node => {
            synthDefs += this.generateSynthDefFromNode(node);
        });

        return synthDefs;
    }

    /**
     * Generate effects definitions
     * @param {Object} composition - jmon composition
     * @returns {string} Effects code
     */
    static generateEffectDefs(composition) {
        let effects = `    // Effect definitions\n`;
        
        if (!composition.audioGraph) {
            return effects;
        }

        const effectNodes = composition.audioGraph.filter(node => 
            this.isEffectNode(node.type)
        );

        effectNodes.forEach(node => {
            effects += this.generateEffectFromNode(node);
        });

        return effects;
    }

    /**
     * Generate pattern definitions from sequences
     * @param {Object} composition - jmon composition
     * @returns {string} Pattern code
     */
    static generatePatterns(composition) {
        let patterns = `    // Pattern definitions\n`;
        
        if (!composition.sequences) {
            return patterns;
        }

        composition.sequences.forEach((sequence, index) => {
            patterns += this.generatePatternFromSequence(sequence, index, composition);
        });

        return patterns;
    }

    /**
     * Generate main execution block
     * @param {Object} composition - jmon composition
     * @returns {string} Main execution code
     */
    static generateMainExecution(composition) {
        let main = `    // Main execution\n`;
        main += `    ~tempo.tempo = ${(composition.bpm || 120) / 60};\n\n`;
        
        // Start patterns
        if (composition.sequences) {
            main += `    // Start all patterns\n`;
            composition.sequences.forEach((sequence, index) => {
                const patternName = this.sanitizeName(sequence.label || `pattern${index}`);
                main += `    ~patterns.${patternName}.play(~tempo);\n`;
            });
        }
        
        main += `\n    "Composition started".postln;\n`;
        main += `});\n`;
        main += `)\n\n`;
        
        // Stop function
        main += `// Stop all patterns\n`;
        main += `(\n`;
        main += `~patterns.do(_.stop);\n`;
        main += `s.freeAll;\n`;
        main += `"Composition stopped".postln;\n`;
        main += `)\n`;
        
        return main;
    }

    /**
     * Generate default SynthDef
     * @returns {string} Default SynthDef code
     */
    static generateDefaultSynthDef() {
        return `    SynthDef(\\defaultSynth, { |freq=440, amp=0.5, gate=1, out=0|
        var env = EnvGen.kr(Env.adsr(0.01, 0.1, 0.8, 0.3), gate, doneAction: 2);
        var sig = SinOsc.ar(freq, 0, amp * env);
        Out.ar(out, sig ! 2);
    }).add;
    
`;
    }

    /**
     * Generate SynthDef from audio graph node
     * @param {Object} node - audio graph node
     * @returns {string} SynthDef code
     */
    static generateSynthDefFromNode(node) {
        const synthName = this.sanitizeName(node.id);
        let synthDef = `    SynthDef(\\${synthName}, { |freq=440, amp=0.5, gate=1, out=0`;
        
        // Add parameters based on node options
        const options = node.options || {};
        
        // Add envelope parameters
        if (options.envelope) {
            synthDef += `, attack=${options.envelope.attack || 0.01}`;
            synthDef += `, decay=${options.envelope.decay || 0.1}`;
            synthDef += `, sustain=${options.envelope.sustain || 0.8}`;
            synthDef += `, release=${options.envelope.release || 0.3}`;
        }
        
        // Add oscillator parameters
        if (options.oscillator) {
            if (options.oscillator.detune) {
                synthDef += `, detune=${options.oscillator.detune}`;
            }
        }
        
        synthDef += `|\n`;
        
        // Generate synthesis code based on type
        synthDef += this.generateSynthesisCode(node.type, options);
        
        synthDef += `    }).add;\n\n`;
        
        return synthDef;
    }

    /**
     * Generate synthesis code based on synth type
     * @param {string} type - synth type
     * @param {Object} options - synth options
     * @returns {string} Synthesis code
     */
    static generateSynthesisCode(type, options) {
        let code = '';
        
        // Envelope
        const env = options.envelope || {};
        code += `        var env = EnvGen.kr(Env.adsr(attack, decay, sustain, release), gate, doneAction: 2);\n`;
        
        // Oscillator(s)
        switch (type) {
            case 'Synth':
                const oscType = options.oscillator?.type || 'sine';
                const oscMethod = this.getOscillatorMethod(oscType);
                code += `        var osc = ${oscMethod}.ar(freq, 0, amp * env);\n`;
                break;
                
            case 'AMSynth':
                code += `        var carrier = SinOsc.ar(freq, 0, 1);\n`;
                code += `        var modulator = SinOsc.ar(freq * 0.5, 0, 0.5);\n`;
                code += `        var osc = carrier * modulator * amp * env;\n`;
                break;
                
            case 'FMSynth':
                const modRatio = options.modulation?.ratio || 2;
                const modIndex = options.modulation?.index || 10;
                code += `        var modFreq = freq * ${modRatio};\n`;
                code += `        var modulator = SinOsc.ar(modFreq, 0, modFreq * ${modIndex});\n`;
                code += `        var osc = SinOsc.ar(freq + modulator, 0, amp * env);\n`;
                break;
                
            case 'PluckSynth':
                code += `        var trigger = Impulse.kr(0);\n`;
                code += `        var osc = Pluck.ar(WhiteNoise.ar(0.1), trigger, 0.2, freq.reciprocal, 10, 0.5) * amp * env;\n`;
                break;
                
            case 'NoiseSynth':
                const noiseType = options.noise?.type || 'white';
                const noiseMethod = noiseType === 'pink' ? 'PinkNoise' : 'WhiteNoise';
                code += `        var osc = ${noiseMethod}.ar(amp * env);\n`;
                break;
                
            case 'Sampler':
                // For Sampler, we'll use PlayBuf or similar
                code += `        var osc = SinOsc.ar(freq, 0, amp * env); // Placeholder for sampler\n`;
                break;
                
            default:
                code += `        var osc = SinOsc.ar(freq, 0, amp * env);\n`;
        }
        
        // Filter if present
        if (options.filter) {
            const filterFreq = options.filter.frequency || 1000;
            const filterQ = options.filter.Q || 1;
            const filterType = options.filter.type || 'lowpass';
            
            switch (filterType) {
                case 'lowpass':
                    code += `        osc = LPF.ar(osc, ${filterFreq}, ${filterQ});\n`;
                    break;
                case 'highpass':
                    code += `        osc = HPF.ar(osc, ${filterFreq}, ${filterQ});\n`;
                    break;
                case 'bandpass':
                    code += `        osc = BPF.ar(osc, ${filterFreq}, ${filterQ});\n`;
                    break;
            }
        }
        
        code += `        Out.ar(out, osc ! 2);\n`;
        
        return code;
    }

    /**
     * Get SuperCollider oscillator method from Tone.js type
     * @param {string} type - oscillator type
     * @returns {string} SuperCollider oscillator method
     */
    static getOscillatorMethod(type) {
        const mapping = {
            'sine': 'SinOsc',
            'square': 'Pulse',
            'sawtooth': 'Saw',
            'triangle': 'LFTri',
            'pulse': 'Pulse'
        };
        return mapping[type] || 'SinOsc';
    }

    /**
     * Generate effect from audio graph node
     * @param {Object} node - effect node
     * @returns {string} Effect code
     */
    static generateEffectFromNode(node) {
        const effectName = this.sanitizeName(node.id);
        let effect = `    // Effect: ${effectName}\n`;
        
        // Create audio bus for effect
        effect += `    ~busses.${effectName} = Bus.audio(s, 2);\n`;
        
        // Generate effect SynthDef
        effect += `    SynthDef(\\${effectName}, { |in, out=0|\n`;
        effect += `        var sig = In.ar(in, 2);\n`;
        effect += this.generateEffectCode(node.type, node.options || {});
        effect += `        Out.ar(out, sig);\n`;
        effect += `    }).add;\n\n`;
        
        return effect;
    }

    /**
     * Generate effect processing code
     * @param {string} type - effect type
     * @param {Object} options - effect options
     * @returns {string} Effect processing code
     */
    static generateEffectCode(type, options) {
        let code = '';
        
        switch (type) {
            case 'Reverb':
                const roomSize = options.roomSize || 0.5;
                const dampening = options.dampening || 0.3;
                const wet = options.wet || 0.5;
                code += `        sig = FreeVerb.ar(sig, ${wet}, ${roomSize}, ${dampening});\n`;
                break;
                
            case 'Delay':
                const delayTime = options.delayTime || 0.25;
                const feedback = options.feedback || 0.4;
                const delayWet = options.wet || 0.5;
                code += `        var delayed = DelayL.ar(sig, 1.0, ${delayTime});\n`;
                code += `        delayed = delayed + (delayed * ${feedback});\n`;
                code += `        sig = (sig * (1 - ${delayWet})) + (delayed * ${delayWet});\n`;
                break;
                
            case 'Filter':
                const frequency = options.frequency || 1000;
                const Q = options.Q || 1;
                const filterType = options.type || 'lowpass';
                
                switch (filterType) {
                    case 'lowpass':
                        code += `        sig = LPF.ar(sig, ${frequency}, ${Q});\n`;
                        break;
                    case 'highpass':
                        code += `        sig = HPF.ar(sig, ${frequency}, ${Q});\n`;
                        break;
                    case 'bandpass':
                        code += `        sig = BPF.ar(sig, ${frequency}, ${Q});\n`;
                        break;
                }
                break;
                
            case 'Distortion':
                const distortion = options.distortion || 0.4;
                code += `        sig = (sig * ${distortion * 10}).tanh;\n`;
                break;
                
            case 'Chorus':
                const chorusFreq = options.frequency || 1.5;
                const chorusDepth = options.depth || 0.7;
                code += `        var mod = SinOsc.kr(${chorusFreq}, 0, ${chorusDepth * 0.01});\n`;
                code += `        sig = DelayL.ar(sig, 0.02, 0.01 + mod);\n`;
                break;
                
            case 'Compressor':
                const threshold = options.threshold || -24;
                const ratio = options.ratio || 4;
                code += `        sig = Compander.ar(sig, sig, ${Math.pow(10, threshold/20)}, 1, 1/${ratio});\n`;
                break;
                
            default:
                code += `        // ${type} effect not implemented\n`;
        }
        
        return code;
    }

    /**
     * Generate pattern from sequence
     * @param {Object} sequence - jmon sequence
     * @param {number} index - sequence index
     * @param {Object} composition - full composition
     * @returns {string} Pattern code
     */
    static generatePatternFromSequence(sequence, index, composition) {
        const patternName = this.sanitizeName(sequence.label || `pattern${index}`);
        const synthName = sequence.synthRef ? this.sanitizeName(sequence.synthRef) : 'defaultSynth';
        
        let pattern = `    // Pattern: ${sequence.label || `Pattern ${index + 1}`}\n`;
        
        // Sort notes by time
        const sortedNotes = [...sequence.notes].sort((a, b) => {
            const timeA = typeof a.time === 'string' ? 
                jmonTone._parseTimeString(a.time, composition.bpm || 120) : a.time;
            const timeB = typeof b.time === 'string' ? 
                jmonTone._parseTimeString(b.time, composition.bpm || 120) : b.time;
            return timeA - timeB;
        });

        // Generate note events
        const notes = [];
        const durs = [];
        const amps = [];
        
        let lastTime = 0;
        
        sortedNotes.forEach(note => {
            const noteTime = typeof note.time === 'string' ? 
                jmonTone._parseTimeString(note.time, composition.bpm || 120) : note.time;
            const duration = typeof note.duration === 'string' ? 
                jmonTone._parseTimeString(note.duration, composition.bpm || 120) : note.duration;
            
            // Add rest if needed
            if (noteTime > lastTime) {
                const restDuration = noteTime - lastTime;
                notes.push('\\rest');
                durs.push(this.secondsToBeats(restDuration, composition.bpm || 120));
                amps.push(0);
            }
            
            // Convert note
            if (Array.isArray(note.note)) {
                // Chord
                const midiNotes = note.note.map(n => 
                    typeof n === 'number' ? n : jmonTone.noteNameToMidiNote(n)
                );
                notes.push(`[${midiNotes.map(n => `${n}.midicps`).join(', ')}]`);
            } else {
                // Single note
                const midiNote = typeof note.note === 'number' ? 
                    note.note : jmonTone.noteNameToMidiNote(note.note);
                notes.push(`${midiNote}.midicps`);
            }
            
            durs.push(this.secondsToBeats(duration, composition.bpm || 120));
            amps.push(note.velocity || 0.8);
            
            lastTime = noteTime + duration;
        });
        
        // Create Pbind pattern
        pattern += `    ~patterns.${patternName} = Pbind(\n`;
        pattern += `        \\instrument, \\${synthName},\n`;
        pattern += `        \\freq, Pseq([${notes.join(', ')}], inf),\n`;
        pattern += `        \\dur, Pseq([${durs.join(', ')}], inf),\n`;
        pattern += `        \\amp, Pseq([${amps.join(', ')}], inf)\n`;
        
        // Add modulation parameters if present
        const hasModulations = sequence.notes.some(note => note.modulations && note.modulations.length > 0);
        if (hasModulations) {
            pattern += `        // Note: Modulations require additional parameter automation\n`;
        }
        
        pattern += `    );\n\n`;
        
        return pattern;
    }

    /**
     * Convert seconds to beats
     * @param {number} seconds - duration in seconds
     * @param {number} bpm - beats per minute
     * @returns {number} duration in beats
     */
    static secondsToBeats(seconds, bpm) {
        return (seconds * bpm) / 60;
    }

    /**
     * Check if node type is a synthesizer
     * @param {string} type - node type
     * @returns {boolean} true if synth node
     */
    static isSynthNode(type) {
        const synthTypes = [
            'Synth', 'PolySynth', 'MonoSynth', 'AMSynth', 'FMSynth', 
            'DuoSynth', 'PluckSynth', 'NoiseSynth', 'Sampler'
        ];
        return synthTypes.includes(type);
    }

    /**
     * Check if node type is an effect
     * @param {string} type - node type
     * @returns {boolean} true if effect node
     */
    static isEffectNode(type) {
        const effectTypes = [
            'Filter', 'AutoFilter', 'Reverb', 'FeedbackDelay', 'PingPongDelay', 'Delay',
            'Chorus', 'Phaser', 'Tremolo', 'AutoWah', 'Distortion', 'Chebyshev', 
            'BitCrusher', 'Compressor', 'Limiter', 'Gate'
        ];
        return effectTypes.includes(type);
    }

    /**
     * Sanitize name for SuperCollider identifier
     * @param {string} name - original name
     * @returns {string} sanitized name
     */
    static sanitizeName(name) {
        return name.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^[0-9]/, '_$&');
    }

    /**
     * Export SuperCollider code as downloadable file
     * @param {string} scCode - SuperCollider code
     * @param {string} filename - filename for download
     */
    static exportScAsFile(scCode, filename = 'composition.scd') {
        const blob = new Blob([scCode], { type: 'text/plain' });
        
        // Create download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Convert jmon composition to SuperCollider and download
     * @param {Object} composition - jmon composition
     * @param {string} filename - Optional filename
     */
    static convertAndDownload(composition, filename) {
        try {
            const scCode = this.convertToSuperCollider(composition);
            const downloadName = filename || `${composition.metadata?.name || 'composition'}.scd`;
            this.exportScAsFile(scCode, downloadName);
            console.log(`✅ SuperCollider file "${downloadName}" exported successfully`);
            return scCode;
        } catch (error) {
            console.error('❌ Error converting to SuperCollider:', error);
            throw error;
        }
    }

    /**
     * Analyze jmon composition for SuperCollider conversion
     * @param {Object} composition - jmon composition
     * @returns {Object} Analysis report
     */
    static analyzeForSuperCollider(composition) {
        const report = {
            synthNodes: 0,
            effectNodes: 0,
            sequences: composition.sequences?.length || 0,
            totalNotes: 0,
            modulations: 0,
            audioConnections: composition.connections?.length || 0,
            warnings: [],
            features: []
        };

        // Analyze audio graph
        if (composition.audioGraph) {
            composition.audioGraph.forEach(node => {
                if (this.isSynthNode(node.type)) {
                    report.synthNodes++;
                } else if (this.isEffectNode(node.type)) {
                    report.effectNodes++;
                }
            });
        }

        // Analyze sequences
        if (composition.sequences) {
            composition.sequences.forEach(seq => {
                report.totalNotes += seq.notes?.length || 0;
                
                seq.notes?.forEach(note => {
                    if (note.modulations) {
                        report.modulations += note.modulations.length;
                    }
                });
            });
        }

        // Feature detection
        if (report.modulations > 0) {
            report.features.push('Real-time modulation support');
        }
        
        if (report.effectNodes > 0) {
            report.features.push('Audio effects processing');
        }
        
        if (composition.tempoMap && composition.tempoMap.length > 0) {
            report.features.push('Tempo changes');
            report.warnings.push('Tempo changes require manual implementation in SuperCollider');
        }

        return report;
    }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = JmonToSuperCollider;
}

if (typeof window !== 'undefined') {
    window.JmonToSuperCollider = JmonToSuperCollider;
}