// ============================================
// GAME SETUP AND INITIALIZATION
// ============================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameOverScreen = document.getElementById('gameOverScreen');

// Game constants
const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;
const GRAVITY = 0.5;
const JUMP_STRENGTH = -8;
const INITIAL_THRONE_SPEED = 12;
const INITIAL_SPAWN_INTERVAL = 3000; // milliseconds (1 throne per 3 seconds initially)
const THRONE_GAP = 800; // gap between top and bottom thrones
const THRONE_WIDTH = 360; // Regular size
const THRONE_IMAGE_HEIGHT = 200; // Fixed height for l1.png image on top of rectangle
const SPEED_INCREASE_RATE = 0.1; // Speed increases by this amount per score point

// Game state
let gameState = {
    running: false,
    gameOver: false,
    score: 0,
    currentThroneSpeed: INITIAL_THRONE_SPEED,
    musicStarted: false
};

// Bird object
const bird = {
    x: 400,
    y: CANVAS_HEIGHT / 2,
    width: 360,
    height: 203, // 16:9 aspect ratio (360 * 9/16 = 202.5 ≈ 203)
    velocity: 0,
    image: new Image()
};

// Thrones array (obstacles)
let thrones = [];

// Images
bird.image.src = 'src/image/Kaido.png';
const throneImage = new Image();
throneImage.src = 'src/image/l1.png';
const backgroundImage = new Image();
backgroundImage.src = 'src/image/wano.jpg';

// Audio
const backgroundMusic = new Audio('src/audio/luffy.mp3');
backgroundMusic.loop = true;
backgroundMusic.volume = 0.2; // 20% volume

const jumpSound = new Audio('src/audio/Kaido.mp3');
jumpSound.volume = 0.5; // 50% volume

// ============================================
// SETUP FUNCTION
// ============================================
function setup() {
    // Reset game state
    gameState.running = true;
    gameState.gameOver = false;
    gameState.score = 0;
    gameState.currentThroneSpeed = INITIAL_THRONE_SPEED;
    
    // Reset bird position
    bird.y = CANVAS_HEIGHT / 2;
    bird.velocity = 0;
    
    // Clear thrones array
    thrones = [];
    
    // Hide game over screen
    gameOverScreen.classList.add('hidden');
    
    // Resume background music if it was paused
    if (gameState.musicStarted) {
        backgroundMusic.play().catch(e => {
            console.log('Background music will play after user interaction');
        });
    }
    
    // Start spawning thrones after a delay
    setTimeout(spawnThrone, 2000);
}

// ============================================
// THRONE SPAWNING
// ============================================
function getSpawnInterval() {
    // Start at 3 seconds, then gradually decrease spawn interval based on score thresholds
    if (gameState.score < 10) {
        return INITIAL_SPAWN_INTERVAL; // 3000ms (3 seconds)
    } else if (gameState.score < 20) {
        return 2500; // 2.5 seconds
    } else if (gameState.score < 50) {
        return 2000; // 2 seconds
    } else if (gameState.score < 100) {
        return 1500; // 1.5 seconds
    } else {
        return 1000; // 1 second (fastest)
    }
}

function spawnThrone() {
    if (!gameState.running || gameState.gameOver) return;
    
    // Random gap position (ensuring it's not too close to top or bottom)
    const minGapY = 400;
    const maxGapY = CANVAS_HEIGHT - THRONE_GAP - 400;
    const gapY = Math.random() * (maxGapY - minGapY) + minGapY;
    
    // Create top throne (inverted)
    thrones.push({
        x: CANVAS_WIDTH,
        y: 0,
        width: THRONE_WIDTH,
        height: gapY,
        passed: false
    });
    
    // Create bottom throne
    thrones.push({
        x: CANVAS_WIDTH,
        y: gapY + THRONE_GAP,
        width: THRONE_WIDTH,
        height: CANVAS_HEIGHT - (gapY + THRONE_GAP),
        passed: false
    });
    
    // Schedule next throne spawn with dynamic interval based on score
    const spawnInterval = getSpawnInterval();
    setTimeout(spawnThrone, spawnInterval);
}

// ============================================
// UPDATE FUNCTION
// ============================================
function update() {
    if (!gameState.running || gameState.gameOver) return;
    
    // Apply gravity to bird
    bird.velocity += GRAVITY;
    bird.y += bird.velocity;
    
    // Calculate current speed based on score (gradually increases)
    gameState.currentThroneSpeed = INITIAL_THRONE_SPEED + (gameState.score * SPEED_INCREASE_RATE);
    
    // Update thrones position
    for (let i = thrones.length - 1; i >= 0; i--) {
        const throne = thrones[i];
        throne.x -= gameState.currentThroneSpeed;
        
        // Check if bird passed the throne (for scoring)
        if (!throne.passed && throne.x + throne.width < bird.x) {
            throne.passed = true;
            // Only increment score once per pair (check if it's the top throne)
            if (i % 2 === 0) {
                gameState.score++;
            }
        }
        
        // Remove thrones that are off screen
        if (throne.x + throne.width < 0) {
            thrones.splice(i, 1);
        }
    }
    
    // Check collisions
    checkCollisions();
    
    // Check ground and ceiling collisions
    const groundY = CANVAS_HEIGHT - 120; // Ground starts at this Y position
    const ceilingY = 120; // Ceiling ends at this Y position
    if (bird.y + bird.height >= groundY || bird.y <= ceilingY) {
        endGame();
    }
}

