window.GAME_CLASSES = window.GAME_CLASSES || {};

window.GAME_CLASSES.scientist = {
    key: "scientist",
    name: "Nhà khoa học",
    icon: '<img src="scientist.png" class="character-img" alt="Scientist">',
    dmg: 20,
    spd: 8,
    rng: 230,
    hp: 100,
    ranged: true,
    pIcon: "⚡",

    onSelect(player, playerEl) {
        playerEl.className = "facing-left";
        playerEl.innerHTML = this.icon;
    },

    attack(player, playerEl, enemies, boss) {
        shootProjectile(player, this.rng, this.dmg, this.pIcon);
    },

    castUltimate(player, playerEl, enemies, boss) {
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
};