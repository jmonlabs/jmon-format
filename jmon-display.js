/**
 * jmon-display.js - JavaScript equivalent of Python anywidget MusicPlayer
 * 
 * Simple, clean music player and score display matching the Python anywidget design.
 * No complex dependencies - just like anywidget philosophy.
 */

// Simple show function for ABC notation display
export function show(composition, options = {}) {
    const container = document.createElement('div');
    container.style.cssText = `
        padding: 12px; border: 1px solid #ddd; border-radius: 6px;
        background: white; font-family: monospace; margin: 8px 0;
        max-width: 600px;
    `;
    
    try {
        // Normalize composition if jmonTone is available
        let normalized = composition;
        if (typeof window !== 'undefined' && window.jmonTone?.normalize) {
            normalized = window.jmonTone.normalize(composition);
        } else if (typeof jmonTone !== 'undefined' && jmonTone.normalize) {
            normalized = jmonTone.normalize(composition);
        }
        
        // Convert to ABC if converter is available
        let content = '';
        if (typeof window !== 'undefined' && window.JmonToAbc?.convertToAbc) {
            content = window.JmonToAbc.convertToAbc(normalized);
        } else if (typeof JmonToAbc !== 'undefined' && JmonToAbc.convertToAbc) {
            content = JmonToAbc.convertToAbc(normalized);
        } else {
            content = JSON.stringify(normalized, null, 2);
        }
        
        // Add title if available
        if (normalized.metadata?.name) {
            const title = document.createElement('div');
            title.textContent = normalized.metadata.name;
            title.style.cssText = 'font-weight: bold; margin-bottom: 8px; font-family: sans-serif;';
            container.appendChild(title);
        }
        
        // Display content
        const pre = document.createElement('pre');
        pre.textContent = content;
        pre.style.cssText = 'margin: 0; font-size: 11px; white-space: pre-wrap; overflow-x: auto;';
        container.appendChild(pre);
        
    } catch (error) {
        container.innerHTML = `<strong>Error:</strong> ${error.message}`;
        container.style.color = '#dc2626';
    }
    
    return container;
}

