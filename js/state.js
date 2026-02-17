// Simple pub/sub state manager
const state = {
    screen: 'title',
    prevScreen: null,
    currentWorld: 0,
    lives: 3,
    coins: 0,
    totalCoins: 0,
    wpm: 0,
    accuracy: 100,
    correctChars: 0,
    totalChars: 0,
    streak: 0,
    bestStreak: 0,
    stars: 0,
    lang: 'ru',
    soundEnabled: true,
    transitioning: false,
    transitionAlpha: 0,
    shakeAmount: 0,
    // Level progress
    wordsCompleted: 0,
    wordsTotal: 0,
    startTime: 0,
    elapsedTime: 0
};

const listeners = {};

export function getState() {
    return state;
}

export function setState(updates) {
    const changed = [];
    for (const key in updates) {
        if (state[key] !== updates[key]) {
            state[key] = updates[key];
            changed.push(key);
        }
    }
    changed.forEach(key => {
        if (listeners[key]) {
            listeners[key].forEach(fn => fn(state[key], state));
        }
    });
    if (changed.length > 0 && listeners['*']) {
        listeners['*'].forEach(fn => fn(state));
    }
}

export function subscribe(key, fn) {
    if (!listeners[key]) listeners[key] = [];
    listeners[key].push(fn);
    return () => {
        listeners[key] = listeners[key].filter(f => f !== fn);
    };
}

export function resetLevelState() {
    setState({
        lives: 3,
        coins: 0,
        wpm: 0,
        accuracy: 100,
        correctChars: 0,
        totalChars: 0,
        streak: 0,
        bestStreak: 0,
        stars: 0,
        wordsCompleted: 0,
        startTime: 0,
        elapsedTime: 0,
        shakeAmount: 0
    });
}
