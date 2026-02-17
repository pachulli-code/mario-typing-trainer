// Keyboard input handler with RU/EN layout support
import { getState, setState } from './state.js';

const pressedKeys = new Set();
let onKeyCallback = null;

export function initInput() {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    // Language toggle button
    const langBtn = document.getElementById('lang-btn');
    langBtn.addEventListener('click', toggleLang);
    updateLangButton();
}

function handleKeyDown(e) {
    // Prevent default for game keys (not F5/F12 etc)
    if (!e.ctrlKey && !e.altKey && !e.metaKey && e.key.length === 1) {
        e.preventDefault();
    }

    // Ctrl+Space to toggle language
    if (e.ctrlKey && e.code === 'Space') {
        e.preventDefault();
        toggleLang();
        return;
    }

    // Filter repeats
    if (e.repeat) return;

    // Filter modifier-only keys
    if (['Control', 'Alt', 'Shift', 'Meta', 'CapsLock', 'Tab'].includes(e.key)) return;

    pressedKeys.add(e.key);

    if (onKeyCallback) {
        onKeyCallback(e.key, e.code);
    }
}

function handleKeyUp(e) {
    pressedKeys.delete(e.key);
}

function toggleLang() {
    const lang = getState().lang === 'ru' ? 'en' : 'ru';
    setState({ lang });
    updateLangButton();
}

function updateLangButton() {
    const langBtn = document.getElementById('lang-btn');
    langBtn.textContent = getState().lang.toUpperCase();
}

export function setKeyCallback(fn) {
    onKeyCallback = fn;
}

export function clearKeyCallback() {
    onKeyCallback = null;
}

export function isKeyPressed(key) {
    return pressedKeys.has(key);
}
