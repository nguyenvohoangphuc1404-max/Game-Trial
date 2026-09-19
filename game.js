// --- CẤU HÌNH HỆ THỐNG & HELPER ---
const $ = id => document.getElementById(id);
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

const MAP = { w: 2400, h: 1500, vw: 900, vh: 520 };
const keys = {}, projectiles = [];
let isSideMenuOpen = false, isGodMode = false;

// Trạng thái chuyển động
let isJumping = false;
let isMoving = false;
let facingDirection = "right";

// Dữ liệu nghề nghiệp
const CLASSES = {
    warrior:   { name: "Kiếm sĩ", icon: "⚔️", dmg: 22, spd: 8,  rng: 100, hp: 120, ranged: false },
    archer:    { name: "Cung thủ", icon: "🏹", dmg: 12, spd: 10, rng: 320, hp: 100, ranged: true },
    mage:      { name: "Pháp sư",  icon: "🔮", dmg: 18, spd: 7,  rng: 260, hp: 100, ranged: true, pIcon: "✨" },
    scientist: { name: "Nhà khoa học", icon: '<img src="scientist.png" class="character-img" alt="Scientist">', dmg: 20, spd: 8, rng: 230, hp: 100, ranged: true, pIcon: "⚡" }
};

// Thực thể người chơi & Boss
let player = { classKey: "", x: 450, y: 350, spd: 8, dmg: 15, hp: 100, maxHp: 100, exp: 0, expNeed: 70, lvl: 1, rng: 90, ranged: false, energy: 0 };
let boss = { x: 900, y: 500, hp: 250, maxHp: 250, spd: 1.4, dmg: 18, cd: 0, isBoss: true };

// Túi đồ & Quái
let inventory = [
    { id: "hp_pot", name: "Bình Máu", icon: "🧪", count: 5, type: "potion", heal: 35 },
    { id: "iron_sword", name: "Đoản Kiếm", icon: "🗡️", count: 1, type: "weapon" }
];
let enemies = [
    { id: 1, x: 300, y: 200 }, { id: 2, x: 800, y: 250 }, { id: 3, x: 500, y: 800 },
    { id: 4, x: 1300, y: 400 }, { id: 5, x: 1100, y: 800 }
].map(e => ({ ...e, hp: 35, maxHp: 35, spd: 2.0, dmg: 6, cd: 0 }));

// --- 1. CHỌN CLASS & KHỞI TẠO GAME ---
document.querySelectorAll(".class-button").forEach(btn => {
    btn.onclick = () => {
        const c = CLASSES[player.classKey = btn.dataset.class];
        Object.assign(player, { dmg: c.dmg, spd: c.spd, rng: c.rng, maxHp: c.hp, hp: c.hp, ranged: c.ranged });
        
        $("player").innerHTML = c.icon;
        $("class-name").innerText = c.name;
        $("class-screen").style.display = "none";
        $("game-screen").style.display = "block";

        initEnemies();
        updateHUD();
        setupTouchControls();
        startGameLoops();
    };
});

function initEnemies() {
    $("enemies-container").innerHTML = enemies.map(e => 
        `<div id="enemy-${e.id}" class="enemy-item" style="left:${e.x}px;top:${e.y}px">
            <div class="enemy-sprite"></div>
            <div class="enemy-hp" id="hp-${e.id}">${e.hp}/${e.hp}</div>
        </div>`
    ).join("");
}

function updateHUD() {
    $("damage").innerText = player.dmg;
    $("player-hp").innerText = player.hp;
    $("player-max-hp").innerText = player.maxHp;
    $("level").innerText = player.lvl;
    $("exp").innerText = player.exp;
    $("exp-needed").innerText = player.expNeed;

    if (isSideMenuOpen) {
        $("stat-class").innerText = CLASSES[player.classKey]?.name || "---";
        $("stat-level").innerText = player.lvl;
        $("stat-hp").innerText = `${player.hp} /${player.maxHp}`;
        $("stat-atk").innerText = player.dmg;
        $("stat-range").innerText = `${player.rng} px`;
        $("stat-speed").innerText = player.spd;
        $("stat-exp").innerText = `${player.exp} /${player.expNeed}`;
    }
}

// --- 2. QUẢN LÝ GIAO DIỆN TÚI ĐỒ (INVENTORY) ---
$("btn-toggle-ui").onclick = toggleDualMenu;

function toggleDualMenu() {
    $("side-menu-container").style.display = (isSideMenuOpen = !isSideMenuOpen) ? "block" : "none";
    if (isSideMenuOpen) { updateHUD(); renderInventory(); }
}

function renderInventory() {
    $("inventory-grid").innerHTML = Array.from({ length: 12 }, (_, i) => {
        const it = inventory[i];
        return `<div class="inv-slot" onclick="useItem(${i})">
            ${it ? `<div class="slot-icon">${it.icon}</div><div class="slot-name">${it.name}</div><div class="slot-count">x${it.count}</div>` : ""}
        </div>`;
    }).join("");
}

