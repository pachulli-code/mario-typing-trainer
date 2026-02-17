// EnemyManager: spawns varied enemies carrying words
import { GOOMBA_SPRITE, KOOPA_SPRITE, BOO_SPRITE, PIRANHA_SPRITE } from '../sprites.js';
import { drawSprite, drawTextOutlined } from '../renderer.js';

const ENEMY_TYPES = [
    { id: 'goomba', sprite: GOOMBA_SPRITE, speed: 30, scale: 2, offsetY: 20 },
    { id: 'koopa',  sprite: KOOPA_SPRITE,  speed: 40, scale: 2, offsetY: 16 },
    { id: 'boo',    sprite: BOO_SPRITE,    speed: 25, scale: 2, offsetY: 12 },
    { id: 'piranha', sprite: PIRANHA_SPRITE, speed: 35, scale: 2, offsetY: 16 },
];

export class EnemyManager {
    constructor() {
        this.enemies = [];
        this.wordQueue = [];
        this.wordsSpawned = 0;
        this.spawnTimer = 0;
        this.spawnInterval = 4;
        this.activeEnemy = null;
        this.frameTimer = 0;
        this.globalFrame = 0;
        this.groundY = 390 - 32;  // above ground
    }

    setWords(words) {
        this.wordQueue = [...words];
        this.wordsSpawned = 0;
        this.enemies = [];
        this.activeEnemy = null;
        this.spawnTimer = 0.5; // first enemy spawns quickly
    }

    spawnEnemy(cameraX) {
        if (this.wordQueue.length === 0) return;

        const word = this.wordQueue.shift();
        const idx = this.wordsSpawned;
        this.wordsSpawned++;

        // Choose enemy type based on progression
        let typeIdx;
        if (idx < 5) {
            typeIdx = 0; // Goombas first
        } else if (idx < 10) {
            typeIdx = Math.random() < 0.6 ? 0 : 1; // Mix Goomba + Koopa
        } else if (idx < 15) {
            typeIdx = Math.floor(Math.random() * 3); // Add Boo
        } else {
            typeIdx = Math.floor(Math.random() * 4); // All types
        }

        const type = ENEMY_TYPES[typeIdx];

        // Speed increases slightly with progression
        const speedMult = 1 + idx * 0.03;

        const enemy = {
            type: type,
            word: word,
            typedIndex: 0,
            worldX: cameraX + 850, // spawn off-screen right
            y: this.groundY - type.offsetY,
            speed: type.speed * speedMult,
            scale: type.scale,
            frame: 0,
            frameTimer: 0,
            state: 'walking',    // walking, active, defeated, fled
            defeatTimer: 0,
            defeatType: null,    // squash, shell, fade
            flashTimer: 0,
            alpha: 1,
            scaleY: 1,
        };

        this.enemies.push(enemy);

        // Decrease spawn interval over time
        this.spawnInterval = Math.max(2.5, 4 - idx * 0.08);
    }

    getCurrentChar() {
        if (!this.activeEnemy || this.activeEnemy.state !== 'active') {
            this.selectActiveEnemy();
        }
        if (this.activeEnemy && this.activeEnemy.typedIndex < this.activeEnemy.word.length) {
            return this.activeEnemy.word[this.activeEnemy.typedIndex];
        }
        return null;
    }

    getCurrentWord() {
        if (this.activeEnemy) return this.activeEnemy.word;
        return '';
    }

    getTypedIndex() {
        if (this.activeEnemy) return this.activeEnemy.typedIndex;
        return 0;
    }

    selectActiveEnemy() {
        // Find nearest walking enemy
        let nearest = null;
        let nearestX = Infinity;
        for (const e of this.enemies) {
            if (e.state === 'walking' || e.state === 'active') {
                if (e.worldX < nearestX) {
                    nearestX = e.worldX;
                    nearest = e;
                }
            }
        }
        if (nearest && nearest !== this.activeEnemy) {
            if (this.activeEnemy) this.activeEnemy.state = 'walking';
            nearest.state = 'active';
            this.activeEnemy = nearest;
        }
    }

    typeChar() {
        if (!this.activeEnemy) return false;
        this.activeEnemy.typedIndex++;
        if (this.activeEnemy.typedIndex >= this.activeEnemy.word.length) {
            this.defeatEnemy(this.activeEnemy);
            return true; // word complete
        }
        return false;
    }

    onError() {
        if (this.activeEnemy) {
            this.activeEnemy.flashTimer = 0.3;
            this.activeEnemy.speed *= 1.5; // speed up on error
        }
    }

    defeatEnemy(enemy) {
        enemy.state = 'defeated';
        enemy.defeatTimer = 0.5;

        switch (enemy.type.id) {
            case 'goomba':
                enemy.defeatType = 'squash';
                break;
            case 'koopa':
                enemy.defeatType = 'shell';
                break;
            case 'boo':
                enemy.defeatType = 'fade';
                break;
            case 'piranha':
                enemy.defeatType = 'squash';
                break;
        }

        if (this.activeEnemy === enemy) {
            this.activeEnemy = null;
        }
    }

    getActiveEnemyScreenPos(cameraX) {
        if (this.activeEnemy) {
            return {
                x: this.activeEnemy.worldX - cameraX,
                y: this.activeEnemy.y
            };
        }
        return null;
    }

    hasWordsLeft() {
        return this.wordQueue.length > 0 || this.enemies.some(e => e.state !== 'defeated' && e.state !== 'fled');
    }

