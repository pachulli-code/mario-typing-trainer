// Scrolling level scenery: decorative elements, flagpole ending, castle
import { VIRTUAL_HEIGHT, WORLDS } from '../config.js';
import { PIPE_SPRITE, BRICK_SPRITE, QUESTION_BLOCK_SPRITE, FLAGBALL_SPRITE, FLAG_SPRITE } from '../sprites.js';
import { drawSprite, drawRoundRect, drawTextOutlined } from '../renderer.js';

const GROUND_Y = VIRTUAL_HEIGHT - 60;

export class Scenery {
    constructor(worldIndex, levelLength) {
        this.worldIndex = worldIndex;
        this.levelLength = levelLength; // total world-space width
        this.items = [];
        this.flagpoleX = levelLength - 200;
        this.castleX = levelLength - 80;
        this.flagY = 0;       // flag vertical offset (0 = top, animated on finish)
        this.flagSliding = false;
        this.flagSlideProgress = 0;
        this.generateItems();
    }

    generateItems() {
        const world = WORLDS[this.worldIndex];
        const seed = this.worldIndex * 1000;

        // Scatter decorative elements
        for (let x = 200; x < this.flagpoleX - 100; x += 80 + pseudoRandom(seed + x) * 60) {
            const type = this.getItemType(pseudoRandom(seed + x + 1));
            this.items.push({
                worldX: x,
                type,
                height: 10 + pseudoRandom(seed + x + 2) * 15,
                variant: Math.floor(pseudoRandom(seed + x + 3) * 3)
            });
        }

        // Staircase blocks before flagpole (classic Mario ending)
        const stairX = this.flagpoleX - 130;
        for (let step = 0; step < 8; step++) {
            for (let h = 0; h <= step; h++) {
                this.items.push({
                    worldX: stairX + step * 16 * 2,
                    type: 'stairBlock',
                    blockY: GROUND_Y - (h + 1) * 16 * 2,
                    step: step
                });
            }
        }
    }

    getItemType(rand) {
        const types = ['pipe', 'bush', 'cloud', 'flowers', 'rocks'];
        return types[Math.floor(rand * types.length)];
    }

    startFlagSlide() {
        this.flagSliding = true;
        this.flagSlideProgress = 0;
        this.flagY = 0;
    }

    update(dt) {
        if (this.flagSliding) {
            this.flagSlideProgress += dt * 0.8;
            this.flagY = Math.min(this.flagSlideProgress, 1) * 140;
            if (this.flagSlideProgress >= 1) {
                this.flagSliding = false;
            }
        }
    }

    draw(ctx, cameraX) {
        // Draw decorative items
        this.items.forEach(item => {
            const screenX = item.worldX - cameraX;
            if (screenX < -80 || screenX > 880) return;

            switch (item.type) {
                case 'pipe':
                    this.drawPipe(ctx, screenX, item.height);
                    break;
                case 'bush':
                    this.drawBush(ctx, screenX, item.variant);
                    break;
                case 'cloud':
                    this.drawCloudItem(ctx, screenX, item.variant);
                    break;
                case 'flowers':
                    this.drawFlowers(ctx, screenX, item.variant);
                    break;
                case 'rocks':
                    this.drawRocks(ctx, screenX, item.variant);
                    break;
                case 'stairBlock':
                    this.drawStairBlock(ctx, screenX, item.blockY);
                    break;
            }
        });

        // Draw flagpole
        this.drawFlagpole(ctx, this.flagpoleX - cameraX);

        // Draw castle
        this.drawCastle(ctx, this.castleX - cameraX);
    }

    drawPipe(ctx, x, h) {
        const scale = 2;
        const pipeH = (h + 10) * scale;
        ctx.save();
        // Pipe top (lip)
        ctx.fillStyle = '#22aa22';
        ctx.fillRect(x - 4, GROUND_Y - pipeH, 36, 8);
        ctx.fillStyle = '#66dd66';
        ctx.fillRect(x - 4, GROUND_Y - pipeH, 36, 3);
        ctx.fillStyle = '#116611';
        ctx.fillRect(x - 4, GROUND_Y - pipeH + 6, 36, 2);
        // Pipe body
        ctx.fillStyle = '#22aa22';
        ctx.fillRect(x, GROUND_Y - pipeH + 8, 28, pipeH - 8);
        ctx.fillStyle = '#66dd66';
        ctx.fillRect(x, GROUND_Y - pipeH + 8, 6, pipeH - 8);
        ctx.fillStyle = '#116611';
        ctx.fillRect(x + 22, GROUND_Y - pipeH + 8, 6, pipeH - 8);
        ctx.restore();
    }

