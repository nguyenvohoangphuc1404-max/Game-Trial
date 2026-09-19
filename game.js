// --- CẤU HÌNH HỆ THỐNG & HELPER ---
const $ = id => document.getElementById(id);
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

const MAP = { w: 2400, h: 1500, vw: 900, vh: 520 };
const keys = {}, projectiles = [];
let isSideMenuOpen = false, isGodMode = false;

// Trạng thái hành động & chuyển động
let isJumping = false;
let isMoving = false;
let isAttacking = false;
let isCastingUlt = false;
let facingDirection = "left";

// ĐÃ BỔ SUNG ĐỦ 4 CLASS: Chiến binh, Nhà khoa học, Phù thủy, Xạ thủ
const CLASSES = window.GAME_CLASSES || {
    warrior: { 
        name: "Chiến Binh", 
        dmg: 22, 
        spd: 7, 
        rng: 110, 
        hp: 130, 
        ranged: false, 
        icon: "⚔️", 
        pIcon: "" 
    },
    scientist: { 
        name: "Nhà Khoa Học", 
        dmg: 28, 
        spd: 6, 
        rng: 320, 
        hp: 85, 
        ranged: true, 
        icon: "⚡", 
        pIcon: "🔮" 
    },
    mage: { 
        name: "Phù Thủy", 
        dmg: 35, 
        spd: 5.5, 
        rng: 340, 
        hp: 75, 
        ranged: true, 
        icon: "🧙", 
        pIcon: "🔥" 
    },
    archer: { 
        name: "Xạ Thủ", 
        dmg: 24, 
        spd: 8, 
        rng: 380, 
        hp: 90, 
        ranged: true, 
        icon: "🏹", 
        pIcon: "➹" 
    }
};

// Người chơi & Boss
let player = { classKey: "warrior", x: 450, y: 350, spd: 320, dmg: 20, hp: 120, maxHp: 120, exp: 0, expNeed: 70, lvl: 1, rng: 110, ranged: false, energy: 0 };
let boss = { x: 900, y: 500, hp: 250, maxHp: 250, spd: 85, dmg: 18, cd: 0, isBoss: true };

// Túi đồ & Kẻ địch
let inventory = [
    { id: "hp_pot", name: "Bình Máu", icon: "🧪", count: 5, type: "potion", heal: 35 },
    { id: "iron_sword", name: "Đoản Kiếm", icon: "🗡️", count: 1, type: "weapon" }
];
let enemies = [
    { id: 1, x: 300, y: 200 }, { id: 2, x: 800, y: 250 }, { id: 3, x: 500, y: 800 },
    { id: 4, x: 1300, y: 400 }, { id: 5, x: 1100, y: 800 }
].map(e => ({ ...e, hp: 35, maxHp: 35, spd: 115, dmg: 6, cd: 0 }));

// Hệ thống va chạm cây cối
const trees = [
    { x: 120, y: 140, r: 24, icon: "🌳", size: 68 }, { x: 700, y: 120, r: 22, icon: "🌲", size: 72 },
    { x: 1100, y: 390, r: 24, icon: "🌳", size: 70 }, { x: 1500, y: 240, r: 22, icon: "🌲", size: 68 },
    { x: 1900, y: 490, r: 24, icon: "🌳", size: 72 }, { x: 300, y: 840, r: 22, icon: "🌲", size: 70 },
    { x: 850, y: 990, r: 24, icon: "🌳", size: 72 }, { x: 1400, y: 1140, r: 22, icon: "🌲", size: 74 },
    { x: 2100, y: 1240, r: 24, icon: "🌳", size: 70 }, { x: 250, y: 450, r: 24, icon: "🌳", size: 66 },
    { x: 420, y: 220, r: 22, icon: "🌲", size: 70 }, { x: 620, y: 620, r: 20, icon: "🌴", size: 65 },
    { x: 920, y: 320, r: 24, icon: "🌳", size: 70 }, { x: 1250, y: 180, r: 22, icon: "🌲", size: 68 },
    { x: 1680, y: 360, r: 20, icon: "🌴", size: 68 }, { x: 2250, y: 250, r: 24, icon: "🌳", size: 74 },
    { x: 180, y: 1100, r: 22, icon: "🌲", size: 70 }, { x: 550, y: 1250, r: 24, icon: "🌳", size: 70 },
    { x: 740, y: 1400, r: 18, icon: "🪵", size: 45 }, { x: 1050, y: 1280, r: 22, icon: "🌲", size: 72 },
    { x: 1280, y: 700, r: 20, icon: "🌴", size: 68 }, { x: 1520, y: 880, r: 24, icon: "🌳", size: 72 },
    { x: 1750, y: 750, r: 22, icon: "🌲", size: 70 }, { x: 1950, y: 1020, r: 24, icon: "🌳", size: 72 },
    { x: 2250, y: 800, r: 20, icon: "🌴", size: 68 }, { x: 400, y: 650, r: 18, icon: "🪵", size: 45 },
    { x: 1600, y: 1350, r: 22, icon: "🌲", size: 70 }, { x: 1850, y: 1380, r: 24, icon: "🌳", size: 70 },
    { x: 1420, y: 480, r: 18, icon: "🪵", size: 45 }
];

