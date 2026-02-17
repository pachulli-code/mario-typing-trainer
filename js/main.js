// Main entry point: init, game loop, screen dispatch
import { SCREENS, FADE_DURATION, MAX_DELTA, VIRTUAL_WIDTH, VIRTUAL_HEIGHT } from './config.js';
import { initRenderer, getCtx, clear } from './renderer.js';
import { getState, setState, subscribe } from './state.js';
import { initInput } from './input.js';
import { initAudio } from './audio.js';
import { loadProgress } from './storage.js';
import { updateTweens } from './animation.js';

// Import all screens
import * as titleScreen from './screens/title.js';
import * as levelSelectScreen from './screens/levelSelect.js';
import * as playingScreen from './screens/playing.js';
import * as levelCompleteScreen from './screens/levelComplete.js';
import * as gameOverScreen from './screens/gameOver.js';

const screens = {
    [SCREENS.TITLE]: titleScreen,
    [SCREENS.LEVEL_SELECT]: levelSelectScreen,
    [SCREENS.PLAYING]: playingScreen,
    [SCREENS.LEVEL_COMPLETE]: levelCompleteScreen,
    [SCREENS.GAME_OVER]: gameOverScreen,
};

let currentScreen = null;
let transitioning = false;
let transitionPhase = 'none'; // 'fadeOut', 'fadeIn', 'none'
let transitionAlpha = 0;
let pendingScreen = null;
let lastTime = 0;

function init() {
    initRenderer();
    initInput();
    initAudio();

    // Load saved language
    const progress = loadProgress();
    setState({ lang: progress.lang || 'ru' });

    // Listen for screen changes
    subscribe('screen', (newScreen) => {
        if (transitioning) return;
        startTransition(newScreen);
    });

    // Start on title screen
    switchScreen(SCREENS.TITLE);

    // Start game loop
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

function startTransition(targetScreen) {
    transitioning = true;
    transitionPhase = 'fadeOut';
    transitionAlpha = 0;
    pendingScreen = targetScreen;
}

function switchScreen(screenName) {
    if (currentScreen && screens[currentScreen] && screens[currentScreen].exit) {
        screens[currentScreen].exit();
    }
    currentScreen = screenName;
    if (screens[currentScreen] && screens[currentScreen].enter) {
        screens[currentScreen].enter();
    }
}

function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, MAX_DELTA / 1000);
    lastTime = timestamp;

    // Update transition
    if (transitioning) {
        const fadeSpeed = 1000 / FADE_DURATION;
        if (transitionPhase === 'fadeOut') {
            transitionAlpha += dt * fadeSpeed;
            if (transitionAlpha >= 1) {
                transitionAlpha = 1;
                transitionPhase = 'fadeIn';
                switchScreen(pendingScreen);
            }
        } else if (transitionPhase === 'fadeIn') {
            transitionAlpha -= dt * fadeSpeed;
            if (transitionAlpha <= 0) {
                transitionAlpha = 0;
                transitionPhase = 'none';
                transitioning = false;
                pendingScreen = null;
            }
        }
    }

    // Update current screen
    if (screens[currentScreen] && screens[currentScreen].update) {
        screens[currentScreen].update(dt);
    }

    // Update tweens
    updateTweens(dt);

    // Draw
    const ctx = getCtx();
    clear('#000');

    if (screens[currentScreen] && screens[currentScreen].draw) {
        screens[currentScreen].draw(ctx);
    }

    // Draw transition overlay
    if (transitioning && transitionAlpha > 0) {
        ctx.fillStyle = `rgba(0, 0, 0, ${transitionAlpha})`;
        ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
    }

    requestAnimationFrame(gameLoop);
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
