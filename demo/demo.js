// unified-demo.js : logiques unifiées pour la démo jmon

// Demo files list (à adapter si besoin)
const demoFiles = [
    'demo-jmon-files/demo-converter-showcase.json',
    'demo-jmon-files/demo-complex-modulations.json',
    'demo-jmon-files/demo-multitrack-score.json',
    'demo-jmon-files/demo-supercollider-features.json',
    'demo-jmon-files/demo-01-basic-synth.json',
    'demo-jmon-files/demo-02-polyphonic.json',
    'demo-jmon-files/demo-03-modulation-wheel.json',
    'demo-jmon-files/demo-04-pitch-bend.json',
    'demo-jmon-files/demo-05-vibrato.json',
    'demo-jmon-files/demo-06-tremolo.json',
    'demo-jmon-files/demo-07-fm-synthesis.json',
    'demo-jmon-files/demo-08-duo-synth.json',
    'demo-jmon-files/demo-09-pluck-synth.json',
    'demo-jmon-files/demo-10-sampler-envelope.json',
    'demo-jmon-files/demo-11-multitrack-ensemble.json',
    'demo-jmon-files/demo-12-complex-modulations.json',
    'demo-jmon-files/demo-13-advanced-effects.json',
    'demo-jmon-files/demo-14-masterpiece.json',
    'demo-jmon-files/demo-15-sampler-modulation-test.json',
];

let compositions = {};
let currentComposition = null;
let audioStarted = false;
let isPlaying = false;
let currentMidi = null;
let currentAbc = null;
let currentSc = null;

// DOM elements
const fileSelect = document.getElementById('fileSelect');
const analyzeButton = document.getElementById('analyzeButton');
const playButton = document.getElementById('playButton');
const stopButton = document.getElementById('stopButton');
const status = document.getElementById('status');
const jmonJson = document.getElementById('jmonJson');

// ABC elements
const convertAbcButton = document.getElementById('convertAbcButton');
const downloadAbcButton = document.getElementById('downloadAbcButton');
const abcOutput = document.getElementById('abcOutput');
const abcScore = document.getElementById('abcScore');

// MIDI elements
const convertMidiButton = document.getElementById('convertMidiButton');
const downloadMidiButton = document.getElementById('downloadMidiButton');
const midiAnalysis = document.getElementById('midiAnalysis');

// SuperCollider elements
const convertScButton = document.getElementById('convertScButton');
const downloadScButton = document.getElementById('downloadScButton');
const scOutput = document.getElementById('scOutput');

// Onglets : JSON, ABC, MIDI, SuperCollider
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        tabContents.forEach(content => {
            content.classList.remove('active');
            if (content.id === `${tabName}-tab`) {
                content.classList.add('active');
            }
        });
    });
});

function showStatus(message, type = 'info') {
    status.textContent = message;
    status.className = `status ${type}`;
    status.style.display = 'block';
    if (type !== 'error') {
        setTimeout(() => { status.style.display = 'none'; }, 3000);
    }
}

function initializeFileSelector() {
    demoFiles.forEach(file => {
        const option = document.createElement('option');
        option.value = file;
        option.textContent = file.replace('demo-jmon-files/', '').replace('.json', '').replace('demo-', 'Demo ').replace(/-/g, ' ');
        fileSelect.appendChild(option);
    });
}

async function loadComposition(filename) {
    try {
        const response = await fetch(filename);
        if (!response.ok) throw new Error(`Failed to load ${filename}`);
        const composition = await response.json();
        compositions[filename] = composition;
        return composition;
    } catch (error) {
        console.error(`Failed to load ${filename}:`, error);
        throw error;
    }
}

// Lors du chargement d'un fichier, afficher le JSON dans l'onglet
fileSelect.addEventListener('change', async (e) => {
    const filename = e.target.value;
    if (!filename) {
        currentComposition = null;
        analyzeButton.disabled = true;
        playButton.disabled = true;
        convertMidiButton.disabled = true;
        convertAbcButton.disabled = true;
        convertScButton.disabled = true;
        jmonJson.value = '';
        return;
    }
    try {
        showStatus('Loading file...');
        if (!compositions[filename]) {
            await loadComposition(filename);
        }
        currentComposition = compositions[filename];
        jmonJson.value = JSON.stringify(currentComposition, null, 2);
        analyzeButton.disabled = false;
        convertMidiButton.disabled = false;
        convertAbcButton.disabled = false;
        convertScButton.disabled = false;
        playButton.disabled = false;
        showStatus('File loaded successfully', 'success');
    } catch (error) {
        showStatus(`Error loading file: ${error.message}`, 'error');
        currentComposition = null;
    }
});

analyzeButton.addEventListener('click', () => {
    if (!currentComposition) return;
    const validation = jmonTone.validate(currentComposition);
    if (validation.success) {
        showStatus('✅ Valid composition', 'success');
    } else {
        showStatus(`❌ Validation errors: ${validation.errors.join(', ')}`, 'error');
    }
});

