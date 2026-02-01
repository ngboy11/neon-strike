// --- 1. SUPABASE CONFIGURATION ---
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = null;

// --- 2. GAME STATE & CONSTANTS ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let score = 0;
let gameActive = false;

const player = {
    x: 400, y: 500, w: 40, h: 40, speed: 5, color: '#00f2ff'
};

let bullets = [];
let enemies = [];
const keys = {};

// --- 3. INPUT HANDLING ---
window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

// --- 4. CORE GAME FUNCTIONS ---
function spawnEnemy() {
    if(!gameActive) return;
    enemies.push({
        x: Math.random() * (canvas.width - 40),
        y: -40,
        w: 40,
        h: 40,
        speed: 2 + Math.random() * 2
    });
    setTimeout(spawnEnemy, 1000);
}

function update() {
    if (!gameActive) return;

    // Movement
    if (keys['ArrowLeft'] || keys['KeyA']) player.x -= player.speed;
    if (keys['ArrowRight'] || keys['KeyD']) player.x += player.speed;
    if (keys['Space']) shoot();

    // Bounds
    player.x = Math.max(0, Math.min(canvas.width - player.w, player.x));

    // Bullets
    bullets.forEach((b, i) => {
        b.y -= 7;
        if (b.y < 0) bullets.splice(i, 1);
    });

    // Enemies
    enemies.forEach((en, i) => {
        en.y += en.speed;
        
        // Player Collision
        if (rectIntersect(player, en)) endGame();

        // Bullet Collision
        bullets.forEach((b, bi) => {
            if (rectIntersect(b, en)) {
                enemies.splice(i, 1);
                bullets.splice(bi, 1);
                score += 10;
            }
        });

        if (en.y > canvas.height) enemies.splice(i, 1);
    });
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Player (SVG-style Triangle)
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.moveTo(player.x + player.w/2, player.y);
    ctx.lineTo(player.x, player.y + player.h);
    ctx.lineTo(player.x + player.w, player.y + player.h);
    ctx.fill();

    // Bullets
    ctx.fillStyle = '#fff';
    bullets.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h));

    // Enemies
    ctx.fillStyle = '#ff00ea';
    enemies.forEach(en => ctx.fillRect(en.x, en.y, en.w, en.h));

    // Score
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}`, 20, 30);

    requestAnimationFrame(() => {
        update();
        draw();
    });
}

function shoot() {
    if (bullets.length < 5) { // Fire rate limit
        bullets.push({ x: player.x + player.w/2 - 2, y: player.y, w: 4, h: 10 });
    }
}

function rectIntersect(r1, r2) {
    return !(r2.x > r1.x + r1.w || r2.x + r2.w < r1.x || r2.y > r1.y + r1.h || r2.y + r2.h < r1.y);
}

// --- 5. SUPABASE LOGIC ---
async function handleSignUp() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) alert(error.message);
    else alert("Check your email for verification!");
}

async function handleSignIn() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    else {
        currentUser = data.user;
        document.getElementById('auth-section').classList.add('hidden');
        document.getElementById('main-nav').classList.remove('hidden');
        document.getElementById('user-welcome').innerText = `Pilot: ${currentUser.email}`;
    }
}

async function saveCurrentScore() {
    const { error } = await supabase
        .from('profiles')
        .upsert({ id: currentUser.id, high_score: score, updated_at: new Date() });
    
    if (error) console.error(error);
    else alert("Score Saved!");
}

// --- 6. UI FLOW ---
function startGame() {
    document.getElementById('menu-overlay').classList.add('hidden');
    gameActive = true;
    score = 0;
    enemies = [];
    bullets = [];
    spawnEnemy();
}

function endGame() {
    gameActive = false;
    document.getElementById('gameover-overlay').classList.remove('hidden');
    document.getElementById('final-score').innerText = score;
}

function resetGame() {
    document.getElementById('gameover-overlay').classList.add('hidden');
    document.getElementById('menu-overlay').classList.remove('hidden');
}

// Initialize loop
draw();