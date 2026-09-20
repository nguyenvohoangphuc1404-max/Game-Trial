window.GAME_CLASSES = window.GAME_CLASSES || {};

window.GAME_CLASSES.warrior = {
    key: "warrior",
    name: "Kiếm sĩ",
    icon: "⚔️",
    dmg: 24,
    spd: 8,
    rng: 95,
    hp: 120,
    ranged: false,

    onSelect(player, playerEl) {
        playerEl.innerHTML = "";
        playerEl.className = "knight-sprite";
        playerDirection = 0;
        playerEl.style.backgroundPosition = "50% 0%";
    },

    attack(player, playerEl, enemies, boss) {
        if (isAttacking) return;
        isAttacking = true;
        playerEl.classList.add("knight-attacking");
        setTimeout(() => {
            playerEl.classList.remove("knight-attacking");
            isAttacking = false;
        }, 200);

        const targets = [...enemies, ...(boss.hp > 0 ? [boss] : [])].filter(t => t.hp > 0);
        targets.filter(t => dist(player, t) <= player.rng).forEach(t => applyDamage(t, player.dmg));
    },

    castUltimate(player, playerEl, enemies, boss) {
        if (isCastingUlt) return;
        isCastingUlt = true;

        // Hoạt ảnh người chơi khi nộ (nếu có file knight_ultimate.png)
        playerEl.classList.remove("knight-sprite");
        playerEl.classList.add("knight-ultimate-lion");

        // TẠO HÌNH ẢNH SÓNG CHIÊU THỨC BAY RA
        const wave = document.createElement("img");
        wave.className = "lion-wave-projectile";
        // Đặt tên file ảnh hoặc gif của bạn vào đây (vd: ult_wave.png, slash.png, v.v.)
        wave.src = "ult_wave.png";
        
        // Hướng bay theo hướng nhìn của nhân vật
        const dirX = facingDirection === "right" ? 1 : -1;
        wave.style.left = `${player.x}px`;
        wave.style.top = `${player.y}px`;
        wave.style.transform = `translate(-50%, -50%) scaleX(${dirX})`;
        $("world").appendChild(wave);

        let waveDist = 0;
        const hitEnemies = new Set();

        const waveInterval = setInterval(() => {
            waveDist += 22;
            const currentX = player.x + waveDist * dirX;
            wave.style.left = `${currentX}px`;

            const targets = [...enemies, ...(boss.hp > 0 ? [boss] : [])].filter(t => t.hp > 0);
            targets.forEach(t => {
                if (!hitEnemies.has(t) && Math.hypot(currentX - t.x, player.y - t.y) <= 85) {
                    hitEnemies.add(t);
                    if (t.isBoss) {
                        applyDamage(t, 200);
                    } else {
                        applyDamage(t, t.hp + 999);
                    }
                }
            });

            // Tầm xa tối đa của chiêu nộ
            if (waveDist >= 850) {
                clearInterval(waveInterval);
                wave.remove();
            }
        }, 16);

        // Hết thời gian vận nộ, đưa nhân vật về lại sprite bình thường
        setTimeout(() => {
            playerEl.classList.remove("knight-ultimate-lion");
            playerEl.classList.add("knight-sprite");
            isCastingUlt = false;
        }, 600);
    }
};