(() => {
  function boot() {
    const game = window.Phaser && Phaser.GAMES && Phaser.GAMES[0];
    const canvas = document.querySelector('#game canvas');
    if (!game || !canvas) return setTimeout(boot, 250);

    let scene;
    try { scene = game.scene.getScene('country'); } catch (_) {}
    if (!scene || !scene.player || !scene.residents || !scene.cameras?.main) {
      return setTimeout(boot, 250);
    }
    if (window.__countryTapMoveInstalled) return;
    window.__countryTapMoveInstalled = true;

    canvas.style.touchAction = 'none';
    canvas.style.webkitUserSelect = 'none';

    let activeToken = 0;
    let marker = null;

    function showMarker(x, y) {
      if (!marker) {
        marker = scene.add.circle(x, y, 11, 0xffffff, 0.5)
          .setStrokeStyle(3, 0x667f6d, 0.85)
          .setDepth(6);
      }
      marker.setPosition(x, y).setVisible(true).setAlpha(1).setScale(1);
      scene.tweens.add({ targets: marker, scale: 1.5, alpha: 0.2, duration: 320, yoyo: true });
    }

    function screenToWorld(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      const sx = (clientX - rect.left) * (scene.scale.width / rect.width);
      const sy = (clientY - rect.top) * (scene.scale.height / rect.height);
      return scene.cameras.main.getWorldPoint(sx, sy);
    }

    function nearestResident(world, maxDistance = 85) {
      let best = null;
      let bestD = maxDistance;
      scene.residents.forEach(r => {
        const d = Phaser.Math.Distance.Between(world.x, world.y, r.x, r.y);
        if (d < bestD) {
          best = r;
          bestD = d;
        }
      });
      return best;
    }

    function animateTo(x, y, resident = null) {
      activeToken += 1;
      const token = activeToken;
      x = Phaser.Math.Clamp(x, 35, 1565);
      y = Phaser.Math.Clamp(y, 35, 965);
      showMarker(x, y);

      const speed = 230;
      let last = performance.now();

      function step(now) {
        if (token !== activeToken) return;
        if (!scene.player || scene.dialogueOpen || scene.policyOpen || scene.historyOpen || scene.buildMode) return;

        const px = scene.player.x;
        const py = scene.player.y;
        const targetX = resident ? resident.x : x;
        const targetY = resident ? resident.y + 58 : y;
        const dx = targetX - px;
        const dy = targetY - py;
        const dist = Math.hypot(dx, dy);

        if ((resident && dist <= 82) || (!resident && dist <= 10)) {
          scene.player.setVelocity?.(0, 0);
          if (marker) marker.setVisible(false);
          if (resident && !scene.dialogueOpen && scene.openDialogue) {
            scene.openDialogue(resident);
          }
          return;
        }

        const dt = Math.min((now - last) / 1000, 0.04);
        last = now;
        const move = Math.min(speed * dt, dist);
        const nx = px + (dx / dist) * move;
        const ny = py + (dy / dist) * move;

        scene.player.setVelocity?.(0, 0);
        if (scene.player.body?.reset) {
          scene.player.body.reset(nx, ny);
        } else {
          scene.player.setPosition(nx, ny);
        }
        requestAnimationFrame(step);
      }

      requestAnimationFrame(step);
    }

    function handleTap(clientX, clientY) {
      if (scene.dialogueOpen || scene.policyOpen || scene.historyOpen || scene.buildMode) return;
      const world = screenToWorld(clientX, clientY);
      const resident = nearestResident(world);
      if (resident) {
        const name = resident.residentData?.name || '住民';
        scene.showNotice?.(`${name}のところへ向かいます`);
        animateTo(resident.x, resident.y + 58, resident);
      } else {
        animateTo(world.x, world.y, null);
      }
    }

    canvas.addEventListener('pointerup', e => {
      e.preventDefault();
      handleTap(e.clientX, e.clientY);
    }, { passive: false });

    canvas.addEventListener('touchend', e => {
      const t = e.changedTouches && e.changedTouches[0];
      if (!t) return;
      e.preventDefault();
      handleTap(t.clientX, t.clientY);
    }, { passive: false });

    scene.showNotice?.('地面をタップで移動・住民をタップで会話できます');
  }

  if (document.readyState === 'complete') boot();
  else window.addEventListener('load', boot);
})();
