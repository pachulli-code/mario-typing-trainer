// Question Block with text to type
import { QUESTION_BLOCK_SPRITE } from '../sprites.js';
import { drawSprite, drawText, drawTextOutlined } from '../renderer.js';

export class QuestionBlock {
    constructor() {
        this.x = 350;
        this.y = 260;
        this.baseY = 260;
        this.scale = 2.5;
        this.word = '';
        this.typedIndex = 0;
        this.active = true;
        this.bounceTimer = 0;
        this.hitAnimation = false;
        this.visible = true;
    }

    setWord(word) {
        this.word = word;
        this.typedIndex = 0;
        this.active = true;
        this.hitAnimation = false;
        this.visible = true;
    }

    getCurrentChar() {
        if (this.typedIndex < this.word.length) {
            return this.word[this.typedIndex];
        }
        return null;
    }

    typeChar() {
        this.typedIndex++;
        this.triggerBounce();
        return this.typedIndex >= this.word.length;
    }

    triggerBounce() {
        this.bounceTimer = 0.15;
    }

    triggerHit() {
        this.hitAnimation = true;
        this.bounceTimer = 0.3;
    }

    isComplete() {
        return this.typedIndex >= this.word.length;
    }

    update(dt) {
        if (this.bounceTimer > 0) {
            this.bounceTimer -= dt;
            this.y = this.baseY - Math.sin((this.bounceTimer / 0.15) * Math.PI) * 8;
            if (this.bounceTimer <= 0) {
                this.y = this.baseY;
            }
        }
    }

    draw(ctx) {
        if (!this.visible) return;

        // Draw block
        ctx.save();
        ctx.translate(Math.round(this.x), Math.round(this.y));
        ctx.scale(this.scale, this.scale);
        drawSprite(QUESTION_BLOCK_SPRITE, -8, -8);
        ctx.restore();

        // Draw the word with typed/untyped highlighting
        const fontSize = this.word.length > 10 ? 18 : (this.word.length > 5 ? 22 : 28);
        const charWidth = fontSize * 0.6;
        const totalWidth = this.word.length * charWidth;
        const startX = this.x - totalWidth / 2;
        const textY = this.y - 50;

        // Background for text
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        const padding = 6;
        ctx.beginPath();
        ctx.roundRect(startX - padding, textY - padding, totalWidth + padding * 2, fontSize + padding * 2, 4);
        ctx.fill();

        for (let i = 0; i < this.word.length; i++) {
            const charX = startX + i * charWidth;
            let color;
            if (i < this.typedIndex) {
                color = '#44ff44'; // typed correctly - green
            } else if (i === this.typedIndex) {
                color = '#ffdd00'; // current char - gold/yellow, pulsing
            } else {
                color = '#ffffff'; // upcoming - white
            }

            // Draw current char with underline
            if (i === this.typedIndex) {
                ctx.fillStyle = '#ffdd00';
                ctx.fillRect(charX, textY + fontSize, charWidth - 2, 2);
            }

            drawTextOutlined(this.word[i], charX, textY, fontSize, color, '#000', 'left');
        }
    }
}
