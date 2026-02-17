// MAIN GAMEPLAY SCREEN — side-scrolling runner with typing
import { VIRTUAL_WIDTH, VIRTUAL_HEIGHT, WORLDS, SCREENS, MAX_LIVES, COINS_PER_LIFE, LEVEL_TIME, WORDS_PER_LEVEL, STAR_THRESHOLDS } from '../config.js';
import { drawTextOutlined } from '../renderer.js';
import { getState, setState, resetLevelState } from '../state.js';
import { setKeyCallback, clearKeyCallback } from '../input.js';
import { drawBackground } from '../backgrounds.js';
import { Mario } from '../game/mario.js';
import { Cappy } from '../game/cappy.js';
import { CoinManager } from '../game/coin.js';
import { EnemyManager } from '../game/enemyManager.js';
import { Scenery } from '../game/scenery.js';
import { HUD } from '../game/hud.js';
import { ParticleSystem } from '../animation.js';
import { playCoinSound, playErrorSound, playCappySound, playJumpSound, playLevelCompleteSound } from '../audio.js';
import { wordsRu } from '../data/wordsRu.js';
import { wordsEn } from '../data/wordsEn.js';

let mario, cappy, coinManager, enemyManager, scenery, hud, particles;
let wordList = [];
let currentWordIndex = 0;
let timeLeft = LEVEL_TIME;
let cameraX = 0;
let gameTime = 0;
let worldIndex = 0;
let isGameActive = false;
let countdownTimer = 0;
let levelLength = 0;

// Flagpole finish sequence
let finishPhase = 'none'; // 'none', 'runToFlag', 'jumpToFlag', 'slideFlag', 'runToCastle', 'done'
let finishTimer = 0;
let flagpoleScreenX = 0;

export function enter() {
    worldIndex = getState().currentWorld;
    resetLevelState();

    // Load words for this level
    const world = WORLDS[worldIndex];
    const lang = getState().lang;
    const wordSource = lang === 'ru' ? wordsRu : wordsEn;
    const pool = wordSource[world.difficulty] || wordSource.letters;
    wordList = shuffle([...pool]).slice(0, WORDS_PER_LEVEL);

    // Calculate level length based on word count (wider level for more words)
    levelLength = 800 + wordList.length * 120;

    mario = new Mario();
    cappy = new Cappy();
    coinManager = new CoinManager();
    enemyManager = new EnemyManager();
    scenery = new Scenery(worldIndex, levelLength);
    hud = new HUD();
    particles = new ParticleSystem();

    enemyManager.setWords(wordList);

    currentWordIndex = 0;
    timeLeft = LEVEL_TIME;
    gameTime = 0;
    cameraX = 0;
    isGameActive = false;
    countdownTimer = 3;
    finishPhase = 'none';
    finishTimer = 0;

    setState({
        wordsTotal: wordList.length,
        wordsCompleted: 0,
        startTime: Date.now()
    });

    setKeyCallback(handleKey);
}

function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function handleKey(key) {
    if (!isGameActive) return;
    if (finishPhase !== 'none') return;

    const state = getState();
    if (state.lives <= 0) return;

    const expectedChar = enemyManager.getCurrentChar();
    if (!expectedChar) return;

    const totalChars = state.totalChars + 1;

    if (key === expectedChar || key.toLowerCase() === expectedChar.toLowerCase()) {
        // CORRECT
        const correctChars = state.correctChars + 1;
        const streak = state.streak + 1;
        const bestStreak = Math.max(streak, state.bestStreak);

        let coinsEarned = 1;
        if (streak > 0 && streak % 10 === 0) coinsEarned += 5;
        const coins = state.coins + coinsEarned;

        let lives = state.lives;
        if (coins >= COINS_PER_LIFE && Math.floor((coins - coinsEarned) / COINS_PER_LIFE) < Math.floor(coins / COINS_PER_LIFE)) {
            lives = Math.min(MAX_LIVES, lives + 1);
        }

        setState({ correctChars, totalChars, streak, bestStreak, coins, lives });

        playCoinSound();

        // Cappy throw to active enemy
        const enemyPos = enemyManager.getActiveEnemyScreenPos(cameraX);
        if (enemyPos) {
            playCappySound();
            cappy.throw(
                mario.x + 20, mario.y + 5,
                enemyPos.x, enemyPos.y,
                () => {
                    coinManager.spawn(enemyPos.x, enemyPos.y - 20);
                    particles.emit(enemyPos.x, enemyPos.y - 20, 5, {
                        speed: 80, life: 0.5, size: 2,
                        colors: ['#ffdd00', '#ffaa00', '#ffee66'],
                        gravity: 100
                    });
                }
            );
        }

        // Mario jumps on correct typing
        mario.triggerSmallJump();

        const wordDone = enemyManager.typeChar();
        hud.showCombo(streak);

        if (wordDone) {
            currentWordIndex++;
            setState({ wordsCompleted: currentWordIndex });

            playJumpSound();
            mario.triggerJump();

            // Coin burst on word complete
            if (enemyPos) {
                for (let i = 0; i < 3; i++) {
                    coinManager.spawn(enemyPos.x + (i - 1) * 15, enemyPos.y - 30);
                }
                particles.emit(enemyPos.x, enemyPos.y, 12, {
                    speed: 120, life: 0.6, size: 3,
                    colors: ['#ffdd00', '#ffaa00', '#ff4444', '#44ff44'],
                    gravity: 80
                });
            }

            // Check if all words done
            if (currentWordIndex >= wordList.length && enemyManager.allWordsDefeated()) {
                startFinishSequence();
            }
        }

        updateStats();

    } else {
        // WRONG
        const streak = 0;
        const lives = state.lives - 1;
        setState({ totalChars, streak, lives });

        playErrorSound();
        setState({ shakeAmount: 6 });

        enemyManager.onError();
        mario.triggerHit();

        particles.emit(mario.x + 16, mario.y + 10, 8, {
            speed: 60, life: 0.4, size: 3,
            colors: ['#ff0000', '#ff4444', '#ff8888'],
            gravity: 80
        });

        if (lives <= 0) {
            setTimeout(() => {
                clearKeyCallback();
                setState({ screen: SCREENS.GAME_OVER });
            }, 1000);
        }

        updateStats();
    }
}

