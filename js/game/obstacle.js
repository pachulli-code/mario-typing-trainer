// Goomba obstacle - visual feedback on typing errors
import { GOOMBA_SPRITE } from '../sprites.js';
import { drawSprite } from '../renderer.js';

export class Obstacle {
    constructor() {
        this.goombas = [];
    }

    spawnGoomba(targetX, targetY) {
        this.goombas.push({
            x: targetX + 100,
            y: targetY + 20,
            startX: targetX + 100,
            targetX: targetX,
            scale: 2,
            progress: 0,
            speed: 3,
            frame: 0,
            frameTimer: 0,
            phase: 'approach', // 'approach' -> 'bump' -> 'leave'
            bumpTimer: 0
        });
    }

    update(dt) {
        for (let i = this.goombas.length - 1; i >= 0; i--) {
            const g = this.goombas[i];

            // Walk animation
            g.frameTimer += dt;
            if (g.frameTimer > 0.2) {
                g.frameTimer = 0;
                g.frame = g.frame === 0 ? 1 : 0;
            }

            if (g.phase === 'approach') {
                g.progress += dt * g.speed;
                const t = Math.min(g.progress, 1);
                g.x = g.startX + (g.targetX - g.startX) * t;

                if (t >= 1) {
                    g.phase = 'bump';
                    g.bumpTimer = 0.4;
                }
            } else if (g.phase === 'bump') {
                g.bumpTimer -= dt;
                if (g.bumpTimer <= 0) {
                    g.phase = 'leave';
                    g.progress = 0;
                    g.startX = g.x;
                    g.targetX = g.x + 120;
                }
            } else if (g.phase === 'leave') {
                g.progress += dt * g.speed;
                const t = Math.min(g.progress, 1);
                g.x = g.startX + (g.targetX - g.startX) * t;

                if (t >= 1) {
                    this.goombas.splice(i, 1);
                }
            }
        }
    }

    draw(ctx) {
        this.goombas.forEach(g => {
            ctx.save();
            ctx.translate(Math.round(g.x), Math.round(g.y));
            ctx.scale(g.scale, g.scale);
            drawSprite(GOOMBA_SPRITE, -8, -16, g.phase === 'leave', g.frame);
            ctx.restore();
        });
    }

    clear() {
        this.goombas.length = 0;
    }
}
