/**
 * jmonTone (Tone Object Notation EXtended) 1.0 - Core Library
 * 
 * A JavaScript library for parsing, validating, and manipulating
 * musical compositions in the jmonTone specification.
 * 
 * Originally designed for Tone.js but extensible to other audio frameworks.
 */

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
     * Validate a jmonTone composition object
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
        } else if (typeof composition.bpm !== 'number' || composition.bpm < 60 || composition.bpm > 240) {
            warnings.push("BPM should be between 60-240 for typical musical compositions");
        }

        if (!composition.sequences || !Array.isArray(composition.sequences)) {
            errors.push("Missing or invalid sequences array");
        } else {
            // Validate each sequence
            composition.sequences.forEach((seq, index) => {
                if (!seq.label) {
                    errors.push(`Sequence ${index}: Missing required field: label`);
                }
                if (!seq.instrument && !seq.synth) {
                    errors.push(`Sequence ${index}: Missing instrument definition`);
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
                    });
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
                loopEndTime = jmonTone._parseTimeString(sequence.loop);
            } else if (sequence.loop === true) {
                // Calculate from notes
                const lastNoteTime = Math.max(...sequence.notes.map(n => {
                    const noteTime = typeof n.time === 'string' ? jmonTone._parseTimeString(n.time) : n.time;
                    const noteDuration = typeof n.duration === 'string' ? jmonTone._parseTimeString(n.duration) : n.duration;
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
                        jmonTone._parseTimeString(originalNote.time) : originalNote.time;
                    
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
                sequenceDuration = jmonTone._parseTimeString(seq.loop);
            } else {
                // Calculate from notes
                seq.notes.forEach(note => {
                    const noteTime = typeof note.time === 'string' ? 
                        jmonTone._parseTimeString(note.time) : note.time;
                    const noteDuration = typeof note.duration === 'string' ? 
                        jmonTone._parseTimeString(note.duration) : note.duration;
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
                const loopTime = jmonTone._parseTimeString(seq.loop);
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
            globalEffects: this.convertGlobalEffects(jsonData.globalEffects),
            sequences: jsonData.sequences.map(seq => {
                const convertedSynth = this.convertSynthFormat(seq.synth);
                
                return {
                    label: seq.label || "Untitled Track",
                    group: seq.group || "default",
                    loop: seq.loop || false,
                    synth: convertedSynth,
                    effects: this.processEffectsChain(convertedSynth.effects),
                    notes: seq.notes.map(note => this.convertNoteFormat(note))
                };
            })
        };

        console.log('✅ jmonTone: Enhanced conversion complete');
        console.log(`   - ${toneFormat.sequences.length} sequences processed`);
        console.log(`   - ${Object.keys(toneFormat.globalEffects || {}).length} global effects`);
        
        return toneFormat;
    }

    /**
     * Convert synth configuration to Tone.js format
     * @param {Object} synthConfig - Synth configuration from JSON
     * @returns {Object} Tone.js compatible synth config
     */
    static convertSynthFormat(synthConfig) {
        if (!synthConfig) {
            return { type: 'Synth' };
        }

        const converted = {
            type: synthConfig.type || 'Synth'
        };

        // Handle different synth types with their specific properties
        switch (synthConfig.type) {
            case 'PolySynth':
                if (synthConfig.voice) converted.voice = synthConfig.voice;
                if (synthConfig.polyphony) converted.polyphony = synthConfig.polyphony;
                break;
            
            case 'AMSynth':
                if (synthConfig.modulation) converted.modulation = synthConfig.modulation;
                if (synthConfig.modulationEnvelope) converted.modulationEnvelope = synthConfig.modulationEnvelope;
                break;
            
            case 'DuoSynth':
                if (synthConfig.voice0) converted.voice0 = synthConfig.voice0;
                if (synthConfig.voice1) converted.voice1 = synthConfig.voice1;
                if (synthConfig.harmonicity) converted.harmonicity = synthConfig.harmonicity;
                if (synthConfig.vibratoAmount) converted.vibratoAmount = synthConfig.vibratoAmount;
                if (synthConfig.vibratoRate) converted.vibratoRate = synthConfig.vibratoRate;
                break;
            
            case 'NoiseSynth':
                if (synthConfig.noise) converted.noise = synthConfig.noise;
                break;
        }

        // Common properties for all synths
        if (synthConfig.oscillator) converted.oscillator = synthConfig.oscillator;
        if (synthConfig.envelope) converted.envelope = synthConfig.envelope;
        if (synthConfig.filter) converted.filter = synthConfig.filter;
        if (synthConfig.filterEnvelope) converted.filterEnvelope = synthConfig.filterEnvelope;
        
        // Store effects separately for processing
        if (synthConfig.effects) converted.effects = synthConfig.effects;

        console.log(`🎛️ jmonTone: Converted ${synthConfig.type} synth with ${synthConfig.effects?.length || 0} effects`);
        return converted;
    }

    /**
     * Convert note format to ensure compatibility
     * @param {Object} note - Note object from JSON
     * @returns {Object} Tone.js compatible note
     */
    static convertNoteFormat(note) {
        return {
            note: this.processNoteInput(note.note),
            time: note.time || 0,
            start: note.start || note.time || 0, // Ensure both time and start exist
            duration: note.duration || '4n',
            velocity: note.velocity || 0.8
        };
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
     * Process effects chain for a synth
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
            delete processed.type; // Remove type from parameters
            return {
                effectType: effect.type,
                parameters: processed
            };
        });
    }

    // Private helper methods

    static _convertSynthToInstrument(synth) {
        if (synth.type === 'Sampler') {
            return {
                type: 'sampler',
                samples: synth.urls || {},
                baseUrl: synth.baseUrl || '',
                sampleProcessing: synth.sampleManipulation || {}
            };
        } else if (synth.type === 'Custom') {
            return {
                type: 'synthesizer',
                engine: 'custom',
                parameters: {
                    oscillator: synth.oscillator || {},
                    envelope: synth.envelope || {}
                }
            };
        } else {
            return {
                type: 'synthesizer',
                engine: synth.type?.toLowerCase() || 'synth',
                parameters: synth
            };
        }
    }

    static _convertInstrumentToSynth(instrument) {
        if (instrument.type === 'sampler') {
            return {
                type: 'Sampler',
                urls: instrument.samples || {},
                baseUrl: instrument.baseUrl || '',
                sampleManipulation: instrument.sampleProcessing || {}
            };
        } else if (instrument.type === 'synthesizer') {
            if (instrument.engine === 'custom') {
                return {
                    type: 'Custom',
                    ...instrument.parameters
                };
            } else {
                return {
                    type: instrument.engine || 'Synth',
                    ...instrument.parameters
                };
            }
        } else {
            return { type: 'Synth' };
        }
    }

    static _parseTimeString(timeStr) {
        // Simple parser for basic time formats
        // This would need to be more sophisticated for full jmonTone support
        if (typeof timeStr === 'number') return timeStr;
        
        // Handle bar:beat format (simplified)
        if (timeStr.includes(':')) {
            const parts = timeStr.split(':');
            const bars = parseInt(parts[0]) || 0;
            const beats = parseInt(parts[1]) || 0;
            // Assume 4/4 time, 120 BPM for simplification
            return bars * 2.0 + beats * 0.5;
        }
        
        return 0;
    }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = jmonTone;
} else if (typeof window !== 'undefined') {
    window.jmonTone = jmonTone;
}
