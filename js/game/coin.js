// Coin particles - fly from blocks to HUD
import { COIN_SPRITE } from '../sprites.js';
import { drawSprite } from '../renderer.js';

export class CoinManager {
    constructor() {
        this.coins = [];
        this.frameTimer = 0;
        this.frame = 0;
    }

    spawn(x, y) {
        this.coins.push({
            x, y,
            startX: x,
            startY: y,
            targetX: 120, // HUD coin counter position
            targetY: 10,
            progress: 0,
            speed: 2.5,
            scale: 2,
            bouncePhase: 0,
            phase: 'bounce' // 'bounce' -> 'fly'
        });
    }

    update(dt) {
        // Coin rotation animation
        this.frameTimer += dt;
        if (this.frameTimer > 0.15) {
            this.frameTimer = 0;
            this.frame = this.frame === 0 ? 1 : 0;
        }

        for (let i = this.coins.length - 1; i >= 0; i--) {
            const c = this.coins[i];

            if (c.phase === 'bounce') {
                // Pop out of block upward
                c.bouncePhase += dt * 4;
                c.y = c.startY - Math.sin(c.bouncePhase * Math.PI) * 40;

                if (c.bouncePhase >= 1) {
                    c.phase = 'fly';
                    c.startX = c.x;
                    c.startY = c.y;
                    c.progress = 0;
                }
            } else {
                // Fly to HUD
                c.progress += dt * c.speed;
                const t = Math.min(c.progress, 1);
                const eased = t * t * (3 - 2 * t); // smoothstep
                c.x = c.startX + (c.targetX - c.startX) * eased;
                c.y = c.startY + (c.targetY - c.startY) * eased;
                c.scale = 2 - t; // shrink as it approaches HUD

                if (t >= 1) {
                    this.coins.splice(i, 1);
                }
            }
        }
    }

    draw(ctx) {
        this.coins.forEach(c => {
            ctx.save();
            ctx.translate(Math.round(c.x), Math.round(c.y));
            ctx.scale(c.scale, c.scale);
            drawSprite(COIN_SPRITE, -5, -5, false, this.frame);
            ctx.restore();
        });
    }

    clear() {
        this.coins.length = 0;
    }
}
