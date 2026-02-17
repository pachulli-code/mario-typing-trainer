// Canvas setup with virtual resolution 800x450
import { VIRTUAL_WIDTH, VIRTUAL_HEIGHT } from './config.js';

let canvas, ctx;
let scale = 1;
let offsetX = 0, offsetY = 0;

export function initRenderer() {
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
    return ctx;
}

function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    scale = Math.min(w / VIRTUAL_WIDTH, h / VIRTUAL_HEIGHT);
    canvas.width = VIRTUAL_WIDTH * scale;
    canvas.height = VIRTUAL_HEIGHT * scale;
    canvas.style.width = canvas.width + 'px';
    canvas.style.height = canvas.height + 'px';
    offsetX = (w - canvas.width) / 2;
    offsetY = (h - canvas.height) / 2;
    ctx.imageSmoothingEnabled = false;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
}

export function getCtx() { return ctx; }
export function getScale() { return scale; }

export function clear(color = '#000') {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
}

// Draw pixel-art sprite from color index array
// sprite = { width, height, pixels: number[][], palette: string[] }
export function drawSprite(sprite, x, y, flipX = false, frame = 0) {
    const pixels = sprite.frames ? sprite.frames[frame] : sprite.pixels;
    const palette = sprite.palette;
    ctx.save();
    if (flipX) {
        ctx.translate(x + sprite.width, y);
        ctx.scale(-1, 1);
        x = 0; y = 0;
    }
    for (let row = 0; row < pixels.length; row++) {
        for (let col = 0; col < pixels[row].length; col++) {
            const ci = pixels[row][col];
            if (ci === 0) continue; // transparent
            ctx.fillStyle = palette[ci];
            ctx.fillRect(flipX ? col : x + col, flipX ? row : y + row, 1, 1);
        }
    }
    ctx.restore();
}

// Draw text with pixel font style (using canvas fillText with monospace)
export function drawText(text, x, y, size = 16, color = '#fff', align = 'left') {
    ctx.save();
    ctx.font = `bold ${size}px monospace`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = 'top';
    ctx.fillText(text, x, y);
    ctx.restore();
}

// Draw outlined text
export function drawTextOutlined(text, x, y, size = 16, color = '#fff', outlineColor = '#000', align = 'left') {
    ctx.save();
    ctx.font = `bold ${size}px monospace`;
    ctx.textAlign = align;
    ctx.textBaseline = 'top';
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 3;
    ctx.strokeText(text, x, y);
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    ctx.restore();
}

// Draw filled rounded rect
export function drawRoundRect(x, y, w, h, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fill();
}

// Measure text width
export function measureText(text, size = 16) {
    ctx.save();
    ctx.font = `bold ${size}px monospace`;
    const m = ctx.measureText(text);
    ctx.restore();
    return m.width;
}
