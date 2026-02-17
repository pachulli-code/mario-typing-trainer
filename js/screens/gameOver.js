// Game Over screen
import { VIRTUAL_WIDTH, VIRTUAL_HEIGHT, SCREENS, WORLDS } from '../config.js';
import { drawTextOutlined, drawRoundRect } from '../renderer.js';
import { MARIO_SPRITE, GOOMBA_SPRITE } from '../sprites.js';
import { drawSprite } from '../renderer.js';
import { getState, setState } from '../state.js';
import { setKeyCallback, clearKeyCallback } from '../input.js';
import { playGameOverSound, playSelectSound } from '../audio.js';

let time = 0;
let selectedOption = 0;
const optionsRu = ['Попробовать снова', 'Выбор мира'];
const optionsEn = ['Try Again', 'World Select'];

export function enter() {
    time = 0;
    selectedOption = 0;
    playGameOverSound();
    setKeyCallback(handleKey);
}

function handleKey(key) {
    if (key === 'ArrowUp' || key === 'ArrowDown') {
        selectedOption = selectedOption === 0 ? 1 : 0;
        playSelectSound();
    }
    if (key === 'Enter' || key === ' ') {
        playSelectSound();
        clearKeyCallback();
        if (selectedOption === 0) {
            // Retry same level
            setState({ screen: SCREENS.PLAYING });
        } else {
            setState({ screen: SCREENS.LEVEL_SELECT });
        }
    }
    if (key === 'Escape') {
        clearKeyCallback();
        setState({ screen: SCREENS.LEVEL_SELECT });
    }
}

export function update(dt) {
    time += dt;
}

export function draw(ctx) {
    const state = getState();
    const lang = state.lang;
    const options = lang === 'ru' ? optionsRu : optionsEn;

    // Dark background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

    // Red vignette
    const grad = ctx.createRadialGradient(
        VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2, 50,
        VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2, VIRTUAL_WIDTH / 2
    );
    grad.addColorStop(0, 'rgba(100,0,0,0.3)');
    grad.addColorStop(1, 'rgba(50,0,0,0.8)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

    // GAME OVER text
    const titleText = lang === 'ru' ? 'ИГРА ОКОНЧЕНА' : 'GAME OVER';
    const scale = 1 + Math.sin(time * 2) * 0.05;
    drawTextOutlined(titleText, VIRTUAL_WIDTH / 2, 60, Math.round(36 * scale), '#ff0000', '#000', 'center');

    // Mario hurt sprite
    ctx.save();
    ctx.translate(VIRTUAL_WIDTH / 2 - 50, 120);
    ctx.scale(3, 3);
    drawSprite(MARIO_SPRITE, 0, 0, false, 4); // hit frame
    ctx.restore();

    // Goomba
    ctx.save();
    ctx.translate(VIRTUAL_WIDTH / 2 + 30, 150);
    ctx.scale(2.5, 2.5);
    drawSprite(GOOMBA_SPRITE, 0, 0, false, Math.floor(time * 2) % 2);
    ctx.restore();

    // Stats
    const cardX = VIRTUAL_WIDTH / 2 - 110;
    const cardY = 210;
    drawRoundRect(cardX, cardY, 220, 80, 8, 'rgba(0,0,0,0.7)');

    const statLabels = lang === 'ru'
        ? ['Скорость:', 'Точность:', 'Монеты:']
        : ['Speed:', 'Accuracy:', 'Coins:'];

    drawTextOutlined(statLabels[0], cardX + 15, cardY + 12, 14, '#aaa', '#000');
    drawTextOutlined(`${state.wpm} WPM`, cardX + 205, cardY + 12, 14, '#fff', '#000', 'right');

    drawTextOutlined(statLabels[1], cardX + 15, cardY + 32, 14, '#aaa', '#000');
    drawTextOutlined(`${state.accuracy}%`, cardX + 205, cardY + 32, 14, '#ff4444', '#000', 'right');

    drawTextOutlined(statLabels[2], cardX + 15, cardY + 52, 14, '#aaa', '#000');
    drawTextOutlined(`${state.coins}`, cardX + 205, cardY + 52, 14, '#ffdd00', '#000', 'right');

    // Menu options
    for (let i = 0; i < options.length; i++) {
        const optY = 320 + i * 40;
        const isSelected = i === selectedOption;

        if (isSelected) {
            drawRoundRect(VIRTUAL_WIDTH / 2 - 120, optY - 5, 240, 32, 6, 'rgba(255,255,255,0.1)');
            const arrowX = VIRTUAL_WIDTH / 2 - 110 + Math.sin(time * 4) * 5;
            drawTextOutlined('▶', arrowX, optY, 20, '#ffdd00', '#000', 'center');
        }

        drawTextOutlined(
            options[i],
            VIRTUAL_WIDTH / 2, optY,
            20,
            isSelected ? '#ffdd00' : '#888',
            '#000', 'center'
        );
    }
}

export function exit() {
    clearKeyCallback();
}
