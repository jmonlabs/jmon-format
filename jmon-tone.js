/**
 * jmonTone (Tone Object Notation EXtended) 1.0 - Core Library
 * 
 * A JavaScript library for parsing, validating, and manipulating
 * musical compositions in the jmonTone specification.
 * 
 * Originally designed for Tone.js but extensible to other audio frameworks.
 */

(function(global) {
    'use strict';
    
    // Check if already loaded
    if (global.jmonTone) {
        return;
    }

class jmonTone {
    static VERSION = "1.0";
    static FORMAT_IDENTIFIER = "jmonTone";
    
    /**
     * Convert MIDI note number to note name (e.g., 60 -> "C4")
     * @param {number} midiNote - MIDI note number (0-127)
     * @returns {string} Note name (e.g., "C4", "A#3")
     */
    static midiNoteToNoteName(midiNote) {
        if (typeof midiNote !== 'number' || midiNote < 0 || midiNote > 127) {
            console.warn(`Invalid MIDI note number: ${midiNote}. Must be 0-127.`);
            return 'C4'; // Default fallback
        }
        
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const octave = Math.floor(midiNote / 12) - 1;
        const noteIndex = midiNote % 12;
        
        return noteNames[noteIndex] + octave;
    }

    /**
     * Convert note name to MIDI note number (e.g., "C4" -> 60)
     * @param {string} noteName - Note name (e.g., "C4", "A#3")
     * @returns {number} MIDI note number (0-127)
     */
    static noteNameToMidiNote(noteName) {
        try {
            // Manual conversion for framework independence
            const noteRegex = /^([A-G])(#|b)?(-?\d+)$/;
            const match = noteName.match(noteRegex);
            
            if (!match) {
                console.warn(`Invalid note name: ${noteName}`);
                return 60; // Default to C4
            }
            
            const [, note, accidental, octave] = match;
            const noteValues = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
            
            let midiNote = noteValues[note] + (parseInt(octave) + 1) * 12;
            
            if (accidental === '#') midiNote += 1;
            else if (accidental === 'b') midiNote -= 1;
            
            return Math.max(0, Math.min(127, midiNote));
        } catch (error) {
            console.warn(`Error converting note name ${noteName}:`, error);
            return 60; // Default to C4
        }
    }

    /**
     * Process note input to handle both MIDI numbers and note names
     * @param {string|number|array} note - Note input
     * @returns {string|array} Processed note(s) as note name(s)
     */
    static processNoteInput(note) {
        if (Array.isArray(note)) {
            return note.map(n => jmonTone.processNoteInput(n));
        } else if (typeof note === 'number') {
            return jmonTone.midiNoteToNoteName(note);
        } else if (typeof note === 'string') {
            return note;
        } else {
            console.warn(`Invalid note input type: ${typeof note}`);
            return 'C4';
        }
    }

    /**
     * Smart conversion of various input formats to jmon format
     * @param {object|array} input - Various input formats
     * @returns {object} Normalized jmon composition
     */
    static normalize(input) {
        // If already a valid jmon object, return as-is
        if (input.format === this.FORMAT_IDENTIFIER) {
            return input;
        }

        let normalized = {
            format: this.FORMAT_IDENTIFIER,
            version: this.VERSION,
            bpm: 120,
            audioGraph: [
                { id: "synth", type: "Synth", options: {} },
                { id: "master", type: "Destination", options: {} }
            ],
            connections: [["synth", "master"]],
            sequences: []
        };

        // Handle different input formats
        if (Array.isArray(input)) {
            // Format: [{ pitch: 60, duration: 1.0, time: 0.0 }, ...]
            normalized.sequences = [{
                label: "sequence",
                synthRef: "synth",
                notes: this.convertNotes(input)
            }];
        } else if (input.tracks) {
            // Format: { tracks: { melody: [...], bass: [...] } }
            normalized.metadata = { name: input.title || "Untitled" };
            normalized.bpm = input.bpm || input.tempo || 120;
            
            normalized.sequences = Object.entries(input.tracks).map(([trackName, notes]) => ({
                label: trackName,
                synthRef: "synth",
                notes: this.convertNotes(notes)
            }));
        } else if (input.sequences || input.parts || input.tracks) {
            // Handle various sequence/parts naming
            const sequences = input.sequences || input.parts || input.tracks;
            
            if (Array.isArray(sequences)) {
                normalized.sequences = sequences.map((seq, index) => ({
                    label: seq.label || seq.name || `sequence${index}`,
                    synthRef: seq.synthRef || "synth",
                    notes: this.convertNotes(seq.notes || seq)
                }));
            }
        } else {
            // Single track format
            const notes = input.notes || input.melody || input;
            if (Array.isArray(notes)) {
                normalized.sequences = [{
                    label: input.title || input.name || "sequence",
                    synthRef: "synth", 
                    notes: this.convertNotes(notes)
                }];
            }
        }

        // Copy over any additional metadata
        if (input.title) normalized.metadata = { ...normalized.metadata, name: input.title };
        if (input.author || input.composer) normalized.metadata = { ...normalized.metadata, author: input.author || input.composer };
        if (input.bpm || input.tempo) normalized.bpm = input.bpm || input.tempo;
        if (input.key || input.keySignature) normalized.keySignature = input.key || input.keySignature;

        return normalized;
    }

    /**
     * Convert various note formats to jmon note format
     * @param {array} notes - Array of notes in various formats
     * @returns {array} Normalized jmon notes
     */
    static convertNotes(notes) {
        if (!Array.isArray(notes)) return [];

        return notes.map(note => {
            const normalized = {
                time: 0,
                duration: "4n",
                velocity: 0.8
            };

            // Handle different note formats
            if (typeof note === 'object') {
                // Convert pitch/note field
                if (note.pitch !== undefined) {
                    if (typeof note.pitch === 'number') {
                        // MIDI number to note name
                        normalized.note = this.midiNoteToNoteName(note.pitch);
                    } else {
                        normalized.note = note.pitch;
                    }
                } else if (note.note !== undefined) {
                    normalized.note = note.note;
                } else if (note.frequency !== undefined) {
                    // Convert frequency to note name (approximate)
                    const midiNote = Math.round(12 * Math.log2(note.frequency / 440) + 69);
                    normalized.note = this.midiNoteToNoteName(midiNote);
                }

                // Convert time
                if (note.time !== undefined) {
                    if (typeof note.time === 'number') {
                        // Convert beats to bars:beats:ticks format
                        const bars = Math.floor(note.time / 4);
                        const beats = note.time % 4;
                        normalized.time = `${bars}:${beats}:0`;
                    } else {
                        normalized.time = note.time;
                    }
                } else if (note.start !== undefined) {
                    normalized.time = note.start;
                }

                // Convert duration
                if (note.duration !== undefined) {
                    if (typeof note.duration === 'number') {
                        // Convert numeric duration to note value
                        if (note.duration === 0.25) normalized.duration = "16n";
                        else if (note.duration === 0.5) normalized.duration = "8n";
                        else if (note.duration === 1) normalized.duration = "4n";
                        else if (note.duration === 2) normalized.duration = "2n";
                        else if (note.duration === 4) normalized.duration = "1n";
                        else normalized.duration = `${note.duration}n`;
                    } else {
                        normalized.duration = note.duration;
                    }
                } else if (note.length !== undefined) {
                    normalized.duration = note.length;
                }

                // Convert velocity/volume
                if (note.velocity !== undefined) {
                    normalized.velocity = typeof note.velocity === 'number' ? 
                        (note.velocity > 1 ? note.velocity / 127 : note.velocity) : 0.8;
                } else if (note.volume !== undefined) {
                    normalized.velocity = note.volume;
                }

                // Copy other properties
                if (note.channel !== undefined) normalized.channel = note.channel;
                if (note.modulations) normalized.modulations = note.modulations;
            }

            return normalized;
        });
    }

    /**
     * Validate a jmonTone composition object against the new schema
     * @param {object} composition - jmonTone composition to validate
     * @returns {object} Validation result with success flag and errors
     */
    static validate(composition) {
        const errors = [];
        const warnings = [];

        // Check required root fields
        if (!composition.format) {
            errors.push("Missing required field: format");
        } else if (composition.format !== jmonTone.FORMAT_IDENTIFIER) {
            errors.push(`Invalid format: expected "${jmonTone.FORMAT_IDENTIFIER}", got "${composition.format}"`);
        }

        if (!composition.version) {
            errors.push("Missing required field: version");
        }

        if (!composition.bpm) {
            errors.push("Missing required field: bpm");
        } else if (typeof composition.bpm !== 'number' || composition.bpm < 20 || composition.bpm > 400) {
            warnings.push("BPM should be between 20-400 according to schema");
        }

        // Check audioGraph (now optional with smart defaults)
        if (composition.audioGraph && Array.isArray(composition.audioGraph)) {
            // Validate audioGraph nodes
            composition.audioGraph.forEach((node, index) => {
                if (!node.id) {
                    errors.push(`AudioGraph node ${index}: Missing required field: id`);
                }
                if (!node.type) {
                    errors.push(`AudioGraph node ${index}: Missing required field: type`);
                }
                if (node.options === undefined) {
                    errors.push(`AudioGraph node ${index}: Missing required field: options`);
                }
                // Validate node type against schema enum
                const validNodeTypes = [
                    "Synth", "PolySynth", "MonoSynth", "AMSynth", "FMSynth", "DuoSynth", 
                    "PluckSynth", "NoiseSynth", "Sampler", "Filter", "AutoFilter", "Reverb", 
                    "FeedbackDelay", "PingPongDelay", "Delay", "Chorus", "Phaser", "Tremolo", 
                    "Vibrato", "AutoWah", "Distortion", "Chebyshev", "BitCrusher", "Compressor", 
                    "Limiter", "Gate", "FrequencyShifter", "PitchShift", "JCReverb", "Freeverb", 
                    "StereoWidener", "MidSideCompressor", "Destination"
                ];
                if (!validNodeTypes.includes(node.type)) {
                    warnings.push(`AudioGraph node ${index}: Unknown node type "${node.type}"`);
                }
            });
        }

        // Check connections (now optional with smart defaults)
        if (composition.connections && Array.isArray(composition.connections)) {
            // Validate connections format
            composition.connections.forEach((connection, index) => {
                if (!Array.isArray(connection) || connection.length !== 2) {
                    errors.push(`Connection ${index}: Must be an array with exactly 2 elements [source, target]`);
                } else {
                    // Validate that referenced nodes exist
                    const [source, target] = connection;
                    if (composition.audioGraph) {
                        const sourceExists = composition.audioGraph.some(node => node.id === source);
                        const targetExists = composition.audioGraph.some(node => node.id === target) || target === 'master';
                        if (!sourceExists) {
                            warnings.push(`Connection ${index}: Source "${source}" not found in audioGraph`);
                        }
                        if (!targetExists) {
                            warnings.push(`Connection ${index}: Target "${target}" not found in audioGraph`);
                        }
                    }
                }
            });
        }

        if (!composition.sequences || !Array.isArray(composition.sequences)) {
            errors.push("Missing or invalid sequences array");
        } else {
            // Validate each sequence
            composition.sequences.forEach((seq, index) => {
                if (!seq.label) {
                    errors.push(`Sequence ${index}: Missing required field: label`);
                }
                if (!seq.synth && !seq.synthRef) {
                    warnings.push(`Sequence ${index}: Missing synth or synthRef definition`);
                }
                if (!seq.notes || !Array.isArray(seq.notes)) {
                    errors.push(`Sequence ${index}: Missing or invalid notes array`);
                } else {
                    // Validate notes
                    seq.notes.forEach((note, noteIndex) => {
                        if (note.time === undefined) {
                            errors.push(`Sequence ${index}, Note ${noteIndex}: Missing required field: time`);
                        }
                        if (!note.note) {
                            errors.push(`Sequence ${index}, Note ${noteIndex}: Missing required field: note`);
                        }
                        if (!note.duration) {
                            errors.push(`Sequence ${index}, Note ${noteIndex}: Missing required field: duration`);
                        }
                        if (note.velocity !== undefined && (note.velocity < 0 || note.velocity > 1)) {
                            warnings.push(`Sequence ${index}, Note ${noteIndex}: Velocity should be between 0.0-1.0`);
                        }
                        // NEW: Validate MIDI channel if present
                        if (note.channel !== undefined && (note.channel < 0 || note.channel > 15)) {
                            errors.push(`Sequence ${index}, Note ${noteIndex}: MIDI channel must be 0-15`);
                        }
                        // NEW: Validate modulations if present
                        if (note.modulations && Array.isArray(note.modulations)) {
                            note.modulations.forEach((mod, modIndex) => {
                                if (!mod.type || !['cc', 'pitchBend', 'aftertouch'].includes(mod.type)) {
                                    errors.push(`Sequence ${index}, Note ${noteIndex}, Modulation ${modIndex}: Invalid type`);
                                }
                                if (mod.value === undefined) {
                                    errors.push(`Sequence ${index}, Note ${noteIndex}, Modulation ${modIndex}: Missing value`);
                                }
                                if (mod.time === undefined) {
                                    errors.push(`Sequence ${index}, Note ${noteIndex}, Modulation ${modIndex}: Missing time`);
                                }
                            });
                        }
                    });
                }
                // NEW: Validate sequence MIDI channel if present
                if (seq.midiChannel !== undefined && (seq.midiChannel < 0 || seq.midiChannel > 15)) {
                    errors.push(`Sequence ${index}: MIDI channel must be 0-15`);
                }
            });
        }

        // NEW: Validate key signature format if present
        if (composition.keySignature && !/^[A-G](#|b)?m?$/.test(composition.keySignature)) {
            errors.push("Invalid keySignature format");
        }

        // NEW: Validate tempo map if present
        if (composition.tempoMap && Array.isArray(composition.tempoMap)) {
            composition.tempoMap.forEach((tempoChange, index) => {
                if (!tempoChange.time) {
                    errors.push(`TempoMap ${index}: Missing time field`);
                }
                if (!tempoChange.bpm || tempoChange.bpm < 20 || tempoChange.bpm > 400) {
                    errors.push(`TempoMap ${index}: Invalid BPM value`);
                }
            });
        }

        return {
            success: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Expand notes with loop repetitions for visualization/export
     * @param {object} sequence - jmonTone sequence object
     * @param {number} totalDuration - Total composition duration in seconds
     * @returns {array} Expanded notes array with loop repetitions
     */
    static expandNotesWithLoop(sequence, totalDuration) {
        const expandedNotes = [...sequence.notes];

        if (sequence.loop && sequence.loop !== false) {
            let loopEndTime;

            if (typeof sequence.loop === 'string') {
                loopEndTime = jmonTone._parseTimeString(sequence.loop, 120);
            } else if (sequence.loop === true) {
                // Calculate from notes
                const lastNoteTime = Math.max(...sequence.notes.map(n => {
                    const noteTime = typeof n.time === 'string' ? jmonTone._parseTimeString(n.time, 120) : n.time;
                    const noteDuration = typeof n.duration === 'string' ? jmonTone._parseTimeString(n.duration, 120) : n.duration;
                    return noteTime + noteDuration;
                }));
                loopEndTime = lastNoteTime;
            }

            const originalDuration = loopEndTime;
            const numberOfLoops = Math.ceil(totalDuration / originalDuration);

            // Add looped notes
            for (let loopIndex = 1; loopIndex < numberOfLoops; loopIndex++) {
                const loopOffset = loopIndex * originalDuration;

                sequence.notes.forEach(originalNote => {
                    const noteTime = typeof originalNote.time === 'string' ? 
                        jmonTone._parseTimeString(originalNote.time, 120) : originalNote.time;
                    
                    const loopedNote = {
                        ...originalNote,
                        time: noteTime + loopOffset,
                        isLooped: true
                    };

                    if (loopedNote.time < totalDuration) {
                        expandedNotes.push(loopedNote);
                    }
                });
            }
        }

        return expandedNotes;
    }

    /**
     * Calculate total composition duration
     * @param {object} composition - jmonTone composition
     * @returns {number} Duration in seconds
     */
    static calculateDuration(composition) {
        let maxDuration = 0;

        composition.sequences.forEach(seq => {
            let sequenceDuration = 0;

            if (seq.loop && seq.loop !== false && typeof seq.loop === 'string') {
                sequenceDuration = jmonTone._parseTimeString(seq.loop, composition.bpm || 120);
            } else {
                // Calculate from notes
                seq.notes.forEach(note => {
                    const noteTime = typeof note.time === 'string' ? 
                        jmonTone._parseTimeString(note.time, composition.bpm || 120) : note.time;
                    const noteDuration = typeof note.duration === 'string' ? 
                        jmonTone._parseTimeString(note.duration, composition.bpm || 120) : note.duration;
                    const noteEnd = noteTime + noteDuration;
                    sequenceDuration = Math.max(sequenceDuration, noteEnd);
                });
            }

            maxDuration = Math.max(maxDuration, sequenceDuration);
        });

        // Find longest loop duration
        let longestLoop = 0;
        composition.sequences.forEach(seq => {
            if (seq.loop && seq.loop !== false && typeof seq.loop === 'string') {
                const loopTime = jmonTone._parseTimeString(seq.loop, composition.bpm || 120);
                longestLoop = Math.max(longestLoop, loopTime);
            }
        });

        return longestLoop > 0 ? longestLoop : maxDuration;
    }

    /**
     * Convert JSON jmonTone format to Tone.js compatible format
     * @param {Object} jsonData - Raw JSON data from file
     * @returns {Object} Format compatible with Tone.js
     */
    static convertToToneFormat(jsonData) {
        console.log('🔄 jmonTone: Converting enhanced JSON to Tone.js format...');
        
        // Validate basic structure
        if (!jsonData.sequences || !Array.isArray(jsonData.sequences)) {
            throw new Error('Invalid jmonTone format: missing sequences array');
        }

        // Convert to format expected by ToneDAW
        const toneFormat = {
            bpm: jsonData.bpm || 120,
            keySignature: jsonData.keySignature || "C major",
            metadata: jsonData.metadata || {},
            // NEW: Include transport settings
            transport: jsonData.transport || {},
            // NEW: Include tempo and key signature maps
            tempoMap: jsonData.tempoMap || [],
            keySignatureMap: jsonData.keySignatureMap || [],
            timeSignatureMap: jsonData.timeSignatureMap || [],
            // NEW: Audio graph and connections
            audioGraph: this.processAudioGraph(jsonData.audioGraph || []),
            connections: jsonData.connections || [],
            // NEW: Custom presets
            customPresets: jsonData.customPresets || [],
            // NEW: Automation and annotations
            automation: jsonData.automation || [],
            annotations: jsonData.annotations || [],
            globalEffects: this.convertGlobalEffects(jsonData.globalEffects),
            sequences: jsonData.sequences.map(seq => {
                // Only support synthRef to audioGraph nodes
                if (!seq.synthRef) {
                    throw new Error(`Sequence "${seq.label}" missing synthRef. All sequences must reference audioGraph nodes.`);
                }
                
                return {
                    label: seq.label || "Untitled Track",
                    group: seq.group || "default",
                    loop: seq.loop || false,
                    loopEnd: seq.loopEnd,
                    // NEW: MIDI channel support
                    midiChannel: seq.midiChannel,
                    synthRef: seq.synthRef, // Only store the reference
                    effects: this.processEffectsChain(seq.effects || convertedSynth.effects),
                    notes: seq.notes.map(note => this.convertNoteFormat(note))
                };
            })
        };

        console.log('✅ jmonTone: Enhanced conversion complete');
        console.log(`   - ${toneFormat.sequences.length} sequences processed`);
        console.log(`   - ${toneFormat.audioGraph.length} audio graph nodes`);
        console.log(`   - ${toneFormat.connections.length} audio connections`);
        console.log(`   - ${Object.keys(toneFormat.globalEffects || {}).length} global effects`);
        
        return toneFormat;
    }

    
    /**
     * Convert note format to ensure compatibility (NEW: with MIDI and modulation support)
     * @param {Object} note - Note object from JSON
     * @returns {Object} Tone.js compatible note
     */
    static convertNoteFormat(note) {
        const converted = {
            note: this.processNoteInput(note.note),
            time: note.time || 0,
            start: note.start || note.time || 0, // Ensure both time and start exist
            duration: note.duration || '4n',
            velocity: note.velocity || 0.8
        };

        // NEW: Add MIDI channel support
        if (note.channel !== undefined) {
            converted.channel = note.channel;
        }

        // NEW: Add articulation support
        if (note.articulation) {
            converted.articulation = note.articulation;
        }

        // NEW: Add microtuning support
        if (note.microtuning !== undefined) {
            converted.microtuning = note.microtuning;
        }

        // NEW: Add modulation events support with Tone.js mapping
        if (note.modulations && Array.isArray(note.modulations)) {
            // Keep original modulations
            converted.modulations = note.modulations.map(mod => ({
                type: mod.type,
                controller: mod.controller,
                value: mod.value,
                time: mod.time
            }));

            // Generate Tone.js compatible automation from MIDI modulations
            const toneModulations = this.mapMIDIModulationToTone(note.modulations);
            converted.toneModulations = toneModulations;
            
            // Generate automation events for Tone.js
            const noteStartTime = typeof converted.time === 'string' ? 
                this._parseTimeString(converted.time) : converted.time;
            converted.automationEvents = this.generateToneAutomationFromMIDI(toneModulations, noteStartTime);
        }

        return converted;
    }

    /**
     * Convert global effects configuration
     * @param {Object} globalEffects - Global effects from JSON
     * @returns {Object} Processed global effects
     */
    static convertGlobalEffects(globalEffects) {
        if (!globalEffects) return {};
        
        console.log('🌐 jmonTone: Processing global effects:', Object.keys(globalEffects));
        return globalEffects;
    }

    /**
     * Process effects chain for a synth (NEW: with preset reference support)
     * @param {Array} effects - Array of effect configurations
     * @returns {Array} Processed effects chain
     */
    static processEffectsChain(effects) {
        if (!effects || !Array.isArray(effects)) return [];
        
        return effects.map(effect => {
            const processed = {
                type: effect.type,
                ...effect
            };
            
            // NEW: Handle preset references
            if (effect.presetRef) {
                processed.presetRef = effect.presetRef;
            }
            
            // NEW: Handle options from schema
            if (effect.options) {
                Object.assign(processed, effect.options);
            }
            
            delete processed.type; // Remove type from parameters
            return {
                effectType: effect.type,
                parameters: processed
            };
        });
    }

    /**
     * Process audio graph nodes (NEW: for audio graph support)
     * @param {Array} audioGraph - Array of audio graph nodes
     * @returns {Array} Processed audio graph nodes
     */
    static processAudioGraph(audioGraph) {
        if (!audioGraph || !Array.isArray(audioGraph)) return [];
        
        console.log('🎚️ jmonTone: Processing audio graph with', audioGraph.length, 'nodes');
        
        return audioGraph.map(node => {
            const processed = {
                id: node.id,
                type: node.type,
                options: node.options || {}
            };

            if (node.target) {
                processed.target = node.target;
            }

            if (node.presetRef) {
                processed.presetRef = node.presetRef;
            }

            return processed;
        });
    }

    /**
     * Resolve custom presets (NEW: for custom preset support)
     * @param {Array} customPresets - Array of custom presets
     * @param {String} presetRef - Reference to preset
     * @returns {Object} Resolved preset options
     */
    static resolveCustomPreset(customPresets, presetRef) {
        if (!customPresets || !presetRef) return {};
        
        const preset = customPresets.find(p => p.id === presetRef);
        if (preset) {
            console.log(`🎯 jmonTone: Resolved custom preset "${presetRef}"`);
            return {
                type: preset.type,
                ...preset.options
            };
        } else {
            console.warn(`⚠️  jmonTone: Custom preset "${presetRef}" not found`);
            return {};
        }
    }

    /**
     * Process automation events (NEW: for automation support)
     * @param {Array} automation - Array of automation events
     * @returns {Array} Processed automation events
     */
    static processAutomation(automation) {
        if (!automation || !Array.isArray(automation)) return [];
        
        console.log('🤖 jmonTone: Processing', automation.length, 'automation events');
        
        return automation.map(event => ({
            target: event.target,
            time: event.time,
            value: event.value,
            // Convert time if it's a string
            timeSeconds: typeof event.time === 'string' ? 
                this._parseTimeString(event.time) : event.time
        }));
    }

    /**
     * Process annotations (NEW: for annotation support)
     * @param {Array} annotations - Array of annotation objects
     * @returns {Array} Processed annotations
     */
    static processAnnotations(annotations) {
        if (!annotations || !Array.isArray(annotations)) return [];
        
        console.log('📝 jmonTone: Processing', annotations.length, 'annotations');
        
        return annotations.map(annotation => ({
            text: annotation.text,
            time: annotation.time,
            type: annotation.type || 'comment',
            duration: annotation.duration,
            // Convert time if it's a string
            timeSeconds: typeof annotation.time === 'string' ? 
                this._parseTimeString(annotation.time) : annotation.time
        }));
    }

    /**
     * Calculate composition duration with tempo map support (NEW: enhanced duration calculation)
     * @param {object} composition - jmonTone composition
     * @returns {number} Duration in seconds
     */
    static calculateDurationWithTempoMap(composition) {
        // If there's a tempo map, we need more sophisticated calculation
        if (composition.tempoMap && composition.tempoMap.length > 0) {
            // This would require more complex tempo-aware duration calculation
            // For now, fall back to basic calculation
            console.log('⏱️ jmonTone: Tempo map detected, using enhanced duration calculation');
        }
        
        // Use existing duration calculation as fallback
        return this.calculateDuration(composition);
    }

    /**
     * Get effective tempo at a given time (NEW: for tempo map support)
     * @param {Array} tempoMap - Tempo map array
     * @param {number} time - Time in seconds
     * @param {number} defaultBpm - Default BPM if no tempo map
     * @returns {number} BPM at the given time
     */
    static getTempoAtTime(tempoMap, time, defaultBpm = 120) {
        if (!tempoMap || tempoMap.length === 0) {
            return defaultBpm;
        }

        // Find the most recent tempo change before or at the given time
        let effectiveTempo = defaultBpm;
        
        for (const tempoChange of tempoMap) {
            const changeTime = typeof tempoChange.time === 'string' ? 
                this._parseTimeString(tempoChange.time) : tempoChange.time;
            
            if (changeTime <= time) {
                effectiveTempo = tempoChange.bpm;
            } else {
                break;
            }
        }

        return effectiveTempo;
    }

    /**
     * Get effective key signature at a given time (NEW: for key signature map support)
     * @param {Array} keySignatureMap - Key signature map array
     * @param {number} time - Time in seconds
     * @param {string} defaultKey - Default key signature
     * @returns {string} Key signature at the given time
     */
    static getKeySignatureAtTime(keySignatureMap, time, defaultKey = "C") {
        if (!keySignatureMap || keySignatureMap.length === 0) {
            return defaultKey;
        }

        // Find the most recent key signature change before or at the given time
        let effectiveKey = defaultKey;
        
        for (const keyChange of keySignatureMap) {
            const changeTime = typeof keyChange.time === 'string' ? 
                this._parseTimeString(keyChange.time) : keyChange.time;
            
            if (changeTime <= time) {
                effectiveKey = keyChange.keySignature;
            } else {
                break;
            }
        }

        return effectiveKey;
    }

    /**
     * Create a basic JMON composition structure (NEW: compliant with extended schema)
     * @param {Object} options - Options for the composition
     * @returns {Object} Basic JMON composition structure
     */
    static createBasicComposition(options = {}) {
        return {
            format: jmonTone.FORMAT_IDENTIFIER,
            version: jmonTone.VERSION,
            bpm: options.bpm || 120,
            keySignature: options.keySignature || "C",
            timeSignature: options.timeSignature || "4/4",
            metadata: {
                name: options.name || "Untitled Composition",
                author: options.author || "Unknown",
                ...options.metadata
            },
            transport: {
                startOffset: 0,
                globalLoop: false,
                swing: 0,
                ...options.transport
            },
            customPresets: options.customPresets || [],
            audioGraph: options.audioGraph || [
                {
                    id: "master",
                    type: "Destination",
                    options: {}
                }
            ],
            connections: options.connections || [],
            sequences: options.sequences || [],
            automation: options.automation || [],
            annotations: options.annotations || [],
            tempoMap: options.tempoMap || [],
            keySignatureMap: options.keySignatureMap || [],
            timeSignatureMap: options.timeSignatureMap || []
        };
    }

    /**
     * Add a sequence to a JMON composition (NEW: with enhanced schema support)
     * @param {Object} composition - JMON composition
     * @param {Object} sequenceOptions - Options for the sequence
     * @returns {Object} Updated composition
     */
    static addSequence(composition, sequenceOptions) {
        const sequence = {
            label: sequenceOptions.label || `Sequence ${composition.sequences.length + 1}`,
            notes: sequenceOptions.notes || [],
            midiChannel: sequenceOptions.midiChannel,
            loop: sequenceOptions.loop || false,
            loopEnd: sequenceOptions.loopEnd,
            effects: sequenceOptions.effects || []
        };

        // Handle synth or synthRef
        if (sequenceOptions.synthRef) {
            sequence.synthRef = sequenceOptions.synthRef;
        } else if (sequenceOptions.synth) {
            sequence.synth = sequenceOptions.synth;
        } else {
            // Default synth
            sequence.synth = {
                type: "Synth",
                options: {
                    oscillator: { type: "sine" },
                    envelope: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 1 }
                }
            };
        }

        composition.sequences.push(sequence);
        return composition;
    }

    /**
     * Add an audio graph node (NEW: for audio graph management)
     * @param {Object} composition - JMON composition
     * @param {Object} nodeOptions - Options for the audio node
     * @returns {Object} Updated composition
     */
    static addAudioGraphNode(composition, nodeOptions) {
        const node = {
            id: nodeOptions.id || `node_${composition.audioGraph.length}`,
            type: nodeOptions.type || "Synth",
            options: nodeOptions.options || {}
        };

        if (nodeOptions.target) {
            node.target = nodeOptions.target;
        }

        if (nodeOptions.presetRef) {
            node.presetRef = nodeOptions.presetRef;
        }

        composition.audioGraph.push(node);
        return composition;
    }

    /**
     * Add a connection between audio graph nodes (NEW: for audio routing)
     * @param {Object} composition - JMON composition
     * @param {String} source - Source node ID
     * @param {String} target - Target node ID
     * @returns {Object} Updated composition
     */
    static addConnection(composition, source, target) {
        composition.connections.push([source, target]);
        return composition;
    }

    /**
     * Add automation event (NEW: for automation support)
     * @param {Object} composition - JMON composition
     * @param {Object} automationOptions - Automation event options
     * @returns {Object} Updated composition
     */
    static addAutomation(composition, automationOptions) {
        const automation = {
            target: automationOptions.target,
            time: automationOptions.time,
            value: automationOptions.value
        };

        composition.automation.push(automation);
        return composition;
    }

    /**
     * Add annotation (NEW: for annotation support)
     * @param {Object} composition - JMON composition
     * @param {Object} annotationOptions - Annotation options
     * @returns {Object} Updated composition
     */
    static addAnnotation(composition, annotationOptions) {
        const annotation = {
            text: annotationOptions.text,
            time: annotationOptions.time,
            type: annotationOptions.type || "comment"
        };

        if (annotationOptions.duration) {
            annotation.duration = annotationOptions.duration;
        }

        composition.annotations.push(annotation);
        return composition;
    }

    /**
     * Generate automation events for Tone.js from MIDI modulations
     * @param {Array} toneModulations - Mapped tone modulations
     * @param {number} noteStartTime - Start time of the note
     * @returns {Array} Array of automation events for Tone.js
     */
    static generateToneAutomationFromMIDI(toneModulations, noteStartTime) {
        if (!toneModulations || !Array.isArray(toneModulations)) {
            return [];
        }
        
        return toneModulations.map(mod => ({
            target: mod.toneTarget,
            value: mod.toneValue,
            time: noteStartTime + (typeof mod.time === 'string' ? 
                this._parseTimeString(mod.time) : mod.time),
            frequency: mod.toneFrequency // For LFO-based modulations
        }));
    }

    /**
     * Apply MIDI modulations to a Tone.js synth instance
     * @param {Object} synth - Tone.js synth instance
     * @param {Array} automationEvents - Automation events to apply
     */
    static applyMIDIModulationsToTone(synth, automationEvents) {
        if (!automationEvents || !Array.isArray(automationEvents)) {
            return;
        }
        
        automationEvents.forEach(event => {
            try {
                const target = this._getNestedProperty(synth, event.target);
                if (target && typeof target.setValueAtTime === 'function') {
                    target.setValueAtTime(event.value, event.time);
                } else if (target && typeof target.set === 'function') {
                    // For some parameters that use set() instead of setValueAtTime()
                    target.set(event.value);
                } else {
                    console.warn(`Unable to apply automation to ${event.target} on synth`);
                }
            } catch (error) {
                console.warn(`Error applying automation to ${event.target}:`, error);
            }
        });
    }

    /**
     * Get nested property from object using dot notation
     * @param {Object} obj - Object to search
     * @param {string} path - Dot notation path (e.g., "filter.frequency")
     * @returns {*} Property value or undefined
     */
    static _getNestedProperty(obj, path) {
        if (!obj || !path) return undefined;
        
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : undefined;
        }, obj);
    }

    /**
     * Generate Tone.js code from JMON modulations (for debugging/export)
     * @param {Object} composition - JMON composition
     * @returns {string} Generated Tone.js code
     */
    static generateToneJSModulationCode(composition) {
        let code = '// Generated Tone.js code from JMON\n';
        code += 'const synths = {};\n';
        code += 'const effects = {};\n\n';
        
        // Generate synth creation code
        if (composition.audioGraph) {
            composition.audioGraph.forEach(node => {
                if (node.type !== 'Destination') {
                    code += `synths.${node.id} = new Tone.${node.type}(${JSON.stringify(node.options || {})});\n`;
                }
            });
        }
        
        code += '\n// Audio connections\n';
        if (composition.connections) {
            composition.connections.forEach(([source, target]) => {
                if (target === 'master') {
                    code += `synths.${source}.toDestination();\n`;
                } else {
                    code += `synths.${source}.connect(synths.${target});\n`;
                }
            });
        }
        
        code += '\n// Note scheduling and modulations\n';
        if (composition.sequences) {
            composition.sequences.forEach((seq, seqIndex) => {
                code += `// Sequence: ${seq.label}\n`;
                seq.notes.forEach((note, noteIndex) => {
                    const synthRef = seq.synthRef || 'defaultSynth';
                    code += `synths.${synthRef}.triggerAttackRelease("${note.note}", "${note.duration}", ${note.time}, ${note.velocity || 0.8});\n`;
                    
                    if (note.modulations) {
                        note.modulations.forEach(mod => {
                            code += `// ${mod.type} modulation: ${mod.controller || 'N/A'} = ${mod.value}\n`;
                        });
                    }
                });
                code += '\n';
            });
        }
        
        return code;
    }

    /**
     * Validate JMON composition with detailed error reporting
     * @param {Object} composition - JMON composition to validate
     * @param {boolean} strict - Whether to use strict validation
     * @returns {Object} Detailed validation result
     */
    static validateDetailed(composition, strict = false) {
        const result = this.validate(composition);
        const details = {
            ...result,
            details: {
                audioGraph: { valid: true, nodes: 0, issues: [] },
                sequences: { valid: true, count: 0, issues: [] },
                connections: { valid: true, count: 0, issues: [] },
                modulations: { valid: true, count: 0, issues: [] }
            }
        };
        
        // Detailed audioGraph validation
        if (composition.audioGraph) {
            details.details.audioGraph.nodes = composition.audioGraph.length;
            composition.audioGraph.forEach((node, index) => {
                if (!node.id) {
                    details.details.audioGraph.issues.push(`Node ${index}: Missing ID`);
                    details.details.audioGraph.valid = false;
                }
                if (!node.type) {
                    details.details.audioGraph.issues.push(`Node ${index}: Missing type`);
                    details.details.audioGraph.valid = false;
                }
            });
        }
        
        // Detailed sequences validation
        if (composition.sequences) {
            details.details.sequences.count = composition.sequences.length;
            composition.sequences.forEach((seq, seqIndex) => {
                if (!seq.notes || !Array.isArray(seq.notes)) {
                    details.details.sequences.issues.push(`Sequence ${seqIndex}: Missing notes array`);
                    details.details.sequences.valid = false;
                } else {
                    seq.notes.forEach((note, noteIndex) => {
                        if (note.modulations) {
                            details.details.modulations.count += note.modulations.length;
                            note.modulations.forEach((mod, modIndex) => {
                                if (mod.type === 'cc' && mod.controller === undefined) {
                                    details.details.modulations.issues.push(
                                        `Seq ${seqIndex}, Note ${noteIndex}, Mod ${modIndex}: CC missing controller`
                                    );
                                    details.details.modulations.valid = false;
                                }
                            });
                        }
                    });
                }
            });
        }
        
        // Detailed connections validation
        if (composition.connections) {
            details.details.connections.count = composition.connections.length;
            composition.connections.forEach((conn, index) => {
                if (!Array.isArray(conn) || conn.length !== 2) {
                    details.details.connections.issues.push(`Connection ${index}: Invalid format`);
                    details.details.connections.valid = false;
                }
            });
        }
        
        return details;
    }

    /**
     * Parse musical time string to seconds (public method)
     * @param {string} timeString - Musical time notation (e.g., "1:2:0", "4n", "2m")
     * @param {number} bpm - Beats per minute for conversion
     * @returns {number} Time in seconds
     */
    static parseTimeString(timeString, bpm = 120) {
        return this._parseTimeString(timeString, bpm);
    }

    /**
     * Parse musical time string to seconds (helper function)
     * @param {string} timeString - Musical time notation (e.g., "1:2:0", "4n", "2m")
     * @param {number} bpm - Beats per minute for conversion
     * @returns {number} Time in seconds
     */
    static _parseTimeString(timeString, bpm = 120) {
        if (typeof timeString === 'number') {
            return timeString;
        }
        
        if (typeof timeString !== 'string') {
            console.warn(`Invalid time string: ${timeString}, defaulting to 0`);
            return 0;
        }

        try {
            // Handle note values (4n, 8n, 1m, etc.)
            if (timeString.match(/^\d+[nmhqwst]$/)) {
                const noteValue = timeString.slice(0, -1);
                const noteType = timeString.slice(-1);
                
                const beatLength = 60 / bpm; // seconds per beat
                
                switch (noteType) {
                    case 'n': // note (quarter note = 1 beat)
                        return beatLength * (4 / parseInt(noteValue));
                    case 'm': // measure (4 beats)
                        return beatLength * 4 * parseInt(noteValue);
                    case 'h': // half note
                        return beatLength * 2 * parseInt(noteValue);
                    case 'q': // quarter note
                        return beatLength * parseInt(noteValue);
                    case 'w': // whole note
                        return beatLength * 4 * parseInt(noteValue);
                    case 't': // triplet
                        return beatLength * (4 / parseInt(noteValue)) * (2/3);
                    case 's': // sixteenth
                        return beatLength * (1/4) * parseInt(noteValue);
                    default:
                        return beatLength;
                }
            }
            
            // Enhanced bars:beats:ticks format (e.g., "2:1:240")
            if (timeString.includes(':')) {
                const parts = timeString.split(':').map(p => parseFloat(p));
                const bars = parts[0] || 0;
                const beats = parts[1] || 0;
                const ticks = parts[2] || 0;
                
                const beatLength = 60 / bpm; // seconds per beat
                const barLength = beatLength * 4; // Assuming 4/4 time
                const tickLength = beatLength / 480; // Standard MIDI ticks per quarter note
                
                return bars * barLength + beats * beatLength + ticks * tickLength;
            }
            
            // Try parsing as a number
            const parsed = parseFloat(timeString);
            if (!isNaN(parsed)) {
                return parsed;
            }
            
            console.warn(`Unable to parse time string: ${timeString}, defaulting to 0`);
            return 0;
            
        } catch (error) {
            console.warn(`Error parsing time string ${timeString}:`, error);
            return 0;
        }
    }

    /**
     * Generate example compositions demonstrating different modulation types
     * @returns {Object} Examples object with different modulation demos
     */
    static generateModulationExamples() {
        return {
            // Example 1: Vibrato modulation
            vibratoDemo: {
                format: "jmonTone",
                version: "1.0",
                bpm: 120,
                audioGraph: [
                    { id: "master", type: "Destination", options: {} }
                ],
                connections: [],
                synthConfig: { type: "Synth", modulationTarget: "vibrato" },
                sequences: [{
                    label: "Vibrato Demo",
                    notes: [{
                        note: "C4",
                        time: 0,
                        duration: 3,
                        velocity: 0.8,
                        modulations: [
                            { type: "cc", controller: 1, value: 0, time: 0 },    // No vibrato
                            { type: "cc", controller: 1, value: 127, time: 2 }   // Full vibrato
                        ]
                    }]
                }]
            },

            // Example 2: Filter sweep
            filterDemo: {
                format: "jmonTone",
                version: "1.0",
                bpm: 120,
                audioGraph: [
                    { id: "master", type: "Destination", options: {} }
                ],
                connections: [],
                synthConfig: { type: "Synth", modulationTarget: "filter" },
                sequences: [{
                    label: "Filter Demo",
                    notes: [{
                        note: "G3",
                        time: 0,
                        duration: 4,
                        velocity: 0.8,
                        modulations: [
                            { type: "cc", controller: 1, value: 0, time: 0 },    // Low filter
                            { type: "cc", controller: 1, value: 127, time: 3 }   // High filter
                        ]
                    }]
                }]
            },

            // Example 3: Pitch bend + modulation wheel
            combinedDemo: {
                format: "jmonTone",
                version: "1.0",
                bpm: 120,
                audioGraph: [
                    { id: "master", type: "Destination", options: {} }
                ],
                connections: [],
                synthConfig: { type: "Synth", modulationTarget: "filter" },
                sequences: [{
                    label: "Combined Demo",
                    notes: [
                        {
                            note: "C4",
                            time: 0,
                            duration: 2,
                            velocity: 0.8,
                            modulations: [
                                { type: "pitchBend", value: -4096, time: 0 },  // Start low
                                { type: "pitchBend", value: 4096, time: 1.5 }  // End high
                            ]
                        },
                        {
                            note: "G4", 
                            time: 2,
                            duration: 2,
                            velocity: 0.8,
                            modulations: [
                                { type: "cc", controller: 1, value: 0, time: 0 },    // Start closed
                                { type: "cc", controller: 1, value: 127, time: 1.5 } // End open
                            ]
                        }
                    ]
                }]
            }
        };
    }

    /**
     * Map raw MIDI modulations and converter hints to Tone.js parameters
     * @param {Array} modulations - Raw modulations array from JMON
     * @param {Object} synthConfig - JMON synthConfig or converterHints.tone
     * @param {Object} hints - Optional hints from converterHints.tone
     * @returns {Object} toneModulations with toneTarget and toneValue
     */
    static mapMIDIModulationToTone(modulations, synthConfig = {}, hints = {}) {
        return modulations.reduce((acc, mod) => {
            const mapped = { ...mod };
            
            if (mod.type === 'pitchBend') {
                // Standard pitch bend range: ±2 semitones (±8192 = ±2 semitones)
                const semitones = (mod.value / 8192) * 2;
                mapped.toneTarget = 'detune';
                mapped.toneValue = semitones * 100; // Convert to cents
            } else if (mod.type === 'cc') {
                const ccKey = `cc${mod.controller}`;
                const hint = hints[ccKey];
                
                switch (mod.controller) {
                    case 1: // Modulation Wheel
                        const target = hint?.target || synthConfig.modulationTarget || 'filter';
                        mapped.toneTarget = target;
                        const norm = mod.value / 127;
                        
                        switch (target) {
                            case 'vibrato':
                                mapped.toneValue = norm * (hint?.depthRange?.[1] || 50); // cents
                                mapped.toneFrequency = hint?.frequency || 6; // Hz
                                break;
                            case 'tremolo':
                                mapped.toneValue = norm * (hint?.depthRange?.[1] || 0.8); // depth
                                mapped.toneFrequency = hint?.frequency || 4; // Hz
                                break;
                            case 'glissando':
                                mapped.toneValue = (norm - 0.5) * (hint?.depthRange?.[1] || 200) * 2; // cents
                                break;
                            case 'filter':
                                const minF = hint?.depthRange?.[0] || 200;
                                const maxF = hint?.depthRange?.[1] || 4000;
                                mapped.toneValue = minF * Math.pow(maxF / minF, norm);
                                break;
                            default:
                                // Check if target is an effect node ID
                                if (hint?.parameter && hint?.depthRange) {
                                    const minVal = hint.depthRange[0] || 0;
                                    const maxVal = hint.depthRange[1] || 1;
                                    mapped.toneValue = minVal + norm * (maxVal - minVal);
                                    mapped.toneParameter = hint.parameter;
                                } else {
                                    console.warn(`CC${mod.controller} requires depthRange and parameter in hints for target: ${hint?.target}`);
                                    mapped.toneValue = norm; // Default normalized value
                                }
                        }
                        break;
                        
                    case 7: // Volume
                        mapped.toneTarget = 'volume';
                        mapped.toneValue = -40 + (mod.value / 127) * 40; // -40dB to 0dB
                        break;
                        
                    case 11: // Expression
                        mapped.toneTarget = hint?.target || 'volume';
                        mapped.toneValue = -20 + (mod.value / 127) * 20; // -20dB to 0dB
                        break;
                        
                    case 64: // Sustain Pedal
                        mapped.toneTarget = 'sustain';
                        mapped.toneValue = mod.value >= 64 ? 1 : 0; // On/Off
                        break;
                        
                    case 71: // Resonance/Harmonic Content
                        mapped.toneTarget = 'filter.Q';
                        mapped.toneValue = 0.1 + (mod.value / 127) * 29.9; // 0.1 to 30
                        break;
                        
                    case 72: // Release Time
                        mapped.toneTarget = 'envelope.release';
                        mapped.toneValue = 0.001 + (mod.value / 127) * 3.999; // 1ms to 4s
                        break;
                        
                    case 73: // Attack Time
                        mapped.toneTarget = 'envelope.attack';
                        mapped.toneValue = 0.001 + (mod.value / 127) * 1.999; // 1ms to 2s
                        break;
                        
                    case 74: // Cutoff Frequency
                        mapped.toneTarget = 'filter.frequency';
                        const minCutoff = hint?.depthRange?.[0] || 20;
                        const maxCutoff = hint?.depthRange?.[1] || 20000;
                        mapped.toneValue = minCutoff * Math.pow(maxCutoff / minCutoff, mod.value / 127);
                        break;
                        
                    default:
                        // Generic CC mapping based on hints
                        if (hint) {
                            mapped.toneTarget = hint.target || 'volume';
                            const norm = mod.value / 127;
                            if (hint.depthRange) {
                                const [min, max] = hint.depthRange;
                                mapped.toneValue = min + norm * (max - min);
                            } else {
                                mapped.toneValue = norm;
                            }
                        } else {
                            // Fallback: map to volume with warning
                            console.warn(`Unmapped CC${mod.controller}, defaulting to volume control`);
                            mapped.toneTarget = 'volume';
                            mapped.toneValue = -20 + (mod.value / 127) * 20;
                        }
                }
            } else if (mod.type === 'aftertouch') {
                // Channel pressure aftertouch
                mapped.toneTarget = hint?.target || 'filter.frequency';
                const norm = mod.value / 127;
                if (mapped.toneTarget === 'filter.frequency') {
                    const minF = hint?.depthRange?.[0] || 200;
                    const maxF = hint?.depthRange?.[1] || 2000;
                    mapped.toneValue = minF + norm * (maxF - minF);
                } else {
                    mapped.toneValue = norm;
                }
            }
            
            acc.push(mapped);
            return acc;
        }, []);
    }

    /**
     * Play a JMON composition using Tone.js, applying converterHints for modulation.
     * @param {Object} composition - JMON composition with synthConfig and converterHints (or any compatible format)
     */
    static async playComposition(composition) {
        // Smart normalize: convert various formats to jmon
        const normalizedComposition = this.normalize(composition);
        await Tone.start();
        console.log(`Tone.js started successfully, context state: ${Tone.context.state}`);
        
        const { synthConfig = {}, converterHints = {} } = normalizedComposition;
        const toneHints = converterHints.tone || {};
        
        // Create a map of synths based on audioGraph nodes
        const synthMap = new Map();
        
        // Process audioGraph to create individual synths
        for (const node of normalizedComposition.audioGraph || []) {
            if (node.type === 'Sampler' && node.options?.urls) {
                console.log(`Creating Sampler: ${node.id}`);
                
                // Merge envelope settings from multiple sources with priority:
                // 1. node.options.envelope (highest)
                // 2. synthConfig.options.envelope (medium) 
                // 3. default values (lowest)
                const defaultEnvelope = {
                    attack: 0.01,
                    decay: 0.1,
                    sustain: 0.8,
                    release: 0.3
                };
                
                const globalEnvelope = synthConfig?.options?.envelope || {};
                const nodeEnvelope = node.options?.envelope || {};
                
                const finalEnvelope = {
                    ...defaultEnvelope,
                    ...globalEnvelope,
                    ...nodeEnvelope
                };
                
                // Create Sampler with proper envelope configuration
                const samplerOptions = {
                    ...node.options,
                    attack: finalEnvelope.attack,
                    release: finalEnvelope.release
                };
                
                // Remove envelope from options to avoid conflicts
                delete samplerOptions.envelope;
                
                try {
                    const sampler = new Tone.Sampler(samplerOptions);
                    
                    // Apply envelope settings if Sampler supports them
                    if (sampler.envelope) {
                        Object.assign(sampler.envelope, {
                            attack: finalEnvelope.attack,
                            decay: finalEnvelope.decay,
                            sustain: finalEnvelope.sustain,
                            release: finalEnvelope.release
                        });
                        console.log(`Applied envelope to Sampler ${node.id}:`, finalEnvelope);
                    }
                    
                    synthMap.set(node.id, sampler);
                    console.log(`Created Sampler ${node.id} with envelope settings`);
                    
                    // Wait for samples to load with timeout
                    await new Promise((resolve, reject) => {
                        let attempts = 0;
                        const maxAttempts = 100; // 10 seconds timeout
                        
                        const checkLoaded = () => {
                            attempts++;
                            if (sampler.loaded) {
                                console.log(`✅ Sampler ${node.id} loaded successfully`);
                                resolve();
                            } else if (attempts >= maxAttempts) {
                                console.warn(`⚠️  Sampler ${node.id} loading timeout, continuing anyway`);
                                resolve(); // Continue execution even if not fully loaded
                            } else {
                                setTimeout(checkLoaded, 100);
                            }
                        };
                        checkLoaded();
                    });
                    
                } catch (error) {
                    console.error(`Failed to create Sampler ${node.id}:`, error);
                    // Create a fallback basic synth
                    const fallbackSynth = new Tone.Synth().toDestination();
                    synthMap.set(node.id, fallbackSynth);
                    console.log(`Created fallback Synth for ${node.id}`);
                }
            } else if (node.type !== 'Destination' && !this.isEffectNode(node.type)) {
                // Handle other synth types (exclude effects)
                try {
                    let synth;
                    const synthOptions = node.options || {};
                    
                    switch (node.type) {
                        case 'Synth':
                            synth = new Tone.Synth(synthOptions);
                            break;
                        case 'PolySynth':
                            synth = new Tone.PolySynth(synthOptions);
                            break;
                        case 'MonoSynth':
                            synth = new Tone.MonoSynth(synthOptions);
                            break;
                        case 'AMSynth':
                            synth = new Tone.AMSynth(synthOptions);
                            break;
                        case 'FMSynth':
                            synth = new Tone.FMSynth(synthOptions);
                            break;
                        case 'DuoSynth':
                            synth = new Tone.DuoSynth(synthOptions);
                            break;
                        case 'PluckSynth':
                            synth = new Tone.PluckSynth(synthOptions);
                            break;
                        case 'NoiseSynth':
                            synth = new Tone.NoiseSynth(synthOptions);
                            break;
                        default:
                            console.warn(`Unknown synth type: ${node.type}, using basic Synth`);
                            synth = new Tone.Synth(synthOptions);
                    }
                    
                    synthMap.set(node.id, synth);
                    console.log(`Created ${node.type}: ${node.id}`);
                    
                } catch (error) {
                    console.error(`Failed to create ${node.type} ${node.id}:`, error);
                    // Fallback to basic synth
                    const fallbackSynth = new Tone.Synth();
                    synthMap.set(node.id, fallbackSynth);
                    console.log(`Created fallback Synth for ${node.id}`);
                }
            }
        }
        
        // Create effects from audioGraph
        const effectsMap = new Map();
        
        for (const node of normalizedComposition.audioGraph || []) {
            if (this.isEffectNode(node.type)) {
                console.log(`Creating effect: ${node.id} (${node.type})`);
                const effect = this.createEffect(node.type, node.options || {});
                if (effect) {
                    effectsMap.set(node.id, effect);
                    console.log(`Effect ${node.id} created successfully`);
                }
            }
        }
        

        
        // Handle connections from audioGraph
        const allNodes = new Map();
        
        // Add synths to nodes map
        synthMap.forEach((synth, nodeId) => {
            allNodes.set(nodeId, synth);
        });
        
        // Add effects to nodes map
        effectsMap.forEach((effect, nodeId) => {
            allNodes.set(nodeId, effect);
        });
        
        // Add destination
        allNodes.set('master', Tone.getDestination());
        
        // Process connections from audioGraph
        if (normalizedComposition.connections && normalizedComposition.connections.length > 0) {
            console.log(`Processing ${normalizedComposition.connections.length} audio connections`);
            
            normalizedComposition.connections.forEach((connection, index) => {
                if (!Array.isArray(connection) || connection.length !== 2) {
                    console.warn(`Invalid connection ${index}: ${JSON.stringify(connection)}`);
                    return;
                }
                
                const [sourceId, targetId] = connection;
                const sourceNode = allNodes.get(sourceId);
                const targetNode = allNodes.get(targetId);
                
                if (!sourceNode) {
                    console.warn(`Source node not found: ${sourceId}`);
                    return;
                }
                
                if (!targetNode) {
                    console.warn(`Target node not found: ${targetId}`);
                    return;
                }
                
                try {
                    sourceNode.connect(targetNode);
                    console.log(`Connected: ${sourceId} → ${targetId}`);
                } catch (error) {
                    console.error(`Failed to connect ${sourceId} → ${targetId}:`, error);
                }
            });
        } else {
            // Require connections to be defined in audioGraph
            console.error('No connections defined in audioGraph. All synths must be connected to effects or destination.');
            throw new Error('Missing audio graph connections. Please define connections in the audioGraph.');
        }
        
        const now = Tone.now();
        
        // Loop through sequences and notes
        normalizedComposition.sequences.forEach(seq => {
            // Get the synth for this sequence
            const synth = synthMap.get(seq.synthRef);
            
            if (!synth) {
                console.error(`Synth not found for synthRef: ${seq.synthRef}`);
                return;
            }
            
            seq.notes.forEach((note, index) => {
                const t0 = now + note.time;
                
                // Calculate natural release time based on note duration
                // Release should take a portion of the note duration for natural fade
                const releasePercentage = 0.3; // Release takes 30% of note duration
                const naturalRelease = note.duration * releasePercentage;
                
                // Set the sampler's release time for this note (if supported)
                if (synth.release !== undefined && typeof synth.release !== 'function') {
                    synth.release = naturalRelease;
                }
                
                console.log(`Natural envelope: Note ${note.note} duration=${note.duration.toFixed(2)}s, release=${naturalRelease.toFixed(2)}s`);
                
                // Use triggerAttackRelease for cleaner note handling
                try {
                    if (synth.triggerAttackRelease) {
                        synth.triggerAttackRelease(note.note, note.duration, t0, note.velocity);
                    } else {
                        // Fallback for synths that don't support triggerAttackRelease
                        synth.triggerAttack(note.note, t0, note.velocity);
                        if (synth.triggerRelease) {
                            synth.triggerRelease(note.note, t0 + note.duration);
                        }
                    }
                } catch (error) {
                    console.warn(`Error triggering note ${note.note}:`, error);
                }
                

                
                // Handle modulations only if the note was successfully triggered
                if (note.modulations && Array.isArray(note.modulations)) {
                    // Pitch Bend - handle all pitch bend events sequentially
                    const bends = note.modulations.filter(m => m.type === 'pitchBend');
                    const isSamplerType = synth.constructor.name === 'Sampler' || synth._buffer !== undefined;
                    
                    if (bends.length > 0 && isSamplerType) {
                        console.warn(`⚠️  Pitch bend with Samplers uses playbackRate, which affects both pitch AND playback speed. For true pitch bending without timing changes, use oscillator-based synths.`);
                    }
                    
                    bends.forEach((bend, idx) => {
                        try {
                            const cents = (bend.value / 8192) * 1200;
                            const bendTime = t0 + (typeof bend.time === 'string' ? 
                                this._parseTimeString(bend.time, normalizedComposition.bpm || 120) : bend.time);
                            
                            console.log(`Pitch bend ${idx}: value=${bend.value}, cents=${cents.toFixed(1)}, time=${bend.time}`);
                            
                            // For Samplers, use playbackRate to achieve pitch bending
                            if (synth.playbackRate) {
                                const playbackRateMultiplier = Math.pow(2, cents / 1200);
                                if (idx === 0) {
                                    synth.playbackRate.setValueAtTime(playbackRateMultiplier, bendTime);
                                } else {
                                    synth.playbackRate.exponentialRampToValueAtTime(playbackRateMultiplier, bendTime);
                                }
                            } else if (synth.frequency) {
                                // Fallback for regular synths
                                const baseFreq = Tone.Frequency(note.note).toFrequency();
                                const bendedFreq = baseFreq * Math.pow(2, cents / 1200);
                                if (idx === 0) {
                                    synth.frequency.setValueAtTime(bendedFreq, bendTime);
                                } else {
                                    synth.frequency.exponentialRampToValueAtTime(bendedFreq, bendTime);
                                }
                            }
                        } catch (error) {
                            console.warn(`Error applying pitch bend:`, error);
                        }
                    });
                    
                    // Reset pitch at note end if there were any bends
                    if (bends.length > 0) {
                        try {
                            if (synth.playbackRate) {
                                synth.playbackRate.exponentialRampToValueAtTime(1, t0 + note.duration);
                            } else if (synth.frequency) {
                                const baseFreq = Tone.Frequency(note.note).toFrequency();
                                synth.frequency.exponentialRampToValueAtTime(baseFreq, t0 + note.duration);
                            }
                        } catch (error) {
                            console.warn(`Error resetting pitch:`, error);
                        }
                    }
                }
                // CC variations
                const ccMods = (note.modulations || []).filter(m => m.type === 'cc');
                if (ccMods.length > 0) {
                    console.log(`🎛️  Processing ${ccMods.length} CC modulation(s) for note ${note.note}`);
                }
                ccMods.forEach((mod, i, arr) => {
                        const tm = now + mod.time;
                        const hint = toneHints[`cc${mod.controller}`] || {};
                        const norm = mod.value / 127;
                        const isSamplerType = synth.constructor.name === 'Sampler' || synth._buffer !== undefined;
                        
                        // If hint.target refers to an effect node ID, handle it directly
                        if (hint.target && effectsMap.has(hint.target)) {
                            const effectNode = effectsMap.get(hint.target);
                            const parameter = hint.parameter || 'frequency'; // default parameter
                            const [minVal, maxVal] = hint.depthRange || [0, 1];
                            const value = minVal + (maxVal - minVal) * norm;
                            
                            if (effectNode[parameter] && typeof effectNode[parameter].setValueAtTime === 'function') {
                                effectNode[parameter].setValueAtTime(value, tm);
                                console.log(`🎛️  CC${mod.controller} -> ${hint.target}.${parameter} = ${value.toFixed(3)} at ${tm.toFixed(2)}s`);
                                
                                // Handle ramping to next value of same type
                                const nextMod = arr[i + 1];
                                if (nextMod && nextMod.controller === mod.controller) {
                                    const nextHint = toneHints[`cc${nextMod.controller}`] || {};
                                    if (nextHint.target === hint.target && nextHint.parameter === parameter) {
                                        const nextNorm = nextMod.value / 127;
                                        const nextValue = minVal + (maxVal - minVal) * nextNorm;
                                        const nextTime = now + nextMod.time;
                                        effectNode[parameter].linearRampToValueAtTime(nextValue, nextTime);
                                        console.log(`🎛️  CC${mod.controller} ramping to ${nextValue.toFixed(3)} at ${nextTime.toFixed(2)}s`);
                                    }
                                }
                            } else {
                                console.warn(`⚠️  Effect ${hint.target}.${parameter} parameter not found or not controllable`);
                            }
                            return; // Skip the legacy switch statement
                        }
                        
                        switch (hint.target) {
                            case 'vibrato': {
                                if (isSamplerType) {
                                    // For Samplers, create vibrato using playbackRate modulation
                                    // Convert cents to playbackRate ratio (cents/1200 = semitones, 2^(semitones/12) = ratio)
                                    const [minCents = -50, maxCents = 50] = hint.depthRange || [-50, 50];
                                    const minRatio = Math.pow(2, minCents / 1200);
                                    const maxRatio = Math.pow(2, maxCents / 1200);
                                    const currentRatio = minRatio + (maxRatio - minRatio) * norm;
                                    const lfoFreq = hint.frequency || 6;
                                    
                                    // Create LFO that oscillates around the current ratio
                                    const depth = (maxRatio - minRatio) / 2;
                                    const center = (minRatio + maxRatio) / 2;
                                    const lfo = new Tone.LFO(lfoFreq, center - depth, center + depth);
                                    if (synth.playbackRate) {
                                        lfo.connect(synth.playbackRate);
                                        lfo.start(tm);
                                        lfo.stop(t0 + note.duration);
                                        console.log(`Sampler vibrato applied: freq=${lfoFreq}Hz, cents range=${minCents}-${maxCents}, playbackRate=${center.toFixed(3)}±${depth.toFixed(3)}`);
                                    }
                                } else {
                                    // For regular synths, apply vibrato via LFO to detune
                                    const [mn = -50, mx = 50] = hint.depthRange || [-50, 50];
                                    const lfo = new Tone.LFO(hint.frequency || 6, mn, mx);
                                    if (synth.detune) {
                                        lfo.connect(synth.detune);
                                        lfo.start(tm);
                                        lfo.stop(t0 + note.duration);
                                        console.log(`Vibrato applied: freq=${hint.frequency || 6}Hz, depth=${mn}-${mx}cents`);
                                    }
                                }
                                break;
                            }
                            case 'tremolo': {
                                console.warn(`⚠️  Legacy 'tremolo' target is deprecated. Use specific effect node IDs instead (e.g., 'tremoloEffect').`);
                                break;
                            }
                            case 'filter': {
                                console.warn(`⚠️  Legacy 'filter' target is deprecated. Use specific effect node IDs instead (e.g., 'filterEffect').`);
                                break;
                            }
                            default: {
                                // Fallback: if no specific target is defined, default to volume control
                                if (!hint.target) {
                                    console.warn(`CC${mod.controller} has no target defined in converterHints, defaulting to volume control`);
                                    // Apply volume modulation to synth
                                    if (synth.volume) {
                                        const dbValue = -20 + (norm * 20); // -20dB to 0dB range
                                        synth.volume.setValueAtTime(dbValue, tm);
                                        console.log(`🔊 Volume set to ${dbValue.toFixed(1)}dB`);
                                    }
                                } else {
                                    console.warn(`⚠️  Unknown modulation target: ${hint.target}`);
                                }
                                break;
                            }
                        }
                    });
            });
        });
    }

    /**
     * Check if a node type is an effect
     * @param {string} type - Node type
     * @returns {boolean} True if it's an effect
     */
    static isEffectNode(type) {
        const effectTypes = [
            'Filter', 'AutoFilter', 'Reverb', 'FeedbackDelay', 'PingPongDelay', 'Delay',
            'Chorus', 'Phaser', 'Tremolo', 'AutoWah', 'Distortion', 'Chebyshev', 
            'BitCrusher', 'Compressor', 'Limiter', 'Gate', 'FrequencyShifter', 
            'PitchShift', 'JCReverb', 'Freeverb', 'StereoWidener', 'MidSideCompressor'
        ];
        return effectTypes.includes(type);
    }

    /**
     * Create an effect node based on type and options
     * @param {string} type - Effect type
     * @param {Object} options - Effect options
     * @returns {Object} Tone.js effect instance
     */
    static createEffect(type, options = {}) {
        try {
            switch (type) {
                case 'Reverb':
                    return new Tone.Reverb({
                        decay: options.decay || 1.5,
                        preDelay: options.preDelay || 0.01,
                        wet: options.wet || 0.4
                    });
                
                case 'JCReverb':
                    return new Tone.JCReverb({
                        roomSize: options.roomSize || 0.5,
                        wet: options.wet || 0.3
                    });
                
                case 'Freeverb':
                    return new Tone.Freeverb({
                        roomSize: options.roomSize || 0.7,
                        dampening: options.dampening || 3000,
                        wet: options.wet || 0.3
                    });
                
                case 'Delay':
                    return new Tone.Delay({
                        delayTime: options.delayTime || 0.25,
                        maxDelay: options.maxDelay || 1
                    });
                
                case 'FeedbackDelay':
                    return new Tone.FeedbackDelay({
                        delayTime: options.delayTime || "8n",
                        feedback: options.feedback || 0.4,
                        wet: options.wet || 0.5
                    });
                
                case 'PingPongDelay':
                    return new Tone.PingPongDelay({
                        delayTime: options.delayTime || "4n",
                        feedback: options.feedback || 0.3,
                        wet: options.wet || 0.5
                    });
                
                case 'Chorus':
                    return new Tone.Chorus({
                        frequency: options.frequency || 1.5,
                        delayTime: options.delayTime || 3.5,
                        depth: options.depth || 0.7,
                        type: options.type || "sine",
                        spread: options.spread || 180,
                        wet: options.wet || 0.5
                    }).start();
                
                case 'Phaser':
                    return new Tone.Phaser({
                        frequency: options.frequency || 0.5,
                        octaves: options.octaves || 3,
                        stages: options.stages || 10,
                        Q: options.Q || 10,
                        baseFrequency: options.baseFrequency || 350,
                        wet: options.wet || 0.5
                    });
                
                case 'Tremolo':
                    return new Tone.Tremolo({
                        frequency: options.frequency || 4,
                        type: options.type || "sine",
                        depth: options.depth || 0.5,
                        spread: options.spread || 180,
                        wet: options.wet || 1
                    }).start();
                
                case 'Vibrato':
                    return new Tone.Vibrato({
                        frequency: options.frequency || 6,
                        type: options.type || "sine",
                        depth: options.depth || 0.1,
                        wet: options.wet || 1
                    });
                
                case 'AutoWah':
                    return new Tone.AutoWah({
                        baseFrequency: options.baseFrequency || 100,
                        octaves: options.octaves || 6,
                        sensitivity: options.sensitivity || 0,
                        Q: options.Q || 2,
                        gain: options.gain || 2,
                        follower: options.follower || {
                            attack: 0.3,
                            release: 0.5
                        },
                        wet: options.wet || 1
                    });
                
                case 'Distortion':
                    return new Tone.Distortion({
                        distortion: options.distortion || 0.4,
                        oversample: options.oversample || "4x",
                        wet: options.wet || 1
                    });
                
                case 'Chebyshev':
                    return new Tone.Chebyshev({
                        order: options.order || 50,
                        oversample: options.oversample || "4x",
                        wet: options.wet || 1
                    });
                
                case 'BitCrusher':
                    return new Tone.BitCrusher({
                        bits: options.bits || 4,
                        wet: options.wet || 1
                    });
                
                case 'Compressor':
                    return new Tone.Compressor({
                        threshold: options.threshold || -24,
                        ratio: options.ratio || 12,
                        attack: options.attack || 0.003,
                        release: options.release || 0.25,
                        knee: options.knee || 30
                    });
                
                case 'Limiter':
                    return new Tone.Limiter(options.threshold || -12);
                
                case 'Gate':
                    return new Tone.Gate({
                        threshold: options.threshold || -40,
                        attack: options.attack || 0.1,
                        release: options.release || 0.1
                    });
                
                case 'Filter':
                    return new Tone.Filter({
                        frequency: options.frequency || 350,
                        type: options.type || "lowpass",
                        rolloff: options.rolloff || -12,
                        Q: options.Q || 1
                    });
                
                case 'AutoFilter':
                    return new Tone.AutoFilter({
                        frequency: options.frequency || "8n",
                        type: options.type || "sine",
                        depth: options.depth || 1,
                        baseFrequency: options.baseFrequency || 200,
                        octaves: options.octaves || 2.6,
                        filter: {
                            type: options.filterType || "lowpass",
                            rolloff: options.rolloff || -12,
                            Q: options.Q || 1
                        },
                        wet: options.wet || 1
                    }).start();
                
                case 'FrequencyShifter':
                    return new Tone.FrequencyShifter({
                        frequency: options.frequency || 0,
                        wet: options.wet || 1
                    });
                
                case 'PitchShift':
                    return new Tone.PitchShift({
                        pitch: options.pitch || 0,
                        windowSize: options.windowSize || 0.1,
                        delayTime: options.delayTime || 0,
                        feedback: options.feedback || 0,
                        wet: options.wet || 1
                    });
                
                case 'StereoWidener':
                    return new Tone.StereoWidener({
                        width: options.width || 0.5
                    });
                
                case 'MidSideCompressor':
                    return new Tone.MidSideCompressor({
                        mid: {
                            threshold: options.midThreshold || -24,
                            ratio: options.midRatio || 3
                        },
                        side: {
                            threshold: options.sideThreshold || -30,
                            ratio: options.sideRatio || 6
                        }
                    });
                
                default:
                    console.warn(`Unknown effect type: ${type}`);
                    return null;
            }
        } catch (error) {
            console.error(`Error creating effect ${type}:`, error);
            return null;
        }
    }

    // ...existing code...
}

// Export for Node.js (CommonJS)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = jmonTone;
}

// Export for browsers (global) - avoid redeclaration
if (typeof window !== 'undefined') {
    window.jmonTone = window.jmonTone || jmonTone;
}

})(typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : this);
