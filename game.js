// --- KÍCH THƯỚC MAP VÀ VIEWPORT ---
const MAP_WIDTH = 2400;
const MAP_HEIGHT = 1500;
const VIEWPORT_WIDTH = 900;
const VIEWPORT_HEIGHT = 520;

// --- THÔNG SỐ NGƯỜI CHƠI ---
let playerClass = "";
let playerPos = { x: 450, y: 350 };
let playerSpeed = 8;
let playerDamage = 15;
let playerHP = 100;
let playerMaxHP = 100;
let playerExp = 0;
let expNeeded = 70;
let playerLevel = 1;
let attackRange = 90;
let isRanged = false;
let projectiles = [];
let scientistEnergy = 0;
const maxEnergy = 100;

// --- TÚI ĐỒ (INVENTORY) & GIAO DIỆN ---
const MAX_SLOTS = 12;
let isSideMenuOpen = false;
let inventory = [
    { id: "hp_pot", name: "Bình Máu", icon: "🧪", count: 5, type: "potion", heal: 35 },
    { id: "iron_sword", name: "Đoản Kiếm", icon: "🗡️", count: 1, type: "weapon" }
];

// --- DEBUG MODE FLAGS ---
let isGodMode = false;

// --- BOSS ORC ---
let boss = {
    x: 1800,
    y: 800,
    hp: 250,
    maxHp: 250,
    speed: 1.4,
    damage: 18,
    cooldown: 0
};

// --- DANH SÁCH 5 GOBLIN PHÂN BỐ RỘNG ---
let enemies = [
    { id: 1, x: 300,  y: 200,  hp: 35, speed: 2.1, damage: 6, cooldown: 0 },
    { id: 2, x: 900,  y: 300,  hp: 35, speed: 2.3, damage: 6, cooldown: 0 },
    { id: 3, x: 600,  y: 1100, hp: 35, speed: 1.9, damage: 6, cooldown: 0 },
    { id: 4, x: 1600, y: 400,  hp: 35, speed: 2.2, damage: 6, cooldown: 0 },
    { id: 5, x: 1400, y: 1200, hp: 35, speed: 2.0, damage: 6, cooldown: 0 }
];

const keys = {};

// --- 1. CHỌN CLASS VÀ BẮT ĐẦU ---
document.querySelectorAll(".class-button").forEach(btn => {
    btn.addEventListener("click", () => {
        playerClass = btn.getAttribute("data-class");
        
        if (playerClass === "warrior") {
            document.getElementById("player").innerText = "⚔️";
            document.getElementById("class-name").innerText = "Kiếm sĩ";
            playerDamage = 22;
            playerSpeed = 8;
            attackRange = 100;
            playerMaxHP = 120;
            playerHP = 120;
            isRanged = false;
        } else if (playerClass === "archer") {
            document.getElementById("player").innerText = "🏹";
            document.getElementById("class-name").innerText = "Cung thủ";
            playerDamage = 12;
            playerSpeed = 10;
            attackRange = 320;
            isRanged = true;
        } else if (playerClass === "mage") {
            document.getElementById("player").innerText = "🔮";
            document.getElementById("class-name").innerText = "Pháp sư";
            playerDamage = 18;
            playerSpeed = 7;
            attackRange = 260;
            isRanged = true;
        } else if (playerClass === "scientist") {
            document.getElementById("player").innerHTML = '<img src="scientist.png" class="character-img" alt="Scientist">';
            document.getElementById("class-name").innerText = "Nhà khoa học";
            playerDamage = 20;
            playerSpeed = 8;
            attackRange = 230;
            isRanged = true;
        }

        updateHUD();
        document.getElementById("class-screen").style.display = "none";
        document.getElementById("game-screen").style.display = "block";

        initEnemies();
        setupUIEvents();
        startGameLoops();
    });
});