function checkTreeCollision(x, y, radius = 18) {
    for (let i = 0; i < trees.length; i++) {
        const t = trees[i];
        if (Math.hypot(x - t.x, y - t.y) < (t.r + radius)) return true;
    }
    return false;
}

function initTrees() {
    const el = $("trees-container");
    if (!el) return;
    el.innerHTML = trees.map(t => 
        `<div class="tree" style="left:${t.x}px; top:${t.y}px; font-size:${t.size}px; z-index:${Math.floor(t.y)};">${t.icon}</div>`
    ).join("");
}

// --- 1. CHỌN CLASS & KHỞI TẠO GAME ---
document.querySelectorAll(".class-button").forEach(btn => {
    btn.onclick = () => {
        const c = CLASSES[player.classKey = btn.dataset.class];
        if (!c) return;
        Object.assign(player, { dmg: c.dmg, spd: c.spd * 45, rng: c.rng, maxHp: c.hp, hp: c.hp, ranged: c.ranged });
        
        const playerEl = $("player");
        if (player.classKey === "warrior") {
            playerEl.innerHTML = "";
            playerEl.className = "knight-sprite";
        } else {
            playerEl.className = "";
            playerEl.innerHTML = c.icon;
        }

        playerEl.classList.add("facing-left");
        $("class-name").innerText = c.name;
        $("class-screen").style.display = "none";
        $("game-screen").style.display = "block";

        initTrees();
        initEnemies();
        updateHUD();
        setupTouchControls();
        startGameLoops();
    };
});

function initEnemies() {
    const el = $("enemies-container");
    if (!el) return;
    el.innerHTML = enemies.map(e => 
        `<div id="enemy-${e.id}" class="enemy-item" style="left:${e.x}px;top:${e.y}px">
            <div class="enemy-sprite"></div>
            <div class="enemy-hp" id="hp-${e.id}">${e.hp}/${e.hp}</div>
        </div>`
    ).join("");
}

function updateHUD() {
    $("damage").innerText = player.dmg;
    $("player-hp").innerText = Math.round(player.hp);
    $("player-max-hp").innerText = player.maxHp;
    $("level").innerText = player.lvl;
    $("exp").innerText = player.exp;
    $("exp-needed").innerText = player.expNeed;
    $("ult-energy").innerText = player.energy;

    const ultBox = $("ult-hud-box");
    if (ultBox) ultBox.classList.toggle("ult-ready", player.energy >= 100 || isGodMode);

    if (isSideMenuOpen) {
        $("stat-class").innerText = CLASSES[player.classKey]?.name || "---";
        $("stat-level").innerText = player.lvl;
        $("stat-hp").innerText = `${Math.round(player.hp)} /${player.maxHp}`;
        $("stat-atk").innerText = player.dmg;
        $("stat-range").innerText = `${player.rng} px`;
        $("stat-speed").innerText = Math.round(player.spd / 45);
        $("stat-exp").innerText = `${player.exp} /${player.expNeed}`;
    }
}

// --- 2. QUẢN LÝ TÚI ĐỒ ---
const btnToggle = $("btn-toggle-ui");
if (btnToggle) btnToggle.onclick = toggleDualMenu;

function toggleDualMenu() {
    isSideMenuOpen = !isSideMenuOpen;
    $("side-menu-container").style.display = isSideMenuOpen ? "block" : "none";
    if (isSideMenuOpen) {
        Object.keys(keys).forEach(k => keys[k] = false);
        $("player").classList.remove("running-lean");
        $("player").classList.add("idle");
        updateHUD(); 
        renderInventory(); 
    }
}
// --- NÚT THOÁT VỀ MÀN HÌNH CHỌN CLASS ---
const btnChangeClass = $("btn-change-class");
if (btnChangeClass) {
    btnChangeClass.onclick = returnToClassSelect;
}

