// --- 1. CORE HELPER & STATE ---
const $ = id => document.getElementById(id);
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

const MAP = { w: 2400, h: 1500 };
let vw = window.innerWidth, vh = window.innerHeight - 44;
window.onresize = () => { vw = window.innerWidth; vh = window.innerHeight - 44; };

const keys = {}, projectiles = [];
let isSideMenuOpen = false, isGodMode = false, isNPCModalOpen = false;
let isJumping = false, isAttacking = false, isCastingUlt = false;
let facingDirection = "left", animFrameId = null, lastTime = performance.now();

let playerDirection = 0; // 0: Xuống, 1: Trái, 2: Phải, 3: Lên
const walkCycle = [1, 0, 1, 2];
let walkStep = 0, animTimer = 0;
let joystickVector = { x: 0, y: 0 };

// --- 2. CLASS, NPC, QUÁI VẬT ---
const CLASSES = {
    warrior:   { name: "Kiếm Sĩ",      baseDmg: 24, spd: 7.5, rng: 110, baseHp: 130, icon: "⚔️" },
    archer:    { name: "Cung Thủ",      baseDmg: 18, spd: 8.5, rng: 360, baseHp: 95,  icon: "🏹", ranged: true, pIcon: "🏹" },
    mage:      { name: "Pháp Sư",       baseDmg: 30, spd: 6.0, rng: 300, baseHp: 85,  icon: "🔮", ranged: true, pIcon: "🔥" },
    scientist: { name: "Nhà Khoa Học", baseDmg: 26, spd: 7.0, rng: 280, baseHp: 100, icon: "⚡", ranged: true, pIcon: "⚡" }
};

let player = { classKey: "warrior", x: 450, y: 350, spd: 320, dmg: 24, defense: 0, hp: 130, maxHp: 130, gold: 50, exp: 0, expNeed: 70, lvl: 1, rng: 110, energy: 0 };
let equipped = { weapon: null, armor: null };
let boss = { x: 900, y: 500, hp: 250, maxHp: 250, spd: 85, dmg: 18, cd: 0, isBoss: true };

const blacksmithNPC = {
    x: 520, y: 280,
    shop: [
        { id: "iron_sword", name: "Kiếm Sắt", icon: "🗡️", type: "weapon", bonusDmg: 10, cost: 40 },
        { id: "great_axe", name: "Rìu Thép", icon: "🪓", type: "weapon", bonusDmg: 22, cost: 110 },
        { id: "leather_armor", name: "Giáp Da", icon: "🥋", type: "armor", bonusHp: 40, defense: 3, cost: 50 },
        { id: "steel_armor", name: "Giáp Thép", icon: "🛡️", type: "armor", bonusHp: 90, defense: 7, cost: 130 },
        { id: "hp_pot", name: "Bình Máu", icon: "🧪", type: "potion", heal: 40, cost: 15 }
    ]
};

let inventory = [
    { id: "hp_pot", name: "Bình Máu", icon: "🧪", count: 5, type: "potion", heal: 35 },
    { id: "iron_sword", name: "Kiếm Sắt", icon: "🗡️", count: 1, type: "weapon", bonusDmg: 10 }
];

const MONSTERS = {
    goblin:   { name: "Goblin", icon: "👺", hp: 35, spd: 120, dmg: 7, rng: 38, exp: 18, gold: [3, 8] },
    wolf:     { name: "Sói Rừng", icon: "🐺", hp: 25, spd: 195, dmg: 6, rng: 35, exp: 20, gold: [2, 6] },
    skeleton: { name: "Xương", icon: "💀", hp: 30, spd: 80, dmg: 9, rng: 260, exp: 25, gold: [5, 12], ranged: true },
    brute:    { name: "Orc Đồ Tể", icon: "👹", hp: 110, spd: 75, dmg: 16, rng: 45, exp: 50, gold: [15, 30] }
};

let enemies = [
    { id: 1, t: "goblin", x: 300, y: 200 }, { id: 2, t: "wolf", x: 650, y: 220 },
    { id: 3, t: "skeleton", x: 800, y: 260 }, { id: 4, t: "goblin", x: 500, y: 820 },
    { id: 5, t: "brute", x: 1150, y: 880 }, { id: 6, t: "skeleton", x: 1500, y: 400 },
    { id: 7, t: "brute", x: 1750, y: 550 }, { id: 8, t: "wolf", x: 2100, y: 400 }
].map(e => ({ ...e, ...MONSTERS[e.t], maxHp: MONSTERS[e.t].hp, cd: 0, ox: e.x, oy: e.y }));

