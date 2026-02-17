// Mario character: state machine, position, animation
import { MARIO_SPRITE } from '../sprites.js';
import { drawSprite } from '../renderer.js';
import { MARIO_STATES } from '../config.js';

export class Mario {
    constructor() {
        this.x = 120;
        this.y = 330; // ground level
        this.baseY = 330;
        this.state = MARIO_STATES.IDLE;
        this.frame = 0;
        this.frameTimer = 0;
        this.scale = 2;
        this.hitTimer = 0;
        this.celebrateTimer = 0;
        this.runTimer = 0;
        this.jumpVelocity = 0;
        this.isJumping = false;
        this.visible = true;
        this.blinkTimer = 0;
    }

    reset() {
        this.x = 120;
        this.y = this.baseY;
        this.state = MARIO_STATES.IDLE;
        this.frame = 0;
        this.hitTimer = 0;
        this.celebrateTimer = 0;
        this.isJumping = false;
        this.jumpVelocity = 0;
        this.visible = true;
        this.blinkTimer = 0;
    }

    triggerJump() {
        if (!this.isJumping) {
            this.isJumping = true;
            this.jumpVelocity = -180;
            this.state = MARIO_STATES.JUMP;
        }
    }

    triggerHit() {
        this.state = MARIO_STATES.HIT;
        this.hitTimer = 0.8;
        this.blinkTimer = 0.8;
    }

    triggerCelebrate() {
        this.state = MARIO_STATES.CELEBRATE;
        this.celebrateTimer = 2;
        this.triggerJump();
    }

    triggerRun() {
        if (this.state !== MARIO_STATES.HIT) {
            this.state = MARIO_STATES.RUN;
            this.runTimer = 0.5;
        }
    }

    update(dt) {
        // Jump physics
        if (this.isJumping) {
            this.y += this.jumpVelocity * dt;
            this.jumpVelocity += 500 * dt; // gravity
            if (this.y >= this.baseY) {
                this.y = this.baseY;
                this.isJumping = false;
                this.jumpVelocity = 0;
                if (this.state === MARIO_STATES.JUMP) {
                    this.state = MARIO_STATES.IDLE;
                }
            }
        }

        // Hit timer
        if (this.hitTimer > 0) {
            this.hitTimer -= dt;
            if (this.hitTimer <= 0) {
                this.state = MARIO_STATES.IDLE;
            }
        }

        // Blink invincibility
        if (this.blinkTimer > 0) {
            this.blinkTimer -= dt;
            this.visible = Math.floor(this.blinkTimer * 10) % 2 === 0;
            if (this.blinkTimer <= 0) {
                this.visible = true;
            }
        }

        // Celebrate timer
        if (this.celebrateTimer > 0) {
            this.celebrateTimer -= dt;
            if (this.celebrateTimer <= 0) {
                this.state = MARIO_STATES.IDLE;
            }
        }

        // Run timer
        if (this.runTimer > 0) {
            this.runTimer -= dt;
            if (this.runTimer <= 0 && this.state === MARIO_STATES.RUN) {
                this.state = MARIO_STATES.IDLE;
            }
        }

        // Animation frames
        this.frameTimer += dt;
        if (this.frameTimer > 0.12) {
            this.frameTimer = 0;
            if (this.state === MARIO_STATES.RUN) {
                this.frame = this.frame === 1 ? 2 : 1;
            }
        }
    }

    draw(ctx) {
        if (!this.visible) return;

        let frameIndex = 0;
        switch (this.state) {
            case MARIO_STATES.IDLE: frameIndex = 0; break;
            case MARIO_STATES.RUN: frameIndex = this.frame; break;
            case MARIO_STATES.JUMP: frameIndex = 3; break;
            case MARIO_STATES.HIT: frameIndex = 4; break;
            case MARIO_STATES.CELEBRATE: frameIndex = 5; break;
        }

        ctx.save();
        ctx.translate(Math.round(this.x), Math.round(this.y));
        ctx.scale(this.scale, this.scale);
        drawSprite(MARIO_SPRITE, 0, 0, false, frameIndex);
        ctx.restore();
    }
}
