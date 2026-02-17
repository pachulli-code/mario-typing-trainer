// Tweening and easing system

const activeTweens = [];

export const Easing = {
    linear: t => t,
    easeInQuad: t => t * t,
    easeOutQuad: t => t * (2 - t),
    easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    easeOutCubic: t => (--t) * t * t + 1,
    easeInBack: t => t * t * (2.7 * t - 1.7),
    easeOutBack: t => { const c = 1.70158; return 1 + (--t) * t * ((c + 1) * t + c); },
    easeOutBounce: t => {
        if (t < 1 / 2.75) return 7.5625 * t * t;
        if (t < 2 / 2.75) return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
        if (t < 2.5 / 2.75) return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
        return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
    },
    easeOutElastic: t => {
        if (t === 0 || t === 1) return t;
        return Math.pow(2, -10 * t) * Math.sin((t - 0.1) * 5 * Math.PI) + 1;
    }
};

// Create a tween: tween(obj, {x: 100, y: 200}, 500, Easing.easeOutQuad, onComplete)
export function tween(obj, props, duration, easing = Easing.linear, onComplete = null) {
    const start = {};
    for (const key in props) {
        start[key] = obj[key];
    }
    const tw = {
        obj, props, start, duration, easing, onComplete,
        elapsed: 0,
        done: false
    };
    activeTweens.push(tw);
    return tw;
}

export function updateTweens(dt) {
    for (let i = activeTweens.length - 1; i >= 0; i--) {
        const tw = activeTweens[i];
        tw.elapsed += dt;
        let t = Math.min(tw.elapsed / tw.duration, 1);
        const eased = tw.easing(t);
        for (const key in tw.props) {
            tw.obj[key] = tw.start[key] + (tw.props[key] - tw.start[key]) * eased;
        }
        if (t >= 1) {
            tw.done = true;
            if (tw.onComplete) tw.onComplete();
            activeTweens.splice(i, 1);
        }
    }
}

export function clearTweens() {
    activeTweens.length = 0;
}

// Simple particle system
export class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    emit(x, y, count, config) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x, y,
                vx: (Math.random() - 0.5) * (config.speed || 100),
                vy: -Math.random() * (config.speed || 100) + (config.vy || 0),
                life: config.life || 1,
                maxLife: config.life || 1,
                size: config.size || 2,
                color: config.colors ? config.colors[Math.floor(Math.random() * config.colors.length)] : '#fff',
                gravity: config.gravity || 150
            });
        }
    }

    update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += p.gravity * dt;
            p.life -= dt;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        this.particles.forEach(p => {
            const alpha = Math.max(0, p.life / p.maxLife);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
        });
        ctx.globalAlpha = 1;
    }

    clear() {
        this.particles.length = 0;
    }
}