// ============================================
// COLLISION DETECTION
// ============================================
function checkCollisions() {
    // Check collision with each throne
    for (const throne of thrones) {
        if (
            bird.x < throne.x + throne.width &&
            bird.x + bird.width > throne.x &&
            bird.y < throne.y + throne.height &&
            bird.y + bird.height > throne.y
        ) {
            endGame();
            return;
        }
    }
}

// ============================================
// DRAW FUNCTION
// ============================================
function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw wano background image
    ctx.drawImage(backgroundImage, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw ground (visual indicator)
    ctx.fillStyle = '#FFFFFF'; // White color
    ctx.fillRect(0, CANVAS_HEIGHT - 120, CANVAS_WIDTH, 120);
    
    // Draw ceiling (visual indicator)
    ctx.fillStyle = '#FFFFFF'; // White color
    ctx.fillRect(0, 0, CANVAS_WIDTH, 120);
    
    // Draw thrones as rectangles with l1.png image on top
    for (const throne of thrones) {
        // Draw rectangle throne with opacity 0 (transparent)
        ctx.globalAlpha = 0;
        ctx.fillStyle = '#8B4513'; // Brown color
        ctx.fillRect(throne.x, throne.y, throne.width, throne.height);
        
        // Add border (also transparent)
        ctx.strokeStyle = '#654321'; // Darker brown border
        ctx.lineWidth = 5;
        ctx.strokeRect(throne.x, throne.y, throne.width, throne.height);
        
        // Draw l1.png image with full opacity (visible)
        ctx.globalAlpha = 1.0;
        if (throne.y === 0) {
            // Top throne - draw image upside down at the bottom of the rectangle
            ctx.save();
            // Flip the image vertically only
            const imageY = throne.y + throne.height - THRONE_IMAGE_HEIGHT;
            ctx.translate(throne.x + throne.width / 2, imageY + THRONE_IMAGE_HEIGHT / 2);
            ctx.scale(1, -1); // Flip vertically only
            ctx.drawImage(
                throneImage,
                -throne.width / 2,
                -THRONE_IMAGE_HEIGHT / 2,
                throne.width,
                THRONE_IMAGE_HEIGHT
            );
            ctx.restore();
        } else {
            // Bottom throne - draw image at the top of the rectangle (normal orientation)
            ctx.drawImage(
                throneImage,
                throne.x,
                throne.y,
                throne.width,
                THRONE_IMAGE_HEIGHT
            );
        }
    }
    
    // Draw bird
    ctx.drawImage(
        bird.image,
        bird.x,
        bird.y,
        bird.width,
        bird.height
    );
    
    // Draw score
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 128px Arial';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 12;
    ctx.strokeText(`Score: ${gameState.score}`, 40, 160);
    ctx.fillText(`Score: ${gameState.score}`, 40, 160);
}

// ============================================
// GAME CONTROL FUNCTIONS
// ============================================
function jump() {
    // Start background music on first user interaction if not started
    if (!gameState.musicStarted) {
        backgroundMusic.play().catch(e => {
            console.log('Background music will play after user interaction');
        });
        gameState.musicStarted = true;
    }
    
    if (!gameState.running) {
        // Start game on first jump
        setup();
        return;
    }
    
    if (gameState.gameOver) {
        // Restart game
        setup();
        return;
    }
    
    // Make bird jump
    bird.velocity = JUMP_STRENGTH;
    
    // Play jump sound effect
    jumpSound.currentTime = 0; // Reset to start
    jumpSound.play().catch(e => {
        // Handle autoplay restrictions
        console.log('Jump sound will play after user interaction');
    });
}

function endGame() {
    if (gameState.gameOver) return;
    
    gameState.gameOver = true;
    gameState.running = false;
    gameOverScreen.classList.remove('hidden');
    
    // Pause background music on game over
    backgroundMusic.pause();
}

// ============================================
// EVENT LISTENERS
// ============================================
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        jump();
    }
});

// Also support click/tap for mobile
canvas.addEventListener('click', jump);

// ============================================
// GAME LOOP
// ============================================
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// ============================================
// INITIALIZE GAME
// ============================================
// Wait for images to load before starting
let imagesLoaded = 0;
const totalImages = 3;

function imageLoaded() {
    imagesLoaded++;
    if (imagesLoaded === totalImages) {
        // Start game loop
        gameLoop();
        // Draw initial state
        draw();
    }
}

bird.image.onload = imageLoaded;
throneImage.onload = imageLoaded;
backgroundImage.onload = imageLoaded;

// Handle case where images might already be cached
if (bird.image.complete && throneImage.complete && backgroundImage.complete) {
    imagesLoaded = totalImages;
    gameLoop();
    draw();
}