function returnToClassSelect() {
    // 1. Đóng menu túi đồ nếu đang mở
    if (isSideMenuOpen) toggleDualMenu();

    // 2. Ẩn màn hình game, hiện lại màn hình chọn class
    $("game-screen").style.display = "none";
    $("class-screen").style.display = "block";

    // 3. Reset các phím điều khiển để nhân vật không bị trôi
    for (let k in keys) keys[k] = false;

    // 4. Thu dọn các hiệu ứng và đạn còn sót lại trên sàn
    projectiles.forEach(p => p.el?.remove());
    projectiles.length = 0;

    // 5. Đưa nhân vật về trạng thái đứng yên tại vị trí ban đầu
    player.x = 450;
    player.y = 350;
    isMoving = false;
    isAttacking = false;
    isJumping = false;
}
function renderInventory() {
    $("inventory-grid").innerHTML = Array.from({ length: 12 }, (_, i) => {
        const it = inventory[i];
        return `<div class="inv-slot" onclick="useItem(${i})">
            ${it ? `<div class="slot-icon">${it.icon}</div><div class="slot-name">${it.name}</div><div class="slot-count">x${it.count}</div>` : ""}
        </div>`;
    }).join("");
}

window.useItem = function(idx) {
    const it = inventory[idx];
    if (it?.type === "potion" && player.hp < player.maxHp) {
        player.hp = Math.min(player.maxHp, player.hp + it.heal);
        if (--it.count <= 0) inventory.splice(idx, 1);
        updateHUD(); 
        renderInventory();
    }
};

// --- 3. ĐIỀU KHIỂN & HÀNH ĐỘNG ---
window.onkeydown = e => {
    if (e.repeat) return;
    const k = e.key.toLowerCase();
    keys[k] = true;

    if (k === "j" && !isJumping && !isSideMenuOpen) jump();
    if (e.code === "Space" && !isSideMenuOpen) attack();
    if (k === "e" && !isSideMenuOpen) castUltimate();
    if (["b", "c", "i"].includes(k)) toggleDualMenu();
    if (["`", "~"].includes(e.key)) {
        const p = $("debug-panel");
        p.style.display = p.style.display === "block" ? "none" : "block";
    }
};
window.onkeyup = e => keys[e.key.toLowerCase()] = false;

function jump() {
    isJumping = true;
    const playerEl = $("player");
    playerEl.classList.add("jumping");

    setTimeout(() => {
        playerEl.classList.remove("jumping");
        isJumping = false;
    }, 400);
}

function attack() {
    if (isAttacking || isCastingUlt) return;

    const playerEl = $("player");
    if (player.classKey === "warrior") {
        isAttacking = true;
        playerEl.classList.add("knight-attacking");
        
        setTimeout(() => {
            playerEl.classList.remove("knight-attacking");
            isAttacking = false;
        }, 300);
    }

    const targets = [...enemies, ...(boss.hp > 0 ? [boss] : [])].filter(t => t.hp > 0);

    if (player.ranged) {
        const target = targets.reduce((best, t) => {
            const d = dist(player, t);
            return (d <= player.rng && (!best || d < best.d)) ? { t, d } : best;
        }, null)?.t;

        if (target) {
            const d = dist(player, target) || 1;
            const pEl = document.createElement("div");
            pEl.className = "projectile";
            pEl.innerText = CLASSES[player.classKey]?.pIcon || "•";
            $("projectiles-container").appendChild(pEl);

            projectiles.push({
                x: player.x, y: player.y,
                vx: ((target.x - player.x) / d) * 700,
                vy: ((target.y - player.y) / d) * 700,
                damage: player.dmg,
                el: pEl
            });
        }
    } else {
        const attackRange = Math.max(player.rng, 130);
        targets.forEach(t => {
            const d = dist(player, t);
            if (d <= attackRange) {
                const isTargetOnRight = t.x >= player.x;
                const isFacingRight = (facingDirection === "right");
                if (d < 45 || (isFacingRight && isTargetOnRight) || (!isFacingRight && !isTargetOnRight)) {
                    applyDamage(t, player.dmg);
                }
            }
        });
    }
}