// Simple player function - JavaScript equivalent of Python anywidget MusicPlayer
export function play(tracks, options = {}) {
    const {
        tempo = 120,
        width = 400,
        showDebug = false
    } = options;

    // Normalize tracks input (same as Python version)
    let normalizedTracks;
    if (Array.isArray(tracks)) {
        if (tracks.length > 0 && Array.isArray(tracks[0]) && tracks[0].length === 3) {
            // Single track: [[midi, duration, time], ...]
            normalizedTracks = { "Instrument 1": tracks };
        } else {
            // Multiple tracks: [track1, track2, ...]
            normalizedTracks = {};
            tracks.forEach((track, i) => {
                normalizedTracks[`Instrument ${i + 1}`] = track;
            });
        }
    } else if (typeof tracks === 'object' && tracks !== null) {
        // Already a dictionary
        normalizedTracks = tracks;
    } else {
        throw new Error("Tracks must be a dictionary of tracks, a single track, or a list of tracks");
    }

    const colors = {
        background: '#FFFFFF',
        primary: '#333',
        secondary: '#F0F0F0',
        accent: '#333',
        text: '#000000',
        lightText: '#666666',
        border: '#CCCCCC'
    };

    const styles = {
        container: `
            font-family: 'PT Sans', sans-serif;
            background-color: ${colors.background};
            color: ${colors.text};
            padding: 20px;
            border-radius: 12px;
            width: ${width}px;
            border: 1px solid ${colors.border};
            box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.1);
            display: flex;
            flex-direction: column;
            margin: 8px 0;
        `,
        topContainer: `
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
        `,
        column: `
            display: flex;
            flex-direction: column;
            width: 48%;
            justify-content: space-between;
        `,
        select: `
            padding: 8px;
            margin: 5px 0;
            border: 1px solid ${colors.secondary};
            border-radius: 6px;
            background-color: ${colors.background};
            color: ${colors.text};
            font-size: 14px;
            cursor: pointer;
            width: 100%;
            height: 36px;
        `,
        bpmContainer: `
            display: flex;
            flex-direction: column;
            width: 100%;
        `,
        bpmLabel: `
            font-size: 14px;
            margin-bottom: 5px;
            color: ${colors.text};
        `,
        bpmInput: `
            padding: 8px;
            border: 1px solid ${colors.secondary};
            border-radius: 6px;
            background-color: ${colors.background};
            color: ${colors.text};
            font-size: 14px;
            text-align: center;
            width: 100%;
            height: 36px;
        `,
        timelineContainer: `
            position: relative;
            width: 100%;
            margin: 20px 0;
            display: flex;
            align-items: center;
        `,
        timeline: `
            flex-grow: 1;
            -webkit-appearance: none;
            background: ${colors.secondary};
            outline: none;
            border-radius: 15px;
            height: 8px;
        `,
        button: `
            width: 40px;
            height: 40px;
            border: none;
            border-radius: 50%;
            background-color: ${colors.primary};
            color: ${colors.background};
            font-size: 16px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0px 10px;
        `,
        timeDisplay: `
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            color: ${colors.lightText};
            margin: 0px 0px 0px 10px;
        `
    };

    const createElementWithStyle = (tag, style) => {
        const element = document.createElement(tag);
        element.style.cssText = style;
        return element;
    };

    const formatTime = seconds => `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;

    const container = createElementWithStyle('div', styles.container);

    // Timeline and play button
    const timelineContainer = createElementWithStyle('div', styles.timelineContainer);
    const timelineSlider = createElementWithStyle('input', styles.timeline);
    Object.assign(timelineSlider, { type: 'range', min: 0, max: 100, value: 0 });

    const playButton = createElementWithStyle('button', styles.button);
    playButton.innerHTML = '▶';

    timelineContainer.append(timelineSlider, playButton);

    const timeDisplay = createElementWithStyle('div', styles.timeDisplay);
    const currentTime = document.createElement('span');
    currentTime.textContent = '0:00';
    const totalTime = document.createElement('span');
    totalTime.textContent = '0:00';
    timeDisplay.append(currentTime, totalTime);

    // Left column for instruments
    const leftColumn = createElementWithStyle('div', styles.column);
    const instrumentsContainer = createElementWithStyle('div', '');
    leftColumn.appendChild(instrumentsContainer);

    // Right column for BPM
    const rightColumn = createElementWithStyle('div', styles.column);
    const bpmContainer = createElementWithStyle('div', styles.bpmContainer);
    const bpmLabel = createElementWithStyle('label', styles.bpmLabel);
    bpmLabel.textContent = 'Tempo';
    const bpmInput = createElementWithStyle('input', styles.bpmInput);
    Object.assign(bpmInput, { type: 'number', min: 60, max: 240, value: tempo });
    bpmContainer.append(bpmLabel, bpmInput);
    rightColumn.appendChild(bpmContainer);

    // Top container
    const topContainer = createElementWithStyle('div', styles.topContainer);
    topContainer.append(leftColumn, rightColumn);

    container.append(topContainer, timelineContainer, timeDisplay);

    // Debug display
    const debugDiv = document.createElement('div');
    const updateDebug = msg => {
        if (showDebug) {
            debugDiv.textContent = msg;
            console.log(msg);
        }
    };

    // Initialize the player
    const initPlayer = async () => {
        try {
            updateDebug('Initializing player...');
            
            // Check if Tone.js is available
            let Tone;
            if (typeof window !== 'undefined' && window.Tone) {
                Tone = window.Tone;
            } else {
                throw new Error('Tone.js not loaded. Please load Tone.js first.');
            }

            // Start Tone.js context
            if (Tone.context.state !== 'running') {
                await Tone.start();
            }

            const synthTypes = ['Synth', 'AMSynth', 'DuoSynth', 'FMSynth', 'MembraneSynth', 'MetalSynth', 'MonoSynth', 'PluckSynth', 'PolySynth'];
            const trackNames = Object.keys(normalizedTracks);
            const trackData = Object.values(normalizedTracks);
            const synthSelects = [];

            // Create instrument selectors
            trackNames.forEach((trackName, index) => {
                const synthSelectorItem = document.createElement('div');
                const synthLabel = document.createElement('label');
                synthLabel.textContent = trackName;
                synthLabel.style.cssText = 'font-size: 14px; margin-bottom: 5px;';
                
                const synthSelect = createElementWithStyle('select', styles.select);
                synthTypes.forEach(synth => {
                    const option = document.createElement('option');
                    option.value = synth;
                    option.textContent = synth;
                    synthSelect.appendChild(option);
                });
                synthSelects.push(synthSelect);
                synthSelectorItem.append(synthLabel, synthSelect);
                instrumentsContainer.appendChild(synthSelectorItem);
            });

            let synths = [];
            let parts = [];
            let totalDuration = 0;
            let isPlaying = false;

            const initAudio = () => {
                // Dispose existing audio
                synths.forEach(s => s.dispose());
                parts.forEach(p => p.dispose());
                synths = [];
                parts = [];

                const currentBpm = parseInt(bpmInput.value);
                Tone.Transport.bpm.value = currentBpm;

                trackData.forEach((instrumentData, index) => {
                    const selectedSynth = synthSelects[index].value;
                    const synth = new Tone[selectedSynth]().toDestination();
                    synths.push(synth);

                    const part = new Tone.Part((time, note) => {
                        if (note.noteName === null) return; // silence
                        
                        if (Array.isArray(note.noteName)) {
                            // chord
                            note.noteName.forEach(n => {
                                if (n !== null) {
                                    synth.triggerAttackRelease(n, note.duration, time);
                                }
                            });
                        } else {
                            // single note
                            synth.triggerAttackRelease(note.noteName, note.duration, time);
                        }
                    }, instrumentData.map(([midi, duration, time]) => ({
                        time: time * 60 / currentBpm,
                        noteName: midi === null ? null :
                            (Array.isArray(midi) 
                                ? midi.map(m => m !== null ? Tone.Frequency(m, "midi").toNote() : null)
                                : Tone.Frequency(midi, "midi").toNote()),
                        duration: duration * 60 / currentBpm
                    }))).start(0);
                    parts.push(part);
                });

                totalDuration = Math.max(...trackData.flat().map(note => note[2] + note[1])) * 60 / currentBpm;
                Tone.Transport.loopEnd = totalDuration;
                Tone.Transport.loop = true;
                totalTime.textContent = formatTime(totalDuration);
                updateDebug(`Audio initialized, duration: ${totalDuration.toFixed(2)}s, BPM: ${currentBpm}`);
            };

            const updateTimeline = () => {
                if (totalDuration > 0) {
                    const progress = (Tone.Transport.seconds / totalDuration) * 100;
                    timelineSlider.value = progress;
                    currentTime.textContent = formatTime(Tone.Transport.seconds);
                }
                if (isPlaying) {
                    requestAnimationFrame(updateTimeline);
                }
            };

            // Play button functionality
            playButton.onclick = async () => {
                try {
                    if (Tone.Transport.state === 'started') {
                        await Tone.Transport.stop();
                        playButton.innerHTML = '▶';
                        isPlaying = false;
                        updateDebug('Playback stopped');
                    } else {
                        if (synths.length === 0) initAudio();
                        await Tone.Transport.start();
                        playButton.innerHTML = '⏸';
                        isPlaying = true;
                        updateDebug(`Playback started, BPM: ${Tone.Transport.bpm.value}`);
                        updateTimeline();
                    }
                } catch (error) {
                    updateDebug(`Error during playback: ${error.message}`);
                }
            };

            // Instrument change handlers
            synthSelects.forEach(select => {
                select.onchange = initAudio;
            });

            // Timeline scrubbing
            timelineSlider.oninput = () => {
                const time = (timelineSlider.value / 100) * totalDuration;
                Tone.Transport.seconds = time;
                currentTime.textContent = formatTime(time);
            };

            // BPM change handler
            bpmInput.onchange = () => {
                const bpm = parseInt(bpmInput.value);
                if (bpm >= 60 && bpm <= 240) {
                    Tone.Transport.bpm.value = bpm;
                    initAudio(); // Reinitialize with new BPM
                    updateDebug(`BPM set to ${bpm}`);
                } else {
                    bpmInput.value = Tone.Transport.bpm.value;
                    updateDebug('Invalid BPM. Please enter a value between 60 and 240.');
                }
            };

            // Initialize audio on load
            initAudio();
            updateDebug('Player initialized successfully');

        } catch (error) {
            updateDebug(`Error initializing player: ${error.message}`);
            console.error('Error initializing player:', error);
        }
    };

    // Initialize when added to DOM
    setTimeout(initPlayer, 100);

    if (showDebug) {
        container.appendChild(debugDiv);
    }

    return container;
}

// Combined display function (like Python anywidget)
export function display(composition, options = {}) {
    const container = document.createElement('div');
    container.style.cssText = 'display: flex; flex-direction: column; gap: 16px;';
    
    // Convert JMON to tracks format for player
    let tracks;
    if (composition.tracks) {
        tracks = {};
        Object.entries(composition.tracks).forEach(([trackName, notes]) => {
            tracks[trackName] = notes.map(note => [
                note.pitch || note.midi,
                note.duration,
                note.time
            ]);
        });
    } else {
        tracks = composition; // Assume it's already in tracks format
    }
    
    container.appendChild(show(composition, options.score));
    container.appendChild(play(tracks, options.player));
    return container;
}

// Make available globally
if (typeof window !== 'undefined') {
    window.jmonDisplay = { show, play, display };
}