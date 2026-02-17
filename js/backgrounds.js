// Procedural parallax backgrounds for each world
import { VIRTUAL_WIDTH, VIRTUAL_HEIGHT, WORLDS } from './config.js';

// Draw a parallax background for the given world
export function drawBackground(ctx, worldIndex, cameraX, time) {
    const world = WORLDS[worldIndex];
    const colors = world.skyColors;

    // Sky gradient
    const grad = ctx.createLinearGradient(0, 0, 0, VIRTUAL_HEIGHT);
    grad.addColorStop(0, colors[0]);
    grad.addColorStop(0.6, colors[1]);
    grad.addColorStop(1, colors[2]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

    // World-specific decorations
    switch (world.id) {
        case 'cap':
            drawCapKingdom(ctx, cameraX, time);
            break;
        case 'cascade':
            drawCascadeKingdom(ctx, cameraX, time);
            break;
        case 'sand':
            drawSandKingdom(ctx, cameraX, time);
            break;
        case 'metro':
            drawMetroKingdom(ctx, cameraX, time);
            break;
        case 'moon':
            drawMoonKingdom(ctx, cameraX, time);
            break;
    }

    // Ground
    drawGround(ctx, world.groundColor, world.accentColor);
}

function drawGround(ctx, color, accent) {
    const groundY = VIRTUAL_HEIGHT - 60;

    // Main ground
    ctx.fillStyle = color;
    ctx.fillRect(0, groundY, VIRTUAL_WIDTH, 60);

    // Top border
    ctx.fillStyle = accent;
    ctx.fillRect(0, groundY, VIRTUAL_WIDTH, 4);

    // Brick pattern
    ctx.fillStyle = accent + '33';
    for (let x = 0; x < VIRTUAL_WIDTH; x += 32) {
        ctx.fillRect(x, groundY + 12, 30, 14);
        ctx.fillRect(x + 16, groundY + 30, 30, 14);
    }
}

// --- Cap Kingdom: purple, top hats, fog ---
function drawCapKingdom(ctx, cameraX, time) {
    // Fog layers
    ctx.globalAlpha = 0.15;
    for (let layer = 0; layer < 3; layer++) {
        const speed = (layer + 1) * 0.1;
        const offset = (cameraX * speed + time * 20) % VIRTUAL_WIDTH;
        ctx.fillStyle = '#c39bd3';
        for (let i = -1; i < 4; i++) {
            const x = i * 250 - offset % 250;
            const y = 200 + layer * 30 + Math.sin(time + i) * 10;
            drawCloud(ctx, x, y, 80 + layer * 20, 25);
        }
    }
    ctx.globalAlpha = 1;

    // Background top hats (silhouettes)
    ctx.fillStyle = '#2a0a58';
    for (let i = 0; i < 5; i++) {
        const x = i * 200 - (cameraX * 0.2) % 200;
        drawTopHat(ctx, x, 280, 40 + i * 5);
    }

    // Stars
    drawStars(ctx, time, '#c39bd3');
}

function drawTopHat(ctx, x, y, size) {
    // Brim
    ctx.fillRect(x - size * 0.6, y, size * 1.2, size * 0.15);
    // Crown
    ctx.fillRect(x - size * 0.35, y - size * 0.8, size * 0.7, size * 0.8);
}

// --- Cascade Kingdom: green, waterfalls, dinosaurs ---
function drawCascadeKingdom(ctx, cameraX, time) {
    // Mountains
    ctx.fillStyle = '#0d3311';
    for (let i = 0; i < 6; i++) {
        const x = i * 180 - (cameraX * 0.15) % 180;
        const h = 100 + Math.sin(i * 1.7) * 40;
        drawMountain(ctx, x, VIRTUAL_HEIGHT - 60 - h, 120, h);
    }

    // Trees
    ctx.fillStyle = '#1a5c1a';
    for (let i = 0; i < 8; i++) {
        const x = i * 120 - (cameraX * 0.3) % 120;
        drawTree(ctx, x, VIRTUAL_HEIGHT - 100, 20 + (i % 3) * 8);
    }

    // Waterfalls
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = '#88ccff';
    for (let i = 0; i < 3; i++) {
        const x = 100 + i * 280 - (cameraX * 0.15) % 280;
        const waveOffset = Math.sin(time * 3 + i) * 2;
        ctx.fillRect(x + waveOffset, 100, 6, VIRTUAL_HEIGHT - 160);
        ctx.fillRect(x + 10 + waveOffset, 120, 4, VIRTUAL_HEIGHT - 180);
    }
    ctx.globalAlpha = 1;
}

function drawMountain(ctx, x, y, w, h) {
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x + w / 2, y);
    ctx.lineTo(x + w, y + h);
    ctx.fill();
}

function drawTree(ctx, x, y, size) {
    // Trunk
    ctx.fillStyle = '#4a3220';
    ctx.fillRect(x - 3, y, 6, size * 0.5);
    // Leaves (triangle)
    ctx.fillStyle = '#1a5c1a';
    ctx.beginPath();
    ctx.moveTo(x, y - size * 0.8);
    ctx.lineTo(x - size * 0.5, y);
    ctx.lineTo(x + size * 0.5, y);
    ctx.fill();
}