function updateHUD() {
    document.getElementById("damage").innerText = playerDamage;
    document.getElementById("player-hp").innerText = playerHP;
    document.getElementById("player-max-hp").innerText = playerMaxHP;
    document.getElementById("level").innerText = playerLevel;
    document.getElementById("exp").innerText = playerExp;
    document.getElementById("exp-needed").innerText = expNeeded;

    // Cập nhật cả bảng bên trái nếu đang mở
    if (isSideMenuOpen) {
        document.getElementById("stat-class").innerText = document.getElementById("class-name").innerText;
        document.getElementById("stat-level").innerText = playerLevel;
        document.getElementById("stat-hp").innerText = `${playerHP} / ${playerMaxHP}`;
        document.getElementById("stat-atk").innerText = playerDamage;
        document.getElementById("stat-range").innerText = `${attackRange} px`;
        document.getElementById("stat-speed").innerText = playerSpeed;
        document.getElementById("stat-exp").innerText = `${playerExp} / ${expNeeded}`;
    }
}

// --- 2. VẼ 5 GOBLIN RA WORLD ---
function initEnemies() {
    const container = document.getElementById("enemies-container");
    container.innerHTML = "";
    enemies.forEach(en => {
        const el = document.createElement("div");
        el.id = `enemy-${en.id}`;
        el.className = "enemy-item";
        el.style.left = `${en.x}px`;
        el.style.top = `${en.y}px`;
        el.innerHTML = `
            <div class="enemy-sprite"></div>
            <div class="enemy-hp" id="hp-${en.id}">${en.hp}/${en.hp}</div>
        `;
        container.appendChild(el);
    });
}

// --- 3. BẬT/TẮT ĐỒNG THỜI BẢNG TRÁI & PHẢI ---
function setupUIEvents() {
    document.getElementById("btn-toggle-ui").onclick = toggleDualMenu;
}

function toggleDualMenu() {
    isSideMenuOpen = !isSideMenuOpen;
    document.getElementById("side-menu-container").style.display = isSideMenuOpen ? "block" : "none";
    if (isSideMenuOpen) {
        updateHUD();
        renderInventory();
    }
}

function renderInventory() {
    const grid = document.getElementById("inventory-grid");
    grid.innerHTML = "";

    for (let i = 0; i < MAX_SLOTS; i++) {
        const item = inventory[i];
        const slot = document.createElement("div");
        slot.className = "inv-slot";

        if (item) {
            slot.innerHTML = `
                <div class="slot-icon">${item.icon}</div>
                <div class="slot-name">${item.name}</div>
                <div class="slot-count">x${item.count}</div>
            `;
            slot.onclick = () => useItem(item, i);
        }
        grid.appendChild(slot);
    }
}

function useItem(item, index) {
    if (item.type === "potion") {
        if (playerHP >= playerMaxHP) return;
        playerHP = Math.min(playerMaxHP, playerHP + item.heal);
        item.count--;
        if (item.count <= 0) {
            inventory.splice(index, 1);
        }
        updateHUD();
        renderInventory();
    }
}

// --- 4. BẮT PHÍM BÀN PHÍM ---
window.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    keys[k] = true;

    if (e.code === "Space") attack();
    if (k === "e" && playerClass === "scientist") castLightningDragon();
    
    // Phím B hoặc C để bật/tắt cùng lúc túi đồ và chỉ số
    if (k === "b" || k === "c" || k === "i") toggleDualMenu();

    // Phím ~ hoặc ` để bật bảng Debug
    if (e.key === "`" || e.key === "~") {
        const panel = document.getElementById("debug-panel");
        panel.style.display = panel.style.display === "block" ? "none" : "block";
    }
});

window.addEventListener("keyup", (e) => {
    keys[e.key.toLowerCase()] = false;
});

