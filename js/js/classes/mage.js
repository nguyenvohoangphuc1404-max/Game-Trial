window.GAME_CLASSES = window.GAME_CLASSES || {};

window.GAME_CLASSES.mage = {
    key: "mage",
    name: "Pháp sư",
    icon: "🔮",
    dmg: 18,
    spd: 7,
    rng: 260,
    hp: 100,
    ranged: true,
    pIcon: "✨",

    onSelect(player, playerEl) {
        playerEl.className = "facing-left";
        playerEl.innerHTML = this.icon;
    },

    attack(player, playerEl, enemies, boss) {
        shootProjectile(player, this.rng, this.dmg, this.pIcon);
    },

    castUltimate(player, playerEl, enemies, boss) {
        enemies.filter(e => e.hp > 0).forEach(e => applyDamage(e, 60));
        if (boss.hp > 0) applyDamage(boss, 80);
    }
};