const trees = Array.from({ length: 20 }, (_, i) => ({
    x: ((i * 143) % 2200) + 100, y: ((i * 97) % 1300) + 100,
    r: 22, icon: i % 2 === 0 ? "🌲" : "🌳", size: 68
}));

const checkTree = (x, y, r = 18) => trees.some(t => Math.hypot(x - t.x, y - t.y) < t.r + r);

function createFloatText(x, y, txt, color = "#ffeb3b") {
    const el = document.createElement("div");
    el.className = "damage-float";
    el.innerText = txt;
    el.style.left = `${x}px`; el.style.top = `${y}px`; el.style.color = color;
    $("world").appendChild(el);
    setTimeout(() => el.remove(), 800);
}

function recalculateStats() {
    const c = CLASSES[player.classKey];
    player.dmg = c.baseDmg + (equipped.weapon?.bonusDmg || 0) + (player.lvl - 1) * 5;
    player.maxHp = c.baseHp + (equipped.armor?.bonusHp || 0) + (player.lvl - 1) * 15;
    player.defense = equipped.armor?.defense || 0;
    player.hp = Math.min(player.hp, player.maxHp);
    player.spd = c.spd * 45;
    player.rng = c.rng;
    player.ranged = !!c.ranged;
}

function updateHUD() {
    const map = {
        "damage": player.dmg, "player-hp": Math.round(player.hp), "player-max-hp": player.maxHp,
        "player-gold": player.gold, "level": player.lvl, "ult-energy": player.energy, "stat-hud-def": player.defense
    };
    for (let k in map) $(k) && ($(k).innerText = map[k]);
    $("ult-hud-box")?.classList.toggle("ult-ready", player.energy >= 100 || isGodMode);

    if (isSideMenuOpen) {
        $("stat-class").innerText = CLASSES[player.classKey]?.name;
        $("stat-atk").innerText = player.dmg;
        $("stat-def").innerText = player.defense;
        $("stat-speed").innerText = Math.round(player.spd / 45);
        $("slot-weapon").querySelector(".slot-content").innerText = equipped.weapon ? `${equipped.weapon.icon} +${equipped.weapon.bonusDmg} ATK` : "Trống";
        $("slot-armor").querySelector(".slot-content").innerText = equipped.armor ? `${equipped.armor.icon} +${equipped.armor.bonusHp} HP` : "Trống";
    }
}

// --- 3. BẮN ĐẠN & SÁT THƯƠNG ---
function spawnBullet(src, target, dmg, icon, isEnemy = false) {
    const d = dist(src, target) || 1;
    const el = document.createElement("div");
    el.className = isEnemy ? "enemy-arrow" : "projectile";
    el.innerText = icon;
    $("projectiles-container").appendChild(el);
    projectiles.push({
        x: src.x, y: src.y,
        vx: ((target.x - src.x) / d) * (isEnemy ? 420 : 720),
        vy: ((target.y - src.y) / d) * (isEnemy ? 420 : 720),
        damage: dmg, isEnemy, el
    });
}

function applyDamage(target, dmg) {
    target.hp = Math.max(0, target.hp - dmg);
    createFloatText(target.x, target.y - 30, `-${dmg}`);

    const el = target.isBoss ? $("boss-character") : $(`enemy-${target.id}`);
    el?.classList.add("hit-flash");
    setTimeout(() => el?.classList.remove("hit-flash"), 120);

    if (player.energy < 100 || isGodMode) {
        player.energy = Math.min(100, player.energy + (target.isBoss ? 20 : 12));
        updateHUD();
    }

    if (target.hp <= 0) {
        if (target.isBoss) {
            $("boss").style.display = "none";
            player.gold += 80;
            createFloatText(target.x, target.y - 50, "+80 💰", "#ffd700");
            alert("Chiến thắng Boss Orc!");
        } else {
            $(`enemy-${target.id}`).style.display = "none";
            const g = Math.floor(Math.random() * (target.gold[1] - target.gold[0] + 1)) + target.gold[0];
            player.gold += g;
            createFloatText(target.x, target.y - 40, `+${g} 💰`, "#ffd700");

            if ((player.exp += target.exp) >= player.expNeed) {
                player.exp -= player.expNeed;
                player.lvl++;
                player.expNeed += 35;
                recalculateStats();
                player.hp = player.maxHp;
                createFloatText(player.x, player.y - 60, "⭐ LEVEL UP! ⭐", "#00e5ff");
            }

            setTimeout(() => {
                target.hp = target.maxHp;
                target.x = clamp(target.ox + (Math.random() - 0.5) * 150, 80, MAP.w - 80);
                target.y = clamp(target.oy + (Math.random() - 0.5) * 150, 80, MAP.h - 80);
                const eEl = $(`enemy-${target.id}`);
                if (eEl) Object.assign(eEl.style, { left: `${target.x}px`, top: `${target.y}px`, display: "block" });
                $(`hp-${target.id}`).innerText = `${target.maxHp}/${target.maxHp}`;
            }, 4000);
        }
    } else {
        $(target.isBoss ? "boss-hp" : `hp-${target.id}`).innerText = target.isBoss ? `BOSS: ${target.hp}/${target.maxHp}` : `${target.hp}/${target.maxHp}`;
    }
    updateHUD();
}