function updateStats() {
    const state = getState();
    const elapsedMinutes = (Date.now() - state.startTime) / 60000;
    const wpm = elapsedMinutes > 0 ? Math.round((state.correctChars / 5) / elapsedMinutes) : 0;
    const accuracy = state.totalChars > 0 ? Math.round((state.correctChars / state.totalChars) * 100) : 100;
    setState({ wpm, accuracy });
}

function startFinishSequence() {
    isGameActive = false;
    finishPhase = 'runToFlag';
    finishTimer = 0;
    mario.runSpeed = 120; // speed up for finish
    playLevelCompleteSound();
}

export function update(dt) {
    gameTime += dt;

    // Countdown
    if (countdownTimer > 0) {
        countdownTimer -= dt;
        if (countdownTimer <= 0) {
            isGameActive = true;
            setState({ startTime: Date.now() });
        }
        mario.update(dt); // animate even during countdown
        return;
    }

    // Finish sequence
    if (finishPhase !== 'none') {
        updateFinishSequence(dt);
        mario.update(dt);
        cappy.update(dt);
        coinManager.update(dt);
        particles.update(dt);
        scenery.update(dt);
        cameraX = mario.worldX - mario.x;
        return;
    }

    if (!isGameActive) return;

    // Timer
    timeLeft -= dt;
    if (timeLeft <= 0) {
        timeLeft = 0;
        clearKeyCallback();
        setState({ screen: SCREENS.GAME_OVER });
        return;
    }

    // Update all entities
    mario.update(dt);
    cappy.update(dt);
    coinManager.update(dt);
    hud.update(dt);
    particles.update(dt);
    scenery.update(dt);

    // Camera follows Mario
    cameraX = mario.worldX - mario.x;

    // Enemy update - check for collisions
    const enemyResult = enemyManager.update(dt, cameraX, mario.worldX);
    if (enemyResult === 'hit') {
        const state = getState();
        const lives = state.lives - 1;
        setState({ lives, streak: 0 });
        playErrorSound();
        setState({ shakeAmount: 4 });
        mario.triggerHit();

        particles.emit(mario.x + 16, mario.y + 10, 6, {
            speed: 50, life: 0.3, size: 3,
            colors: ['#ff0000', '#ff4444'],
            gravity: 80
        });

        if (lives <= 0) {
            setTimeout(() => {
                clearKeyCallback();
                setState({ screen: SCREENS.GAME_OVER });
            }, 1000);
        }
    }

    // Check if all words complete (enemies might finish between spawns)
    if (currentWordIndex >= wordList.length && enemyManager.allWordsDefeated() && finishPhase === 'none') {
        startFinishSequence();
    }

    // Decay screen shake
    const shake = getState().shakeAmount;
    if (shake > 0) {
        setState({ shakeAmount: Math.max(0, shake - dt * 20) });
    }
}

function updateFinishSequence(dt) {
    finishTimer += dt;
    const flagWorldX = scenery.flagpoleX;

    switch (finishPhase) {
        case 'runToFlag':
            // Mario runs toward flagpole
            if (mario.worldX >= flagWorldX - 20) {
                mario.paused = true;
                mario.triggerJump();
                finishPhase = 'jumpToFlag';
                finishTimer = 0;
            }
            break;

        case 'jumpToFlag':
            // Waiting for jump to peak
            if (finishTimer > 0.3) {
                finishPhase = 'slideFlag';
                finishTimer = 0;
                scenery.startFlagSlide();
                mario.paused = true;
                // Mario slides down
                playJumpSound();
            }
            break;

        case 'slideFlag':
            // Mario descends with flag
            mario.y = Math.min(mario.baseY, mario.y + 100 * dt);
            if (finishTimer > 1.5) {
                finishPhase = 'runToCastle';
                finishTimer = 0;
                mario.paused = false;
                mario.runSpeed = 100;

                // Firework particles
                for (let i = 0; i < 5; i++) {
                    const fx = mario.x + Math.random() * 200;
                    const fy = 50 + Math.random() * 100;
                    particles.emit(fx, fy, 15, {
                        speed: 100, life: 1, size: 3,
                        colors: ['#ff4444', '#44ff44', '#4444ff', '#ffdd00', '#ff44ff'],
                        gravity: 40, vy: -50
                    });
                }
            }
            break;

        case 'runToCastle':
            // Mario runs into castle
            if (mario.worldX >= scenery.castleX + 30) {
                mario.paused = true;
                mario.visible = false;
                finishPhase = 'done';
                finishTimer = 0;

                // Calculate stars
                const state = getState();
                let stars = 0;
                if (state.accuracy >= STAR_THRESHOLDS[0]) stars = 1;
                if (state.accuracy >= STAR_THRESHOLDS[1]) stars = 2;
                if (state.accuracy >= STAR_THRESHOLDS[2]) stars = 3;
                setState({ stars });
            }
            break;

        case 'done':
            if (finishTimer > 1.5) {
                clearKeyCallback();
                setState({ screen: SCREENS.LEVEL_COMPLETE });
            }
            break;
    }
}

