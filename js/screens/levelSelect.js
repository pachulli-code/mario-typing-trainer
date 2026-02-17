// World/level selection map
import { VIRTUAL_WIDTH, VIRTUAL_HEIGHT, WORLDS, SCREENS } from '../config.js';
import { drawTextOutlined, drawRoundRect } from '../renderer.js';
import { STAR_SPRITE, STAR_EMPTY_SPRITE } from '../sprites.js';
import { drawSprite } from '../renderer.js';
import { getState, setState } from '../state.js';
import { setKeyCallback, clearKeyCallback } from '../input.js';
import { loadProgress } from '../storage.js';
import { playSelectSound } from '../audio.js';

let selectedWorld = 0;
let time = 0;
let unlockedWorlds = [];
let bestScores = [];

export function enter() {
    time = 0;
    const progress = loadProgress();
    unlockedWorlds = progress.unlockedWorlds;
    bestScores = progress.bestScores;
    selectedWorld = 0;
    // Find first unlocked world
    for (let i = 0; i < unlockedWorlds.length; i++) {
        if (unlockedWorlds[i]) selectedWorld = i;
    }
    setKeyCallback(handleKey);
}

function handleKey(key) {
    if (key === 'ArrowRight' || key === 'ArrowDown') {
        const next = selectedWorld + 1;
        if (next < WORLDS.length && unlockedWorlds[next]) {
            selectedWorld = next;
            playSelectSound();
        }
    }
    if (key === 'ArrowLeft' || key === 'ArrowUp') {
        const prev = selectedWorld - 1;
        if (prev >= 0 && unlockedWorlds[prev]) {
            selectedWorld = prev;
            playSelectSound();
        }
    }
    if (key === 'Enter' || key === ' ') {
        if (unlockedWorlds[selectedWorld]) {
            playSelectSound();
            clearKeyCallback();
            setState({
                currentWorld: selectedWorld,
                screen: SCREENS.PLAYING
            });
        }
    }
    if (key === 'Escape') {
        clearKeyCallback();
        setState({ screen: SCREENS.TITLE });
    }
}

export function update(dt) {
    time += dt;
}

export function draw(ctx) {
    // Background
    const grad = ctx.createLinearGradient(0, 0, 0, VIRTUAL_HEIGHT);
    grad.addColorStop(0, '#0a0a2a');
    grad.addColorStop(1, '#1a1a4a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

    // Title
    drawTextOutlined('Выбери Мир / Select World', VIRTUAL_WIDTH / 2, 20, 22, '#ffdd00', '#000', 'center');

    // World cards
    const cardW = 130;
    const cardH = 200;
    const startX = (VIRTUAL_WIDTH - (WORLDS.length * (cardW + 15) - 15)) / 2;

    WORLDS.forEach((world, i) => {
        const x = startX + i * (cardW + 15);
        const y = 70;
        const isSelected = i === selectedWorld;
        const isUnlocked = unlockedWorlds[i];

        // Card background
        const bgColor = isUnlocked ? world.bgColor : '#333';
        const yOffset = isSelected ? -8 + Math.sin(time * 3) * 3 : 0;

        // Selection glow
        if (isSelected) {
            ctx.shadowColor = world.accentColor;
            ctx.shadowBlur = 15;
        }

        drawRoundRect(x, y + yOffset, cardW, cardH, 8, bgColor);
        ctx.shadowBlur = 0;

        if (isSelected) {
            // Border
            ctx.strokeStyle = '#ffdd00';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(x, y + yOffset, cardW, cardH, 8);
            ctx.stroke();
        }

        if (!isUnlocked) {
            // Lock icon
            drawTextOutlined('🔒', x + cardW / 2, y + yOffset + 70, 30, '#666', '#000', 'center');
            drawTextOutlined('???', x + cardW / 2, y + yOffset + 110, 16, '#666', '#000', 'center');
        } else {
            // World number
            drawTextOutlined(`${i + 1}`, x + cardW / 2, y + yOffset + 12, 28, world.accentColor, '#000', 'center');

            // World name
            const lang = getState().lang;
            const name = lang === 'ru' ? world.name : world.nameEn;
            // Word wrap for long names
            const words = name.split(' ');
            let line1 = words[0] || '';
            let line2 = words.slice(1).join(' ');
            drawTextOutlined(line1, x + cardW / 2, y + yOffset + 48, 12, '#fff', '#000', 'center');
            if (line2) {
                drawTextOutlined(line2, x + cardW / 2, y + yOffset + 64, 12, '#fff', '#000', 'center');
            }

            // Difficulty indicator
            const diffLabels = {
                letters: 'АБВ',
                shortWords: 'Слова',
                longWords: 'Длинные',
                phrases: 'Фразы',
                sentences: 'Текст'
            };
            const diffLabelsEn = {
                letters: 'ABC',
                shortWords: 'Words',
                longWords: 'Long',
                phrases: 'Phrases',
                sentences: 'Text'
            };
            const labels = lang === 'ru' ? diffLabels : diffLabelsEn;
            drawTextOutlined(labels[world.difficulty], x + cardW / 2, y + yOffset + 90, 11, world.accentColor, '#000', 'center');

            // Best score stars
            const score = bestScores[i];
            if (score) {
                for (let s = 0; s < 3; s++) {
                    ctx.save();
                    ctx.translate(x + 30 + s * 25, y + yOffset + 120);
                    ctx.scale(1.5, 1.5);
                    const sprite = s < score.stars ? STAR_SPRITE : STAR_EMPTY_SPRITE;
                    drawSprite(sprite, 0, 0);
                    ctx.restore();
                }
                drawTextOutlined(`${score.wpm} WPM`, x + cardW / 2, y + yOffset + 150, 11, '#aaa', '#000', 'center');
                drawTextOutlined(`${score.accuracy}%`, x + cardW / 2, y + yOffset + 165, 11, '#aaa', '#000', 'center');
            }

            // Colored accent bar at bottom
            ctx.fillStyle = world.accentColor;
            ctx.beginPath();
            ctx.roundRect(x + 10, y + yOffset + cardH - 15, cardW - 20, 6, 3);
            ctx.fill();
        }
    });

    // Path connecting worlds
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    for (let i = 0; i < WORLDS.length - 1; i++) {
        const x1 = startX + i * (cardW + 15) + cardW;
        const x2 = startX + (i + 1) * (cardW + 15);
        const y = 170;
        ctx.moveTo(x1, y);
        ctx.lineTo(x2, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Instructions
    drawTextOutlined(
        '← → Выбор   Enter Играть   Esc Назад',
        VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT - 25,
        12, '#666', '#000', 'center'
    );
}

export function exit() {
    clearKeyCallback();
}