function takePlayerDamage(dmg) {
    if (isGodMode || isJumping) return;
    const real = Math.max(1, dmg - player.defense);
    player.hp = Math.max(0, player.hp - real);
    createFloatText(player.x, player.y - 30, `-${real}`, "#ff1744");
    if (player.hp <= 0) {
        alert("Bạn đã hi sinh! Đang tái sinh...");
        player.hp = player.maxHp;
        player.x = 450; player.y = 350;
    }
    updateHUD();
}

// --- 4. HÀNH ĐỘNG CHIẾN ĐẤU ---
function attack() {
    const targets = [...enemies, ...(boss.hp > 0 ? [boss] : [])].filter(t => t.hp > 0);

    if (player.ranged) {
        const t = targets.reduce((b, cur) => {
            const d = dist(player, cur);
            return (d <= player.rng && (!b || d < b.d)) ? { cur, d } : b;
        }, null)?.cur;
        if (t) spawnBullet(player, t, player.dmg, CLASSES[player.classKey].pIcon);
    } else {
        if (isAttacking) return;
        isAttacking = true;

        const pEl = $("player");
        const scaleX = facingDirection === "right" ? 1 : -1;
        pEl.style.transform = `translate(-50%, -50%) scaleX(${scaleX})`;
        pEl.classList.add("knight-attacking");

        setTimeout(() => {
            pEl.classList.remove("knight-attacking");
            pEl.style.transform = `translate(-50%, -50%)`;
            isAttacking = false;
        }, 350);

        targets.forEach(t => {
            const inRange = dist(player, t) <= player.rng;
            const isFront = facingDirection === "right" ? (t.x >= player.x - 20) : (t.x <= player.x + 20);
            if (inRange && isFront) {
                applyDamage(t, player.dmg);
            }
        });
    }
}

function jump() {
    if (isJumping) return;
    isJumping = true;
    $("player").classList.add("jumping");
    setTimeout(() => { $("player").classList.remove("jumping"); isJumping = false; }, 400);
}

function castUltimate() {
    if ((!isGodMode && player.energy < 100) || isCastingUlt) return;
    if (!isGodMode) player.energy = 0;
    updateHUD();

 if (player.classKey === "warrior") {
        isCastingUlt = true;
        const pEl = $("player");
        pEl.classList.remove("knight-sprite");
        pEl.classList.add("knight-ultimate-lion");

        // Gây sát thương diện rộng xung quanh/phía trước khi sư tử lao tới
        const targets = [...enemies, ...(boss.hp > 0 ? [boss] : [])].filter(t => t.hp > 0);
        targets.forEach(t => {
            const inRange = dist(player, t) <= 300; // Tầm ảnh hưởng của sư tử
            if (inRange) {
                applyDamage(t, t.isBoss ? 200 : t.hp + 999);
            }
        });

        // Chạy xong hoạt ảnh gồng nộ thì trả về sprite bình thường
        setTimeout(() => {
            pEl.classList.remove("knight-ultimate-lion");
            pEl.classList.add("knight-sprite");
            isCastingUlt = false;
        }, 600);
        return;
    }

    // Nộ class khác
    const targets = [...enemies, ...(boss.hp > 0 ? [boss] : [])].filter(t => t.hp > 0);
    const dragon = document.createElement("div");
    dragon.className = "lightning-dragon";
    dragon.innerHTML = "⚡🐉⚡";
    dragon.style.top = `${player.y}px`;
    $("world").appendChild(dragon);
    targets.forEach(t => applyDamage(t, t.isBoss ? 90 : 65));
    setTimeout(() => dragon.remove(), 1000);
}