    allWordsDefeated() {
        return this.wordQueue.length === 0 &&
               !this.enemies.some(e => e.state === 'walking' || e.state === 'active');
    }

    update(dt, cameraX, marioWorldX) {
        // Animation frame
        this.frameTimer += dt;
        if (this.frameTimer > 0.2) {
            this.frameTimer = 0;
            this.globalFrame = this.globalFrame === 0 ? 1 : 0;
        }

        // Spawn timer
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0 && this.wordQueue.length > 0) {
            this.spawnEnemy(cameraX);
            this.spawnTimer = this.spawnInterval;
        }

        // Update enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];

            e.frameTimer += dt;

            if (e.state === 'walking' || e.state === 'active') {
                // Move toward Mario
                e.worldX -= e.speed * dt;

                // Flash decay
                if (e.flashTimer > 0) e.flashTimer -= dt;

                // Check if reached Mario
                if (e.worldX <= marioWorldX + 50) {
                    e.state = 'fled';
                    e.defeatTimer = 0.3;
                    if (this.activeEnemy === e) {
                        this.activeEnemy = null;
                    }
                    return 'hit'; // signal that Mario gets hit
                }
            } else if (e.state === 'defeated') {
                e.defeatTimer -= dt;

                // Defeat animations
                if (e.defeatType === 'squash') {
                    e.scaleY = Math.max(0, e.defeatTimer / 0.5);
                } else if (e.defeatType === 'shell') {
                    e.worldX += 200 * dt; // shell flies away
                    e.frame = 2; // shell frame for koopa
                } else if (e.defeatType === 'fade') {
                    e.alpha = Math.max(0, e.defeatTimer / 0.5);
                }

                if (e.defeatTimer <= 0) {
                    this.enemies.splice(i, 1);
                }
            } else if (e.state === 'fled') {
                e.defeatTimer -= dt;
                e.alpha = Math.max(0, e.defeatTimer / 0.3);
                if (e.defeatTimer <= 0) {
                    this.enemies.splice(i, 1);
                }
            }
        }

        // Auto-select active enemy if none
        if (!this.activeEnemy || this.activeEnemy.state === 'defeated' || this.activeEnemy.state === 'fled') {
            this.activeEnemy = null;
            this.selectActiveEnemy();
        }

        return null;
    }

    draw(ctx, cameraX) {
        this.enemies.forEach(e => {
            const screenX = e.worldX - cameraX;
            if (screenX < -50 || screenX > 850) return;

            ctx.save();
            ctx.globalAlpha = e.alpha;

            // Flash red on error
            if (e.flashTimer > 0) {
                ctx.globalAlpha = 0.5 + Math.sin(e.flashTimer * 30) * 0.5;
            }

            // Draw enemy sprite
            ctx.save();
            ctx.translate(Math.round(screenX), Math.round(e.y));
            if (e.defeatType === 'squash' && e.state === 'defeated') {
                ctx.translate(0, (1 - e.scaleY) * e.type.sprite.height * e.scale);
                ctx.scale(e.scale, e.scale * e.scaleY);
            } else {
                ctx.scale(e.scale, e.scale);
            }

            let frame = this.globalFrame;
            if (e.type.id === 'koopa' && e.defeatType === 'shell') {
                frame = 2;
            }
            if (frame >= e.type.sprite.frames.length) frame = 0;

            drawSprite(e.type.sprite, -8, -16, false, frame);
            ctx.restore();

            // Draw word above enemy
            if (e.state === 'walking' || e.state === 'active') {
                this.drawWord(ctx, e, screenX);
            }

            ctx.globalAlpha = 1;
            ctx.restore();
        });
    }

    drawWord(ctx, enemy, screenX) {
        const word = enemy.word;
        const isActive = enemy.state === 'active';
        const fontSize = word.length > 10 ? 14 : (word.length > 5 ? 16 : 20);
        const charWidth = fontSize * 0.6;
        const totalWidth = word.length * charWidth;
        const startX = screenX - totalWidth / 2 + 8;
        const textY = enemy.y - 45;

        // Background for text
        const bgAlpha = isActive ? 0.85 : 0.5;
        ctx.fillStyle = `rgba(0,0,0,${bgAlpha})`;
        const padding = 5;
        ctx.beginPath();
        ctx.roundRect(startX - padding, textY - padding, totalWidth + padding * 2, fontSize + padding * 2, 4);
        ctx.fill();

        // Active indicator border
        if (isActive) {
            ctx.strokeStyle = '#ffdd00';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(startX - padding, textY - padding, totalWidth + padding * 2, fontSize + padding * 2, 4);
            ctx.stroke();
        }

        for (let i = 0; i < word.length; i++) {
            const charX = startX + i * charWidth;
            let color;
            if (i < enemy.typedIndex) {
                color = '#44ff44'; // typed - green
            } else if (i === enemy.typedIndex && isActive) {
                color = '#ffdd00'; // current - gold
            } else {
                color = isActive ? '#ffffff' : '#aaaaaa';
            }

            if (i === enemy.typedIndex && isActive) {
                ctx.fillStyle = '#ffdd00';
                ctx.fillRect(charX, textY + fontSize, charWidth - 2, 2);
            }

            drawTextOutlined(word[i], charX, textY, fontSize, color, '#000', 'left');
        }
    }

    clear() {
        this.enemies = [];
        this.wordQueue = [];
        this.activeEnemy = null;
    }
}
