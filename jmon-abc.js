/**
 * jmon-to-abc.js - Convert jmon format to ABC notation
 * 
 * Converts jmon compositions to ABC score format for traditional music notation.
 * Supports multi-voice scores, ornamentations, and dynamic markings.
 */

(function(global) {
    'use strict';
    
    // Check if already loaded
    if (global.JmonToAbc) {
        return;
    }

class JmonToAbc {
    /**
     * Helper function to parse time strings with fallback
     * @param {string|number} timeString - time value
     * @param {number} bpm - beats per minute
     * @returns {number} parsed time in seconds
     */
    static parseTimeString(timeString, bpm) {
        if (typeof timeString === 'number') return timeString;
        if (typeof timeString !== 'string') return 0;
        
        try {
            // Try to use jmonTone method if available
            if (jmonTone && jmonTone._parseTimeString) {
                return jmonTone._parseTimeString(timeString, bpm);
            }
        } catch (e) {
            // Fallback parsing
        }
        
        // Simple fallback for common time formats
        if (timeString.includes(':')) {
            const parts = timeString.split(':').map(Number);
            return parts[0] + (parts[1] || 0) / 4; // Simple bars:beats conversion
        }
        
        return parseFloat(timeString) || 0;
    }

    /**
     * Convert a jmon composition to ABC notation
     * @param {Object} composition - jmon composition object
     * @returns {string} ABC notation string
     */
    static convertToAbc(composition) {
        // Validate jmon composition
        if (!jmonTone.validate(composition).success) {
            throw new Error('Invalid jmon composition');
        }

        let abc = '';
        // ABC Header
        abc += this.generateAbcHeader(composition);

        // Multi-voice: ajouter %%score et déclarations V: dans l'en-tête
        if (composition.sequences && composition.sequences.length > 1) {
            // Déclaration des voix
            composition.sequences.forEach((sequence, index) => {
                abc += `V:${index + 1} name=\"${sequence.label || `Voice ${index + 1}`}\"\n`;
            });
            // Ligne %%score
            const scoreLine = '%%score ' + composition.sequences.map((_, i) => `V:${i+1}`).join(' ');
            abc += scoreLine + '\n';
        }

        // Génération des voix/tracks
        if (composition.sequences && composition.sequences.length > 0) {
            if (composition.sequences.length > 1) {
                abc += this.generateMultiVoiceAbc(composition);
            } else {
                abc += this.generateSingleVoiceAbc(composition.sequences[0], composition);
            }
        }
        return abc;
    }

    /**
     * Generate ABC header section
     * @param {Object} composition - jmon composition
     * @returns {string} ABC header
     */
    static generateAbcHeader(composition) {
        let header = '';
        
        // Index number (required)
        header += 'X:1\n';
        
        // Title
        const title = composition.metadata?.name || 'Untitled';
        header += `T:${title}\n`;
        
        // Composer
        if (composition.metadata?.author) {
            header += `C:${composition.metadata.author}\n`;
        }
        
        // Additional metadata BEFORE the key signature
        if (composition.metadata?.description) {
            header += `N:${composition.metadata.description}\n`;
        }
        
        // Source info
        header += 'S:Generated from jmon format\n';
        
        // Meter (time signature)
        const timeSignature = composition.timeSignature || '4/4';
        header += `M:${timeSignature}\n`;
        
        // Default note length (usually 1/4 for quarter notes)
        header += 'L:1/4\n';
        
        // Tempo
        const bpm = composition.bpm || 120;
        header += `Q:1/4=${bpm}\n`;
        
        // Key signature (MUST be last in header)
        const keySignature = composition.keySignature || 'C';
        header += `K:${this.convertKeySignature(keySignature)}\n`;
        
        return header;
    }

    /**
     * Convert jmon key signature to ABC key signature
     * @param {string} keySignature - jmon key signature (e.g., 'C', 'Am', 'F#')
     * @returns {string} ABC key signature
     */
    static convertKeySignature(keySignature) {
        // ABC notation key signatures
        const keyMap = {
            'C': 'C',
            'G': 'G',
            'D': 'D', 
            'A': 'A',
            'E': 'E',
            'B': 'B',
            'F#': 'F#',
            'C#': 'C#',
            'F': 'F',
            'Bb': 'Bb',
            'Eb': 'Eb',
            'Ab': 'Ab',
            'Db': 'Db',
            'Gb': 'Gb',
            'Cb': 'Cb',
            // Minor keys
            'Am': 'Am',
            'Em': 'Em',
            'Bm': 'Bm',
            'F#m': 'F#m',
            'C#m': 'C#m',
            'G#m': 'G#m',
            'D#m': 'D#m',
            'A#m': 'A#m',
            'Dm': 'Dm',
            'Gm': 'Gm',
            'Cm': 'Cm',
            'Fm': 'Fm',
            'Bbm': 'Bbm',
            'Ebm': 'Ebm',
            'Abm': 'Abm'
        };
        
        return keyMap[keySignature] || 'C';
    }

    /**
     * Generate single voice ABC notation
     * @param {Object} sequence - jmon sequence
     * @param {Object} composition - full composition for context
     * @returns {string} ABC notation
     */
    static generateSingleVoiceAbc(sequence, composition) {
        let abc = '';
        
        // Sort notes by time
        const sortedNotes = [...sequence.notes].sort((a, b) => {
            const timeA = this.parseTimeString(a.time, composition.bpm || 120);
            const timeB = this.parseTimeString(b.time, composition.bpm || 120);
            return timeA - timeB;
        });

        // Generate notes with proper spacing
        sortedNotes.forEach((note, index) => {
            // Add space between notes (except for first note)
            if (index > 0) {
                abc += ' ';
            }
            
            // Convert note (without dynamics for now to test)
            abc += this.convertNoteToAbcSimple(note, composition);
        });

        // Add bar line and end
        abc += ' |]';

        return abc;
    }
    
    /**
     * Simple note conversion without complex formatting
     */
    static convertNoteToAbcSimple(note, composition) {
        let abcNote = '';

        // Handle chords
        if (Array.isArray(note.note)) {
            abcNote += '[';
            note.note.forEach((n, index) => {
                if (index > 0) abcNote += '';
                abcNote += this.convertSingleNoteToAbc(n);
            });
            abcNote += ']';
        } else {
            abcNote += this.convertSingleNoteToAbc(note.note);
        }

        // Add duration
        let duration = note.duration;
        if (typeof note.duration === 'string') {
            duration = this.parseTimeString(note.duration, composition.bpm || 120);
        }
        abcNote += this.durationToAbcNotation(duration, composition.bpm || 120);

        return abcNote;
    }

    /**
     * Generate multi-voice ABC notation
     * @param {Object} composition - jmon composition
     * @returns {string} ABC notation
     */
    static generateMultiVoiceAbc(composition) {
        let abc = '';
        
        composition.sequences.forEach((sequence, index) => {
            // Voice header
            abc += `V:${index + 1} name="${sequence.label || `Voice ${index + 1}`}"\n`;
            
            // Generate voice content
            abc += this.generateSingleVoiceAbc(sequence, composition);
            abc += '\n';
        });

        return abc;
    }

    /**
     * Convert a single note to ABC notation
     * @param {Object} note - jmon note object
     * @param {Object} composition - composition context
     * @returns {string} ABC note notation
     */
    static convertNoteToAbc(note, composition) {
        let abcNote = '';

        // Handle chords
        if (Array.isArray(note.note)) {
            abcNote += '[';
            note.note.forEach((n, index) => {
                if (index > 0) abcNote += '';
                abcNote += this.convertSingleNoteToAbc(n);
            });
            abcNote += ']';
        } else {
            abcNote += this.convertSingleNoteToAbc(note.note);
        }

        // Add duration
        let duration = note.duration;
        if (typeof note.duration === 'string') {
            // Use the class parseTimeString helper
            duration = this.parseTimeString(note.duration, composition.bpm || 120);
        }
        abcNote += this.durationToAbcNotation(duration, composition.bpm || 120);

        // Add dynamics based on velocity (using standard ABC dynamics)
        if (note.velocity !== undefined) {
            if (note.velocity < 0.4) {
                abcNote += '!p!';
            } else if (note.velocity < 0.7) {
                abcNote += '!mp!';
            } else if (note.velocity < 0.85) {
                abcNote += '!mf!';
            } else {
                abcNote += '!f!';
            }
        }

        // Add articulations (place before note)
        if (note.articulation) {
            switch (note.articulation) {
                case 'staccato':
                    abcNote = '.' + abcNote;
                    break;
                case 'accent':
                    abcNote += '!accent!';
                    break;
                case 'tenuto':
                    abcNote += '!tenuto!';
                    break;
            }
        }

        // Add ornaments based on modulations (place after note)
        if (note.modulations) {
            note.modulations.forEach(mod => {
                if (mod.type === 'cc' && mod.controller === 1) {
                    // Modulation wheel - interpret as vibrato
                    if (mod.value > 64) {
                        abcNote += '!trill!';
                    }
                } else if (mod.type === 'pitchBend') {
                    // Pitch bend - add slide notation
                    if (mod.value > 0) {
                        abcNote += '!slide!';
                    }
                }
            });
        }

        // Add microtuning as quarter-tone accidentals if present
        if (note.microtuning) {
            const semitones = Math.abs(note.microtuning);
            if (semitones >= 0.25 && semitones < 0.75) {
                // Quarter tone - use ABC extension
                abcNote = (note.microtuning > 0 ? '^/' : '_/') + abcNote;
            }
        }

        return abcNote;
    }

    /**
     * Convert a single note name or MIDI number to ABC notation
     * @param {string|number} note - note name or MIDI number
     * @returns {string} ABC note
     */
    static convertSingleNoteToAbc(note) {
        let noteName;
        
        if (typeof note === 'number') {
            // Convert MIDI number to note name
            const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
            const octave = Math.floor(note / 12) - 1;
            const noteIndex = note % 12;
            noteName = noteNames[noteIndex] + octave;
        } else {
            noteName = note;
        }

        // Parse note name (e.g., "C4", "F#3", "Bb5")
        const match = noteName.match(/^([A-G])(#|b)?(-?\d+)$/);
        if (!match) {
            console.warn('Invalid note name:', noteName);
            return 'C';
        }

        const [, noteChar, accidental, octaveStr] = match;
        const octave = parseInt(octaveStr);

        // Convert to ABC notation
        let abcNote = noteChar;

        // Add accidentals
        if (accidental === '#') {
            abcNote = '^' + abcNote;
        } else if (accidental === 'b') {
            abcNote = '_' + abcNote;
        }

        // Handle octaves in ABC notation correctly
        // ABC notation: C,, C, C c c' c''
        // Octave 3 = C,  Octave 4 = C  Octave 5 = c  Octave 6 = c'
        if (octave <= 3) {
            abcNote = abcNote.toUpperCase();
            // Add commas for lower octaves
            for (let i = octave; i < 3; i++) {
                abcNote += ',';
            }
        } else if (octave === 4) {
            abcNote = abcNote.toUpperCase();
        } else {
            abcNote = abcNote.toLowerCase();
            // Add apostrophes for higher octaves
            for (let i = 5; i <= octave; i++) {
                abcNote += "'";
            }
        }

        return abcNote;
    }

    /**
     * Convert duration to ABC notation
     * @param {number} duration - duration in seconds
     * @param {number} bpm - beats per minute
     * @returns {string} ABC duration notation
     */
    static durationToAbcNotation(duration, bpm) {
        const beatLength = 60 / bpm; // quarter note duration
        const ratio = duration / beatLength;

        // Common note durations
        if (Math.abs(ratio - 4) < 0.1) return '4';      // whole note
        if (Math.abs(ratio - 2) < 0.1) return '2';      // half note
        if (Math.abs(ratio - 1) < 0.1) return '';       // quarter note (default)
        if (Math.abs(ratio - 0.5) < 0.1) return '/2';   // eighth note
        if (Math.abs(ratio - 0.25) < 0.1) return '/4';  // sixteenth note
        if (Math.abs(ratio - 0.125) < 0.1) return '/8'; // thirty-second note
        
        // Dotted notes
        if (Math.abs(ratio - 1.5) < 0.1) return '3/2';  // dotted quarter
        if (Math.abs(ratio - 0.75) < 0.1) return '3/4'; // dotted eighth
        if (Math.abs(ratio - 3) < 0.1) return '3';      // dotted half
        
        // Triplets
        if (Math.abs(ratio - 2/3) < 0.1) return '2/3';  // quarter triplet
        if (Math.abs(ratio - 1/3) < 0.1) return '/3';   // eighth triplet

        // For other durations, use fractional notation
        const numerator = Math.round(ratio * 8);
        return numerator === 8 ? '' : `${numerator}/8`;
    }

    /**
     * Convert duration to ABC rest notation
     * @param {number} duration - rest duration in seconds
     * @param {number} bpm - beats per minute
     * @returns {string} ABC rest notation
     */
    static durationToAbcRest(duration, bpm) {
        const notation = this.durationToAbcNotation(duration, bpm);
        return 'z' + notation;
    }

    /**
     * Export ABC notation as downloadable file
     * @param {string} abc - ABC notation string
     * @param {string} filename - filename for download
     */
    static exportAbcAsFile(abc, filename = 'composition.abc') {
        const blob = new Blob([abc], { type: 'text/plain' });
        
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
     * Convert jmon composition to ABC and download
     * @param {Object} composition - jmon composition
     * @param {string} filename - Optional filename
     */
    static convertAndDownload(composition, filename) {
        try {
            const abc = this.convertToAbc(composition);
            const downloadName = filename || `${composition.metadata?.name || 'composition'}.abc`;
            this.exportAbcAsFile(abc, downloadName);
            console.log(`✅ ABC file "${downloadName}" exported successfully`);
            return abc;
        } catch (error) {
            console.error('❌ Error converting to ABC:', error);
            throw error;
        }
    }

    /**
     * Analyze jmon composition for ABC conversion compatibility
     * @param {Object} composition - jmon composition
     * @returns {Object} Analysis report
     */
    static analyzeForAbc(composition) {
        const report = {
            voices: composition.sequences?.length || 0,
            totalNotes: 0,
            chords: 0,
            microtuning: 0,
            modulations: 0,
            tempoChanges: composition.tempoMap?.length || 0,
            keyChanges: composition.keySignatureMap?.length || 0,
            warnings: [],
            recommendations: []
        };

        if (composition.sequences) {
            composition.sequences.forEach((seq, index) => {
                report.totalNotes += seq.notes?.length || 0;
                
                seq.notes?.forEach(note => {
                    if (Array.isArray(note.note)) {
                        report.chords++;
                    }
                    
                    if (note.microtuning) {
                        report.microtuning++;
                    }
                    
                    if (note.modulations) {
                        report.modulations += note.modulations.length;
                    }
                });

                // Check for unsupported features
                if (seq.effects && seq.effects.length > 0) {
                    report.warnings.push(`Voice ${index + 1} (${seq.label}): Effects not supported in ABC notation`);
                }
            });
        }

        // Recommendations
        if (report.microtuning > 0) {
            report.recommendations.push('Consider using standard tuning for better ABC compatibility');
        }
        
        if (report.modulations > 0) {
            report.recommendations.push('Modulations will be converted to ornaments - review output for accuracy');
        }
        
        if (composition.audioGraph && composition.audioGraph.length > 1) {
            report.warnings.push('Audio routing and synthesis parameters will be lost in ABC conversion');
        }

        return report;
    }

    /**
     * Generate ABC notation with lyrics from annotations
     * @param {Object} composition - jmon composition with annotations
     * @returns {string} ABC notation with lyrics
     */
    static convertWithLyrics(composition) {
        let abc = this.convertToAbc(composition);
        
        // Add lyrics from annotations
        if (composition.annotations) {
            const lyrics = composition.annotations
                .filter(ann => ann.type === 'lyric')
                .sort((a, b) => {
                    const timeA = typeof a.time === 'string' ? 
                        jmonTone._parseTimeString(a.time, composition.bpm || 120) : a.time;
                    const timeB = typeof b.time === 'string' ? 
                        jmonTone._parseTimeString(b.time, composition.bpm || 120) : b.time;
                    return timeA - timeB;
                });
                
            if (lyrics.length > 0) {
                abc += '\nw: ';
                lyrics.forEach((lyric, index) => {
                    if (index > 0) abc += ' ';
                    abc += lyric.text;
                });
                abc += '\n';
            }
        }
        
        return abc;
    }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = JmonToAbc;
}

// Export for browsers (global) - avoid redeclaration
if (typeof window !== 'undefined') {
    window.JmonToAbc = window.JmonToAbc || JmonToAbc;
}

})(typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : this);