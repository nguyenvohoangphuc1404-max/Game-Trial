// ========================================
// LẤY HTML
// ========================================

const classScreen =
    document.getElementById("class-screen");

const gameScreen =
    document.getElementById("game-screen");

const player =
    document.getElementById("player");

const enemy =
    document.getElementById("enemy");

const goblinSprite =
    document.getElementById("enemy-character");

const enemyHPText =
    document.getElementById("enemy-hp");

const boss =
    document.getElementById("boss");

const bossHPText =
    document.getElementById("boss-hp");

const levelText =
    document.getElementById("level");

const expText =
    document.getElementById("exp");

const expNeededText =
    document.getElementById("exp-needed");

const damageText =
    document.getElementById("damage");

const playerHPText =
    document.getElementById("player-hp");

const classNameText =
    document.getElementById("class-name");


// ========================================
// THÔNG SỐ PLAYER
// ========================================

let x = 380;
let y = 230;

let playerHP = 100;

let level = 1;

let exp = 0;

let expNeeded = 70;

let damage = 10;

let playerSpeed = 10;


// ========================================
// CLASS
// ========================================

let playerClass = "";


// ========================================
// QUÁI
// ========================================

let enemyX = 200;
let enemyY = 150;

let enemyHp = 30;

const maxEnemyHp = 30;


// ========================================
// BOSS
// ========================================

let bossX = 550;
let bossY = 300;

let bossHp = 150;

const maxBossHp = 150;


// ========================================
// CHỌN CLASS
// ========================================

document
    .querySelectorAll(".class-button")
    .forEach(function(button) {

        button.addEventListener(
            "click",
            function() {

                playerClass =
                    button.dataset.class;

                chooseClass();

            }
        );

    });


// ========================================
// XỬ LÝ CLASS
// ========================================

function chooseClass() {

    if (playerClass === "warrior") {

        classNameText.textContent =
            "⚔️ Kiếm sĩ";

        damage = 15;

        playerSpeed = 10;

        player.textContent = "⚔️";
    }


    if (playerClass === "archer") {

        classNameText.textContent =
            "🏹 Cung thủ";

        damage = 10;

        playerSpeed = 12;

        player.textContent = "🏹";
    }


    if (playerClass === "mage") {

        classNameText.textContent =
            "🔮 Pháp sư";

        damage = 12;

        playerSpeed = 10;

        player.textContent = "🔮";
    }


    damageText.textContent =
        damage;


    // Ẩn menu
    classScreen.style.display =
        "none";


    // Hiện game
    gameScreen.style.display =
        "block";

}


// ========================================
// DI CHUYỂN PLAYER
// ========================================

document.addEventListener(
    "keydown",
    function(event) {

        // Nếu chưa chọn class thì không chơi
        if (playerClass === "") {
            return;
        }

        // W
        if (event.key === "w") {
            y -= playerSpeed;
        }

        // S
        if (event.key === "s") {
            y += playerSpeed;
        }

        // A
        if (event.key === "a") {
            x -= playerSpeed;
        }

        // D
        if (event.key === "d") {
            x += playerSpeed;
        }

        // Giới hạn map
        if (x < 0) {
            x = 0;
        }

        if (y < 0) {
            y = 0;
        }

        if (x > 760) {
            x = 760;
        }

        if (y > 460) {
            y = 460;
        }

        player.style.left =
            x + "px";

        player.style.top =
            y + "px";

        // SPACE
        if (event.key === " ") {
            attack();
        }

    }
);


// ========================================
// TẤN CÔNG
// ========================================

function attack() {

    // Kiểm tra khoảng cách quái
    const enemyDistance =
        Math.sqrt(
            (x - enemyX) ** 2 +
            (y - enemyY) ** 2
        );

    // Kiểm tra khoảng cách boss
    const bossDistance =
        Math.sqrt(
            (x - bossX) ** 2 +
            (y - bossY) ** 2
        );


    // Kiếm sĩ
    if (playerClass === "warrior") {

        if (enemyDistance < 100) {
            damageEnemy();
        }

        if (bossDistance < 120) {
            damageBoss();
        }

    }

    // Cung thủ
    if (playerClass === "archer") {

        if (enemyDistance < 300) {
            createProjectile(
                enemyX,
                enemyY
            );
        }

        if (bossDistance < 300) {
            createProjectile(
                bossX,
                bossY
            );
        }

    }

    // Pháp sư
    if (playerClass === "mage") {

        if (enemyDistance < 350) {
            createMagicProjectile(
                enemyX,
                enemyY
            );
        }

        if (bossDistance < 350) {
            createMagicProjectile(
                bossX,
                bossY
            );
        }

    }

}


// ========================================
// DAMAGE QUÁI
// ========================================

function damageEnemy() {

    enemyHp -= damage;

    enemyHPText.textContent =
        "HP: " +
        Math.max(enemyHp, 0) +
        "/" +
        maxEnemyHp;

    if (enemyHp <= 0) {
        exp += 10;
        updateEXP();
        spawnEnemy();
    }

}


// ========================================
// DAMAGE BOSS
// ========================================

function damageBoss() {

    bossHp -= damage;

    bossHPText.textContent =
        "BOSS HP: " +
        Math.max(bossHp, 0) +
        "/" +
        maxBossHp;

    if (bossHp <= 0) {
        exp += 50;
        updateEXP();

        boss.style.display =
            "none";

        setTimeout(
            spawnBoss,
            3000
        );
    }

}


// ========================================
// EXP
// ========================================