// --- 5. MINIMAP & GAME LOOP ---
function drawMinimap() {
    const cvs = $("minimap"), ctx = cvs?.getContext("2d");
    if (!ctx) return;
    const sx = cvs.width / MAP.w, sy = cvs.height / MAP.h;
    ctx.fillStyle = "#1e3c1b"; ctx.fillRect(0, 0, cvs.width, cvs.height);

    ctx.fillStyle = "#ffb300"; ctx.beginPath(); ctx.arc(blacksmithNPC.x * sx, blacksmithNPC.y * sy, 3.5, 0, 7); ctx.fill();
    ctx.fillStyle = "#2979ff";
    enemies.filter(e => e.hp > 0).forEach(e => { ctx.beginPath(); ctx.arc(e.x * sx, e.y * sy, 2.5, 0, 7); ctx.fill(); });
    if (boss.hp > 0) { ctx.fillStyle = "#ff1744"; ctx.beginPath(); ctx.arc(boss.x * sx, boss.y * sy, 5, 0, 7); ctx.fill(); }
    ctx.fillStyle = "#00e676"; ctx.beginPath(); ctx.arc(player.x * sx, player.y * sy, 3.5, 0, 7); ctx.fill();
}

function gameLoop(time) {
    const dt = Math.min((time - lastTime) / 1000, 0.1);
    lastTime = time;

    if (!isSideMenuOpen && !isNPCModalOpen) {
        let dx = (keys["d"] ? 1 : 0) - (keys["a"] ? 1 : 0) || joystickVector.x;
        let dy = (keys["s"] ? 1 : 0) - (keys["w"] ? 1 : 0) || joystickVector.y;

        const isMoving = (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1);

        if (Math.abs(dy) > Math.abs(dx)) {
            if (dy > 0) playerDirection = 0;
            else if (dy < 0) playerDirection = 3;
        } else if (Math.abs(dx) > 0) {
            if (dx > 0) {
                playerDirection = 2;
                facingDirection = "right";
            } else {
                playerDirection = 1;
                facingDirection = "left";
            }
        }

        const currentSpd = (keys["shift"] ? player.spd * 1.55 : player.spd) * dt;
        const nx = clamp(player.x + dx * currentSpd, 40, MAP.w - 40);
        const ny = clamp(player.y + dy * currentSpd, 40, MAP.h - 40);
        if (!checkTree(nx, player.y)) player.x = nx;
        if (!checkTree(player.x, ny)) player.y = ny;

        const pEl = $("player");
        pEl.style.left = `${player.x}px`; pEl.style.top = `${player.y}px`; pEl.style.zIndex = Math.floor(player.y);

        if (player.classKey === "warrior" && !isCastingUlt && !isAttacking) {
            let col = 1;
            if (isMoving && !isJumping) {
                animTimer += dt * 1000;
                if (animTimer >= 140) {
                    animTimer = 0;
                    walkStep = (walkStep + 1) % walkCycle.length;
                }
                col = walkCycle[walkStep];
            } else {
                walkStep = 0; animTimer = 0; col = 1;
            }
            pEl.style.backgroundPosition = `${col * 50}\%${playerDirection * 33.3333}%`;
        } else if (player.classKey !== "warrior") {
            pEl.classList.toggle("running-lean", isMoving && !isJumping);
            pEl.classList.toggle("facing-left", facingDirection === "left");
            pEl.classList.toggle("facing-right", facingDirection === "right");
        }

        $("world").style.transform = `translate(${-clamp(player.x - vw / 2, 0, MAP.w - vw)}px,${-clamp(player.y - vh / 2, 0, MAP.h - vh)}px)`;
        $("npc-blacksmith")?.querySelector(".npc-bubble")?.classList.toggle("active", dist(player, blacksmithNPC) < 100);

        const allEnemies = [...enemies.filter(e => e.hp > 0), ...(boss.hp > 0 ? [boss] : [])];
        allEnemies.forEach(en => {
            const d = dist(player, en);
            const el = en.isBoss ? $("boss") : $(`enemy-${en.id}`);
            const limit = en.isBoss ? 55 : (en.ranged ? 220 : en.rng);

            if (d < 650 && d > limit) {
                const mx = ((player.x - en.x) / d) * en.spd * dt;
                const my = ((player.y - en.y) / d) * en.spd * dt;
                if (!checkTree(en.x + mx, en.y, 16)) en.x += mx;
                if (!checkTree(en.x, en.y + my, 16)) en.y += my;
            }
            if (el) { el.style.left = `${en.x}px`; el.style.top = `${en.y}px`; el.style.zIndex = Math.floor(en.y); }

            if (en.cd > 0) en.cd -= dt * 1000;
            if (en.cd <= 0 && d <= (en.ranged ? 260 : (en.isBoss ? 75 : en.rng))) {
                if (en.ranged) { spawnBullet(en, player, en.dmg, "🏹", true); en.cd = 1800; }
                else { takePlayerDamage(en.dmg); en.cd = en.t === "wolf" ? 750 : 1100; }
            }
        });

        for (let i = projectiles.length - 1; i >= 0; i--) {
            const p = projectiles[i];
            p.x += p.vx * dt; p.y += p.vy * dt;
            const hitP = p.isEnemy && dist(p, player) < 30;
            const hitT = !p.isEnemy && allEnemies.find(t => dist(p, t) < 30);

            if (hitP || hitT || checkTree(p.x, p.y, 8) || p.x < 0 || p.x > MAP.w || p.y < 0 || p.y > MAP.h) {
                if (hitP) takePlayerDamage(p.damage);
                if (hitT) applyDamage(hitT, p.damage);
                p.el.remove();
                projectiles.splice(i, 1);
                continue;
            }
            p.el.style.left = `${p.x}px`; p.el.style.top = `${p.y}px`;
        }

        drawMinimap();
    }
    animFrameId = requestAnimationFrame(gameLoop);
}

