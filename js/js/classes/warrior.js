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
        playerEl.className = "knight-sprite facing-left";
    },

    attack(player, playerEl, enemies, boss) {
        if (isAttacking) return;
        isAttacking = true;
        playerEl.classList.add("knight-attacking");
        playerEl.addEventListener('animationend', () => {
            playerEl.classList.remove("knight-attacking");
            isAttacking = false;
        }, { once: true });

        const targets = [...enemies, ...(boss.hp > 0 ? [boss] : [])].filter(t => t.hp > 0);
        targets.filter(t => dist(player, t) <= player.rng).forEach(t => applyDamage(t, player.dmg));
    },

    castUltimate(player, playerEl, enemies, boss) {
        isCastingUlt = true;
        playerEl.classList.add("knight-bladestorm");

        const aura = document.createElement("div");
        aura.className = "bladestorm-aura";
        aura.style.left = `${player.x}px`;
        aura.style.top = `${player.y}px`;
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
};