function applyDamage(target, dmg) {
    target.hp = Math.max(0, target.hp - dmg);
    
    const targetEl = target.isBoss ? $("boss-character") : $(`enemy-${target.id}`);
    if (targetEl) {
        targetEl.classList.add("hit-flash");
        setTimeout(() => targetEl.classList.remove("hit-flash"), 120);
    }

    if (!target.isBoss) {
        const d = dist(player, target) || 1;
        const pushX = target.x + ((target.x - player.x) / d) * 16;
        const pushY = target.y + ((target.y - player.y) / d) * 16;
        if (!checkTreeCollision(pushX, pushY, 15)) {
            target.x = pushX;
            target.y = pushY;
        }
    }

    if (player.energy < 100 || isGodMode) {
        player.energy = Math.min(100, player.energy + (target.isBoss ? 20 : 12));
        updateHUD();
    }

    if (target.isBoss) {
        $("boss-hp").innerText = `BOSS HP: ${target.hp}/${target.maxHp}`;
        if (target.hp <= 0) {
            $("boss").style.display = "none";
            addExp(80);
            setTimeout(() => alert("CHIẾN THẮNG! Bạn đã tiêu diệt Boss Orc!"), 100);
        }
    } else {
        $(`hp-${target.id}`).innerText = `${target.hp}/${target.maxHp}`;
        if (target.hp <= 0) {
            const el = $(`enemy-${target.id}`);
            if (el) el.style.display = "none";
            addExp(18);

            if (Math.random() < 0.4) {
                let pot = inventory.find(i => i.id === "hp_pot");
                pot ? pot.count++ : inventory.push({ id: "hp_pot", name: "Bình Máu", icon: "🧪", count: 1, type: "potion", heal: 35 });
                if (isSideMenuOpen) renderInventory();
            }

            setTimeout(() => {
                target.hp = target.maxHp;
                target.x = clamp(player.x + (Math.random() - 0.5) * 800, 80, MAP.w - 80);
                target.y = clamp(player.y + (Math.random() - 0.5) * 600, 80, MAP.h - 80);
                if (el) Object.assign(el.style, { left: `${target.x}px`, top: `${target.y}px`, display: "block" });
                $(`hp-${target.id}`).innerText = `${target.maxHp}/${target.maxHp}`;
            }, 3500);
        }
    }
}

// --- CHIÊU NỘ ---
function castUltimate() {
    if (!isGodMode && player.energy < 100) return;
    if (isCastingUlt) return;

    if (player.classKey === "scientist" || player.classKey === "mage") {
        castLightningDragon();
    } else {
        castWarriorBladestorm();
    }
}

function castWarriorBladestorm() {
    if (!isGodMode) player.energy = 0;
    updateHUD();

    isCastingUlt = true;
    const playerEl = $("player");
    playerEl.classList.add("knight-bladestorm");

    const aura = document.createElement("div");
    aura.className = "bladestorm-aura";
    $("world").appendChild(aura);

    let ticks = 0;
    const stormInterval = setInterval(() => {
        ticks++;
        aura.style.left = `${player.x}px`;
        aura.style.top = `${player.y}px`;

        const targets = [...enemies, ...(boss.hp > 0 ? [boss] : [])].filter(t => t.hp > 0);
        targets.forEach(t => {
            if (dist(player, t) <= 180) {
                applyDamage(t, Math.floor(player.dmg * 0.9));
                if (!t.isBoss) {
                    const angle = Math.atan2(t.y - player.y, t.x - player.x) + 0.4;
                    const pushX = player.x + Math.cos(angle) * 110;
                    const pushY = player.y + Math.sin(angle) * 110;
                    if (!checkTreeCollision(pushX, pushY, 15)) {
                        t.x = pushX;
                        t.y = pushY;
                    }
                }
            }
        });

        if (ticks >= 8) {
            clearInterval(stormInterval);
            aura.remove();
            playerEl.classList.remove("knight-bladestorm");
            isCastingUlt = false;
        }
    }, 180);
}