playButton.addEventListener('click', async () => {
    if (!audioStarted) {
        try { await Tone.start(); audioStarted = true; } catch (e) { showStatus('Failed to start audio context', 'error'); return; }
    }
    if (!currentComposition) { showStatus('No composition loaded', 'warning'); return; }
    try {
        Tone.Transport.stop(); Tone.Transport.cancel();
        await jmonTone.playComposition(currentComposition);
        isPlaying = true;
        playButton.disabled = true;
        stopButton.disabled = false;
        showStatus('Playing original...', 'success');
    } catch (error) {
        showStatus(`Playback error: ${error.message}`, 'error');
    }
});

stopButton.addEventListener('click', () => {
    Tone.Transport.stop();
    Tone.Transport.cancel();
    isPlaying = false;
    playButton.disabled = false;
    stopButton.disabled = true;
    showStatus('Stopped');
});

convertAbcButton.addEventListener('click', () => {
    if (!currentComposition) return;
    try {
        currentAbc = JmonToAbc.convertToAbc(currentComposition);
        abcOutput.value = currentAbc;
        downloadAbcButton.disabled = false;
        abcScore.innerHTML = '';
        if (typeof ABCJS !== 'undefined') {
            ABCJS.renderAbc('abcScore', currentAbc);
        }
        showStatus('ABC conversion and rendering OK!', 'success');
    } catch (error) {
        showStatus(`ABC conversion error: ${error.message}`, 'error');
        abcOutput.value = `Error: ${error.message}`;
        abcScore.innerHTML = `<div style=\"color: red; text-align: center; margin-top: 80px;\">Conversion failed: ${error.message}</div>`;
    }
});

downloadAbcButton.addEventListener('click', () => {
    if (!currentAbc || !currentComposition) return;
    try {
        const filename = `${currentComposition.metadata?.name || 'composition'}.abc`;
        JmonToAbc.exportAbcAsFile(currentAbc, filename);
        showStatus(`ABC file "${filename}" downloaded!`, 'success');
    } catch (error) {
        showStatus(`Download error: ${error.message}`, 'error');
    }
});

convertMidiButton.addEventListener('click', () => {
    if (!currentComposition) return;
    try {
        currentMidi = JmonToMidi.convertToMidi(currentComposition);
        downloadMidiButton.disabled = false;
        showStatus('MIDI conversion successful!', 'success');
    } catch (error) {
        showStatus(`MIDI conversion error: ${error.message}`, 'error');
    }
});

downloadMidiButton.addEventListener('click', () => {
    if (!currentMidi || !currentComposition) return;
    try {
        const filename = `${currentComposition.metadata?.name || 'composition'}.mid`;
        JmonToMidi.exportMidiAsFile(currentMidi, filename);
        showStatus(`MIDI file "${filename}" downloaded!`, 'success');
    } catch (error) {
        showStatus(`Download error: ${error.message}`, 'error');
    }
});

convertScButton.addEventListener('click', () => {
    if (!currentComposition) return;
    try {
        currentSc = JmonToSuperCollider.convertToSuperCollider(currentComposition);
        scOutput.value = currentSc;
        downloadScButton.disabled = false;
        showStatus('SuperCollider conversion successful!', 'success');
    } catch (error) {
        showStatus(`SuperCollider conversion error: ${error.message}`, 'error');
        scOutput.value = `Error: ${error.message}`;
    }
});

downloadScButton.addEventListener('click', () => {
    if (!currentSc || !currentComposition) return;
    try {
        const filename = `${currentComposition.metadata?.name || 'composition'}.scd`;
        JmonToSuperCollider.exportScAsFile(currentSc, filename);
        showStatus(`SuperCollider file "${filename}" downloaded!`, 'success');
    } catch (error) {
        showStatus(`Download error: ${error.message}`, 'error');
    }
});

// Copier le contenu d'une textarea
function setupCopyButton(btnId, textareaId) {
    const btn = document.getElementById(btnId);
    const ta = document.getElementById(textareaId);
    if (!btn || !ta) return;
    btn.addEventListener('click', () => {
        ta.select();
        document.execCommand('copy');
        btn.innerHTML = '✅';
        setTimeout(() => { btn.innerHTML = '<span>📋</span>'; }, 1200);
    });
}
setupCopyButton('copyJsonBtn', 'jmonJson');
setupCopyButton('copyAbcBtn', 'abcOutput');
setupCopyButton('copyScBtn', 'scOutput');

// Permettre l'édition du JSON et recharger la composition
const updateJmonBtn = document.getElementById('updateJmonBtn');
if (updateJmonBtn) {
    updateJmonBtn.addEventListener('click', () => {
        try {
            const newJson = JSON.parse(jmonJson.value);
            currentComposition = newJson;
            showStatus('JMON mis à jour avec succès', 'success');
            // Réinitialiser les sorties
            abcOutput.value = '';
            abcScore.innerHTML = '';
            scOutput.value = '';
            currentAbc = null;
            currentSc = null;
            currentMidi = null;
        } catch (e) {
            showStatus('Erreur JSON : ' + e.message, 'error');
        }
    });
}

window.addEventListener('load', () => {
    initializeFileSelector();
    showStatus('Select a demo file to begin');
});