// --- 6. HỆ THỐNG ĐIỀU KHIỂN ---
function setupControls() {
    window.onkeydown = e => {
        if (e.repeat) return;
        const k = e.key.toLowerCase();
        keys[k] = true;
        
        if (k === "n" || (k === "f" && dist(player, blacksmithNPC) < 100)) {
            isNPCModalOpen ? closeNPCModal() : openNPCModal();
        }
        if (k === "j") jump();
        if (e.code === "Space") attack();
        if (k === "f" || k === "e") castUltimate();
        if (["b", "c", "i"].includes(k)) toggleDualMenu();
        if (k === "~" || k === "`") $("debug-panel").style.display = $("debug-panel").style.display === "block" ? "none" : "block";
    };
    window.onkeyup = e => keys[e.key.toLowerCase()] = false;

    const joyZone = $("joystick-zone");
    const joyStick = $("joystick-stick");
    let touchId = null, startPos = { x: 0, y: 0 };
    const maxRadius = 40;

    joyZone.addEventListener("touchstart", e => {
        const t = e.changedTouches[0];
        touchId = t.identifier;
        const rect = joyZone.getBoundingClientRect();
        startPos = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }, { passive: false });

    window.addEventListener("touchmove", e => {
        if (touchId === null) return;
        for (let i = 0; i < e.changedTouches.length; i++) {
            const t = e.changedTouches[i];
            if (t.identifier === touchId) {
                const dx = t.clientX - startPos.x;
                const dy = t.clientY - startPos.y;
                const d = Math.hypot(dx, dy) || 1;
                const angle = Math.atan2(dy, dx);
                const r = Math.min(maxRadius, d);

                const mx = Math.cos(angle) * r;
                const my = Math.sin(angle) * r;

                joyStick.style.transform = `translate(calc(-50% + ${mx}px), calc(-50% + ${my}px))`;
                joystickVector = { x: mx / maxRadius, y: my / maxRadius };
                break;
            }
        }
    }, { passive: false });

    const endJoy = e => {
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === touchId) {
                touchId = null;
                joyStick.style.transform = "translate(-50%, -50%)";
                joystickVector = { x: 0, y: 0 };
                break;
            }
        }
    };
    window.addEventListener("touchend", endJoy);
    window.addEventListener("touchcancel", endJoy);

    document.querySelectorAll(".touch-action-btn").forEach(btn => {
        btn.addEventListener("touchstart", e => {
            e.preventDefault();
            const act = btn.dataset.action;
            if (act === "atk") attack();
            if (act === "jump") jump();
            if (act === "ult") castUltimate();
            if (act === "interact" && dist(player, blacksmithNPC) < 100) openNPCModal();
        }, { passive: false });
    });
}

// --- 7. TÚI ĐỒ, CỬA HÀNG NPC & CHỌN CLASS ---
function renderInventory() {
    $("inventory-grid").innerHTML = Array.from({ length: 8 }, (_, i) => {
        const it = inventory[i];
        return `<div class="inv-slot" onclick="useItem(${i})">
            ${it ? `<div class="slot-icon">${it.icon}</div><div class="slot-name">${it.name}</div>` : ""}
        </div>`;
    }).join("");
}