function castLightningDragon() {
    if (!isGodMode) player.energy = 0;
    updateHUD();

    const dragon = document.createElement("div");
    dragon.className = "lightning-dragon";
    dragon.innerHTML = "⚡🐉⚡";
    dragon.style.top = `${player.y}px`;
    $("world").appendChild(dragon);

    enemies.filter(e => e.hp > 0).forEach(e => applyDamage(e, 70));
    if (boss.hp > 0) {
        applyDamage(boss, 90);
        const prevSpd = boss.spd; 
        boss.spd = 0;
        $("boss-character")?.classList.add("electrocuted");
        setTimeout(() => { 
            boss.spd = prevSpd; 
            $("boss-character")?.classList.remove("electrocuted"); 
        }, 2500);
    }
    setTimeout(() => dragon.remove(), 1000);
}

function addExp(amount) {
    if ((player.exp += amount) >= player.expNeed) {
        player.exp -= player.expNeed;
        player.lvl++;
        player.dmg += 5;
        player.hp = (player.maxHp += 15);
        player.expNeed += 35;
    }
    updateHUD();
}

function takePlayerDamage(dmg) {
    if (isGodMode || isJumping) return;
    if ((player.hp = Math.max(0, player.hp - dmg)) <= 0) {
        alert("Bạn đã hi sinh! Nhấn F5 để chơi lại.");
        location.reload();
    }
    updateHUD();
}

// --- 4. GAME LOOP DÙNG REQUESTANIMATIONFRAME ---
let lastTime = performance.now();