// --- Sand Kingdom: desert, pyramids, cacti ---
function drawSandKingdom(ctx, cameraX, time) {
    // Distant dunes
    ctx.fillStyle = '#cc8800';
    for (let i = 0; i < 8; i++) {
        const x = i * 150 - (cameraX * 0.1) % 150;
        const h = 40 + Math.sin(i * 2.3) * 20;
        drawDune(ctx, x, VIRTUAL_HEIGHT - 60 - h, 130, h);
    }

    // Pyramids
    ctx.fillStyle = '#daa520';
    for (let i = 0; i < 2; i++) {
        const x = 200 + i * 400 - (cameraX * 0.2) % 400;
        drawPyramid(ctx, x, VIRTUAL_HEIGHT - 60, 80 + i * 30);
    }

    // Cacti
    ctx.fillStyle = '#2d6b2d';
    for (let i = 0; i < 5; i++) {
        const x = 80 + i * 180 - (cameraX * 0.35) % 180;
        drawCactus(ctx, x, VIRTUAL_HEIGHT - 90, 20);
    }

    // Sun
    ctx.fillStyle = '#ffee44';
    ctx.beginPath();
    ctx.arc(650 - cameraX * 0.05, 60, 30, 0, Math.PI * 2);
    ctx.fill();
}

function drawDune(ctx, x, y, w, h) {
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.quadraticCurveTo(x + w / 2, y, x + w, y + h);
    ctx.fill();
}

function drawPyramid(ctx, x, y, size) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - size, y);
    ctx.lineTo(x - size / 2, y - size * 0.8);
    ctx.fill();
}

function drawCactus(ctx, x, y, h) {
    ctx.fillRect(x - 2, y, 4, h);
    ctx.fillRect(x - 8, y + 5, 8, 3);
    ctx.fillRect(x - 8, y + 5, 3, 10);
    ctx.fillRect(x + 2, y + 10, 8, 3);
    ctx.fillRect(x + 7, y + 7, 3, 10);
}

// --- Metro Kingdom: city, buildings, neon ---
function drawMetroKingdom(ctx, cameraX, time) {
    // Skyline - far buildings
    ctx.fillStyle = '#0a1929';
    for (let i = 0; i < 12; i++) {
        const x = i * 80 - (cameraX * 0.1) % 80;
        const h = 80 + ((i * 37) % 60);
        ctx.fillRect(x, VIRTUAL_HEIGHT - 60 - h, 60, h);
        // Windows
        ctx.fillStyle = '#ffee88';
        for (let wy = VIRTUAL_HEIGHT - 50 - h; wy < VIRTUAL_HEIGHT - 70; wy += 12) {
            for (let wx = x + 5; wx < x + 55; wx += 10) {
                if (Math.sin(wx * 7 + wy * 13 + time) > 0.3) {
                    ctx.fillRect(wx, wy, 5, 6);
                }
            }
        }
        ctx.fillStyle = '#0a1929';
    }

    // Closer buildings
    ctx.fillStyle = '#0d2844';
    for (let i = 0; i < 8; i++) {
        const x = i * 120 - (cameraX * 0.25) % 120;
        const h = 100 + ((i * 53) % 80);
        ctx.fillRect(x, VIRTUAL_HEIGHT - 60 - h, 90, h);
        // Neon accents
        ctx.fillStyle = ['#ff4488', '#44aaff', '#44ff88'][i % 3];
        ctx.fillRect(x, VIRTUAL_HEIGHT - 60 - h, 90, 2);
        ctx.fillStyle = '#0d2844';
    }
}

// --- Moon Kingdom: space, stars, lunar surface ---
function drawMoonKingdom(ctx, cameraX, time) {
    // Many stars
    drawStars(ctx, time, '#ffffff', 60);

    // Earth in background
    ctx.fillStyle = '#2244aa';
    ctx.beginPath();
    ctx.arc(600, 80, 35, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#33aa44';
    ctx.beginPath();
    ctx.arc(595, 75, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(615, 90, 8, 0, Math.PI * 2);
    ctx.fill();

    // Lunar craters
    ctx.fillStyle = '#1a0040';
    for (let i = 0; i < 6; i++) {
        const x = i * 160 - (cameraX * 0.15) % 160;
        const y = VIRTUAL_HEIGHT - 60 - 10 - Math.abs(Math.sin(i * 1.3)) * 15;
        ctx.beginPath();
        ctx.ellipse(x + 40, y + 5, 25, 8, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    // Moon pillars
    ctx.fillStyle = '#2d004d';
    for (let i = 0; i < 4; i++) {
        const x = 100 + i * 220 - (cameraX * 0.2) % 220;
        const h = 60 + (i % 3) * 30;
        ctx.fillRect(x, VIRTUAL_HEIGHT - 60 - h, 15, h);
        ctx.fillRect(x - 8, VIRTUAL_HEIGHT - 60 - h, 31, 8);
    }
}

// --- Helpers ---
function drawCloud(ctx, x, y, w, h) {
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
}

function drawStars(ctx, time, color, count = 30) {
    ctx.fillStyle = color;
    for (let i = 0; i < count; i++) {
        const x = (i * 127 + 50) % VIRTUAL_WIDTH;
        const y = (i * 89 + 20) % (VIRTUAL_HEIGHT - 100);
        const twinkle = (Math.sin(time * 2 + i * 0.7) + 1) / 2;
        const size = 1 + (i % 3 === 0 ? 1 : 0);
        ctx.globalAlpha = 0.3 + twinkle * 0.7;
        ctx.fillRect(x, y, size, size);
    }
    ctx.globalAlpha = 1;
}
