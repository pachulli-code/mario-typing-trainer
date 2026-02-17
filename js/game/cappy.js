// Cappy (hat) throw animation
import { CAPPY_SPRITE } from '../sprites.js';
import { drawSprite } from '../renderer.js';

export class Cappy {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.startX = 0;
        this.startY = 0;
        this.active = false;
        this.progress = 0;
        this.speed = 4; // complete throw in ~0.25s
        this.scale = 2;
        this.frame = 0;
        this.frameTimer = 0;
        this.returning = false;
        this.onHit = null;
    }

    throw(fromX, fromY, toX, toY, onHit) {
        this.startX = fromX;
        this.startY = fromY;
        this.targetX = toX;
        this.targetY = toY;
        this.x = fromX;
        this.y = fromY;
        this.active = true;
        this.progress = 0;
        this.returning = false;
        this.onHit = onHit;
    }

    update(dt) {
        if (!this.active) return;

        this.progress += dt * this.speed;

        // Frame animation
        this.frameTimer += dt;
        if (this.frameTimer > 0.06) {
            this.frameTimer = 0;
            this.frame = this.frame === 0 ? 1 : 0;
        }

        if (!this.returning) {
            // Flying to target
            const t = Math.min(this.progress, 1);
            const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
            this.x = this.startX + (this.targetX - this.startX) * eased;
            this.y = this.startY + (this.targetY - this.startY) * eased - Math.sin(t * Math.PI) * 30;

            if (t >= 1) {
                if (this.onHit) this.onHit();
                this.returning = true;
                this.progress = 0;
                this.startX = this.x;
                this.startY = this.y;
            }
        } else {
            // Returning
            const t = Math.min(this.progress, 1);
            const eased = t * t; // easeInQuad
            this.x = this.startX + (this.targetX - this.startX) * eased;
            this.y = this.startY + (this.targetY - this.startY) * eased;
            // Return target = Mario position area
            if (t >= 0.6) {
                this.active = false;
            }
        }
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();
        ctx.translate(Math.round(this.x), Math.round(this.y));

        // Rotation based on progress
        const angle = this.progress * Math.PI * 4;
        ctx.rotate(angle);
        ctx.scale(this.scale, this.scale);
        drawSprite(CAPPY_SPRITE, -CAPPY_SPRITE.width / 2, -CAPPY_SPRITE.height / 2, false, this.frame);
        ctx.restore();
    }
}
