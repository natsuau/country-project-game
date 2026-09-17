class CountryScene extends Phaser.Scene {
  constructor() {
    super('country');
    this.speed = 190;
  }

  create() {
    this.createWorld();
    this.createPlayer();
    this.createControls();
    this.createResidents();
    this.createHud();

    this.cameras.main.setBounds(0, 0, 1600, 1000);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setZoom(1.15);
  }

  createWorld() {
    this.physics.world.setBounds(0, 0, 1600, 1000);

    const g = this.add.graphics();
    g.fillStyle(0xcfe6b8, 1);
    g.fillRect(0, 0, 1600, 1000);

    // River
    g.fillStyle(0x87c9de, 1);
    g.fillRoundedRect(0, 710, 1600, 155, 55);
    g.fillStyle(0xbce6ef, 0.55);
    for (let x = 30; x < 1600; x += 130) {
      g.fillEllipse(x, 755 + (x % 4) * 8, 72, 10);
    }

    // Paths
    g.fillStyle(0xe8ddc5, 1);
    g.fillRoundedRect(110, 395, 1180, 90, 30);
    g.fillRoundedRect(715, 120, 90, 590, 30);

    this.add.text(100, 80, 'はじまりの町', {
      fontFamily: 'system-ui',
      fontSize: '34px',
      color: '#35523c',
      fontStyle: 'bold'
    });

    this.makeHouse(220, 275, 0xf5c4a8);
    this.makeHouse(420, 540, 0xeab0a8);
    this.makeHouse(1120, 285, 0xf1d29b);
    this.makeHouse(1230, 560, 0xd9b7e8);
    this.makeSchool(770, 290);

    this.makeTreeCluster(90, 500);
    this.makeTreeCluster(1360, 180);
    this.makeTreeCluster(1320, 520);

    // Bridge
    g.fillStyle(0xb78f6a, 1);
    g.fillRoundedRect(720, 690, 110, 195, 10);
    g.lineStyle(5, 0x8c6a50, 1);
    for (let y = 710; y <= 850; y += 35) {
      g.lineBetween(730, y, 820, y);
    }
  }

  makeHouse(x, y, wallColor) {
    const g = this.add.graphics();
    g.fillStyle(wallColor, 1);
    g.fillRoundedRect(x, y, 140, 95, 10);
    g.fillStyle(0x9c5f4a, 1);
    g.fillTriangle(x - 10, y + 5, x + 70, y - 62, x + 150, y + 5);
    g.fillStyle(0xf7efd9, 1);
    g.fillRect(x + 25, y + 28, 34, 34);
    g.fillStyle(0x6d513f, 1);
    g.fillRoundedRect(x + 90, y + 34, 28, 61, 4);
  }

  makeSchool(x, y) {
    const g = this.add.graphics();
    g.fillStyle(0xf2e7c6, 1);
    g.fillRoundedRect(x, y, 210, 120, 10);
    g.fillStyle(0xb56f58, 1);
    g.fillTriangle(x - 8, y + 8, x + 105, y - 48, x + 218, y + 8);
    g.fillStyle(0x8fc1d7, 1);
    for (let i = 0; i < 4; i++) {
      g.fillRect(x + 24 + i * 45, y + 35, 28, 32);
    }
    this.add.text(x + 58, y + 80, '学校', {
      fontFamily: 'system-ui',
      fontSize: '24px',
      color: '#5d5a4f'
    });
  }

  makeTreeCluster(x, y) {
    const g = this.add.graphics();
    const offsets = [[0,0],[60,-20],[105,35],[30,70],[95,95],[150,60]];
    offsets.forEach(([dx, dy]) => {
      g.fillStyle(0x765b43, 1);
      g.fillRect(x + dx + 15, y + dy + 40, 12, 36);
      g.fillStyle(0x6fa765, 1);
      g.fillCircle(x + dx + 20, y + dy + 32, 28);
      g.fillStyle(0x87b978, 1);
      g.fillCircle(x + dx + 2, y + dy + 38, 20);
    });
  }

  createPlayer() {
    const g = this.add.graphics();
    g.fillStyle(0x3d5f73, 1);
    g.fillCircle(18, 15, 13);
    g.fillStyle(0xf1c6a8, 1);
    g.fillCircle(18, 12, 8);
    g.fillStyle(0xe4efe6, 1);
    g.fillRoundedRect(7, 25, 22, 28, 7);
    g.fillStyle(0x5a6e7a, 1);
    g.fillRect(8, 52, 8, 18);
    g.fillRect(20, 52, 8, 18);
    g.generateTexture('player', 36, 72);
    g.destroy();

    this.player = this.physics.add.image(760, 560, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.body.setSize(24, 32).setOffset(6, 36);
  }

  createResidents() {
    const residents = [
      { x: 520, y: 430, label: '住民A' },
      { x: 930, y: 430, label: '住民B' },
      { x: 845, y: 610, label: '住民C' }
    ];

    residents.forEach((resident, index) => {
      const circle = this.add.circle(resident.x, resident.y, 18, [0xe7a6a1, 0x8db9a7, 0xd8b46f][index]);
      this.add.text(resident.x - 24, resident.y + 25, resident.label, {
        fontFamily: 'system-ui',
        fontSize: '15px',
        color: '#405047',
        backgroundColor: '#ffffffcc',
        padding: { x: 5, y: 2 }
      });
      this.tweens.add({
        targets: circle,
        y: resident.y - 6,
        duration: 1300 + index * 200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut'
      });
    });
  }

  createControls() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D');
    this.touchState = { left: false, right: false, up: false, down: false };

    const controls = [
      ['←', 75, -70, 'left'],
      ['→', 155, -70, 'right'],
      ['↑', 115, -110, 'up'],
      ['↓', 115, -30, 'down']
    ];

    controls.forEach(([label, x, y, dir]) => {
      const bg = this.add.circle(x, y, 31, 0xffffff, 0.74)
        .setStrokeStyle(2, 0x52665a, 0.28)
        .setScrollFactor(0)
        .setInteractive();
      const txt = this.add.text(x, y, label, {
        fontSize: '30px', color: '#41564a'
      }).setOrigin(0.5).setScrollFactor(0);

      const position = () => {
        bg.setPosition(x, this.scale.height + y);
        txt.setPosition(x, this.scale.height + y);
      };
      position();
      this.scale.on('resize', position);

      bg.on('pointerdown', () => this.touchState[dir] = true);
      bg.on('pointerup', () => this.touchState[dir] = false);
      bg.on('pointerout', () => this.touchState[dir] = false);
    });
  }

  createHud() {
    this.add.text(20, 18, '春・1年目', {
      fontFamily: 'system-ui',
      fontSize: '20px',
      color: '#35523c',
      backgroundColor: '#ffffffd9',
      padding: { x: 12, y: 8 }
    }).setScrollFactor(0).setDepth(20);

    this.add.text(20, 63, '歩いて、この国を見てみよう', {
      fontFamily: 'system-ui',
      fontSize: '16px',
      color: '#4e6356',
      backgroundColor: '#ffffffbd',
      padding: { x: 10, y: 6 }
    }).setScrollFactor(0).setDepth(20);
  }

  update() {
    let vx = 0;
    let vy = 0;

    const left = this.cursors.left.isDown || this.keys.A.isDown || this.touchState.left;
    const right = this.cursors.right.isDown || this.keys.D.isDown || this.touchState.right;
    const up = this.cursors.up.isDown || this.keys.W.isDown || this.touchState.up;
    const down = this.cursors.down.isDown || this.keys.S.isDown || this.touchState.down;

    if (left) vx -= 1;
    if (right) vx += 1;
    if (up) vy -= 1;
    if (down) vy += 1;

    if (vx !== 0 && vy !== 0) {
      const norm = Math.SQRT1_2;
      vx *= norm;
      vy *= norm;
    }

    this.player.setVelocity(vx * this.speed, vy * this.speed);
  }
}

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 960,
  height: 540,
  backgroundColor: '#cfe6b8',
  physics: {
    default: 'arcade',
    arcade: { debug: false }
  },
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: CountryScene
};

new Phaser.Game(config);
