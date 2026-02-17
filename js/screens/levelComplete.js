// Level complete screen — results, stars, next world unlock
import { VIRTUAL_WIDTH, VIRTUAL_HEIGHT, WORLDS, SCREENS, STAR_THRESHOLDS } from '../config.js';
import { drawTextOutlined, drawRoundRect } from '../renderer.js';
import { STAR_SPRITE, STAR_EMPTY_SPRITE, MARIO_SPRITE } from '../sprites.js';
import { drawSprite } from '../renderer.js';
import { getState, setState } from '../state.js';
import { setKeyCallback, clearKeyCallback } from '../input.js';
import { saveBestScore, unlockWorld, addTotalCoins, loadProgress } from '../storage.js';
import { playLevelCompleteSound, playSelectSound } from '../audio.js';

let time = 0;
let starsRevealed = 0;
let savedScore = false;

export function enter() {
    time = 0;
    starsRevealed = 0;
    savedScore = false;
    playLevelCompleteSound();
    setKeyCallback(handleKey);
}

function handleKey(key) {
    if (key === 'Enter' || key === ' ') {
        playSelectSound();
        clearKeyCallback();

        // Save score
        if (!savedScore) {
            const state = getState();
            saveBestScore(state.currentWorld, {
                wpm: state.wpm,
                accuracy: state.accuracy,
                stars: state.stars,
                coins: state.coins
            });
            addTotalCoins(state.coins);

            // Unlock next world if earned at least 1 star
            if (state.stars >= 1 && state.currentWorld < WORLDS.length - 1) {
                unlockWorld(state.currentWorld + 1);
            }
            savedScore = true;
        }

        setState({ screen: SCREENS.LEVEL_SELECT });
    }
    if (key === 'Escape') {
        clearKeyCallback();
        setState({ screen: SCREENS.LEVEL_SELECT });
    }
}

export function update(dt) {
    time += dt;

    // Reveal stars over time
    const state = getState();
    if (time > 1 && starsRevealed < state.stars) {
        if (time > 1 + starsRevealed * 0.5) {
            starsRevealed++;
        }
    }

    // Save once
    if (!savedScore && time > 0.5) {
        const s = getState();
        saveBestScore(s.currentWorld, {
            wpm: s.wpm,
            accuracy: s.accuracy,
            stars: s.stars,
            coins: s.coins
        });
        addTotalCoins(s.coins);
        if (s.stars >= 1 && s.currentWorld < WORLDS.length - 1) {
            unlockWorld(s.currentWorld + 1);
        }
        savedScore = true;
    }
}

export function draw(ctx) {
    const state = getState();
    const world = WORLDS[state.currentWorld];

    // Background
    const grad = ctx.createLinearGradient(0, 0, 0, VIRTUAL_HEIGHT);
    grad.addColorStop(0, world.bgColor);
    grad.addColorStop(1, '#000');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

    // Celebration particles
    for (let i = 0; i < 20; i++) {
        const x = (i * 47 + time * 30 * (i % 3 + 1)) % VIRTUAL_WIDTH;
        const y = (i * 31 + time * 50) % VIRTUAL_HEIGHT;
        const colors = ['#ffdd00', '#ff4444', '#44ff44', '#44aaff', '#ff44ff'];
        ctx.fillStyle = colors[i % colors.length];
        ctx.globalAlpha = 0.6;
        ctx.fillRect(x, y, 3, 3);
    }
    ctx.globalAlpha = 1;

    // Title
    const lang = state.lang;
    const title = lang === 'ru' ? 'УРОВЕНЬ ПРОЙДЕН!' : 'LEVEL COMPLETE!';
    drawTextOutlined(title, VIRTUAL_WIDTH / 2, 40, 30, '#ffdd00', '#000', 'center');

    // World name
    const worldName = lang === 'ru' ? world.name : world.nameEn;
    drawTextOutlined(worldName, VIRTUAL_WIDTH / 2, 75, 18, world.accentColor, '#000', 'center');

    // Mario celebrating
    ctx.save();
    ctx.translate(VIRTUAL_WIDTH / 2 - 24, 100 + Math.sin(time * 3) * 5);
    ctx.scale(3, 3);
    drawSprite(MARIO_SPRITE, 0, 0, false, 5); // celebrate frame
    ctx.restore();

    // Stars
    const starY = 170;
    for (let i = 0; i < 3; i++) {
        ctx.save();
        const starX = VIRTUAL_WIDTH / 2 - 60 + i * 50;
        const revealed = i < starsRevealed;
        const scale = revealed ? 3 + Math.sin(time * 4 + i) * 0.3 : 3;
        ctx.translate(starX, starY);
        ctx.scale(scale, scale);
        drawSprite(revealed ? STAR_SPRITE : STAR_EMPTY_SPRITE, 0, 0);
        ctx.restore();
    }

    // Stats card
    const cardX = VIRTUAL_WIDTH / 2 - 130;
    const cardY = 220;
    drawRoundRect(cardX, cardY, 260, 120, 8, 'rgba(0,0,0,0.7)');

    const statLabels = lang === 'ru'
        ? ['Скорость:', 'Точность:', 'Монеты:', 'Серия:']
        : ['Speed:', 'Accuracy:', 'Coins:', 'Best streak:'];

    const stats = [
        { label: statLabels[0], value: `${state.wpm} WPM`, color: '#fff' },
        { label: statLabels[1], value: `${state.accuracy}%`, color: state.accuracy >= 95 ? '#44ff44' : state.accuracy >= 70 ? '#ffdd00' : '#ff4444' },
        { label: statLabels[2], value: `${state.coins}`, color: '#ffdd00' },
        { label: statLabels[3], value: `${state.bestStreak}`, color: '#ff8844' },
    ];

    stats.forEach((s, i) => {
        const y = cardY + 18 + i * 25;
        drawTextOutlined(s.label, cardX + 20, y, 16, '#aaa', '#000', 'left');
        drawTextOutlined(s.value, cardX + 240, y, 16, s.color, '#000', 'right');
    });

    // Accuracy thresholds
    const thresholdY = 350;
    for (let i = 0; i < 3; i++) {
        const reached = state.accuracy >= STAR_THRESHOLDS[i];
        drawTextOutlined(
            `★ ${STAR_THRESHOLDS[i]}%`,
            VIRTUAL_WIDTH / 2 - 80 + i * 80, thresholdY,
            12, reached ? '#ffdd00' : '#555', '#000', 'center'
        );
    }

    // Next world unlock message
    if (state.stars >= 1 && state.currentWorld < WORLDS.length - 1) {
        const nextWorld = WORLDS[state.currentWorld + 1];
        const unlockMsg = lang === 'ru'
            ? `Открыт: ${nextWorld.name}!`
            : `Unlocked: ${nextWorld.nameEn}!`;
        drawTextOutlined(unlockMsg, VIRTUAL_WIDTH / 2, 380, 16, '#44ff44', '#000', 'center');
    }

    // Continue prompt
    const continueText = lang === 'ru' ? 'Нажми Enter для продолжения' : 'Press Enter to continue';
    const alpha = (Math.sin(time * 3) + 1) / 2;
    ctx.globalAlpha = 0.5 + alpha * 0.5;
    drawTextOutlined(continueText, VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT - 30, 14, '#fff', '#000', 'center');
    ctx.globalAlpha = 1;
}

export function exit() {
    clearKeyCallback();
}
