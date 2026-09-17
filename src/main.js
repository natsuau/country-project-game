class CountryScene extends Phaser.Scene {
  constructor() {
    super('country');
    this.speed = 190;
    this.nearResident = null;
    this.dialogueOpen = false;
    this.buildMode = false;
    this.historyOpen = false;
    this.policyOpen = false;
    this.touchState = { left: false, right: false, up: false, down: false };
    this.state = this.loadState();
  }

  defaultState() {
    return {
      countryName: 'はじまりの国',
      year: 1,
      season: 0,
      money: 120,
      population: 42,
      education: 38,
      environment: 72,
      employment: 64,
      freeTime: 55,
      technology: 20,
      schoolBuilt: false,
      introTalks: 0,
      firstChoiceDone: false,
      history: [
        { year: 1, text: '小さな町から国づくりが始まった。' }
      ],
      policies: {
        educationBudget: '標準',
        environmentRule: '標準',
        workStyle: '標準',
        taxLevel: '標準',
        technologyInvestment: '標準'
      }
    };
  }

  loadState() {
    try {
      const saved = localStorage.getItem('country-project-save-v1');
      if (saved) return { ...this.defaultState(), ...JSON.parse(saved) };
    } catch (e) {}
    return this.defaultState();
  }

  saveState() {
    try {
      localStorage.setItem('country-project-save-v1', JSON.stringify(this.state));
    } catch (e) {}
  }

  create() {
    this.createWorld();
    this.createPlayer();
    this.createResidents();
    this.createControls();
    this.createHud();
    this.createDialogueUi();
    this.createPolicyUi();
    this.createHistoryUi();
    this.createBuildUi();

    this.cameras.main.setBounds(0, 0, 1600, 1000);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setZoom(1.12);

    this.time.addEvent({
      delay: 22000,
      loop: true,
      callback: () => this.advanceTime()
    });

    if (!this.state.firstChoiceDone) {
      this.time.delayedCall(1200, () => this.showNotice('歩いて住民に話しかけてみよう'));
    }
  }

  createWorld() {
    this.physics.world.setBounds(0, 0, 1600, 1000);

    const g = this.add.graphics().setDepth(0);

    // Soft paper-like grass base
    g.fillStyle(0xd6e8c6, 1);
    g.fillRect(0, 0, 1600, 1000);
    g.fillStyle(0xc9dfba, 0.45);
    for (let i = 0; i < 60; i++) {
      const x = (i * 193) % 1600;
      const y = (i * 109) % 700;
      g.fillEllipse(x, y, 70 + (i % 4) * 18, 26, 0.18);
    }

    // River with banks and soft highlights
    g.fillStyle(0x6faebe, 0.26);
    g.fillRoundedRect(0, 695, 1600, 185, 58);
    g.fillStyle(0x83c7d8, 1);
    g.fillRoundedRect(0, 710, 1600, 155, 52);
    g.fillStyle(0xbce7ed, 0.64);
    for (let x = 40; x < 1600; x += 145) {
      const y = 755 + ((x / 145) % 3) * 16;
      g.fillEllipse(x, y, 82, 9);
    }
    g.fillStyle(0xffffff, 0.22);
    for (let x = 85; x < 1550; x += 220) {
      g.fillEllipse(x, 825 - (x % 5) * 7, 46, 5);
    }

    // Paths: soft edge + center
    g.fillStyle(0xd5c8ae, 0.5);
    g.fillRoundedRect(96, 387, 1205, 106, 36);
    g.fillRoundedRect(704, 108, 112, 604, 38);
    g.fillStyle(0xeadfc7, 1);
    g.fillRoundedRect(110, 397, 1180, 86, 30);
    g.fillRoundedRect(716, 120, 88, 590, 30);

    this.add.text(100, 78, 'はじまりの町', {
      fontFamily: 'system-ui',
      fontSize: '34px',
      color: '#476151',
      fontStyle: 'bold',
      stroke: '#f7f3e8',
      strokeThickness: 5
    }).setDepth(2);

    this.makeHouse(220, 275, 0xf2c6ac, 0xb96f58);
    this.makeHouse(420, 540, 0xe9b8ad, 0xa9685b);
    this.makeHouse(1120, 285, 0xf0d3a8, 0xbd7b58);
    this.makeHouse(1230, 560, 0xdac0e5, 0x8f6c96);

    this.makeSchool(770, 290, '小さな学校');
    if (this.state.schoolBuilt) this.makeSchool(1080, 520, '新しい学校');

    this.makeTreeCluster(90, 500);
    this.makeTreeCluster(1360, 180);
    this.makeTreeCluster(1320, 520);

    this.makeBridge(720, 690);

    // Flowers and tiny landscape details
    for (let i = 0; i < 42; i++) {
      const x = 60 + (i * 137) % 1450;
      const y = 145 + (i * 83) % 525;
      const colors = [0xfaf7eb, 0xe7b6c4, 0xe8cf7c, 0xa7c9a0];
      this.add.circle(x, y, 3 + (i % 2), colors[i % colors.length], 0.78).setDepth(1);
    }

    // Benches give a sense that people actually live here.
    this.makeBench(360, 455);
    this.makeBench(1030, 455);
  }

  makeHouse(x, y, wallColor, roofColor) {
    const g = this.add.graphics().setDepth(y);

    // ground shadow
    g.fillStyle(0x55705f, 0.16);
    g.fillEllipse(x + 78, y + 104, 150, 34);

    // side wall creates gentle 2.5D volume
    g.fillStyle(Phaser.Display.Color.ValueToColor(wallColor).darken(10).color, 1);
    g.fillRoundedRect(x + 118, y + 12, 38, 82, 7);

    // front wall
    g.fillStyle(wallColor, 1);
    g.fillRoundedRect(x, y, 128, 94, 11);

    // roof side
    g.fillStyle(Phaser.Display.Color.ValueToColor(roofColor).darken(15).color, 1);
    g.fillTriangle(x + 70, y - 57, x + 158, y + 4, x + 128, y + 15);

    // roof front
    g.fillStyle(roofColor, 1);
    g.fillTriangle(x - 12, y + 8, x + 64, y - 58, x + 136, y + 8);

    // warm window
    g.fillStyle(0xf8eccd, 1);
    g.fillRoundedRect(x + 20, y + 30, 36, 34, 5);
    g.lineStyle(2, 0xd4b67f, 0.6);
    g.lineBetween(x + 38, y + 31, x + 38, y + 63);
    g.lineBetween(x + 21, y + 47, x + 55, y + 47);

    // door
    g.fillStyle(0x765948, 1);
    g.fillRoundedRect(x + 84, y + 36, 28, 58, 5);
    g.fillStyle(0xd4b98b, 1);
    g.fillCircle(x + 105, y + 65, 2.5);
  }

  makeSchool(x, y, label = '学校') {
    const g = this.add.graphics().setDepth(y);

    g.fillStyle(0x536b5e, 0.17);
    g.fillEllipse(x + 115, y + 132, 240, 42);

    // right side wall
    g.fillStyle(0xd9cda9, 1);
    g.fillRoundedRect(x + 180, y + 10, 54, 108, 8);

    // front wall
    g.fillStyle(0xf2e7c6, 1);
    g.fillRoundedRect(x, y, 190, 118, 11);

    // roof side and front
    g.fillStyle(0x995f50, 1);
    g.fillTriangle(x + 106, y - 47, x + 238, y + 8, x + 190, y + 22);
    g.fillStyle(0xb76f5a, 1);
    g.fillTriangle(x - 10, y + 9, x + 96, y - 49, x + 200, y + 9);

    // windows with soft highlights
    for (let i = 0; i < 4; i++) {
      const wx = x + 18 + i * 42;
      g.fillStyle(0x82b7c9, 1);
      g.fillRoundedRect(wx, y + 30, 28, 34, 4);
      g.fillStyle(0xcce8ef, 0.72);
      g.fillRect(wx + 4, y + 34, 9, 25);
    }

    // entrance
    g.fillStyle(0x856452, 1);
    g.fillRoundedRect(x + 76, y + 74, 38, 44, 5);

    this.add.text(x + 35, y + 84, label, {
      fontFamily: 'system-ui',
      fontSize: '20px',
      color: '#5d5a4f',
      backgroundColor: '#fffaf0b8',
      padding: { x: 6, y: 2 }
    }).setDepth(y + 2);
  }

  makeTreeCluster(x, y) {
    const offsets = [[0,0],[60,-20],[105,35],[30,70],[95,95],[150,60]];
    offsets.forEach(([dx, dy], i) => this.makeTree(x + dx, y + dy, i));
  }

  makeTree(x, y, variant = 0) {
    const g = this.add.graphics().setDepth(y + 70);

    // shadow
    g.fillStyle(0x506758, 0.16);
    g.fillEllipse(x + 20, y + 69, 64, 22);

    // trunk
    g.fillStyle(0x725844, 1);
    g.fillRoundedRect(x + 14, y + 37, 14, 36, 5);

    // layered canopy
    const dark = variant % 2 ? 0x699763 : 0x719f69;
    const mid = variant % 2 ? 0x7eab72 : 0x84b278;
    const light = variant % 2 ? 0x94bd82 : 0x9bc48a;
    g.fillStyle(dark, 1);
    g.fillCircle(x + 18, y + 30, 30);
    g.fillCircle(x + 3, y + 38, 22);
    g.fillStyle(mid, 1);
    g.fillCircle(x + 34, y + 34, 24);
    g.fillCircle(x + 18, y + 13, 21);
    g.fillStyle(light, 0.72);
    g.fillCircle(x + 7, y + 19, 12);
  }

  makeBridge(x, y) {
    const g = this.add.graphics().setDepth(y + 170);

    // bridge shadow on water
    g.fillStyle(0x4f7480, 0.25);
    g.fillRoundedRect(x + 8, y + 20, 112, 196, 13);

    // side thickness
    g.fillStyle(0x8f674d, 1);
    g.fillRoundedRect(x + 2, y + 12, 124, 190, 12);

    // deck
    g.fillStyle(0xb98d65, 1);
    g.fillRoundedRect(x - 5, y, 124, 190, 12);

    // planks
    g.lineStyle(5, 0x8f684e, 0.82);
    for (let yy = y + 25; yy < y + 180; yy += 35) {
      g.lineBetween(x + 12, yy, x + 101, yy);
    }

    // subtle rails
    g.lineStyle(4, 0x745846, 0.8);
    g.lineBetween(x + 5, y + 8, x + 5, y + 180);
    g.lineBetween(x + 110, y + 8, x + 110, y + 180);
  }

  makeBench(x, y) {
    const g = this.add.graphics().setDepth(y);
    g.fillStyle(0x51695b, 0.12);
    g.fillEllipse(x + 28, y + 25, 70, 15);
    g.fillStyle(0x9d795b, 1);
    g.fillRoundedRect(x, y, 58, 9, 3);
    g.fillRoundedRect(x, y + 12, 58, 8, 3);
    g.fillStyle(0x765c49, 1);
    g.fillRect(x + 7, y + 20, 5, 13);
    g.fillRect(x + 46, y + 20, 5, 13);
  }

  createPlayer() {
    const g = this.add.graphics();

    // transparent area keeps room for the soft shadow
    g.fillStyle(0x000000, 0);
    g.fillRect(0, 0, 46, 82);

    // body shadow inside texture
    g.fillStyle(0x4e6357, 0.22);
    g.fillEllipse(23, 75, 34, 10);

    // hair/back of head
    g.fillStyle(0x4b6470, 1);
    g.fillCircle(23, 20, 16);
    g.fillStyle(0xf1c7aa, 1);
    g.fillCircle(23, 20, 10);
    g.fillStyle(0x536c78, 1);
    g.fillArc(23, 17, 11, 190, 350, false);

    // clothing
    g.fillStyle(0xe6efe7, 1);
    g.fillRoundedRect(10, 31, 26, 30, 8);
    g.fillStyle(0xa8c3ad, 1);
    g.fillRoundedRect(12, 34, 22, 7, 3);

    // legs
    g.fillStyle(0x5e7180, 1);
    g.fillRoundedRect(12, 58, 9, 17, 3);
    g.fillRoundedRect(25, 58, 9, 17, 3);

    g.generateTexture('player', 46, 82);
    g.destroy();

    this.player = this.physics.add.image(760, 560, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.body.setSize(28, 34).setOffset(9, 40);
    this.player.setDepth(this.player.y);
  }

  createResidents() {
    const residents = [
      {
        x: 520, y: 430, name: 'ミナ', role: '子ども', color: 0xe3a5a5,
        lines: [
          '学校まで、ちょっと遠いんだ。',
          '川の近くを通る道は好き。でも雨の日は大変。'
        ]
      },
      {
        x: 930, y: 430, name: 'トオル', role: '店主', color: 0x86b3a0,
        lines: [
          '最近、この辺りにも家が増えてきたよ。',
          '学校が近くにできたら、人通りも変わりそうだね。'
        ]
      },
      {
        x: 845, y: 610, name: 'ルカ', role: '川辺で働く人', color: 0xd5ae68,
        lines: [
          'この川は町の大事な場所なんだ。',
          '便利になるのはうれしいけど、川の景色も残したいな。'
        ]
      }
    ];

    this.residents = residents.map((resident, index) => {
      const group = this.add.container(resident.x, resident.y).setDepth(resident.y);
      const shadow = this.add.ellipse(0, 18, 35, 11, 0x506457, 0.18);
      const body = this.add.ellipse(0, 2, 25, 32, resident.color, 1);
      const face = this.add.circle(0, -15, 10, 0xf0c5a5, 1);
      const hair = this.add.arc(0, -18, 11, 185, 355, false, [0x566870, 0x725b4f, 0x5c5149][index], 1);
      group.add([shadow, body, face, hair]);
      group.residentData = resident;

      const label = this.add.text(resident.x, resident.y + 29, `${resident.name}\n${resident.role}`, {
        fontFamily: 'system-ui',
        fontSize: '14px',
        align: 'center',
        color: '#405047',
        backgroundColor: '#fffdf6d9',
        padding: { x: 6, y: 4 }
      }).setOrigin(0.5, 0).setDepth(resident.y + 4);

      this.tweens.add({
        targets: [group, label],
        y: '+=-5',
        duration: 1400 + index * 170,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut'
      });

      return group;
    });
  }

  createControls() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D,E,H,P,B');

    const controls = [
      ['←', 68, -108, 'left'],
      ['→', 148, -108, 'right'],
      ['↑', 108, -148, 'up'],
      ['↓', 108, -68, 'down']
    ];

    controls.forEach(([label, x, y, dir]) => {
      const bg = this.add.circle(x, y, 31, 0xfffdf7, 0.82)
        .setStrokeStyle(2, 0x52665a, 0.22)
        .setScrollFactor(0)
        .setDepth(30)
        .setInteractive();
      const txt = this.add.text(x, y, label, {
        fontSize: '28px', color: '#41564a'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(31);

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
    this.yearText = this.add.text(20, 18, '', {
      fontFamily: 'system-ui',
      fontSize: '20px',
      color: '#35523c',
      backgroundColor: '#fffdf4e8',
      padding: { x: 12, y: 8 }
    }).setScrollFactor(0).setDepth(40);

    this.moneyText = this.add.text(20, 62, '', {
      fontFamily: 'system-ui',
      fontSize: '16px',
      color: '#4e6356',
      backgroundColor: '#fffdf4d6',
      padding: { x: 10, y: 6 }
    }).setScrollFactor(0).setDepth(40);

    this.goalText = this.add.text(20, 100, '', {
      fontFamily: 'system-ui',
      fontSize: '15px',
      color: '#4e6356',
      backgroundColor: '#fffdf4c9',
      padding: { x: 10, y: 6 }
    }).setScrollFactor(0).setDepth(40);

    this.interactButton = this.add.text(0, 0, '話す', {
      fontFamily: 'system-ui', fontSize: '22px', color: '#ffffff',
      backgroundColor: '#617f6a', padding: { x: 18, y: 12 }
    }).setOrigin(1, 1).setScrollFactor(0).setDepth(45).setInteractive();
    this.interactButton.on('pointerdown', () => this.interact());

    this.menuButtons = [];
    const menu = [
      ['方針', () => this.togglePolicy()],
      ['歴史', () => this.toggleHistory()]
    ];
    menu.forEach(([label, cb]) => {
      const b = this.add.text(0, 0, label, {
        fontFamily: 'system-ui', fontSize: '16px', color: '#3e5547',
        backgroundColor: '#fffdf4e6', padding: { x: 11, y: 8 }
      }).setOrigin(1, 0).setScrollFactor(0).setDepth(45).setInteractive();
      b.on('pointerdown', cb);
      this.menuButtons.push(b);
    });

    const reposition = () => {
      this.interactButton.setPosition(this.scale.width - 22, this.scale.height - 82);
      this.menuButtons[0].setPosition(this.scale.width - 18, 18);
      this.menuButtons[1].setPosition(this.scale.width - 88, 18);
    };
    reposition();
    this.scale.on('resize', reposition);
    this.refreshHud();
  }

  refreshHud() {
    const seasons = ['春', '夏', '秋', '冬'];
    this.yearText.setText(`${this.state.countryName}　${seasons[this.state.season]}・${this.state.year}年目`);
    this.moneyText.setText(`国のお金 ${this.state.money}　人口 ${this.state.population}`);

    if (!this.state.firstChoiceDone) {
      this.goalText.setText(this.state.introTalks < 2 ? '住民に話を聞いてみよう' : '新しい学校を建てる場所を考えよう');
    } else {
      this.goalText.setText(`教育 ${this.state.education}　環境 ${this.state.environment}　自由時間 ${this.state.freeTime}`);
    }
  }

  createDialogueUi() {
    this.dialogueBg = this.add.rectangle(0, 0, 10, 10, 0xfffdf7, 0.96)
      .setStrokeStyle(2, 0x78917f, 0.35).setScrollFactor(0).setDepth(80).setVisible(false);
    this.dialogueName = this.add.text(0, 0, '', {
      fontFamily: 'system-ui', fontSize: '18px', fontStyle: 'bold', color: '#3f5d49'
    }).setScrollFactor(0).setDepth(81).setVisible(false);
    this.dialogueText = this.add.text(0, 0, '', {
      fontFamily: 'system-ui', fontSize: '18px', color: '#33433a', wordWrap: { width: 520 }
    }).setScrollFactor(0).setDepth(81).setVisible(false);
    this.dialogueClose = this.add.text(0, 0, '閉じる', {
      fontFamily: 'system-ui', fontSize: '15px', color: '#ffffff',
      backgroundColor: '#607b69', padding: { x: 12, y: 7 }
    }).setScrollFactor(0).setDepth(82).setInteractive().setVisible(false);
    this.dialogueClose.on('pointerdown', () => this.closeDialogue());

    const resize = () => {
      const w = Math.min(this.scale.width - 32, 650);
      const h = 160;
      const x = this.scale.width / 2;
      const y = this.scale.height - h / 2 - 88;
      this.dialogueBg.setPosition(x, y).setSize(w, h);
      this.dialogueName.setPosition(x - w / 2 + 22, y - 56);
      this.dialogueText.setPosition(x - w / 2 + 22, y - 20);
      this.dialogueText.setWordWrapWidth(w - 44);
      this.dialogueClose.setPosition(x + w / 2 - 82, y + 45);
    };
    resize();
    this.scale.on('resize', resize);
  }

  openDialogue(resident) {
    this.dialogueOpen = true;
    const data = resident.residentData;
    const line = data.lines[Math.min(this.state.introTalks, data.lines.length - 1) % data.lines.length];
    this.dialogueName.setText(`${data.name}・${data.role}`);
    this.dialogueText.setText(line);
    [this.dialogueBg, this.dialogueName, this.dialogueText, this.dialogueClose].forEach(o => o.setVisible(true));

    if (!this.state.firstChoiceDone) {
      this.state.introTalks = Math.min(3, this.state.introTalks + 1);
      this.saveState();
      this.refreshHud();
      if (this.state.introTalks === 2 && !this.state.schoolBuilt) {
        this.time.delayedCall(500, () => this.showBuildPrompt());
      }
    }
  }

  closeDialogue() {
    this.dialogueOpen = false;
    [this.dialogueBg, this.dialogueName, this.dialogueText, this.dialogueClose].forEach(o => o.setVisible(false));
  }

  showBuildPrompt() {
    this.showNotice('住民の声が集まった。新しい学校を建てられます。');
    this.buildButton.setVisible(true);
  }

  createBuildUi() {
    this.buildButton = this.add.text(0, 0, '学校を建てる', {
      fontFamily: 'system-ui', fontSize: '18px', color: '#ffffff',
      backgroundColor: '#8a6a4d', padding: { x: 15, y: 10 }
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(60).setInteractive();
    this.buildButton.setVisible(!this.state.schoolBuilt && this.state.introTalks >= 2);
    this.buildButton.on('pointerdown', () => this.startBuildMode());

    this.buildGhost = this.add.rectangle(1080, 520, 220, 140, 0xf4dfaf, 0.55)
      .setStrokeStyle(4, 0x8a6a4d, 0.9).setDepth(12).setVisible(false).setInteractive();
    this.buildLabel = this.add.text(1080, 520, 'ここに学校を建てる\n費用 35', {
      fontFamily: 'system-ui', fontSize: '18px', align: 'center', color: '#4c4339',
      backgroundColor: '#fffdf4e8', padding: { x: 10, y: 7 }
    }).setOrigin(0.5).setDepth(13).setVisible(false);
    this.buildGhost.on('pointerdown', () => this.confirmBuild());

    const reposition = () => this.buildButton.setPosition(this.scale.width / 2, 18);
    reposition();
    this.scale.on('resize', reposition);
  }

  startBuildMode() {
    if (this.state.schoolBuilt) return;
    if (this.state.money < 35) {
      this.showNotice('国のお金が足りません');
      return;
    }
    this.buildMode = true;
    this.buildGhost.setVisible(true);
    this.buildLabel.setVisible(true);
    this.showNotice('町の右下にある候補地をタップしてください');
  }

  confirmBuild() {
    if (!this.buildMode || this.state.schoolBuilt) return;
    this.state.schoolBuilt = true;
    this.state.firstChoiceDone = true;
    this.state.money -= 35;
    this.state.education = Math.min(100, this.state.education + 12);
    this.state.population += 2;
    this.state.history.push({ year: this.state.year, text: '川の近くに新しい学校を建てた。' });
    this.buildMode = false;
    this.buildGhost.setVisible(false);
    this.buildLabel.setVisible(false);
    this.buildButton.setVisible(false);
    this.makeSchool(1080, 520, '新しい学校');
    this.saveState();
    this.refreshHud();
    this.showNotice('学校が完成した。教育へのアクセスが少し良くなった。');
  }

  createPolicyUi() {
    this.policyPanel = this.add.rectangle(0, 0, 360, 450, 0xfafcf8, 0.97)
      .setStrokeStyle(2, 0x78917f, 0.3).setScrollFactor(0).setDepth(90).setOrigin(1, 0).setVisible(false);
    this.policyTitle = this.add.text(0, 0, '国の方針', {
      fontFamily: 'system-ui', fontSize: '24px', fontStyle: 'bold', color: '#35523c'
    }).setScrollFactor(0).setDepth(91).setVisible(false);

    this.policyTexts = [];
    const categories = [
      ['教育', 'educationBudget'],
      ['環境', 'environmentRule'],
      ['働き方', 'workStyle'],
      ['税金', 'taxLevel'],
      ['技術', 'technologyInvestment']
    ];

    categories.forEach(([label, key], i) => {
      const txt = this.add.text(0, 0, '', {
        fontFamily: 'system-ui', fontSize: '17px', color: '#405047',
        backgroundColor: '#edf3ea', padding: { x: 10, y: 9 }
      }).setScrollFactor(0).setDepth(91).setInteractive().setVisible(false);
      txt.policyKey = key;
      txt.policyLabel = label;
      txt.on('pointerdown', () => this.cyclePolicy(key, label));
      this.policyTexts.push(txt);
    });

    this.policyHint = this.add.text(0, 0, 'タップすると 標準 → 高め → 低め と変わります', {
      fontFamily: 'system-ui', fontSize: '13px', color: '#6b7b70', wordWrap: { width: 300 }
    }).setScrollFactor(0).setDepth(91).setVisible(false);

    const reposition = () => {
      const right = this.scale.width - 14;
      this.policyPanel.setPosition(right, 62);
      this.policyTitle.setPosition(right - 330, 82);
      this.policyTexts.forEach((t, i) => t.setPosition(right - 330, 128 + i * 55));
      this.policyHint.setPosition(right - 330, 412);
    };
    reposition();
    this.scale.on('resize', reposition);
  }

  togglePolicy() {
    this.policyOpen = !this.policyOpen;
    this.historyOpen = false;
    this.historyObjects.forEach(o => o.setVisible(false));
    this.refreshPolicyPanel();
  }

  refreshPolicyPanel() {
    const visible = this.policyOpen;
    this.policyPanel.setVisible(visible);
    this.policyTitle.setVisible(visible);
    this.policyHint.setVisible(visible);
    this.policyTexts.forEach(t => {
      t.setVisible(visible);
      t.setText(`${t.policyLabel}　${this.state.policies[t.policyKey]}`);
    });
  }

  cyclePolicy(key, label) {
    const order = ['標準', '高め', '低め'];
    const current = this.state.policies[key] || '標準';
    const next = order[(order.indexOf(current) + 1) % order.length];
    this.state.policies[key] = next;

    const effects = {
      educationBudget: { '高め': [-4, 3, 0], '低め': [3, -2, 0] },
      environmentRule: { '高め': [-2, 0, 3], '低め': [2, 0, -3] },
      workStyle: { '高め': [0, 0, 0], '低め': [0, 0, 0] },
      taxLevel: { '高め': [4, 0, 0], '低め': [-4, 0, 0] },
      technologyInvestment: { '高め': [-3, 0, 0], '低め': [2, 0, 0] }
    };
    const [money, edu, env] = effects[key]?.[next] || [0, 0, 0];
    this.state.money += money;
    this.state.education = Phaser.Math.Clamp(this.state.education + edu, 0, 100);
    this.state.environment = Phaser.Math.Clamp(this.state.environment + env, 0, 100);
    this.state.history.push({ year: this.state.year, text: `${label}の方針を「${next}」に変えた。` });
    this.saveState();
    this.refreshHud();
    this.refreshPolicyPanel();
    this.showNotice(`${label}の方針を「${next}」に変更`);
  }

  createHistoryUi() {
    const panel = this.add.rectangle(0, 0, 420, 460, 0xfffdf8, 0.97)
      .setStrokeStyle(2, 0x78917f, 0.3).setScrollFactor(0).setDepth(90).setOrigin(0, 0).setVisible(false);
    const title = this.add.text(0, 0, 'この国の歴史', {
      fontFamily: 'system-ui', fontSize: '24px', fontStyle: 'bold', color: '#35523c'
    }).setScrollFactor(0).setDepth(91).setVisible(false);
    const body = this.add.text(0, 0, '', {
      fontFamily: 'system-ui', fontSize: '16px', lineSpacing: 7, color: '#405047',
      wordWrap: { width: 360 }
    }).setScrollFactor(0).setDepth(91).setVisible(false);
    this.historyObjects = [panel, title, body];
    this.historyBody = body;

    const reposition = () => {
      panel.setPosition(16, 62);
      title.setPosition(38, 84);
      body.setPosition(38, 130);
    };
    reposition();
    this.scale.on('resize', reposition);
  }

  toggleHistory() {
    this.historyOpen = !this.historyOpen;
    this.policyOpen = false;
    this.refreshPolicyPanel();
    if (this.historyOpen) {
      const lines = this.state.history.slice(-10).reverse().map(h => `${h.year}年目　${h.text}`);
      this.historyBody.setText(lines.join('\n\n'));
    }
    this.historyObjects.forEach(o => o.setVisible(this.historyOpen));
  }

  advanceTime() {
    if (this.dialogueOpen || this.buildMode) return;
    this.state.season += 1;
    if (this.state.season > 3) {
      this.state.season = 0;
      this.state.year += 1;
      this.applyYearlySimulation();
    }
    this.saveState();
    this.refreshHud();
  }

  applyYearlySimulation() {
    const p = this.state.policies;

    if (p.educationBudget === '高め') {
      this.state.education = Math.min(100, this.state.education + 2);
      this.state.money -= 3;
    } else if (p.educationBudget === '低め') {
      this.state.education = Math.max(0, this.state.education - 1);
      this.state.money += 2;
    }

    if (p.environmentRule === '高め') {
      this.state.environment = Math.min(100, this.state.environment + 2);
      this.state.money -= 1;
    } else if (p.environmentRule === '低め') {
      this.state.environment = Math.max(0, this.state.environment - 2);
      this.state.money += 2;
    }

    if (p.workStyle === '低め') {
      this.state.freeTime = Math.min(100, this.state.freeTime + 2);
      this.state.employment = Math.max(0, this.state.employment - 1);
    } else if (p.workStyle === '高め') {
      this.state.freeTime = Math.max(0, this.state.freeTime - 2);
      this.state.money += 1;
    }

    if (p.technologyInvestment === '高め') {
      this.state.technology = Math.min(100, this.state.technology + 3);
      this.state.money -= 2;
    }

    if (p.taxLevel === '高め') this.state.money += 4;
    if (p.taxLevel === '低め') this.state.money -= 2;

    if (this.state.schoolBuilt) this.state.population += 1;

    if (this.state.environment >= 78 && this.state.year % 3 === 0) {
      this.state.history.push({ year: this.state.year, text: '川辺に鳥が戻り、散歩する住民が増えた。' });
      this.showNotice('川辺に鳥が戻ってきた');
    }

    if (this.state.education >= 55 && this.state.year % 4 === 0) {
      this.state.history.push({ year: this.state.year, text: '学校の活動から小さな研究会が生まれた。' });
      this.showNotice('町に小さな研究会が生まれた');
    }

    this.state.money = Math.max(0, this.state.money);
  }

  interact() {
    if (this.dialogueOpen) {
      this.closeDialogue();
      return;
    }
    if (this.nearResident) {
      this.openDialogue(this.nearResident);
    } else {
      this.showNotice('もう少し住民に近づいてみよう');
    }
  }

  showNotice(text) {
    if (this.notice) this.notice.destroy();
    this.notice = this.add.text(this.scale.width / 2, 78, text, {
      fontFamily: 'system-ui', fontSize: '17px', color: '#33433a',
      backgroundColor: '#fff9e9ef', padding: { x: 16, y: 9 }
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(120);
    this.tweens.add({
      targets: this.notice,
      alpha: 0,
      delay: 2500,
      duration: 700,
      onComplete: () => { if (this.notice) { this.notice.destroy(); this.notice = null; } }
    });
  }

  update() {
    let vx = 0;
    let vy = 0;

    const left = this.cursors.left.isDown || this.keys.A.isDown || this.touchState.left;
    const right = this.cursors.right.isDown || this.keys.D.isDown || this.touchState.right;
    const up = this.cursors.up.isDown || this.keys.W.isDown || this.touchState.up;
    const down = this.cursors.down.isDown || this.keys.S.isDown || this.touchState.down;

    if (!this.dialogueOpen && !this.policyOpen && !this.historyOpen) {
      if (left) vx -= 1;
      if (right) vx += 1;
      if (up) vy -= 1;
      if (down) vy += 1;
    }

    if (vx !== 0 && vy !== 0) {
      const norm = Math.SQRT1_2;
      vx *= norm;
      vy *= norm;
    }

    this.player.setVelocity(vx * this.speed, vy * this.speed);
    this.player.setDepth(this.player.y + 15);

    // A tiny walk bob creates life without needing sprite animation.
    if (vx !== 0 || vy !== 0) {
      this.player.setScale(1, 0.985 + Math.sin(this.time.now / 90) * 0.015);
    } else {
      this.player.setScale(1, 1);
    }

    this.nearResident = null;
    let nearestDistance = 99999;
    this.residents.forEach(r => {
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, r.x, r.y);
      if (d < 92 && d < nearestDistance) {
        nearestDistance = d;
        this.nearResident = r;
      }
    });

    this.interactButton.setText(this.nearResident ? `話す：${this.nearResident.residentData.name}` : '話す');

    if (Phaser.Input.Keyboard.JustDown(this.keys.E)) this.interact();
    if (Phaser.Input.Keyboard.JustDown(this.keys.H)) this.toggleHistory();
    if (Phaser.Input.Keyboard.JustDown(this.keys.P)) this.togglePolicy();
    if (Phaser.Input.Keyboard.JustDown(this.keys.B) && !this.state.schoolBuilt) this.startBuildMode();
  }
}

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 960,
  height: 540,
  backgroundColor: '#d6e8c6',
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
