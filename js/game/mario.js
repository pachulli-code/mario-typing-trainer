// Mario character: auto-running state machine, position, animation
import { MARIO_SPRITE } from '../sprites.js';
import { drawSprite } from '../renderer.js';
import { MARIO_STATES } from '../config.js';

export class Mario {
    constructor() {
        this.x = 120;           // screen x (fixed)
        this.y = 330;           // screen y
        this.baseY = 330;
        this.worldX = 0;        // world position (drives camera)
        this.runSpeed = 60;     // pixels per second in world space
        this.state = MARIO_STATES.RUN;
        this.frame = 1;
        this.frameTimer = 0;
        this.scale = 2;
        this.hitTimer = 0;
        this.celebrateTimer = 0;
        this.jumpVelocity = 0;
        this.isJumping = false;
        this.visible = true;
        this.blinkTimer = 0;
        this.bobTime = 0;
        this.paused = false;    // pause running (for flagpole sequence)
    }

    reset() {
        this.worldX = 0;
        this.y = this.baseY;
        this.state = MARIO_STATES.RUN;
        this.frame = 1;
        this.hitTimer = 0;
        this.celebrateTimer = 0;
        this.isJumping = false;
        this.jumpVelocity = 0;
        this.visible = true;
        this.blinkTimer = 0;
        this.paused = false;
    }

    triggerJump() {
        if (!this.isJumping) {
            this.isJumping = true;
            this.jumpVelocity = -200;
            this.state = MARIO_STATES.JUMP;
        }
    }

    triggerSmallJump() {
        if (!this.isJumping) {
            this.isJumping = true;
            this.jumpVelocity = -130;
            this.state = MARIO_STATES.JUMP;
        }
    }

    triggerHit() {
        this.state = MARIO_STATES.HIT;
        this.hitTimer = 0.6;
        this.blinkTimer = 0.8;
    }

    triggerCelebrate() {
        this.state = MARIO_STATES.CELEBRATE;
        this.celebrateTimer = 2;
        this.triggerJump();
    }

    update(dt) {
        this.bobTime += dt;

        // Auto-run: advance world position
        if (!this.paused && this.state !== MARIO_STATES.HIT) {
            this.worldX += this.runSpeed * dt;
        }

        // Jump physics
        if (this.isJumping) {
            this.y += this.jumpVelocity * dt;
            this.jumpVelocity += 550 * dt; // gravity
            if (this.y >= this.baseY) {
                this.y = this.baseY;
                this.isJumping = false;
                this.jumpVelocity = 0;
                if (this.state === MARIO_STATES.JUMP) {
                    this.state = this.paused ? MARIO_STATES.IDLE : MARIO_STATES.RUN;
                }
            }
        }

        // Hit timer
        if (this.hitTimer > 0) {
            this.hitTimer -= dt;
            if (this.hitTimer <= 0) {
                this.state = this.paused ? MARIO_STATES.IDLE : MARIO_STATES.RUN;
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
                this.state = this.paused ? MARIO_STATES.IDLE : MARIO_STATES.RUN;
            }
        }

        // Run animation frames
        if (this.state === MARIO_STATES.RUN) {
            this.frameTimer += dt;
            if (this.frameTimer > 0.1) {
                this.frameTimer = 0;
                this.frame = this.frame === 1 ? 2 : 1;
            }
            // Subtle vertical bob while running
            if (!this.isJumping) {
                this.y = this.baseY + Math.sin(this.bobTime * 10) * 1.5;
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