function startGameLoops() {
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

function gameLoop(currentTime) {
    const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
    lastTime = currentTime;

    if (!isSideMenuOpen) {
        // Di chuyển Player
        const currentSpeed = keys["shift"] ? player.spd * 1.6 : player.spd;
        let dx = 0, dy = 0;
        if (keys["w"]) dy -= 1;
        if (keys["s"]) dy += 1;
        if (keys["a"]) { dx -= 1; facingDirection = "left"; }
        if (keys["d"]) { dx += 1; facingDirection = "right"; }

        if (dx !== 0 && dy !== 0) {
            dx *= 0.7071;
            dy *= 0.7071;
        }

        let nextX = clamp(player.x + dx * currentSpeed * dt, 40, MAP.w - 40);
        let nextY = clamp(player.y + dy * currentSpeed * dt, 40, MAP.h - 40);

        if (!checkTreeCollision(nextX, player.y, 18)) player.x = nextX;
        if (!checkTreeCollision(player.x, nextY, 18)) player.y = nextY;

        const playerEl = $("player");
        playerEl.style.left = `${player.x}px`;
        playerEl.style.top = `${player.y}px`;
        playerEl.style.zIndex = Math.floor(player.y);

        isMoving = (dx !== 0 || dy !== 0);
        playerEl.classList.toggle("running-lean", isMoving && !isJumping);
        playerEl.classList.toggle("idle", !isMoving && !isJumping && !isAttacking && !isCastingUlt);
        playerEl.classList.toggle("facing-left", facingDirection === "left");
        playerEl.classList.toggle("facing-right", facingDirection === "right");

        // Camera theo dõi Player
        const camX = clamp(player.x - MAP.vw / 2, 0, MAP.w - MAP.vw);
        const camY = clamp(player.y - MAP.vh / 2, 0, MAP.h - MAP.vh);
        $("world").style.transform = `translate(${-camX}px, ${-camY}px)`;

        // AI Quái thường
        enemies.forEach(en => {
            if (en.hp <= 0) return;
            const d = dist(player, en);
            const el = $(`enemy-${en.id}`);

            if (d < 700 && d > 30) {
                const moveX = ((player.x - en.x) / d) * en.spd * dt;
                const moveY = ((player.y - en.y) / d) * en.spd * dt;
                const eNextX = en.x + moveX;
                const eNextY = en.y + moveY;

                if (!checkTreeCollision(eNextX, en.y, 14)) en.x = eNextX;
                if (!checkTreeCollision(en.x, eNextY, 14)) en.y = eNextY;

                if (el) {
                    el.classList.add("enemy-walking");
                    el.classList.toggle("facing-left", moveX < 0);
                    el.classList.toggle("facing-right", moveX >= 0);
                }
            } else if (el) {
                el.classList.remove("enemy-walking");
            }

            if (el) {
                el.style.left = `${en.x}px`;
                el.style.top = `${en.y}px`;
                el.style.zIndex = Math.floor(en.y);
            }

            if (en.cd > 0) en.cd -= dt * 1000;
            if (d < 38 && en.cd <= 0) { 
                takePlayerDamage(en.dmg); 
                en.cd = 1000; 
            }
        });

        // AI Boss Orc
        if (boss.hp > 0) {
            const d = dist(player, boss);
            if (d < 900 && d > 55) {
                const bMoveX = ((player.x - boss.x) / d) * boss.spd * dt;
                const bMoveY = ((player.y - boss.y) / d) * boss.spd * dt;
                const bNextX = boss.x + bMoveX;
                const bNextY = boss.y + bMoveY;

                if (!checkTreeCollision(bNextX, boss.y, 28)) boss.x = bNextX;
                if (!checkTreeCollision(boss.x, bNextY, 28)) boss.y = bNextY;
            }
            const bossEl = $("boss");
            bossEl.style.left = `${boss.x}px`;
            bossEl.style.top = `${boss.y}px`;
            bossEl.style.zIndex = Math.floor(boss.y);

            if (boss.cd > 0) boss.cd -= dt * 1000;
            if (d < 75 && boss.cd <= 0) {
                const bChar = $("boss-character");
                bChar?.classList.add("boss-attack");
                takePlayerDamage(boss.dmg);
                boss.cd = 1400;
                setTimeout(() => bChar?.classList.remove("boss-attack"), 300);
            }
        }

        // Quản lý đạn
        for (let i = projectiles.length - 1; i >= 0; i--) {
            const p = projectiles[i];
            p.x += p.vx * dt; 
            p.y += p.vy * dt;

            const hitTarget = [...enemies, ...(boss.hp > 0 ? [boss] : [])].find(t => t.hp > 0 && dist(p, t) < (t.isBoss ? 42 : 26));
            const hitTree = checkTreeCollision(p.x, p.y, 8);
            const outOfBounds = p.x < 0 || p.x > MAP.w || p.y < 0 || p.y > MAP.h;

            if (hitTarget || hitTree || outOfBounds) {
                if (hitTarget) applyDamage(hitTarget, p.damage);
                p.el?.remove();
                projectiles.splice(i, 1);
                continue;
            }

            p.el.style.left = `${p.x}px`;
            p.el.style.top = `${p.y}px`;
        }
    }

    requestAnimationFrame(gameLoop);
}

// --- 5. NÚT ẢO MOBILE ---
function setupTouchControls() {
    document.querySelectorAll(".touch-dpad .touch-btn").forEach(btn => {
        const k = btn.dataset.key;
        btn.addEventListener("touchstart", e => { e.preventDefault(); keys[k] = true; }, { passive: false });
        btn.addEventListener("touchend", e => { e.preventDefault(); keys[k] = false; }, { passive: false });
    });

    document.querySelectorAll(".touch-actions .touch-btn").forEach(btn => {
        const act = btn.dataset.action;
        btn.addEventListener("touchstart", e => {
            e.preventDefault();
            if (isSideMenuOpen) return;
            if (act === "atk") attack();
            if (act === "jump" && !isJumping) jump();
            if (act === "ult") castUltimate();
        }, { passive: false });
    });
}

// --- 6. DEBUG TOOLS ---
window.debugFullEnergy = () => { player.energy = 100; updateHUD(); };
window.debugLevelUp = () => addExp(player.expNeed - player.exp);
window.debugKillAllEnemies = () => enemies.filter(e => e.hp > 0).forEach(e => applyDamage(e, 9999));

window.debugInfiniteMode = () => {
    isGodMode = !isGodMode;
    const st = $("debug-godmode-status");
    if (st) {
        st.innerText = isGodMode ? "BẬT (Bất tử + Vô hạn nộ)" : "TẮT";
        st.style.color = isGodMode ? "#00ff66" : "red";
    }
    player.hp = player.maxHp = isGodMode ? 99999 : 100;
    player.dmg = isGodMode ? 999 : (CLASSES[player.classKey]?.dmg || 15);
    updateHUD();
};

window.debugSpawnItems = () => {
    let pot = inventory.find(i => i.id === "hp_pot");
    pot ? pot.count += 10 : inventory.push({ id: "hp_pot", name: "Bình Máu", icon: "🧪", count: 10, type: "potion", heal: 35 });
    if (isSideMenuOpen) renderInventory();
};

window.debugSpawnBoss = () => {
    boss.hp = boss.maxHp;
    boss.x = player.x + 180;
    boss.y = player.y;
    $("boss").style.display = "block";
    $("boss-hp").innerText = `BOSS HP: ${boss.hp}/${boss.maxHp}`;
};