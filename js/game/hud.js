// HUD: lives, coins, WPM, accuracy, timer, combo
import { VIRTUAL_WIDTH } from '../config.js';
import { HEART_SPRITE, HEART_EMPTY_SPRITE, COIN_SPRITE } from '../sprites.js';
import { drawSprite, drawText, drawTextOutlined } from '../renderer.js';
import { getState } from '../state.js';

export class HUD {
    constructor() {
        this.comboText = '';
        this.comboTimer = 0;
        this.comboX = 400;
        this.comboY = 200;
        this.comboScale = 1;
    }

    showCombo(streak) {
        if (streak >= 5) {
            this.comboText = `${streak} COMBO!`;
            this.comboTimer = 1;
            this.comboScale = 2;
        }
    }

    update(dt) {
        if (this.comboTimer > 0) {
            this.comboTimer -= dt;
            this.comboScale = 1 + this.comboTimer;
            this.comboY -= dt * 30;
        }
    }

    draw(ctx, timeLeft) {
        const state = getState();

        // Lives (top-left)
        for (let i = 0; i < 3; i++) {
            const sprite = i < state.lives ? HEART_SPRITE : HEART_EMPTY_SPRITE;
            ctx.save();
            ctx.translate(15 + i * 28, 12);
            ctx.scale(2.2, 2.2);
            drawSprite(sprite, 0, 0);
            ctx.restore();
        }

        // Coins (next to hearts)
        ctx.save();
        ctx.translate(110, 10);
        ctx.scale(1.8, 1.8);
        drawSprite(COIN_SPRITE, 0, 0, false, 0);
        ctx.restore();
        drawTextOutlined(`×${state.coins}`, 134, 12, 18, '#ffdd00', '#000');

        // WPM (top center-left)
        drawTextOutlined(`WPM: ${state.wpm}`, 220, 12, 16, '#fff', '#000');

        // Accuracy (top center-right)
        const accColor = state.accuracy >= 95 ? '#44ff44' :
                         state.accuracy >= 70 ? '#ffdd00' : '#ff4444';
        drawTextOutlined(`${state.accuracy}%`, 340, 12, 16, accColor, '#000');

        // Timer (top right)
        const mins = Math.floor(timeLeft / 60);
        const secs = Math.floor(timeLeft % 60);
        const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;
        const timeColor = timeLeft < 15 ? '#ff4444' : '#fff';
        drawTextOutlined(timeStr, VIRTUAL_WIDTH - 15, 12, 18, timeColor, '#000', 'right');

        // Word progress
        drawTextOutlined(
            `${state.wordsCompleted}/${state.wordsTotal}`,
            VIRTUAL_WIDTH - 15, 34, 14, '#aaa', '#000', 'right'
        );

        // Combo text
        if (this.comboTimer > 0) {
            const alpha = Math.min(1, this.comboTimer * 2);
            ctx.globalAlpha = alpha;
            const colors = ['#ff4444', '#ffdd00', '#44ff44', '#44aaff', '#ff44ff'];
            const colorIdx = Math.floor(Date.now() / 100) % colors.length;
            drawTextOutlined(
                this.comboText,
                VIRTUAL_WIDTH / 2, this.comboY,
                Math.round(14 * this.comboScale),
                colors[colorIdx], '#000', 'center'
            );
            ctx.globalAlpha = 1;
        }

        // Streak indicator
        if (state.streak >= 3) {
            const streakColor = state.streak >= 10 ? '#ff44ff' :
                               state.streak >= 5 ? '#ffdd00' : '#44ff44';
            drawTextOutlined(
                `🔥${state.streak}`,
                VIRTUAL_WIDTH / 2, 38,
                14, streakColor, '#000', 'center'
            );
        }
    }
}
