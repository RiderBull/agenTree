// Game constants
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// UI elements
const playerHealthBar = document.querySelector('#playerHealth .health-fill');
const scoreDisplay = document.getElementById('score');

// Player tank properties
const player = {
    x: WIDTH / 2,
    y: HEIGHT - 60,
    width: 40,
    height: 40,
    speed: 3.5,
    angle: 0, // in radians
    health: 100,
    maxHealth: 100,
    cooldown: 0
};

// Bullet properties
const bulletSpeed = 7;
const bulletSize = 6;

// Enemy tank properties
const enemySpeed = 1.5;
const enemySize = 40;

// Game state
let keys = {};
let bullets = [];
let enemies = [];
let score = 0;
let gameOver = false;

// Keyboard input handlers
window.addEventListener('keydown', e => {
    keys[e.code] = true;
});
window.addEventListener('keyup', e => {
    keys[e.code] = false;
});

// Utility functions
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

// Tank drawing function
function drawTank(x, y, angle, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    // Tank body
    ctx.fillStyle = color;
    ctx.fillRect(-20, -15, 40, 30);
    // Tank turret
    ctx.fillStyle = '#222';
    ctx.fillRect(0, -6, 25, 12);
    ctx.restore();
}

// Bullet drawing function
function drawBullet(bullet) {
    ctx.fillStyle = '#ff0';
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bulletSize / 2, 0, Math.PI * 2);
    ctx.fill();
}

// Enemy tank class
class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = enemySize;
        this.height = enemySize;
        this.health = 50;
        this.maxHealth = 50;
        this.speed = enemySpeed;
        this.angle = 0;
        this.cooldown = 0;
    }

    update() {
        // Move downwards
        this.y += this.speed;
        if (this.y > HEIGHT + this.height) {
            this.respawn();
        }
        // Aim at player
        let dx = player.x - this.x;
        let dy = player.y - this.y;
        this.angle = Math.atan2(dy, dx);

        // Shooting cooldown
        if (this.cooldown > 0) this.cooldown--;
        else {
            this.shoot();
            this.cooldown = 120; // cooldown frames
        }
    }

    shoot() {
        // Shoot bullet towards player
        let bulletDx = Math.cos(this.angle) * bulletSpeed;
        let bulletDy = Math.sin(this.angle) * bulletSpeed;
        bullets.push({
            x: this.x + Math.cos(this.angle) * 25,
            y: this.y + Math.sin(this.angle) * 25,
            dx: bulletDx,
            dy: bulletDy,
            owner: 'enemy'
        });
    }

    draw() {
        drawTank(this.x, this.y, this.angle, '#d22');
        // Draw health bar
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x - 20, this.y - 30, 40, 6);
        ctx.fillStyle = '#4caf50';
        ctx.fillRect(this.x - 20, this.y - 30, 40 * (this.health / this.maxHealth), 6);
    }

    respawn() {
        this.x = Math.random() * (WIDTH - this.width) + this.width / 2;
        this.y = -this.height;
        this.health = this.maxHealth;
    }
}

// Spawn initial enemies
function spawnEnemies(count) {
    for (let i = 0; i < count; i++) {
        let x = Math.random() * (WIDTH - enemySize) + enemySize / 2;
        let y = Math.random() * -HEIGHT;
        enemies.push(new Enemy(x, y));
    }
}

// Player shooting
function playerShoot() {
    if (player.cooldown > 0) return;
    let angle = player.angle;
    let bulletDx = Math.cos(angle) * bulletSpeed;
    let bulletDy = Math.sin(angle) * bulletSpeed;
    bullets.push({
        x: player.x + Math.cos(angle) * 25,
        y: player.y + Math.sin(angle) * 25,
        dx: bulletDx,
        dy: bulletDy,
        owner: 'player'
    });
    player.cooldown = 20; // cooldown frames
}