    drawBush(ctx, x, variant) {
        const w = 30 + variant * 15;
        const h = 14 + variant * 4;
        ctx.fillStyle = '#22aa22';
        ctx.beginPath();
        ctx.ellipse(x + w / 2, GROUND_Y - h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        // Highlight
        ctx.fillStyle = '#44cc44';
        ctx.beginPath();
        ctx.ellipse(x + w / 2 - 3, GROUND_Y - h / 2 - 2, w / 3, h / 3, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    drawCloudItem(ctx, x, variant) {
        const y = 60 + variant * 40;
        const w = 40 + variant * 10;
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y, w / 2, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + w / 3, y - 4, w / 4, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + w * 0.7, y - 2, w / 4, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    drawFlowers(ctx, x, variant) {
        const colors = ['#ff4444', '#ffdd00', '#ff88ff', '#4488ff', '#ff8844'];
        for (let i = 0; i < 3 + variant; i++) {
            const fx = x + i * 10;
            const fh = 8 + (i % 3) * 3;
            // Stem
            ctx.fillStyle = '#22aa22';
            ctx.fillRect(fx + 2, GROUND_Y - fh, 2, fh);
            // Petal
            ctx.fillStyle = colors[(variant + i) % colors.length];
            ctx.beginPath();
            ctx.arc(fx + 3, GROUND_Y - fh - 3, 4, 0, Math.PI * 2);
            ctx.fill();
            // Center
            ctx.fillStyle = '#ffdd00';
            ctx.beginPath();
            ctx.arc(fx + 3, GROUND_Y - fh - 3, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawRocks(ctx, x, variant) {
        ctx.fillStyle = '#888888';
        ctx.beginPath();
        ctx.moveTo(x, GROUND_Y);
        ctx.lineTo(x + 5, GROUND_Y - 8 - variant * 3);
        ctx.lineTo(x + 12, GROUND_Y - 10 - variant * 2);
        ctx.lineTo(x + 20, GROUND_Y - 6 - variant * 3);
        ctx.lineTo(x + 25, GROUND_Y);
        ctx.fill();
        ctx.fillStyle = '#aaaaaa';
        ctx.beginPath();
        ctx.moveTo(x + 4, GROUND_Y - 6 - variant * 2);
        ctx.lineTo(x + 8, GROUND_Y - 9 - variant * 3);
        ctx.lineTo(x + 14, GROUND_Y - 7 - variant * 2);
        ctx.fill();
    }

    drawStairBlock(ctx, x, blockY) {
        const s = 2;
        ctx.save();
        ctx.translate(x, blockY);
        ctx.scale(s, s);
        drawSprite(BRICK_SPRITE, 0, 0);
        ctx.restore();
    }

    drawFlagpole(ctx, screenX) {
        if (screenX < -50 || screenX > 900) return;

        const poleX = screenX + 14;
        const poleTop = GROUND_Y - 200;
        const poleBottom = GROUND_Y;

        // Pole (thin dark line)
        ctx.fillStyle = '#444444';
        ctx.fillRect(poleX - 1, poleTop, 4, poleBottom - poleTop);

        // Pole highlight
        ctx.fillStyle = '#888888';
        ctx.fillRect(poleX, poleTop, 1, poleBottom - poleTop);

        // Flag (slides down)
        const flagBaseY = poleTop + 10 + this.flagY;
        ctx.save();
        ctx.translate(poleX + 3, flagBaseY);
        ctx.scale(2, 2);
        drawSprite(FLAG_SPRITE, 0, 0);
        ctx.restore();

        // Gold ball on top
        ctx.save();
        ctx.translate(poleX - 6, poleTop - 12);
        ctx.scale(2, 2);
        drawSprite(FLAGBALL_SPRITE, 0, 0);
        ctx.restore();

        // Base block
        ctx.fillStyle = '#22aa22';
        ctx.fillRect(poleX - 8, poleBottom - 16, 20, 16);
        ctx.fillStyle = '#116611';
        ctx.fillRect(poleX - 8, poleBottom - 16, 20, 3);
    }

    drawCastle(ctx, screenX) {
        if (screenX < -120 || screenX > 920) return;

        const castleW = 100;
        const castleH = 80;
        const baseY = GROUND_Y - castleH;

        // Main body
        ctx.fillStyle = '#cc8844';
        ctx.fillRect(screenX, baseY, castleW, castleH);

        // Darker outline
        ctx.fillStyle = '#aa6622';
        ctx.fillRect(screenX, baseY, castleW, 3);
        ctx.fillRect(screenX, baseY, 3, castleH);
        ctx.fillRect(screenX + castleW - 3, baseY, 3, castleH);

        // Battlements (top crenellations)
        ctx.fillStyle = '#cc8844';
        for (let i = 0; i < 5; i++) {
            ctx.fillRect(screenX + 2 + i * 20, baseY - 14, 14, 14);
        }
        ctx.fillStyle = '#aa6622';
        for (let i = 0; i < 5; i++) {
            ctx.fillRect(screenX + 2 + i * 20, baseY - 14, 14, 3);
        }

        // Door (dark archway)
        const doorX = screenX + castleW / 2 - 12;
        const doorY = GROUND_Y - 35;
        ctx.fillStyle = '#000000';
        ctx.fillRect(doorX, doorY, 24, 35);
        ctx.beginPath();
        ctx.arc(doorX + 12, doorY, 12, Math.PI, 0);
        ctx.fill();

        // Window (above door)
        ctx.fillStyle = '#4488ff';
        ctx.beginPath();
        ctx.arc(screenX + castleW / 2, baseY + 20, 8, 0, Math.PI * 2);
        ctx.fill();
        // Window cross
        ctx.fillStyle = '#aa6622';
        ctx.fillRect(screenX + castleW / 2 - 1, baseY + 13, 2, 14);
        ctx.fillRect(screenX + castleW / 2 - 7, baseY + 19, 14, 2);

        // Tower/flag on top
        const towerX = screenX + castleW / 2 - 5;
        ctx.fillStyle = '#cc8844';
        ctx.fillRect(towerX, baseY - 30, 10, 16);
        ctx.fillStyle = '#aa6622';
        ctx.fillRect(towerX, baseY - 30, 10, 3);
        // Small flag
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(towerX + 10, baseY - 38, 12, 8);
        // Pole
        ctx.fillStyle = '#444444';
        ctx.fillRect(towerX + 9, baseY - 40, 2, 12);
    }
}

// Deterministic pseudo-random (0-1) from seed
function pseudoRandom(seed) {
    const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
}
