(() => {
  function waitForScene() {
    const game = window.Phaser && Phaser.GAMES && Phaser.GAMES[0];
    if (!game) return setTimeout(waitForScene, 250);

    let scene;
    try { scene = game.scene.getScene('country'); } catch (_) {}
    if (!scene || !scene.player || !scene.residents || !scene.update) {
      return setTimeout(waitForScene, 250);
    }
    if (scene.__tapMoveInstalled) return;
    scene.__tapMoveInstalled = true;

    let target = null;
    let targetResident = null;
    let marker = null;

    function clearTarget() {
      target = null;
      targetResident = null;
      if (marker) marker.setVisible(false);
    }

    function setTarget(x, y, resident = null) {
      if (scene.dialogueOpen || scene.policyOpen || scene.historyOpen || scene.buildMode) return;
      target = {
        x: Phaser.Math.Clamp(x, 35, 1565),
        y: Phaser.Math.Clamp(y, 35, 965)
      };
      targetResident = resident;
      if (!marker) {
        marker = scene.add.circle(target.x, target.y, 10, 0xffffff, 0.50)
          .setStrokeStyle(3, 0x68806e, 0.8)
          .setDepth(7);
      }
      marker.setPosition(target.x, target.y).setScale(1).setAlpha(1).setVisible(true);
      scene.tweens.add({
        targets: marker,
        scale: 1.55,
        alpha: 0.15,
        duration: 380,
        yoyo: true
      });
    }

    // Make residents easier to tap on a phone.
    scene.residents.forEach(resident => {
      resident.setInteractive(new Phaser.Geom.Circle(0, 0, 42), Phaser.Geom.Circle.Contains);
    });

    scene.input.on('pointerdown', pointer => {
      if (scene.dialogueOpen || scene.policyOpen || scene.historyOpen || scene.buildMode) return;

      const world = scene.cameras.main.getWorldPoint(pointer.x, pointer.y);

      // If the tap is close to a resident, treat it as "talk to this person".
      let nearest = null;
      let nearestDistance = 99999;
      scene.residents.forEach(resident => {
        const d = Phaser.Math.Distance.Between(world.x, world.y, resident.x, resident.y);
        if (d < 70 && d < nearestDistance) {
          nearest = resident;
          nearestDistance = d;
        }
      });

      if (nearest) {
        const data = nearest.residentData || {};
        setTarget(nearest.x, nearest.y + 58, nearest);
        if (scene.showNotice) scene.showNotice(`${data.name || '住民'}のところへ向かいます`);
        return;
      }

      setTarget(world.x, world.y, null);
    });

    // Wrap the scene's own update so our movement runs AFTER the original code.
    // That prevents the original update from resetting velocity back to zero.
    const originalUpdate = scene.update.bind(scene);
    scene.update = function(time, delta) {
      originalUpdate(time, delta);

      if (!target || !scene.player) return;

      if (scene.dialogueOpen || scene.policyOpen || scene.historyOpen || scene.buildMode) {
        scene.player.setVelocity(0, 0);
        return;
      }

      const manual = scene.cursors?.left?.isDown || scene.cursors?.right?.isDown ||
        scene.cursors?.up?.isDown || scene.cursors?.down?.isDown ||
        scene.keys?.A?.isDown || scene.keys?.D?.isDown || scene.keys?.W?.isDown || scene.keys?.S?.isDown ||
        scene.touchState?.left || scene.touchState?.right || scene.touchState?.up || scene.touchState?.down;

      if (manual) {
        clearTarget();
        return;
      }

      if (targetResident) {
        const dResident = Phaser.Math.Distance.Between(
          scene.player.x,
          scene.player.y,
          targetResident.x,
          targetResident.y
        );

        if (dResident <= 84) {
          const resident = targetResident;
          scene.player.setVelocity(0, 0);
          clearTarget();
          if (!scene.dialogueOpen && scene.openDialogue) scene.openDialogue(resident);
          return;
        }
      }

      const d = Phaser.Math.Distance.Between(scene.player.x, scene.player.y, target.x, target.y);
      if (d <= 14) {
        scene.player.setVelocity(0, 0);
        clearTarget();
        return;
      }

      scene.physics.moveTo(scene.player, target.x, target.y, scene.speed || 190);
    };

    if (scene.showNotice) scene.showNotice('地面や住民をタップして移動できます');
  }

  window.addEventListener('load', waitForScene);
})();
