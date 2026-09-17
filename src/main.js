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
    this.cameras.main.setZoom(1.15);

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

    // Old school stays as the starting settlement school.
    this.makeSchool(770, 290, '小さな学校');

    if (this.state.schoolBuilt) {
      this.makeSchool(1080, 520, '新しい学校');
    }

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

    // Small flowers / life
    for (let i = 0; i < 38; i++) {
      const x = 80 + (i * 137) % 1420;
      const y = 150 + (i * 83) % 500;
      this.add.circle(x, y, 3, [0xffffff, 0xf2c4d0, 0xf5db8c][i % 3], 0.85);
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

  makeSchool(x, y, label = '学校') {
    const g = this.add.graphics();
    g.fillStyle(0xf2e7c6, 1);
    g.fillRoundedRect(x, y, 210, 120, 10);
    g.fillStyle(0xb56f58, 1);
    g.fillTriangle(x - 8, y + 8, x + 105, y - 48, x + 218, y + 8);
    g.fillStyle(0x8fc1d7, 1);
    for (let i = 0; i < 4; i++) {
      g.fillRect(x + 24 + i * 45, y + 35, 28, 32);
    }
    this.add.text(x + 42, y + 80, label, {
      fontFamily: 'system-ui',
      fontSize: '21px',
      color: '#5d5a4f'
    });
  }

  makeTreeCluster(x, y) {
    const g = this.add.graphics();
    const offsets = [[0,0],[60,-20],[105,35],[30,70],[95,95],[150,60]];
    offsets.forEach(([dx, dy], i) => {
      g.fillStyle(0x765b43, 1);
      g.fillRect(x + dx + 15, y + dy + 40, 12, 36);
      g.fillStyle(i % 2 ? 0x6fa765 : 0x79ae6f, 1);
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
      {
        x: 520, y: 430, name: 'ミナ', role: '子ども', color: 0xe7a6a1,
        lines: [
          '学校まで、ちょっと遠いんだ。',
          '川の近くを通る道は好き。でも雨の日は大変。'
        ]
      },
      {
        x: 930, y: 430, name: 'トオル', role: '店主', color: 0x8db9a7,
        lines: [
          '最近、この辺りにも家が増えてきたよ。',
          '学校が近くにできたら、人通りも変わりそうだね。'
        ]
      },
      {
        x: 845, y: 610, name: 'ルカ', role: '川辺で働く人', color: 0xd8b46f,
        lines: [
          'この川は町の大事な場所なんだ。',
          '便利になるのはうれしいけど、川の景色も残したいな。'
        ]
      }
    ];

    this.residents = residents.map((resident, index) => {
      const circle = this.add.circle(resident.x, resident.y, 18, resident.color);
      circle.residentData = resident;
      this.add.text(resident.x - 38, resident.y + 25, `${resident.name}\n${resident.role}`, {
        fontFamily: 'system-ui',
        fontSize: '14px',
        align: 'center',
        color: '#405047',
        backgroundColor: '#ffffffcc',
        padding: { x: 5, y: 3 }
      }).setOrigin(0.5, 0);

      this.tweens.add({
        targets: circle,
        y: resident.y - 6,
        duration: 1300 + index * 200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut'
      });

      return circle;
    });
  }

  createControls() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D,E,H,P,B');

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
        .setDepth(30)
        .setInteractive();
      const txt = this.add.text(x, y, label, {
        fontSize: '30px', color: '#41564a'
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
      backgroundColor: '#ffffffdd',
      padding: { x: 12, y: 8 }
    }).setScrollFactor(0).setDepth(40);

    this.moneyText = this.add.text(20, 62, '', {
      fontFamily: 'system-ui',
      fontSize: '16px',
      color: '#4e6356',
      backgroundColor: '#ffffffc9',
      padding: { x: 10, y: 6 }
    }).setScrollFactor(0).setDepth(40);

    this.goalText = this.add.text(20, 100, '', {
      fontFamily: 'system-ui',
      fontSize: '15px',
      color: '#4e6356',
      backgroundColor: '#ffffffb8',
      padding: { x: 10, y: 6 }
    }).setScrollFactor(0).setDepth(40);

    this.interactButton = this.add.text(0, 0, '話す', {
      fontFamily: 'system-ui', fontSize: '22px', color: '#ffffff',
      backgroundColor: '#567a63', padding: { x: 18, y: 12 }
    }).setOrigin(1, 1).setScrollFactor(0).setDepth(45).setInteractive();
    this.interactButton.on('pointerdown', () => this.interact());

    this.menuButtons = [];
    const menu = [
      ['方針', () => this.togglePolicy()],
      ['歴史', () => this.toggleHistory()]
    ];
    menu.forEach(([label, cb], i) => {
      const b = this.add.text(0, 0, label, {
        fontFamily: 'system-ui', fontSize: '16px', color: '#3e5547',
        backgroundColor: '#ffffffdc', padding: { x: 11, y: 8 }
      }).setOrigin(1, 0).setScrollFactor(0).setDepth(45).setInteractive();
      b.on('pointerdown', cb);
      this.menuButtons.push(b);
    });

    const reposition = () => {
      this.interactButton.setPosition(this.scale.width - 22, this.scale.height - 24);
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
    this.dialogueBg = this.add.rectangle(0, 0, 10, 10, 0xffffff, 0.96)
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
      const y = this.scale.height - h / 2 - 20;
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
      backgroundColor: '#ffffffdd', padding: { x: 10, y: 7 }
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
    const panel = this.add.rectangle(0, 0, 420, 460, 0xffffff, 0.97)
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

    // Small state-driven events.
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
      backgroundColor: '#fffbe9ee', padding: { x: 16, y: 9 }
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