function updateEXP() {

    while (exp >= expNeeded) {
        level++;
        exp -= expNeeded;
        expNeeded += 30;
        damage += 5;
    }

    levelText.textContent =
        level;

    expText.textContent =
        exp;

    expNeededText.textContent =
        expNeeded;

    damageText.textContent =
        damage;

}


// ========================================
// TẠO QUÁI MỚI
// ========================================

function spawnEnemy() {

    enemyX =
        Math.floor(
            Math.random() * 700
        ) + 30;

    enemyY =
        Math.floor(
            Math.random() * 400
        ) + 30;

    enemyHp =
        maxEnemyHp;

    enemy.style.left =
        enemyX + "px";

    enemy.style.top =
        enemyY + "px";

    enemy.style.display =
        "block";

    enemyHPText.textContent =
        "HP: " +
        enemyHp +
        "/" +
        maxEnemyHp;

}


// ========================================
// TẠO BOSS MỚI
// ========================================

function spawnBoss() {

    bossX =
        Math.floor(
            Math.random() * 650
        ) + 50;

    bossY =
        Math.floor(
            Math.random() * 350
        ) + 50;

    bossHp =
        maxBossHp;

    boss.style.left =
        bossX + "px";

    boss.style.top =
        bossY + "px";

    boss.style.display =
        "block";

    bossHPText.textContent =
        "BOSS HP: " +
        bossHp +
        "/" +
        maxBossHp;

}


// ========================================
// QUÁI TỰ ĐUỔI PLAYER (CẬP NHẬT GOBLIN)
// ========================================

setInterval(
    function() {

        if (playerClass === "") {
            return;
        }

        // Tính khoảng cách
        const distance =
            Math.sqrt(
                (x - enemyX) ** 2 +
                (y - enemyY) ** 2
            );

        // Đánh khi chạm gần
        if (distance < 55) {
            playerHP -= 2;
            playerHPText.textContent =
                Math.max(playerHP, 0);
        }

        // Đuổi theo và đổi hướng mặt Goblin
        if (
            distance > 55 &&
            distance < 350
        ) {

            const diffX = x - enemyX;
            const diffY = y - enemyY;

            if (Math.abs(diffX) > Math.abs(diffY)) {
                if (diffX > 0) {
                    enemyX += 1;
                    if (goblinSprite) goblinSprite.className = "goblin-right";
                } else {
                    enemyX -= 1;
                    if (goblinSprite) goblinSprite.className = "goblin-left";
                }
            } else {
                if (diffY > 0) {
                    enemyY += 1;
                    if (goblinSprite) goblinSprite.className = "goblin-down";
                } else {
                    enemyY -= 1;
                    if (goblinSprite) goblinSprite.className = "goblin-up";
                }
            }

            enemy.style.left =
                enemyX + "px";

            enemy.style.top =
                enemyY + "px";

        }

        // Player bị hạ
        if (playerHP <= 0) {
            alert(
                "💀 Bạn đã bị hạ! F5 để chơi lại."
            );
        }

    },
    100
);


// ========================================
// TẠO ĐẠN CUNG
// ========================================

function createProjectile(
    targetX,
    targetY
) {

    const projectile =
        document.createElement("div");

    projectile.className =
        "projectile";

    projectile.style.left =
        x + "px";

    projectile.style.top =
        y + "px";

    document
        .getElementById("game")
        .appendChild(projectile);

    let px = x;
    let py = y;

    const dx =
        targetX - x;

    const dy =
        targetY - y;

    const distance =
        Math.sqrt(
            dx * dx +
            dy * dy
        );

    const speed = 8;

    const vx =
        dx / distance * speed;

    const vy =
        dy / distance * speed;

    const timer =
        setInterval(
            function() {

                px += vx;
                py += vy;

                projectile.style.left =
                    px + "px";

                projectile.style.top =
                    py + "px";

                // Kiểm tra trúng quái
                const hit =
                    Math.sqrt(
                        (px - targetX) ** 2 +
                        (py - targetY) ** 2
                    );

                if (hit < 30) {
                    projectile.remove();
                    clearInterval(timer);

                    if (
                        targetX === enemyX &&
                        targetY === enemyY
                    ) {
                        damageEnemy();
                    }
                }

                // Ra khỏi map
                if (
                    px < 0 ||
                    px > 800 ||
                    py < 0 ||
                    py > 500
                ) {
                    projectile.remove();
                    clearInterval(timer);
                }

            },
            30
        );

}


// ========================================
// PHÁP SƯ BẮN PHÉP
// ========================================

function createMagicProjectile(
    targetX,
    targetY
) {

    const projectile =
        document.createElement("div");

    projectile.className =
        "projectile";

    projectile.style.width =
        "20px";

    projectile.style.height =
        "20px";

    projectile.style.left =
        x + "px";

    projectile.style.top =
        y + "px";

    document
        .getElementById("game")
        .appendChild(projectile);

    let px = x;
    let py = y;

    const dx =
        targetX - x;

    const dy =
        targetY - y;

    const distance =
        Math.sqrt(
            dx * dx +
            dy * dy
        );

    const speed = 6;

    const vx =
        dx / distance * speed;

    const vy =
        dy / distance * speed;

    const timer =
        setInterval(
            function() {

                px += vx;
                py += vy;

                projectile.style.left =
                    px + "px";

                projectile.style.top =
                    py + "px";

                const hit =
                    Math.sqrt(
                        (px - targetX) ** 2 +
                        (py - targetY) ** 2
                    );

                if (hit < 30) {
                    projectile.remove();
                    clearInterval(timer);
                    damageEnemy();
                }

                if (
                    px < 0 ||
                    px > 800 ||
                    py < 0 ||
                    py > 500
                ) {
                    projectile.remove();
                    clearInterval(timer);
                }

            },
            30
        );

}