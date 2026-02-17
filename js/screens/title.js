// Title screen with animations
import { VIRTUAL_WIDTH, VIRTUAL_HEIGHT, SCREENS } from '../config.js';
import { drawTextOutlined, drawRoundRect, getCtx } from '../renderer.js';
import { MARIO_SPRITE, CAPPY_SPRITE } from '../sprites.js';
import { drawSprite } from '../renderer.js';
import { setState } from '../state.js';
import { setKeyCallback, clearKeyCallback } from '../input.js';
import { playSelectSound } from '../audio.js';

let time = 0;
let marioY = 0;
let cappyAngle = 0;
let selectedOption = 0;
const options = ['Начать игру', 'Start Game'];

export function enter() {
    time = 0;
    selectedOption = 0;
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
        setState({ screen: SCREENS.LEVEL_SELECT });
    }
}

export function update(dt) {
    time += dt;
    marioY = Math.sin(time * 2) * 8;
    cappyAngle += dt * 3;
}

export function draw(ctx) {
    // Background
    const grad = ctx.createLinearGradient(0, 0, 0, VIRTUAL_HEIGHT);
    grad.addColorStop(0, '#1a0a3e');
    grad.addColorStop(0.5, '#3a1078');
    grad.addColorStop(1, '#0d47a1');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

    // Animated stars
    for (let i = 0; i < 40; i++) {
        const x = (i * 127 + 50) % VIRTUAL_WIDTH;
        const y = (i * 89 + 20) % VIRTUAL_HEIGHT;
        const twinkle = (Math.sin(time * 2 + i * 0.7) + 1) / 2;
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.3 + twinkle * 0.7;
        ctx.fillRect(x, y, 2, 2);
    }
    ctx.globalAlpha = 1;

    // Floating coins decoration
    for (let i = 0; i < 6; i++) {
        const cx = 100 + i * 120;
        const cy = 50 + Math.sin(time * 1.5 + i * 1.1) * 20;
        ctx.fillStyle = '#ffdd00';
        ctx.beginPath();
        ctx.arc(cx, cy, 5, 0, Math.PI * 2);
        ctx.fill();
    }

    // Title
    const titleY = 80 + Math.sin(time * 1.5) * 5;
    drawTextOutlined('MARIO', VIRTUAL_WIDTH / 2, titleY, 48, '#ff0000', '#000', 'center');
    drawTextOutlined('TYPING TRAINER', VIRTUAL_WIDTH / 2, titleY + 50, 32, '#ffdd00', '#000', 'center');

    // Mario sprite
    ctx.save();
    ctx.translate(VIRTUAL_WIDTH / 2 - 80, 200 + marioY);
    ctx.scale(3, 3);
    drawSprite(MARIO_SPRITE, 0, 0, false, Math.floor(time * 3) % 2 === 0 ? 0 : 1);
    ctx.restore();

    // Cappy flying around
    ctx.save();
    const cappyX = VIRTUAL_WIDTH / 2 + 40 + Math.cos(cappyAngle) * 50;
    const cappyY = 220 + Math.sin(cappyAngle) * 20;
    ctx.translate(cappyX, cappyY);
    ctx.rotate(cappyAngle * 2);
    ctx.scale(2, 2);
    drawSprite(CAPPY_SPRITE, -6, -4, false, 0);
    ctx.restore();

    // Menu options
    for (let i = 0; i < options.length; i++) {
        const optY = 320 + i * 40;
        const isSelected = i === selectedOption;

        if (isSelected) {
            // Selection highlight
            drawRoundRect(VIRTUAL_WIDTH / 2 - 110, optY - 5, 220, 32, 6, 'rgba(255,255,255,0.15)');
            // Arrow indicator
            const arrowX = VIRTUAL_WIDTH / 2 - 100 + Math.sin(time * 4) * 5;
            drawTextOutlined('▶', arrowX, optY, 20, '#ffdd00', '#000', 'center');
        }

        drawTextOutlined(
            options[i],
            VIRTUAL_WIDTH / 2, optY,
            22,
            isSelected ? '#ffdd00' : '#aaa',
            '#000', 'center'
        );
    }

    // Instructions
    drawTextOutlined(
        'Нажми Enter / Press Enter',
        VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT - 30,
        14, '#888', '#000', 'center'
    );
}

export function exit() {
    clearKeyCallback();
}
