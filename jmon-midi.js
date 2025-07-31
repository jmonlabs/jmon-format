/**
 * jmon-to-midi.js - Convert jmon format to MIDI using Tone.js Midi
 * 
 * Converts jmon compositions to MIDI format using Tone.js's Midi library.
 * Supports multi-track sequences, modulations, tempo changes, and time signatures.
 */

(function(global) {
    'use strict';
    
    // Check if already loaded
    if (global.JmonToMidi) {
        return;
    }

class JmonToMidi {
    /**
     * Convert a jmon composition to MIDI format
     * @param {Object} composition - jmon composition object
    /**
     * Convert a jmon composition to MIDI format
     * @param {Object} composition - jmon composition object or any compatible format
     * @returns {Object} Tone.js Midi object
     */
    static convertToMidi(composition) {
        // Check dependencies
        if (typeof Tone === 'undefined' || !Tone.Midi) {
            throw new Error('Tone.js with MIDI support is required. Make sure to include Tone.js.');
        }
        
        if (typeof jmonTone === 'undefined') {
            throw new Error('jmonTone library is required. Make sure jmon-tone.js is loaded.');
        }
        
        // Smart normalize: convert various formats to jmon
        const normalizedComposition = jmonTone.normalize(composition);
        
        // Validate normalized jmon composition
        if (!jmonTone.validate(normalizedComposition).success) {
            throw new Error('Invalid jmon composition');
        }

        // Create new MIDI object
        let midi;
        try {
            midi = new Tone.Midi();
        } catch (error) {
            console.error('Failed to create Tone.Midi object:', error);
            throw new Error('Tone.Midi is not available. Make sure Tone.js is loaded.');
        }
        
        // Initialize header properties - different Tone.js versions may vary
        if (!midi.header) {
            midi.header = {};
        }
        
        // Ensure required header arrays exist
        if (!midi.header.tempos) {
            midi.header.tempos = [];
        }
        if (!midi.header.timeSignatures) {
            midi.header.timeSignatures = [];
        }
        if (!midi.header.keySignatures) {
            midi.header.keySignatures = [];
        }
        
        // For newer Tone.js versions, we might need to use different properties
        // Store tempo/timing info separately if header doesn't work
        if (!midi.header || typeof midi.header !== 'object') {
            console.warn('Tone.Midi.header not available, using alternative approach');
            midi._jmonHeader = {
                tempos: [],
                timeSignatures: [],
                keySignatures: []
            };
        }
        
        // Helper function to safely access header
        const getHeader = (midi) => {
            return midi.header || midi._jmonHeader;
        };
        
        // Helper function to parse time strings (replaces private _parseTimeString)
        const parseTime = (timeStr, bpm) => {
            if (typeof timeStr === 'number') return timeStr;
            if (typeof timeStr !== 'string') return 0;
            
            // Try to use jmonTone's public method if available
            if (jmonTone.parseTimeString) {
                return jmonTone.parseTimeString(timeStr, bpm);
            }
            
            // Enhanced bars:beats:ticks format support (e.g., "2:1:240")
            if (timeStr.includes(':')) {
                const parts = timeStr.split(':').map(parseFloat);
                const bars = parts[0] || 0;
                const beats = parts[1] || 0;
                const ticks = parts[2] || 0;
                
                const beatValue = 60 / bpm; // seconds per beat
                const beatsPerBar = 4; // Assume 4/4 for simplicity
                const ticksPerBeat = 480; // Standard MIDI ticks per quarter note
                
                return bars * beatsPerBar * beatValue + 
                       beats * beatValue + 
                       ticks * (beatValue / ticksPerBeat);
            }
            
            // Handle Tone.js note values and triplets
            if (timeStr.match(/^\d+[nthqm]$/)) {
                const noteValue = parseInt(timeStr);
                const noteType = timeStr.slice(-1);
                const beatValue = 60 / bpm;
                
                switch (noteType) {
                    case 'n': return beatValue * (4 / noteValue); // note values
                    case 't': return beatValue * (4 / noteValue) * (2/3); // triplets
                    case 'h': return beatValue * 2; // half note
                    case 'q': return beatValue; // quarter note
                    case 'm': return beatValue * 4 * noteValue; // measures
                    default: return beatValue;
                }
            }
            
            return parseFloat(timeStr) || 0;
        };
        
        // Helper function to convert note names to MIDI note numbers
        const noteNameToMidi = (noteName) => {
            if (typeof noteName === 'number') return noteName;
            
            // Try jmonTone method first if available
            if (jmonTone.noteNameToMidiNote) {
                try {
                    return jmonTone.noteNameToMidiNote(noteName);
                } catch (e) {
                    // Fall through to manual conversion
                }
            }
            
            // Manual conversion for basic note names
            const noteMap = {
                'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4,
                'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9,
                'A#': 10, 'Bb': 10, 'B': 11
            };
            
            const match = noteName.match(/^([A-G][#b]?)(\d+)$/);
            if (match) {
                const [, note, octave] = match;
                const noteValue = noteMap[note];
                if (noteValue !== undefined) {
                    return noteValue + (parseInt(octave) + 1) * 12;
                }
            }
            
            console.warn('Could not convert note name to MIDI:', noteName);
            return 60; // Default to middle C
        };
        
        // Set basic properties
        const header = getHeader(midi);
        header.tempos = [{
            time: 0,
            bpm: normalizedComposition.bpm || 120
        }];

        // Add tempo map if present
        if (normalizedComposition.tempoMap && normalizedComposition.tempoMap.length > 0) {
            normalizedComposition.tempoMap.forEach(tempoChange => {
                const time = parseTime(tempoChange.time, normalizedComposition.bpm || 120);
                
                header.tempos.push({
                    time: time,
                    bpm: tempoChange.bpm
                });
            });
        }

        // Add time signatures
        if (normalizedComposition.timeSignature) {
            const [numerator, denominator] = normalizedComposition.timeSignature.split('/').map(Number);
            getHeader(midi).timeSignatures = [{
                time: 0,
                timeSignature: [numerator, denominator]
            }];
        }

        // Add time signature map if present
        if (normalizedComposition.timeSignatureMap && normalizedComposition.timeSignatureMap.length > 0) {
            normalizedComposition.timeSignatureMap.forEach(timeSigChange => {
                const time = parseTime(timeSigChange.time, normalizedComposition.bpm || 120);
                
                const [numerator, denominator] = timeSigChange.timeSignature.split('/').map(Number);
                
                getHeader(midi).timeSignatures.push({
                    time: time,
                    timeSignature: [numerator, denominator]
                });
            });
        }

        // Add key signature if present
        if (normalizedComposition.keySignature) {
            getHeader(midi).keySignatures = [{
                time: 0,
                key: normalizedComposition.keySignature
            }];
        }

        // Add key signature map if present
        if (normalizedComposition.keySignatureMap && normalizedComposition.keySignatureMap.length > 0) {
            normalizedComposition.keySignatureMap.forEach(keyChange => {
                const time = parseTime(keyChange.time, normalizedComposition.bpm || 120);
                
                getHeader(midi).keySignatures.push({
                    time: time,
                    key: keyChange.keySignature
                });
            });
        }

        // Convert sequences to MIDI tracks
        normalizedComposition.sequences.forEach((sequence, index) => {
            // In Tone.js, we need to add tracks to the tracks array
            if (!midi.tracks) {
                midi.tracks = [];
            }
            
            // Create a new track object
            const track = {
                name: sequence.label || `Track ${index + 1}`,
                notes: [],
                controlChanges: {},
                pitchBends: [],
                channel: sequence.midiChannel || 0
            };
            
            midi.tracks.push(track);
            
            // Set default MIDI channel
            const defaultChannel = sequence.midiChannel || 
                                 normalizedComposition.converterHints?.midi?.channel || 0;
            
            // Add instrument/program change if synth type is specified
            if (sequence.synth && sequence.synth.type) {
                const programNumber = JmonToMidi.synthTypeToMidiProgram(sequence.synth.type);
                
                // Initialize controlChanges array for this controller if needed
                if (!track.controlChanges[0]) {
                    track.controlChanges[0] = [];
                }
                
                track.controlChanges[0].push({
                    time: 0,
                    value: 0 // Bank Select MSB
                });
                
                // Add program change (for now, we'll store this as a note property)
                track.programChange = {
                    time: 0,
                    number: programNumber,
                    channel: defaultChannel
                };
            }

            // Convert notes
            sequence.notes.forEach(note => {
                const startTime = parseTime(note.time, normalizedComposition.bpm || 120);
                const duration = parseTime(note.duration, normalizedComposition.bpm || 120);

                const velocity = note.velocity ? Math.round(note.velocity * 127) : 100;
                const channel = note.channel !== undefined ? note.channel : defaultChannel;

                // Handle single notes, chords, and MIDI note numbers
                const notes = Array.isArray(note.note) ? note.note : [note.note];
                
                notes.forEach(n => {
                    let midiNote;
                    if (typeof n === 'number') {
                        midiNote = n;
                    } else if (typeof n === 'string') {
                        midiNote = noteNameToMidi(n);
                    } else {
                        console.warn('Invalid note type:', n);
                        return;
                    }

                    // Apply microtuning if present
                    if (note.microtuning) {
                        // MIDI doesn't support microtuning directly, but we can add pitch bend
                        const pitchBendValue = Math.round((note.microtuning / 2) * 8192); // ±2 semitones range
                        track.pitchBends.push({
                            time: startTime,
                            value: pitchBendValue,
                            channel: channel
                        });
                    }

                    // Add the note
                    track.notes.push({
                        midi: midiNote,
                        time: startTime,
                        duration: duration,
                        velocity: velocity,
                        channel: channel
                    });

                    // Reset pitch bend after note if microtuning was applied
                    if (note.microtuning) {
                        track.pitchBends.push({
                            time: startTime + duration,
                            value: 0,
                            channel: channel
                        });
                    }
                });

                // Add modulation events
                if (note.modulations && Array.isArray(note.modulations)) {
                    note.modulations.forEach(mod => {
                        const modTime = startTime + parseTime(mod.time, normalizedComposition.bpm || 120);

                        switch (mod.type) {
                            case 'cc':
                                if (!track.controlChanges[mod.controller]) {
                                    track.controlChanges[mod.controller] = [];
                                }
                                track.controlChanges[mod.controller].push({
                                    time: modTime,
                                    value: mod.value,
                                    channel: channel
                                });
                                break;
                            
                            case 'pitchBend':
                                track.pitchBends.push({
                                    time: modTime,
                                    value: mod.value,
                                    channel: channel
                                });
                                break;
                            
                            case 'aftertouch':
                                // Store aftertouch events (MIDI doesn't have a standard way in Tone.js)
                                if (!track.aftertouch) {
                                    track.aftertouch = [];
                                }
                                track.aftertouch.push({
                                    time: modTime,
                                    value: mod.value,
                                    channel: channel
                                });
                                break;
                        }
                    });
                }
            });
        });

        // Add global automation events as MIDI CC
        if (normalizedComposition.automation) {
            // Handle new automation format with channels and anchor points
            if (normalizedComposition.automation.global && Array.isArray(normalizedComposition.automation.global)) {
                normalizedComposition.automation.global.forEach(channel => {
                    if (channel.anchorPoints && Array.isArray(channel.anchorPoints)) {
                        channel.anchorPoints.forEach(point => {
                            const time = parseTime(point.time, normalizedComposition.bpm || 120);
                            
                            // Parse automation target to determine MIDI message type
                            if (channel.target.startsWith('midi.cc')) {
                                const ccNumber = parseInt(channel.target.replace('midi.cc', ''));
                                if (!isNaN(ccNumber) && ccNumber >= 0 && ccNumber <= 127) {
                                    const track = midi.tracks[0];
                                    if (track) {
                                        if (!track.controlChanges[ccNumber]) {
                                            track.controlChanges[ccNumber] = [];
                                        }
                                        // Map value from automation range to MIDI range (0-127)
                                        const [minRange, maxRange] = channel.range || [0, 127];
                                        const midiValue = Math.round((point.value - minRange) / (maxRange - minRange) * 127);
                                        track.controlChanges[ccNumber].push({
                                            time: time,
                                            value: Math.max(0, Math.min(127, midiValue)),
                                            channel: 0
                                        });
                                    }
                                }
                            } else if (channel.target === 'midi.pitchBend') {
                                const track = midi.tracks[0];
                                if (track) {
                                    track.pitchBends.push({
                                        time: time,
                                        value: Math.round(point.value),
                                        channel: 0
                                    });
                                }
                            }
                        });
                    }
                });
            }
            
            // Handle legacy automation format for backwards compatibility
            if (normalizedComposition.automation.events && Array.isArray(normalizedComposition.automation.events)) {
                normalizedComposition.automation.events.forEach(auto => {
                    const time = parseTime(auto.time, normalizedComposition.bpm || 120);

                    if (auto.target.startsWith('midi.cc')) {
                        const ccNumber = parseInt(auto.target.replace('midi.cc', ''));
                        if (!isNaN(ccNumber) && ccNumber >= 0 && ccNumber <= 127) {
                            const track = midi.tracks[0];
                            if (track) {
                                if (!track.controlChanges[ccNumber]) {
                                    track.controlChanges[ccNumber] = [];
                                }
                                track.controlChanges[ccNumber].push({
                                    time: time,
                                    value: Math.round(auto.value),
                                    channel: 0
                                });
                            }
                        }
                    }
                });
            }
        }

        // Add text events from annotations
        if (normalizedComposition.annotations && normalizedComposition.annotations.length > 0) {
            normalizedComposition.annotations.forEach(annotation => {
                const time = parseTime(annotation.time, normalizedComposition.bpm || 120);

                // Add to first track
                const track = midi.tracks[0];
                
                if (track) {
                    // Initialize text events array if needed
                    if (!track.textEvents) {
                        track.textEvents = [];
                    }
                    
                    switch (annotation.type) {
                        case 'lyric':
                            track.textEvents.push({
                                time: time,
                                text: annotation.text,
                                type: 'lyric'
                            });
                            break;
                        
                        case 'marker':
                        case 'rehearsal':
                            track.textEvents.push({
                                time: time,
                                text: annotation.text,
                                type: 'marker'
                            });
                            break;
                        
                        case 'comment':
                        default:
                            track.textEvents.push({
                                time: time,
                                text: annotation.text,
                                type: 'text'
                            });
                            break;
                    }
                }
            });
        }

        // Add metadata
        if (normalizedComposition.metadata) {
            const track = midi.tracks[0];
            
            if (track) {
                if (!track.textEvents) {
                    track.textEvents = [];
                }
                
                if (normalizedComposition.metadata.name) {
                    track.textEvents.push({
                        time: 0,
                        text: `Title: ${normalizedComposition.metadata.name}`,
                        type: 'text'
                    });
                }
                
                if (normalizedComposition.metadata.author) {
                    track.textEvents.push({
                        time: 0,
                        text: `Composer: ${normalizedComposition.metadata.author}`,
                        type: 'text'
                    });
                }
                
                if (normalizedComposition.metadata.description) {
                    track.textEvents.push({
                        time: 0,
                        text: `Description: ${normalizedComposition.metadata.description}`,
                        type: 'text'
                    });
                }
            }
        }

        return midi;
    }

    /**
     * Map jmon synth types to MIDI program numbers
     * @param {string} synthType - jmon synth type
     * @returns {number} MIDI program number (0-127)
     */
    static synthTypeToMidiProgram(synthType) {
        const mapping = {
            'Synth': 80,           // Lead 1 (square)
            'PolySynth': 88,       // New Age
            'MonoSynth': 81,       // Lead 2 (sawtooth)
            'AMSynth': 82,         // Lead 3 (calliope)
            'FMSynth': 83,         // Lead 4 (chiff)
            'DuoSynth': 84,        // Lead 5 (charang)
            'PluckSynth': 24,      // Acoustic Guitar (nylon)
            'NoiseSynth': 120,     // Reverse Cymbal
            'Sampler': 0           // Acoustic Grand Piano (default)
        };
        
        return mapping[synthType] || 0;
    }

    /**
     * Export MIDI as base64 string
     * @param {Object} midi - Tone.js Midi object
     * @returns {string} Base64 encoded MIDI data
     */
    static exportMidiAsBase64(midi) {
        const arrayBuffer = midi.toArray();
        const uint8Array = new Uint8Array(arrayBuffer);
        const binaryString = Array.from(uint8Array).map(byte => String.fromCharCode(byte)).join('');
        return btoa(binaryString);
    }

    /**
     * Export MIDI object as downloadable file
     * @param {Object} midi - Tone.js Midi object
     * @param {string} filename - Filename for download
     */
    static exportMidiAsFile(midi, filename = 'composition.mid') {
        try {
            let arrayBuffer;
            
            console.log('🎵 Exporting MIDI file:', filename);
            
            // Check for various export methods in Tone.js
            let exportMethodWorked = false;
            
            if (midi.toMidi && typeof midi.toMidi === 'function') {
                console.log('✅ Trying midi.toMidi() method');
                const midiData = midi.toMidi();
                console.log('📊 midi.toMidi() returned:', typeof midiData, midiData);
                
                // Handle different return types from toMidi()
                if (midiData instanceof Uint8Array) {
                    arrayBuffer = midiData;
                    exportMethodWorked = true;
                } else if (midiData instanceof ArrayBuffer) {
                    arrayBuffer = new Uint8Array(midiData);
                    exportMethodWorked = true;
                } else if (Array.isArray(midiData)) {
                    arrayBuffer = new Uint8Array(midiData);
                    exportMethodWorked = true;
                } else if (typeof midiData === 'string' && midiData.length > 0) {
                    // If it's a base64 string, decode it
                    try {
                        const binaryString = atob(midiData);
                        arrayBuffer = new Uint8Array(binaryString.length);
                        for (let i = 0; i < binaryString.length; i++) {
                            arrayBuffer[i] = binaryString.charCodeAt(i);
                        }
                        exportMethodWorked = true;
                    } catch (e) {
                        console.warn('⚠️ Could not decode MIDI data string');
                    }
                } else if (midiData && typeof midiData === 'object') {
                    // If it's an object, it might have a data property or be a different structure
                    console.log('🔍 MIDI data object structure:', Object.keys(midiData));
                    if (midiData.data instanceof Uint8Array) {
                        arrayBuffer = midiData.data;
                        exportMethodWorked = true;
                    } else if (midiData.buffer instanceof ArrayBuffer) {
                        arrayBuffer = new Uint8Array(midiData.buffer);
                        exportMethodWorked = true;
                    }
                }
                
                if (!exportMethodWorked) {
                    console.warn('⚠️ midi.toMidi() returned unusable data, trying other methods');
                }
            }
            
            if (!exportMethodWorked && midi.toArray && typeof midi.toArray === 'function') {
                console.log('✅ Trying midi.toArray() method');
                try {
                    arrayBuffer = midi.toArray();
                    exportMethodWorked = true;
                } catch (e) {
                    console.warn('⚠️ midi.toArray() failed');
                }
            }
            
            if (!exportMethodWorked && midi.toUint8Array && typeof midi.toUint8Array === 'function') {
                console.log('✅ Trying midi.toUint8Array() method');
                try {
                    arrayBuffer = midi.toUint8Array();
                    exportMethodWorked = true;
                } catch (e) {
                    console.warn('⚠️ midi.toUint8Array() failed');
                }
            }
            
            if (!exportMethodWorked && midi.toBytes && typeof midi.toBytes === 'function') {
                console.log('✅ Trying midi.toBytes() method');
                try {
                    arrayBuffer = midi.toBytes();
                    exportMethodWorked = true;
                } catch (e) {
                    console.warn('⚠️ midi.toBytes() failed');
                }
            }
            
            if (!exportMethodWorked && midi.data && midi.data instanceof Uint8Array) {
                console.log('✅ Using midi.data property');
                arrayBuffer = midi.data.slice(); // Make a copy
                exportMethodWorked = true;
            }
            
            if (!exportMethodWorked && midi.toArrayBuffer && typeof midi.toArrayBuffer === 'function') {
                console.log('✅ Trying midi.toArrayBuffer() method');
                try {
                    arrayBuffer = new Uint8Array(midi.toArrayBuffer());
                    exportMethodWorked = true;
                } catch (e) {
                    console.warn('⚠️ midi.toArrayBuffer() failed');
                }
            }
            
            if (!exportMethodWorked) {
                // Last resort: Create MIDI file manually from tracks
                console.warn('⚠️ No working export methods found, creating MIDI file manually from tracks');
                console.log('📊 MIDI object has', midi.tracks?.length || 0, 'tracks');
                
                if (midi.tracks && midi.tracks.length > 0) {
                    arrayBuffer = this.createMidiFromTracks(midi);
                } else {
                    throw new Error('No MIDI tracks available and no export methods working');
                }
            }
            
            // Ensure we have a proper Uint8Array
            if (!(arrayBuffer instanceof Uint8Array)) {
                if (Array.isArray(arrayBuffer)) {
                    arrayBuffer = new Uint8Array(arrayBuffer);
                } else if (arrayBuffer instanceof ArrayBuffer) {
                    arrayBuffer = new Uint8Array(arrayBuffer);
                } else {
                    throw new Error('Could not convert MIDI data to proper format');
                }
            }
            
            console.log(`📁 MIDI data prepared: ${arrayBuffer.length} bytes`);
            
            const blob = new Blob([arrayBuffer], { type: 'audio/midi' });
            
            // Create download link
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            console.log(`✅ MIDI file "${filename}" downloaded successfully`);
            
        } catch (error) {
            console.error('❌ MIDI export error:', error);
            throw new Error(`Failed to export MIDI: ${error.message}`);
        }
    }
    
    /**
     * Create a basic MIDI file manually as fallback
     * @param {Object} midi - Tone.js Midi object
     * @returns {Uint8Array} Basic MIDI file data
     */
    static createBasicMidiFile(midi) {
        // This is a very basic MIDI file creation
        // Header chunk: "MThd" + length(6) + format(1) + tracks(1) + division(480)
        const header = [
            0x4D, 0x54, 0x68, 0x64, // "MThd"
            0x00, 0x00, 0x00, 0x06, // chunk length
            0x00, 0x01, // format 1
            0x00, 0x01, // number of tracks
            0x01, 0xE0  // division (480 ticks per quarter note)
        ];
        
        // Simple track with just end of track
        const track = [
            0x4D, 0x54, 0x72, 0x6B, // "MTrk"
            0x00, 0x00, 0x00, 0x04, // track length (4 bytes)
            0x00, 0xFF, 0x2F, 0x00  // end of track
        ];
        
        return new Uint8Array([...header, ...track]);
    }

    /**
     * Create MIDI file from tracks (more advanced fallback)
     * @param {Object} midi - Tone.js Midi object with tracks
     * @returns {Uint8Array} MIDI file data
     */
    static createMidiFromTracks(midi) {
        console.log('🔧 Creating MIDI file manually from tracks:', midi.tracks.length);
        
        // Basic MIDI file structure
        const tracks = midi.tracks || [];
        const header = midi.header || {};
        const ticksPerQuarter = header.ticksPerQuarter || 480;
        const bpm = (header.tempos && header.tempos[0]) ? header.tempos[0].bpm : 120;
        
        console.log('📊 MIDI parameters: bpm=', bpm, 'ticksPerQuarter=', ticksPerQuarter);
        
        // Create MIDI header chunk
        const headerData = new Uint8Array([
            // MThd chunk
            0x4D, 0x54, 0x68, 0x64, // "MThd"
            0x00, 0x00, 0x00, 0x06, // Header length (6 bytes)
            0x00, 0x01,             // Format 1 (multi-track)
            ...this.numberToBytes(tracks.length, 2), // Number of tracks
            ...this.numberToBytes(ticksPerQuarter, 2) // Ticks per quarter note
        ]);
        
        // Create track chunks
        const trackChunks = [];
        
        for (let i = 0; i < tracks.length; i++) {
            const track = tracks[i];
            console.log(`🎵 Processing track ${i} with ${track.notes?.length || 0} notes`);
            
            const trackEvents = [];
            
            // Add tempo event at the beginning of first track
            if (i === 0) {
                const microsecondsPerQuarter = Math.round(60000000 / bpm);
                trackEvents.push(
                    0x00, // Delta time
                    0xFF, 0x51, 0x03, // Tempo meta event
                    ...this.numberToBytes(microsecondsPerQuarter, 3)
                );
            }
            
            // Process notes
            let lastTime = 0;
            for (const note of track.notes || []) {
                const startTime = Math.round((note.time || 0) * ticksPerQuarter);
                const duration = Math.round((note.duration || 0.5) * ticksPerQuarter);
                const deltaTime = startTime - lastTime;
                const velocity = Math.round((note.velocity || 0.8) * 127);
                
                // Convert note name to MIDI number
                let midiNote = note.midi || this.noteNameToMidiNumber(note.name || note.note || 'C4');
                
                // Note On event
                trackEvents.push(
                    ...this.encodeVariableLength(deltaTime),
                    0x90 | (track.channel || 0), // Note on, channel 0
                    midiNote,
                    velocity
                );
                
                // Note Off event
                trackEvents.push(
                    ...this.encodeVariableLength(duration),
                    0x80 | (track.channel || 0), // Note off, channel 0
                    midiNote,
                    0x00
                );
                
                lastTime = startTime + duration;
            }
            
            // End of track
            trackEvents.push(0x00, 0xFF, 0x2F, 0x00);
            
            // Create track chunk
            const trackData = new Uint8Array(trackEvents);
            const trackChunk = new Uint8Array([
                // MTrk chunk
                0x4D, 0x54, 0x72, 0x6B, // "MTrk"
                ...this.numberToBytes(trackData.length, 4), // Track length
                ...trackData
            ]);
            
            trackChunks.push(trackChunk);
        }
        
        // Combine header and tracks
        const totalLength = headerData.length + trackChunks.reduce((sum, chunk) => sum + chunk.length, 0);
        const midiFile = new Uint8Array(totalLength);
        
        let offset = 0;
        midiFile.set(headerData, offset);
        offset += headerData.length;
        
        for (const chunk of trackChunks) {
            midiFile.set(chunk, offset);
            offset += chunk.length;
        }
        
        console.log(`✅ Created MIDI file: ${midiFile.length} bytes`);
        return midiFile;
    }
    
    /**
     * Convert number to bytes (big-endian)
     */
    static numberToBytes(num, bytes) {
        const result = [];
        for (let i = bytes - 1; i >= 0; i--) {
            result.push((num >>> (i * 8)) & 0xFF);
        }
        return result;
    }
    
    /**
     * Encode variable length quantity (MIDI standard)
     */
    static encodeVariableLength(value) {
        if (value < 0x80) return [value];
        
        const bytes = [];
        bytes.unshift(value & 0x7F);
        value >>>= 7;
        
        while (value > 0) {
            bytes.unshift((value & 0x7F) | 0x80);
            value >>>= 7;
        }
        
        return bytes;
    }
    
    /**
     * Convert note name to MIDI number
     */
    static noteNameToMidiNumber(noteName) {
        if (typeof noteName === 'number') return noteName;
        
        const noteMap = {
            'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4,
            'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9,
            'A#': 10, 'Bb': 10, 'B': 11
        };
        
        const match = noteName.match(/^([A-G][#b]?)(\d+)$/);
        if (match) {
            const [, note, octave] = match;
            const noteValue = noteMap[note];
            if (noteValue !== undefined) {
                return noteValue + (parseInt(octave) + 1) * 12;
            }
        }
        
        console.warn('Could not convert note name to MIDI:', noteName);
        return 60; // Default to middle C
    }

    /**
     * Convert jmon composition to MIDI and download
     * @param {Object} composition - jmon composition
     * @param {string} filename - Optional filename
     */
    static convertAndDownload(composition, filename) {
        try {
            const midi = this.convertToMidi(composition);
            const downloadName = filename || `${composition.metadata?.name || 'composition'}.mid`;
            this.exportMidiAsFile(midi, downloadName);
            console.log(`✅ MIDI file "${downloadName}" exported successfully`);
        } catch (error) {
            console.error('❌ Error converting to MIDI:', error);
            throw error;
        }
    }

    /**
     * Analyze jmon composition and provide MIDI conversion report
     * @param {Object} composition - jmon composition
     * @returns {Object} Analysis report
     */
    static analyzeForMidi(composition) {
        const report = {
            tracks: composition.sequences?.length || 0,
            totalNotes: 0,
            modulationEvents: 0,
            automationEvents: composition.automation?.length || 0,
            annotations: composition.annotations?.length || 0,
            tempoChanges: composition.tempoMap?.length || 0,
            keyChanges: composition.keySignatureMap?.length || 0,
            timeSignatureChanges: composition.timeSignatureMap?.length || 0,
            warnings: []
        };

        if (composition.sequences) {
            composition.sequences.forEach((seq, index) => {
                report.totalNotes += seq.notes?.length || 0;
                
                seq.notes?.forEach(note => {
                    if (note.modulations) {
                        report.modulationEvents += note.modulations.length;
                    }
                });

                // Check for features that don't translate well to MIDI
                if (seq.effects && seq.effects.length > 0) {
                    report.warnings.push(`Track ${index + 1} (${seq.label}): Effects will be lost in MIDI conversion`);
                }
            });
        }

        if (composition.audioGraph && composition.audioGraph.length > 1) {
            report.warnings.push('Audio graph routing will be lost in MIDI conversion');
        }

        return report;
    }

    /**
     * Test MIDI conversion functionality
     * @returns {Object} Test results with success status and any errors
     */
    static testMidiConversion() {
        const results = {
            success: false,
            errors: [],
            warnings: []
        };

        try {
            // Check dependencies
            if (typeof Tone === 'undefined') {
                results.errors.push('Tone.js is not loaded');
                return results;
            }

            if (!Tone.Midi) {
                results.errors.push('Tone.Midi is not available - make sure you have the full Tone.js library');
                return results;
            }

            if (typeof jmonTone === 'undefined') {
                results.errors.push('jmonTone library is not loaded');
                return results;
            }

            // Test basic MIDI object creation
            let testMidi;
            try {
                testMidi = new Tone.Midi();
                if (!testMidi) {
                    results.errors.push('Failed to create Tone.Midi object');
                    return results;
                }
            } catch (error) {
                results.errors.push(`Error creating Tone.Midi: ${error.message}`);
                return results;
            }

            // Test header access
            if (!testMidi.header && !testMidi._jmonHeader) {
                results.warnings.push('Tone.Midi.header not available, will use fallback');
            }

            // Test basic composition conversion
            const testComposition = {
                format: "jmonTone",
                version: "1.0",
                bpm: 120,
                audioGraph: [
                    { id: "synth", type: "Synth", options: {} },
                    { id: "master", type: "Destination", options: {} }
                ],
                connections: [["synth", "master"]],
                sequences: [{
                    label: "Test",
                    synthRef: "synth",
                    notes: [{ note: "C4", time: 0, duration: 1, velocity: 0.8 }]
                }]
            };

            const convertedMidi = this.convertToMidi(testComposition);
            if (!convertedMidi) {
                results.errors.push('Failed to convert test composition');
                return results;
            }

            results.success = true;
            results.message = 'MIDI conversion is working correctly';

        } catch (error) {
            results.errors.push(`Test failed: ${error.message}`);
        }

        return results;
    }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = JmonToMidi;
}

// Export for browsers (global) - avoid redeclaration
if (typeof window !== 'undefined') {
    window.JmonToMidi = window.JmonToMidi || JmonToMidi;
}

})(typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : this);