function useItem(idx) {
    const it = inventory[idx];
    if (it?.type === "potion" && player.hp < player.maxHp) {
        player.hp = Math.min(player.maxHp, player.hp + it.heal);
        if (--it.count <= 0) inventory.splice(idx, 1);
        updateHUD(); renderInventory();
    }
}

// --- 3. ĐIỀU KHIỂN & HÀNH ĐỘNG ---
window.onkeydown = e => {
    const k = e.key.toLowerCase();
    keys[k] = true;

    if (k === "j" && !isJumping) jump();
    if (e.code === "Space") attack();
    if (k === "e" && player.classKey === "scientist") castLightningDragon();
    if (["b", "c", "i"].includes(k)) toggleDualMenu();
    if (["`", "~"].includes(e.key)) $("debug-panel").style.display = $("debug-panel").style.display === "block" ? "none" : "block";
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
    const targets = [...enemies, ...(boss.hp > 0 ? [boss] : [])].filter(t => t.hp > 0);
    if (player.ranged) {
        const target = targets.reduce((best, t) => {
            const d = dist(player, t);
            return (d <= player.rng && (!best || d < best.d)) ? { t, d } : best;
        }, null)?.t;

        if (target) {
            const d = dist(player, target);
            projectiles.push({
                x: player.x, y: player.y,
                vx: ((target.x - player.x) / d) * 14,
                vy: ((target.y - player.y) / d) * 14,
                damage: player.dmg, icon: CLASSES[player.classKey]?.pIcon || ""
            });
        }
    } else {
        targets.filter(t => dist(player, t) <= player.rng).forEach(t => applyDamage(t, player.dmg));
    }
}

