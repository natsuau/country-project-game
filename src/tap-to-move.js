(() => {
  function waitForScene() {
    const game = window.Phaser && Phaser.GAMES && Phaser.GAMES[0];
    if (!game) return setTimeout(waitForScene, 250);

    let scene;
    try { scene = game.scene.getScene('country'); } catch (_) {}
    if (!scene || !scene.player || !scene.input || !scene.residents) {
      return setTimeout(waitForScene, 250);
    }

    if (scene.__tapMoveInstalled) return;
    scene.__tapMoveInstalled = true;
    scene.__tapTarget = null;
    scene.__tapResident = null;

    let marker = null;

    function clearTarget() {
      scene.__tapTarget = null;
      scene.__tapResident = null;
      if (marker) marker.setVisible(false);
    }

    function setTarget(x, y, resident = null) {
      if (scene.dialogueOpen || scene.policyOpen || scene.historyOpen || scene.buildMode) return;
      scene.__tapTarget = { x, y };
      scene.__tapResident = resident;
      if (!marker) {
        marker = scene.add.circle(x, y, 11, 0xffffff, 0.48)
          .setStrokeStyle(3, 0x6f8b75, 0.8)
          .setDepth(8);
      }
      marker.setPosition(x, y).setVisible(true);
      scene.tweens.add({ targets: marker, scale: 1.45, alpha: 0.1, duration: 420, yoyo: true });
    }

    // Tap the ground to walk there.
    scene.input.on('pointerdown', (pointer, currentlyOver) => {
      if (scene.dialogueOpen || scene.policyOpen || scene.historyOpen || scene.buildMode) return;
      if (currentlyOver && currentlyOver.some(obj => obj && obj.residentData)) return;

      const world = scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
      setTarget(
        Phaser.Math.Clamp(world.x, 35, 1565),
        Phaser.Math.Clamp(world.y, 35, 965)
      );
    });

    // Tap a resident to walk over and start talking automatically.
    scene.residents.forEach(resident => {
      resident.setInteractive({ useHandCursor: true });
      resident.on('pointerdown', (pointer, localX, localY, event) => {
        if (event && event.stopPropagation) event.stopPropagation();
        const data = resident.residentData || {};
        setTarget(data.x ?? resident.x, (data.y ?? resident.y) + 62, resident);
        if (scene.showNotice) scene.showNotice(`${data.name || '住民'}のところへ向かいます`);
      });
    });

    scene.events.on('update', () => {
      if (!scene.player || !scene.__tapTarget) return;
      if (scene.dialogueOpen || scene.policyOpen || scene.historyOpen || scene.buildMode) {
        scene.player.setVelocity(0, 0);
        return;
      }

      // Manual controls take priority and cancel tap-to-move.
      const manual = scene.cursors?.left?.isDown || scene.cursors?.right?.isDown ||
        scene.cursors?.up?.isDown || scene.cursors?.down?.isDown ||
        scene.keys?.A?.isDown || scene.keys?.D?.isDown || scene.keys?.W?.isDown || scene.keys?.S?.isDown ||
        scene.touchState?.left || scene.touchState?.right || scene.touchState?.up || scene.touchState?.down;
      if (manual) {
        clearTarget();
        return;
      }

      if (scene.__tapResident) {
        const resident = scene.__tapResident;
        const d = Phaser.Math.Distance.Between(scene.player.x, scene.player.y, resident.x, resident.y);
        if (d <= 82) {
          scene.player.setVelocity(0, 0);
          const toTalk = resident;
          clearTarget();
          if (!scene.dialogueOpen && scene.openDialogue) scene.openDialogue(toTalk);
          return;
        }
      }

      const target = scene.__tapTarget;
      const d = Phaser.Math.Distance.Between(scene.player.x, scene.player.y, target.x, target.y);
      if (d <= 12) {
        scene.player.setVelocity(0, 0);
        clearTarget();
        return;
      }

      scene.physics.moveTo(scene.player, target.x, target.y, scene.speed || 190);
    });
  }

  window.addEventListener('load', waitForScene);
})();