// --- 5. TẤN CÔNG (SPACE) ---
function attack() {
    if (isRanged) {
        let target = null;
        let minDist = 9999;

        enemies.concat(boss.hp > 0 ? [boss] : []).forEach(t => {
            if (t.hp > 0) {
                let d = Math.hypot(playerPos.x - t.x, playerPos.y - t.y);
                if (d < minDist && d <= attackRange) {
                    minDist = d;
                    target = t;
                }
            }
        });

        if (target) {
            let dx = target.x - playerPos.x;
            let dy = target.y - playerPos.y;
            let dist = Math.hypot(dx, dy);
            projectiles.push({
                x: playerPos.x,
                y: playerPos.y,
                vx: (dx / dist) * 14,
                vy: (dy / dist) * 14,
                damage: playerDamage,
                icon: playerClass === "scientist" ? "⚡" : (playerClass === "mage" ? "✨" : "")
            });
        }
    } else {
        enemies.forEach(en => {
            if (en.hp > 0 && Math.hypot(playerPos.x - en.x, playerPos.y - en.y) <= attackRange) {
                hitEnemy(en, playerDamage);
            }
        });

        if (boss.hp > 0 && Math.hypot(playerPos.x - boss.x, playerPos.y - boss.y) <= attackRange) {
            hitBoss(playerDamage);
        }
    }
}

function hitEnemy(en, dmg) {
    en.hp = Math.max(0, en.hp - dmg);
    const hpEl = document.getElementById(`hp-${en.id}`);
    if (hpEl) hpEl.innerText = `${en.hp}/35`;

    if (playerClass === "scientist" && (scientistEnergy < maxEnergy || isGodMode)) {
        scientistEnergy = Math.min(maxEnergy, scientistEnergy + 10);
        const ultEl = document.getElementById("scientist-ult");
        if (ultEl) ultEl.innerText = scientistEnergy;
    }

    if (en.hp <= 0) {
        const el = document.getElementById(`enemy-${en.id}`);
        if (el) el.style.display = "none";
        addExp(18);

        // Tỷ lệ rơi vật phẩm bình máu
        if (Math.random() < 0.4) {
            let pot = inventory.find(i => i.id === "hp_pot");
            if (pot) pot.count++;
            else inventory.push({ id: "hp_pot", name: "Bình Máu", icon: "🧪", count: 1, type: "potion", heal: 35 });
            if (isSideMenuOpen) renderInventory();
        }

        setTimeout(() => {
            en.hp = 35;
            en.x = Math.max(80, Math.min(MAP_WIDTH - 80, playerPos.x + (Math.random() - 0.5) * 800));
            en.y = Math.max(80, Math.min(MAP_HEIGHT - 80, playerPos.y + (Math.random() - 0.5) * 600));

            if (el) {
                el.style.left = `${en.x}px`;
                el.style.top = `${en.y}px`;
                el.style.display = "block";
            }
            if (hpEl) hpEl.innerText = "35/35";
        }, 3500);
    }
}

function hitBoss(dmg) {
    boss.hp = Math.max(0, boss.hp - dmg);
    const bossHpEl = document.getElementById("boss-hp");
    if (bossHpEl) bossHpEl.innerText = `BOSS HP: ${boss.hp}/${boss.maxHp}`;

    if (playerClass === "scientist" && (scientistEnergy < maxEnergy || isGodMode)) {
        scientistEnergy = Math.min(maxEnergy, scientistEnergy + 15);
        const ultEl = document.getElementById("scientist-ult");
        if (ultEl) ultEl.innerText = scientistEnergy;
    }

    if (boss.hp <= 0) {
        const bossEl = document.getElementById("boss");
        if (bossEl) bossEl.style.display = "none";
        addExp(80);
        setTimeout(() => alert("CHIẾN THẮNG! Bạn đã hạ gục Boss Orc!"), 100);
    }
}