function applyDamage(target, dmg) {
    target.hp = Math.max(0, target.hp - dmg);
    
    // Chớp đỏ khi nhận đòn
    const targetEl = target.isBoss ? $("boss-character") : $(`enemy-${target.id}`);
    if (targetEl) {
        targetEl.classList.add("hit-flash");
        setTimeout(() => targetEl.classList.remove("hit-flash"), 120);
    }

    // Đẩy lùi nhẹ quái thường
    if (!target.isBoss) {
        const d = dist(player, target) || 1;
        target.x += ((target.x - player.x) / d) * 16;
        target.y += ((target.y - player.y) / d) * 16;
    }

    // Tích nộ nhà khoa học
    if (player.classKey === "scientist" && (player.energy < 100 || isGodMode)) {
        player.energy = Math.min(100, player.energy + (target.isBoss ? 15 : 10));
        $("scientist-ult").innerText = player.energy;
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

function castLightningDragon() {
    if (!isGodMode && player.energy < 100) return;
    if (!isGodMode) $("scientist-ult").innerText = (player.energy = 0);

    const dragon = document.createElement("div");
    dragon.className = "lightning-dragon";
    dragon.innerHTML = "⚡🐉⚡";
    dragon.style.top = `${player.y}px`;
    $("world").appendChild(dragon);

    enemies.filter(e => e.hp > 0).forEach(e => applyDamage(e, 70));
    if (boss.hp > 0) {
        applyDamage(boss, 90);
        const prevSpd = boss.spd; boss.spd = 0;
        $("boss-character")?.classList.add("electrocuted");
        setTimeout(() => { boss.spd = prevSpd; $("boss-character")?.classList.remove("electrocuted"); }, 2500);
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

// --- 4. GAME LOOP & CHUYỂN ĐỘNG ---
function startGameLoops() {
    setInterval(() => {
        const currentSpeed = keys["shift"] ? player.spd * 1.6 : player.spd;

        let dx = 0;
        let dy = 0;
        if (keys["w"]) dy -= 1;
        if (keys["s"]) dy += 1;
        if (keys["a"]) { dx -= 1; facingDirection = "left"; }
        if (keys["d"]) { dx += 1; facingDirection = "right"; }

        if (dx !== 0 && dy !== 0) {
            dx *= 0.7071;
            dy *= 0.7071;
        }

        player.x = clamp(player.x + dx * currentSpeed, 40, MAP.w - 40);
        player.y = clamp(player.y + dy * currentSpeed, 40, MAP.h - 40);

        const playerEl = $("player");
        playerEl.style.left = `${player.x}px`;
        playerEl.style.top = `${player.y}px`;

        isMoving = (dx !== 0 || dy !== 0);
        playerEl.classList.toggle("running-lean", isMoving && !isJumping);
        playerEl.classList.toggle("idle", !isMoving && !isJumping);
        playerEl.classList.toggle("facing-left", facingDirection === "left");
        playerEl.classList.toggle("facing-right", facingDirection === "right");

        // Camera cuộn theo Player
        const camX = clamp(player.x - MAP.vw / 2, 0, MAP.w - MAP.vw);
        const camY = clamp(player.y - MAP.vh / 2, 0, MAP.h - MAP.vh);
        $("world").style.transform = `translate(${-camX}px, ${-camY}px)`;

        // AI Quái thường
        enemies.forEach(en => {
            if (en.hp <= 0) return;
            const d = dist(player, en);
            const el = $(`enemy-${en.id}`);

            if (d < 700 && d > 30) {
                const moveX = ((player.x - en.x) / d) * en.spd;
                const moveY = ((player.y - en.y) / d) * en.spd;
                en.x += moveX;
                en.y += moveY;

                if (el) {
                    el.classList.add("enemy-walking");
                    el.classList.toggle("facing-left", moveX < 0);
                    el.classList.toggle("facing-right", moveX >= 0);
                }
            } else {
                if (el) el.classList.remove("enemy-walking");
            }

            if (el) Object.assign(el.style, { left: `${en.x}px`, top: `${en.y}px` });

            if (en.cd > 0) en.cd -= 50;
            if (d < 38 && en.cd <= 0) { 
                takePlayerDamage(en.dmg); 
                en.cd = 1000; 
            }
        });

        // AI Boss Orc
        if (boss.hp > 0) {
            const d = dist(player, boss);
            if (d < 900 && d > 55) {
                boss.x += ((player.x - boss.x) / d) * boss.spd;
                boss.y += ((player.y - boss.y) / d) * boss.spd;
            }
            Object.assign($("boss").style, { left: `${boss.x}px`, top: `${boss.y}px` });

            if (boss.cd > 0) boss.cd -= 50;
            if (d < 75 && boss.cd <= 0) {
                const bChar = $("boss-character");
                bChar?.classList.add("boss-attack");
                takePlayerDamage(boss.dmg);
                boss.cd = 1400;
                setTimeout(() => bChar?.classList.remove("boss-attack"), 300);
            }
        }

        // Quản lý đạn
        const container = $("projectiles-container");
        for (let i = projectiles.length - 1; i >= 0; i--) {
            const p = projectiles[i];
            p.x += p.vx; p.y += p.vy;

            const hitTarget = [...enemies, ...(boss.hp > 0 ? [boss] : [])].find(t => t.hp > 0 && dist(p, t) < (t.isBoss ? 42 : 26));
            const outOfBounds = p.x < 0 || p.x > MAP.w || p.y < 0 || p.y > MAP.h;

            if (hitTarget || outOfBounds) {
                if (hitTarget) applyDamage(hitTarget, p.damage);
                p.el?.remove();
                projectiles.splice(i, 1);
                continue;
            }

            if (!p.el) {
                p.el = document.createElement("div");
                p.el.className = "projectile";
                p.el.innerText = p.icon;
                container.appendChild(p.el);
            }
            Object.assign(p.el.style, { left: `${p.x}px`, top: `${p.y}px` });
        }
    }, 50);
}

// --- 5. NÚT CẢM ỨNG ĐIỆN THOẠI ---
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
            if (act === "atk") attack();
            if (act === "jump" && !isJumping) jump();
            if (act === "ult" && player.classKey === "scientist") castLightningDragon();
        }, { passive: false });
    });
}

// --- 6. CÔNG CỤ DEBUG / GOD MODE ---
function debugFullEnergy() { $("scientist-ult").innerText = (player.energy = 100); }
function debugLevelUp() { addExp(player.expNeed - player.exp); }
function debugKillAllEnemies() { enemies.filter(e => e.hp > 0).forEach(e => applyDamage(e, 9999)); }

function debugInfiniteMode() {
    isGodMode = !isGodMode;
    $("debug-godmode-status").innerText = isGodMode ? "BẬT (Bất tử + Vô hạn nộ)" : "TẮT";
    $("debug-godmode-status").style.color = isGodMode ? "#00ff66" : "red";
    player.hp = player.maxHp = isGodMode ? 99999 : 100;
    player.dmg = isGodMode ? 999 : (CLASSES[player.classKey]?.dmg || 15);
    updateHUD();
}

function debugSpawnItems() {
    let pot = inventory.find(i => i.id === "hp_pot");
    pot ? pot.count += 10 : inventory.push({ id: "hp_pot", name: "Bình Máu", icon: "🧪", count: 10, type: "potion", heal: 35 });
    if (isSideMenuOpen) renderInventory();
}

function debugSpawnBoss() {
    boss.hp = boss.maxHp;
    boss.x = player.x + 180;
    boss.y = player.y;
    $("boss").style.display = "block";
    $("boss-hp").innerText = `BOSS HP: ${boss.hp}/${boss.maxHp}`;
}