// Update player position and angle
function updatePlayer() {
    let moved = false;
    if (keys['ArrowUp']) {
        player.y -= player.speed;
        moved = true;
    }
    if (keys['ArrowDown']) {
        player.y += player.speed;
        moved = true;
    }
    if (keys['ArrowLeft']) {
        player.x -= player.speed;
        moved = true;
    }
    if (keys['ArrowRight']) {
        player.x += player.speed;
        moved = true;
    }
    // Clamp position
    player.x = clamp(player.x, player.width / 2, WIDTH - player.width / 2);
    player.y = clamp(player.y, player.height / 2, HEIGHT - player.height / 2);

    // Update angle to face mouse or movement direction
    if (moved) {
        // Calculate angle based on last movement
        let dx = 0, dy = 0;
        if (keys['ArrowUp']) dy -= 1;
        if (keys['ArrowDown']) dy += 1;
        if (keys['ArrowLeft']) dx -= 1;
        if (keys['ArrowRight']) dx += 1;
        if (dx !== 0 || dy !== 0) {
            player.angle = Math.atan2(dy, dx);
        }
    }

    // Shooting
    if (keys['Space']) {
        playerShoot();
    }

    if (player.cooldown > 0) player.cooldown--;
}

// Update bullets
function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        let b = bullets[i];
        b.x += b.dx;
        b.y += b.dy;
        // Remove bullets out of bounds
        if (b.x < 0 || b.x > WIDTH || b.y < 0 || b.y > HEIGHT) {
            bullets.splice(i, 1);
            continue;
        }
        // Check collisions
        if (b.owner === 'player') {
            // Check collision with enemies
            for (let j = enemies.length - 1; j >= 0; j--) {
                let e = enemies[j];
                if (rectCircleColliding(e, b)) {
                    e.health -= 25;
                    bullets.splice(i, 1);
                    if (e.health <= 0) {
                        score += 10;
                        e.respawn();
                    }
                    break;
                }
            }
        } else if (b.owner === 'enemy') {
            // Check collision with player
            if (circleRectColliding(b, player)) {
                player.health -= 10;
                bullets.splice(i, 1);
                if (player.health <= 0) {
                    gameOver = true;
                }
            }
        }
    }
}

// Collision detection helpers
function rectCircleColliding(rect, circle) {
    let distX = Math.abs(circle.x - rect.x);
    let distY = Math.abs(circle.y - rect.y);

    if (distX > (rect.width / 2 + bulletSize / 2)) { return false; }
    if (distY > (rect.height / 2 + bulletSize / 2)) { return false; }

    if (distX <= (rect.width / 2)) { return true; }
    if (distY <= (rect.height / 2)) { return true; }

    let dx = distX - rect.width / 2;
    let dy = distY - rect.height / 2;
    return (dx * dx + dy * dy <= (bulletSize / 2) * (bulletSize / 2));
}

function circleRectColliding(circle, rect) {
    // circle: {x,y}, rect: {x,y,width,height}
    let distX = Math.abs(circle.x - rect.x);
    let distY = Math.abs(circle.y - rect.y);

    if (distX > (rect.width / 2 + bulletSize / 2)) { return false; }
    if (distY > (rect.height / 2 + bulletSize / 2)) { return false; }

    if (distX <= (rect.width / 2)) { return true; }
    if (distY <= (rect.height / 2)) { return true; }

    let dx = distX - rect.width / 2;
    let dy = distY - rect.height / 2;
    return (dx * dx + dy * dy <= (bulletSize / 2) * (bulletSize / 2));
}

// Draw everything
function draw() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    // Draw background
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Draw player
    drawTank(player.x, player.y, player.angle, '#2a2');

    // Draw enemies
    enemies.forEach(e => e.draw());

    // Draw bullets
    bullets.forEach(drawBullet);

    // Draw player health bar update
    playerHealthBar.style.width = (player.health / player.maxHealth * 100) + '%';

    // Draw score
    scoreDisplay.textContent = `Score: ${score}`;

    if (gameOver) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        ctx.fillStyle = '#fff';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over', WIDTH / 2, HEIGHT / 2 - 20);
        ctx.font = '24px Arial';
        ctx.fillText(`Final Score: ${score}`, WIDTH / 2, HEIGHT / 2 + 20);
        ctx.fillText('Refresh to play again', WIDTH / 2, HEIGHT / 2 + 60);
    }
}

// Game loop
function gameLoop() {
    if (!gameOver) {
        updatePlayer();
        enemies.forEach(e => e.update());
        updateBullets();
    }
    draw();
    requestAnimationFrame(gameLoop);
}

// Initialize game
spawnEnemies(5);
gameLoop();