export function draw(ctx) {
    const state = getState();

    // Apply screen shake
    ctx.save();
    if (state.shakeAmount > 0) {
        const sx = (Math.random() - 0.5) * state.shakeAmount * 2;
        const sy = (Math.random() - 0.5) * state.shakeAmount * 2;
        ctx.translate(sx, sy);
    }

    // Background (parallax)
    drawBackground(ctx, worldIndex, cameraX, gameTime);

    // Scenery (pipes, bushes, staircase, flagpole, castle)
    scenery.draw(ctx, cameraX);

    // Enemies
    enemyManager.draw(ctx, cameraX);

    // Coins
    coinManager.draw(ctx);

    // Cappy
    cappy.draw(ctx);

    // Mario
    mario.draw(ctx);

    // Particles
    particles.draw(ctx);

    // Streak visual effects
    drawStreakEffects(ctx, state.streak, gameTime);

    ctx.restore();

    // HUD (not affected by shake)
    if (finishPhase === 'none') {
        hud.draw(ctx, timeLeft);
    }

    // Countdown overlay
    if (countdownTimer > 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

        const num = Math.ceil(countdownTimer);
        const scale = 1 + (countdownTimer - Math.floor(countdownTimer)) * 0.5;
        drawTextOutlined(
            num > 0 ? num.toString() : 'GO!',
            VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2 - 30,
            Math.round(60 * scale),
            '#ffdd00', '#000', 'center'
        );

        const world = WORLDS[worldIndex];
        const lang = state.lang;
        const name = lang === 'ru' ? world.name : world.nameEn;
        drawTextOutlined(name, VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2 + 40, 20, world.accentColor, '#000', 'center');
    }

    // Finish sequence text
    if (finishPhase === 'done') {
        const lang = state.lang;
        const text = lang === 'ru' ? 'УРОВЕНЬ ПРОЙДЕН!' : 'LEVEL CLEAR!';
        const pulse = 1 + Math.sin(gameTime * 4) * 0.1;
        drawTextOutlined(text, VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2 - 40,
            Math.round(32 * pulse), '#ffdd00', '#000', 'center');
    }
}

function drawStreakEffects(ctx, streak, time) {
    if (streak < 5) return;

    // Speed lines behind Mario (streak 5+)
    ctx.save();
    ctx.globalAlpha = Math.min(0.6, (streak - 4) * 0.1);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    for (let i = 0; i < Math.min(streak - 3, 8); i++) {
        const y = mario.y + 5 + i * 4;
        const len = 20 + i * 8;
        const x = mario.x - 10 - len + Math.sin(time * 8 + i) * 5;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + len, y);
        ctx.stroke();
    }
    ctx.restore();

    // Gold sparkle trail (streak 10+)
    if (streak >= 10 && Math.random() < 0.3) {
        particles.emit(mario.x - 5, mario.y + 20, 1, {
            speed: 30, life: 0.4, size: 2,
            colors: ['#ffdd00', '#ffee66', '#ffaa00'],
            gravity: -20
        });
    }

    // Rainbow border (streak 15+)
    if (streak >= 15) {
        const hue = (time * 200) % 360;
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.strokeStyle = `hsl(${hue}, 100%, 60%)`;
        ctx.lineWidth = 4;
        ctx.strokeRect(2, 2, VIRTUAL_WIDTH - 4, VIRTUAL_HEIGHT - 4);
        ctx.restore();
    }

    // Aura behind Mario (streak 20+)
    if (streak >= 20) {
        ctx.save();
        const grad = ctx.createRadialGradient(
            mario.x + 16, mario.y + 16, 5,
            mario.x + 16, mario.y + 16, 40
        );
        const alpha = 0.2 + Math.sin(time * 6) * 0.1;
        grad.addColorStop(0, `rgba(255,221,0,${alpha})`);
        grad.addColorStop(1, 'rgba(255,221,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(mario.x - 30, mario.y - 30, 90, 80);
        ctx.restore();
    }
}

export function exit() {
    clearKeyCallback();
}
