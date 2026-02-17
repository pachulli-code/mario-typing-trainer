// LocalStorage: save/load game progress

const STORAGE_KEY = 'mario-typing-trainer';

const defaultData = {
    unlockedWorlds: [true, false, false, false, false],
    bestScores: [null, null, null, null, null], // { wpm, accuracy, stars, coins }
    totalCoins: 0,
    lang: 'ru'
};

export function loadProgress() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const data = JSON.parse(raw);
            return { ...defaultData, ...data };
        }
    } catch (e) {
        console.warn('Failed to load progress:', e);
    }
    return { ...defaultData };
}

export function saveProgress(data) {
    try {
        const current = loadProgress();
        const merged = { ...current, ...data };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    } catch (e) {
        console.warn('Failed to save progress:', e);
    }
}

export function unlockWorld(index) {
    const data = loadProgress();
    if (index < data.unlockedWorlds.length) {
        data.unlockedWorlds[index] = true;
        saveProgress(data);
    }
}

export function saveBestScore(worldIndex, score) {
    const data = loadProgress();
    const prev = data.bestScores[worldIndex];
    if (!prev || score.stars > prev.stars ||
        (score.stars === prev.stars && score.wpm > prev.wpm)) {
        data.bestScores[worldIndex] = score;
        saveProgress(data);
    }
}

export function addTotalCoins(amount) {
    const data = loadProgress();
    data.totalCoins += amount;
    saveProgress(data);
}

export function saveLang(lang) {
    saveProgress({ lang });
}
