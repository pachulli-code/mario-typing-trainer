// Web Audio API sound effects — no external files needed

let audioCtx = null;
let soundEnabled = true;

export function initAudio() {
    // Init on first user interaction
    const init = () => {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        document.removeEventListener('click', init);
        document.removeEventListener('keydown', init);
    };
    document.addEventListener('click', init);
    document.addEventListener('keydown', init);

    const soundBtn = document.getElementById('sound-btn');
    soundBtn.addEventListener('click', () => {
        soundEnabled = !soundEnabled;
        soundBtn.textContent = soundEnabled ? '♪' : '♪̶';
        soundBtn.style.opacity = soundEnabled ? '1' : '0.5';
    });
}

export function setSoundEnabled(enabled) {
    soundEnabled = enabled;
}

function playNote(freq, type, duration, startTime = 0, gain = 0.15) {
    if (!audioCtx || !soundEnabled) return;
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime + startTime);
    g.gain.setValueAtTime(gain, audioCtx.currentTime + startTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + startTime + duration);
    osc.connect(g);
    g.connect(audioCtx.destination);
    osc.start(audioCtx.currentTime + startTime);
    osc.stop(audioCtx.currentTime + startTime + duration);
}

// Coin sound: E5 → B5 sine
export function playCoinSound() {
    playNote(659.25, 'sine', 0.1, 0, 0.12);
    playNote(987.77, 'sine', 0.15, 0.1, 0.12);
}

// Jump sound: frequency sweep 200→600Hz
export function playJumpSound() {
    if (!audioCtx || !soundEnabled) return;
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.15);
    g.gain.setValueAtTime(0.12, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
    osc.connect(g);
    g.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
}

// Error sound: low sawtooth 100Hz
export function playErrorSound() {
    playNote(100, 'sawtooth', 0.2, 0, 0.1);
    playNote(80, 'sawtooth', 0.15, 0.05, 0.08);
}

// Cappy throw: white noise + sweep
export function playCappySound() {
    if (!audioCtx || !soundEnabled) return;
    const bufferSize = audioCtx.sampleRate * 0.12;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(0.08, audioCtx.currentTime);
    noise.connect(g);
    g.connect(audioCtx.destination);
    noise.start();

    // Add sweep
    const osc = audioCtx.createOscillator();
    const g2 = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);
    g2.gain.setValueAtTime(0.06, audioCtx.currentTime);
    g2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
    osc.connect(g2);
    g2.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
}

// Level complete: arpeggio C5-E5-G5-C6
export function playLevelCompleteSound() {
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, i) => {
        playNote(freq, 'sine', 0.25, i * 0.15, 0.12);
    });
}

// Life lost jingle
export function playLifeLostSound() {
    playNote(440, 'square', 0.15, 0, 0.08);
    playNote(370, 'square', 0.15, 0.15, 0.08);
    playNote(311, 'square', 0.3, 0.3, 0.08);
}

// Game over
export function playGameOverSound() {
    const notes = [392, 349.23, 311.13, 261.63];
    notes.forEach((freq, i) => {
        playNote(freq, 'square', 0.3, i * 0.25, 0.08);
    });
}

// Menu select
export function playSelectSound() {
    playNote(660, 'square', 0.08, 0, 0.08);
}
