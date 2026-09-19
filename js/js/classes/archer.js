window.GAME_CLASSES = window.GAME_CLASSES || {};

window.GAME_CLASSES.archer = {
    key: "archer",
    name: "Cung thủ",
    icon: "🏹",
    dmg: 12,
    spd: 10,
    rng: 320,
    hp: 100,
    ranged: true,
    pIcon: "→",

    onSelect(player, playerEl) {
        playerEl.className = "facing-left";
        playerEl.innerHTML = this.icon;
    },

    attack(player, playerEl, enemies, boss) {
        shootProjectile(player, this.rng, this.dmg, this.pIcon);
    },

    castUltimate(player, playerEl, enemies, boss) {
        enemies.filter(e => e.hp > 0).forEach(e => applyDamage(e, 50));
        if (boss.hp > 0) applyDamage(boss, 70);
    }
};