window.useItem = function(idx) {
    const it = inventory[idx];
    if (!it) return;
    if (it.type === "potion" && player.hp < player.maxHp) {
        player.hp = Math.min(player.maxHp, player.hp + it.heal);
        createFloatText(player.x, player.y - 40, `+${it.heal} HP`, "#00e676");
        if (--it.count <= 0) inventory.splice(idx, 1);
    } else if (it.type === "weapon" || it.type === "armor") {
        const slot = it.type;
        const prev = equipped[slot];
        equipped[slot] = it;
        inventory.splice(idx, 1);
        if (prev) inventory.push(prev);
        recalculateStats();
        createFloatText(player.x, player.y - 40, `Đã mặc ${it.name}!`, "#00e5ff");
    }
    updateHUD(); renderInventory();
};

window.openNPCModal = () => {
    isNPCModalOpen = true;
    $("npc-dialog-modal").style.display = "flex";
    $("shop-items-grid").innerHTML = blacksmithNPC.shop.map((it, idx) => `
        <div class="shop-item-card">
            <div>${it.icon} <b>${it.name}</b> (${it.cost} 💰)</div>
            <button class="shop-btn-buy" onclick="buyShopItem(${idx})">Mua</button>
        </div>
    `).join("");
};
window.closeNPCModal = () => { isNPCModalOpen = false; $("npc-dialog-modal").style.display = "none"; };
window.buyShopItem = idx => {
    const it = blacksmithNPC.shop[idx];
    if (player.gold < it.cost) return alert("Không đủ vàng!");
    player.gold -= it.cost;
    inventory.push({ ...it, count: 1 });
    createFloatText(player.x, player.y - 40, `Đã mua ${it.name}!`);
    updateHUD();
};

window.toggleDualMenu = () => {
    isSideMenuOpen = !isSideMenuOpen;
    $("side-menu-container").style.display = isSideMenuOpen ? "flex" : "none";
    if (isSideMenuOpen) { updateHUD(); renderInventory(); }
};
$("btn-toggle-ui").onclick = toggleDualMenu;

function initClassSelection() {
    document.querySelectorAll(".class-button").forEach(btn => {
        btn.onclick = () => {
            player.classKey = btn.dataset.class;
            recalculateStats();
            const pEl = $("player");

            pEl.className = player.classKey === "warrior" ? "knight-sprite" : "facing-left";
            pEl.innerHTML = player.classKey === "warrior" ? "" : CLASSES[player.classKey].icon;

            $("class-screen").style.display = "none";
            $("game-screen").style.display = "block";

            $("trees-container").innerHTML = trees.map(t => `<div class="tree" style="left:${t.x}px;top:${t.y}px;font-size:${t.size}px;z-index:${Math.floor(t.y)};">${t.icon}</div>`).join("");
            $("enemies-container").innerHTML = enemies.map(e => `
                <div id="enemy-${e.id}" class="enemy-item" style="left:${e.x}px;top:${e.y}px">
                    <div class="enemy-info-bar"><span class="enemy-hp" id="hp-${e.id}">${e.hp}/${e.hp}</span></div>
                    <div class="enemy-visual">${e.icon}</div>
                </div>
            `).join("");

            Object.assign($("npc-blacksmith").style, { left: `${blacksmithNPC.x}px`, top: `${blacksmithNPC.y}px`, zIndex: `${blacksmithNPC.y}` });
            $("npc-blacksmith").onclick = () => { if (dist(player, blacksmithNPC) < 100) openNPCModal(); };

            updateHUD();
            setupControls();
            if (!animFrameId) animFrameId = requestAnimationFrame(gameLoop);
        };
    });

    const btnChange = $("btn-change-class");
    if (btnChange) {
        btnChange.onclick = () => {
            $("game-screen").style.display = "none";
            $("class-screen").style.display = "block";
            if (animFrameId) { cancelAnimationFrame(animFrameId); animFrameId = null; }
        };
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initClassSelection);
} else {
    initClassSelection();
}

// Debug Tools (Phím ~)
window.debugFullEnergy = () => { player.energy = 100; updateHUD(); };
window.debugAddGold = v => { player.gold += v; updateHUD(); };
window.debugInfiniteMode = () => { isGodMode = !isGodMode; alert("God mode: " + isGodMode); };
window.debugSpawnBoss = () => { boss.hp = boss.maxHp; boss.x = player.x + 150; boss.y = player.y; $("boss").style.display = "block"; };