// --- CHIÊU NỘ: RỒNG SÉT (PHÍM E) ---
function castLightningDragon() {
    if (!isGodMode && scientistEnergy < maxEnergy) return;

    if (!isGodMode) {
        scientistEnergy = 0;
        const ultEl = document.getElementById("scientist-ult");
        if (ultEl) ultEl.innerText = scientistEnergy;
    }

    const dragon = document.createElement("div");
    dragon.className = "lightning-dragon";
    dragon.innerHTML = "⚡🐉⚡";
    dragon.style.top = `${playerPos.y}px`;
    document.getElementById("world").appendChild(dragon);

    enemies.forEach(en => {
        if (en.hp > 0) hitEnemy(en, 70);
    });

    if (boss.hp > 0) {
        hitBoss(90);
        let origSpeed = boss.speed;
        boss.speed = 0;
        const bossChar = document.getElementById("boss-character");
        if (bossChar) bossChar.classList.add("electrocuted");

        setTimeout(() => {
            boss.speed = origSpeed;
            if (bossChar) bossChar.classList.remove("electrocuted");
        }, 2500);
    }

    setTimeout(() => dragon.remove(), 1000);
}

function addExp(amount) {
    playerExp += amount;
    if (playerExp >= expNeeded) {
        playerExp -= expNeeded;
        playerLevel++;
        playerDamage += 5;
        playerMaxHP += 15;
        playerHP = playerMaxHP;
        expNeeded += 35;
    }
    updateHUD();
}

function takePlayerDamage(dmg) {
    if (isGodMode) return;
    playerHP = Math.max(0, playerHP - dmg);
    updateHUD();
    if (playerHP <= 0) {
        alert("Bạn đã hi sinh! Nhấn F5 để chơi lại.");
        location.reload();
    }
}

// --- 6. HỆ THỐNG CAMERA SCROLLING ---
function updateCamera() {
    let camX = playerPos.x - VIEWPORT_WIDTH / 2;
    let camY = playerPos.y - VIEWPORT_HEIGHT / 2;

    camX = Math.max(0, Math.min(camX, MAP_WIDTH - VIEWPORT_WIDTH));
    camY = Math.max(0, Math.min(camY, MAP_HEIGHT - VIEWPORT_HEIGHT));

    const worldEl = document.getElementById("world");
    worldEl.style.transform = `translate(${-camX}px, ${-camY}px)`;
}

