// Virtual resolution and game constants
export const VIRTUAL_WIDTH = 800;
export const VIRTUAL_HEIGHT = 450;

export const MAX_LIVES = 3;
export const COINS_PER_LIFE = 50;
export const LEVEL_TIME = 120; // seconds per level
export const FADE_DURATION = 300; // ms for screen transitions
export const MAX_DELTA = 50; // cap delta time at 50ms

// Star thresholds (accuracy %)
export const STAR_THRESHOLDS = [70, 85, 95];

// Words per level
export const WORDS_PER_LEVEL = 20;

// World definitions
export const WORLDS = [
    {
        id: 'cap',
        name: 'Шапочное Королевство',
        nameEn: 'Cap Kingdom',
        difficulty: 'letters',
        bgColor: '#3a1078',
        groundColor: '#6c3483',
        accentColor: '#c39bd3',
        skyColors: ['#1a0a3e', '#3a1078', '#6c3483'],
        unlocked: true
    },
    {
        id: 'cascade',
        name: 'Каскадное Королевство',
        nameEn: 'Cascade Kingdom',
        difficulty: 'shortWords',
        bgColor: '#1b5e20',
        groundColor: '#2e7d32',
        accentColor: '#81c784',
        skyColors: ['#0d3311', '#1b5e20', '#4caf50'],
        unlocked: false
    },
    {
        id: 'sand',
        name: 'Песчаное Королевство',
        nameEn: 'Sand Kingdom',
        difficulty: 'longWords',
        bgColor: '#e65100',
        groundColor: '#bf360c',
        accentColor: '#ffcc02',
        skyColors: ['#ff8f00', '#e65100', '#bf360c'],
        unlocked: false
    },
    {
        id: 'metro',
        name: 'Городское Королевство',
        nameEn: 'Metro Kingdom',
        difficulty: 'phrases',
        bgColor: '#0d47a1',
        groundColor: '#1a237e',
        accentColor: '#64b5f6',
        skyColors: ['#0a1929', '#0d47a1', '#1565c0'],
        unlocked: false
    },
    {
        id: 'moon',
        name: 'Лунное Королевство',
        nameEn: 'Moon Kingdom',
        difficulty: 'sentences',
        bgColor: '#1a0033',
        groundColor: '#2d004d',
        accentColor: '#ce93d8',
        skyColors: ['#0a0015', '#1a0033', '#4a0080'],
        unlocked: false
    }
];

// Mario states
export const MARIO_STATES = {
    IDLE: 'idle',
    RUN: 'run',
    JUMP: 'jump',
    HIT: 'hit',
    CELEBRATE: 'celebrate'
};

// Screen names
export const SCREENS = {
    TITLE: 'title',
    LEVEL_SELECT: 'levelSelect',
    PLAYING: 'playing',
    LEVEL_COMPLETE: 'levelComplete',
    GAME_OVER: 'gameOver'
};