// --- 7. VÒNG LẶP CHÍNH CỦA GAME (GAME LOOP) ---
function startGameLoops() {
    setInterval(() => {
        if (keys["w"] && playerPos.y > 40) playerPos.y -= playerSpeed;
        if (keys["s"] && playerPos.y < MAP_HEIGHT - 40) playerPos.y += playerSpeed;
        if (keys["a"] && playerPos.x > 40) playerPos.x -= playerSpeed;
        if (keys["d"] && playerPos.x < MAP_WIDTH - 40) playerPos.x += playerSpeed;

        const playerEl = document.getElementById("player");
        playerEl.style.left = `${playerPos.x}px`;
        playerEl.style.top = `${playerPos.y}px`;

        updateCamera();

        // AI Goblins
        enemies.forEach(en => {
            if (en.hp <= 0) return;

            let dx = playerPos.x - en.x;
            let dy = playerPos.y - en.y;
            let dist = Math.hypot(dx, dy);

            if (dist < 700 && dist > 30) {
                en.x += (dx / dist) * en.speed;
                en.y += (dy / dist) * en.speed;
            }

            const el = document.getElementById(`enemy-${en.id}`);
            if (el) {
                el.style.left = `${en.x}px`;
                el.style.top = `${en.y}px`;
            }

            if (en.cooldown > 0) en.cooldown -= 50;
            if (dist < 38 && en.cooldown <= 0) {
                takePlayerDamage(en.damage);
                en.cooldown = 1000;
            }
        });

        // AI Boss Orc
        if (boss.hp > 0) {
            let bdx = playerPos.x - boss.x;
            let bdy = playerPos.y - boss.y;
            let bDist = Math.hypot(bdx, bdy);

            if (bDist < 900 && bDist > 55) {
                boss.x += (bdx / bDist) * boss.speed;
                boss.y += (bdy / bDist) * boss.speed;
            }

            const bossEl = document.getElementById("boss");
            const bossChar = document.getElementById("boss-character");
            if (bossEl) {
                bossEl.style.left = `${boss.x}px`;
                bossEl.style.top = `${boss.y}px`;
            }

            if (boss.cooldown > 0) boss.cooldown -= 50;
            if (bDist < 75 && boss.cooldown <= 0) {
                if (bossChar) bossChar.classList.add("boss-attack");
                takePlayerDamage(boss.damage);
                boss.cooldown = 1400;

                setTimeout(() => {
                    if (bossChar) bossChar.classList.remove("boss-attack");
                }, 300);
            }
        }

        // Quản lý đường bay của đạn
        const projContainer = document.getElementById("projectiles-container");
        for (let i = projectiles.length - 1; i >= 0; i--) {
            let p = projectiles[i];
            p.x += p.vx;
            p.y += p.vy;

            if (p.x < 0 || p.x > MAP_WIDTH || p.y < 0 || p.y > MAP_HEIGHT) {
                if (p.el) p.el.remove();
                projectiles.splice(i, 1);
                continue;
            }

            let hit = false;
            enemies.forEach(en => {
                if (!hit && en.hp > 0 && Math.hypot(p.x - en.x, p.y - en.y) < 26) {
                    hitEnemy(en, p.damage);
                    hit = true;
                }
            });

            if (!hit && boss.hp > 0 && Math.hypot(p.x - boss.x, p.y - boss.y) < 42) {
                hitBoss(p.damage);
                hit = true;
            }

            if (hit) {
                if (p.el) p.el.remove();
                projectiles.splice(i, 1);
                continue;
            }

            if (!p.el) {
                p.el = document.createElement("div");
                p.el.className = "projectile";
                if (p.icon) p.el.innerText = p.icon;
                projContainer.appendChild(p.el);
            }
            p.el.style.left = `${p.x}px`;
            p.el.style.top = `${p.y}px`;
        }
    }, 50);
}

// --- 8. CÁC HÀM HỖ TRỢ DEBUG / GOD MODE ---
function debugFullEnergy() {
    scientistEnergy = maxEnergy;
    const ultEl = document.getElementById("scientist-ult");
    if (ultEl) ultEl.innerText = scientistEnergy;
}

function debugInfiniteMode() {
    isGodMode = !isGodMode;
    const statusEl = document.getElementById("debug-godmode-status");
    if (isGodMode) {
        statusEl.innerText = "BẬT (Bất tử + Xả chiêu liên tục)";
        statusEl.style.color = "#00ff66";
        playerHP = playerMaxHP = 99999;
        playerDamage = 999;
    } else {
        statusEl.innerText = "TẮT";
        statusEl.style.color = "red";
        playerHP = playerMaxHP = 100;
        playerDamage = 20;
    }
    updateHUD();
}

function debugLevelUp() {
    addExp(expNeeded - playerExp);
}

function debugSpawnItems() {
    let pot = inventory.find(i => i.id === "hp_pot");
    if (pot) {
        pot.count += 10;
    } else {
        inventory.push({ id: "hp_pot", name: "Bình Máu", icon: "🧪", count: 10, type: "potion", heal: 35 });
    }
    if (isSideMenuOpen) renderInventory();
}

function debugKillAllEnemies() {
    enemies.forEach(en => {
        if (en.hp > 0) hitEnemy(en, 9999);
    });
}

function debugSpawnBoss() {
    boss.hp = boss.maxHp;
    boss.x = 1800;
    boss.y = 800;
    const bossEl = document.getElementById("boss");
    const bossHpEl = document.getElementById("boss-hp");
    if (bossEl) bossEl.style.display = "block";
    if (bossHpEl) bossHpEl.innerText = `BOSS HP: ${boss.hp}/${boss.maxHp}`;
}