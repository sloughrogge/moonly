// src/MainScene.js

class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    preload() {
        // 预加载所有音频资源
        //this.load.audio('backgroundMusic', 'assets/audio/bgm.mp3');
        this.load.audio('jumpSound', 'assets/audio/qitiao.mp3');
        this.load.audio('landSound', 'assets/audio/luodi.mp3');
        this.load.audio('clickDrawCard', 'assets/audio/chouka.mp3');
        this.load.audio('clickConfirm', 'assets/audio/queding.mp3');
        this.load.audio('consumeCard', 'assets/audio/xiaoshi.mp3');
        this.load.audio('gameOverSound', 'assets/audio/jieshu.mp3');

        this.load.image('background', 'assets/images/beijing.png'); // 新增
        this.load.image('topUI', 'assets/images/top.png'); // 顶部UI背景图片
        this.load.image('cardPack', 'assets/images/chouka.png'); // 抽卡包裹按钮
        this.load.image('card_right', 'assets/images/you3.png'); // 右跳卡牌
        this.load.image('card_left', 'assets/images/zuo2.png'); // 左跳卡牌
        this.load.image('ball', 'assets/images/oo.png');
        this.load.image('platform', 'assets/images/taban.png'); // 你的踏板图片
    }

    create() {
        const scene = this;

        // 创建音频对象
        scene.backgroundMusic = this.sound.add('backgroundMusic', { loop: true, volume: 0.5 });
        scene.jumpSound = this.sound.add('jumpSound', { volume: 1 });
        scene.landSound = this.sound.add('landSound', { volume: 1 });
        scene.clickDrawCardSound = this.sound.add('clickDrawCard', { volume: 1 });
        scene.clickConfirmSound = this.sound.add('clickConfirm', { volume: 1 });
        scene.consumeCardSound = this.sound.add('consumeCard', { volume: 1 });
        scene.gameOverSound = this.sound.add('gameOverSound', { volume: 1 });

        // 播放背景音乐
        //if (!scene.backgroundMusic.isPlaying) {
        //    scene.backgroundMusic.play();
        //}

        // 初始化游戏状态
        scene.score = 0;
        scene.jumpCards = [];
        scene.selectedCards = [];
        scene.isJumping = false;
        scene.drawCount = 0; // 每回合抽卡次数
        scene.currentLayer = 0; // 初始层级 (0-3)
        scene.currentRegion = Phaser.Math.Between(0, 2); // 随机选择初始区域，0: 左, 1: 中, 2: 右
        scene.layers = [150, 250, 350, 450]; // 四层，y坐标
        scene.regions = [133.33, 400, 666.67]; // 左、中、右三个区域的中心X坐标
        scene.platformsMap = []; // 数组形式：platformsMap[layer][region] = true/false
        scene.platformPositions = []; // 数组形式：platformPositions[layer][region] = platformSprite or null
        scene.targetPlatform = null;

        scene.fallStartY = null;
        scene.isFalling = false;
        scene.isGameOver = false; // 标记游戏是否结束

        // 初始化平台映射
        this.initializePlatformMappings();

        // 创建游戏区域
        this.createGameArea();

        // 创建UI
        this.createUI();

        // 创建小球，确保其位于随机区域的第一层踏板上
        //scene.ball = this.createBall(scene.regions[scene.currentRegion], scene.layers[scene.currentLayer] - 15 - 10);

        // 禁用小球与世界边界的左右碰撞，允许其移动出屏幕两侧
        scene.ball.setCollideWorldBounds(false);

        // 添加碰撞检测
        this.physics.add.collider(scene.ball, scene.platforms, this.hitPlatform, null, this);

        // 设置摄像机跟随小球
        this.cameras.main.startFollow(scene.ball, true, 0.05, 0.05);
        this.cameras.main.setBounds(0, 0, 800, this.layers[this.layers.length - 1] + 100);

        // 创建全屏黑色遮罩
        const fadeInMask = this.add.rectangle(400, 300, 800, 600, 0x000000).setDepth(1000);
        fadeInMask.setAlpha(1);

        // 添加淡入动画
        this.tweens.add({
            targets: fadeInMask,
            alpha: 0,
            duration: 1000,
            onComplete: () => {
                fadeInMask.destroy();
            }
        });
        //this.add.sprite(100, 100, 'card_left').setDisplaySize(600, 60);
        //this.add.sprite(220, 100, 'card_right').setDisplaySize(600, 60);
    }

    update() {
        const scene = this;

        // 监听小球是否超出屏幕边界，实现跨屏幕跳跃
        if (scene.ball.x < -50) {
            scene.ball.x = 800 + 50; // 从右侧重新出现
        } else if (scene.ball.x > 850) {
            scene.ball.x = -50; // 从左侧重新出现
        }

        // 循环背景
        // 假设背景图片高度为1200px
        if (scene.cameras.main.scrollY > scene.background1.y + 600) { // 600 = 1200 / 2
            scene.background1.y += 1200;
        }
        if (scene.cameras.main.scrollY > scene.background2.y + 600) {
            scene.background2.y += 1200;
        }
    }

    // 初始化平台映射
    initializePlatformMappings() {
        const scene = this;
        scene.platformsMap = [];
        scene.platformPositions = [];
        for (let layer = 0; layer < scene.layers.length; layer++) {
            scene.platformsMap[layer] = [false, false, false];
            scene.platformPositions[layer] = [null, null, null]; // 初始化为空
        }
    }

    // 创建游戏区域
    createGameArea() {
        const scene = this;
    
        // 添加背景图像
        scene.background1 = scene.add.image(400, 300, 'background')
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(-1);
        scene.background2 = scene.add.image(400, 900, 'background')
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(-1);
    
        // 定义中部区域的高度和顶部UI高度
        const middleHeight = 400;
        const topHeight = 100; // 与UI层的顶部高度一致
        const middleY = topHeight;
    
        // 绘制中部的十二个小方格，用于可视化
        const gridGraphics = scene.add.graphics();
        gridGraphics.lineStyle(2, 0x000000, 1);
    
        const boxWidth = 800 / 3; // 每个垂直区域的宽度
        const boxHeight = middleHeight / 4; // 每个层级的高度
    
        for (let layer = 0; layer < 4; layer++) {
            for (let region = 0; region < 3; region++) {
                const x = region * boxWidth;
                const y = middleY + layer * boxHeight;
                gridGraphics.strokeRect(x, y, boxWidth, boxHeight);
            }
        }
    
        // 创建平台组
        scene.platforms = scene.physics.add.staticGroup();
    
        // 遍历每一层，确保每层至少有一个平台
        for (let layer = 0; layer < scene.layers.length; layer++) {
            let requiredRegion;
    
            if (layer === 0) {
                // 第一层强制生成平台在当前区域，确保小球有平台
                requiredRegion = scene.currentRegion;
            } else {
                // 后续层根据上一层的平台生成一个相邻区域的平台
                const previousLayerPlatforms = scene.platformPositions[layer - 1]
                    .map((platform, index) => platform ? index : null)
                    .filter(index => index !== null);
    
                if (previousLayerPlatforms.length > 0) {
                    const previousRegion = Phaser.Utils.Array.GetRandom(previousLayerPlatforms);
                    requiredRegion = Phaser.Utils.Array.GetRandom(this.getAdjacentRegions(previousRegion));
                } else {
                    // 如果上一层没有平台，随机选择区域
                    requiredRegion = Phaser.Math.Between(0, 2);
                }
            }
    
            // 创建强制平台，确保该层至少有一个平台
            this.createPlatform(requiredRegion, layer, true);
    
            // 在剩余区域随机生成其他平台（非强制）
            const remainingRegions = [0, 1, 2].filter(region => region !== requiredRegion);
            remainingRegions.forEach(region => {
                if (Phaser.Math.FloatBetween(0, 1) < 0.5) {
                    this.createPlatform(region, layer);
                }
            });
        }
    
        // 将小球放置在第一层的一个平台上
        const firstLayerPlatform = scene.platformPositions[0][scene.currentRegion];
        scene.ball = this.createBall(firstLayerPlatform.x, scene.layers[0] - 25);
    }
    
    // 定义 getAdjacentRegions() 方法，确保它是类的一部分
    getAdjacentRegions(region) {
        if (region === 0) return [0, 1]; // 左侧只能选择左或中
        if (region === 1) return [0, 1, 2]; // 中间可以选择所有区域
        if (region === 2) return [1, 2]; // 右侧只能选择中或右
    }

    // 创建踏板函数
    createPlatform(region, layerIndex, forceCreate = false) {
        const scene = this;
        const y = scene.layers[layerIndex];

        // 决定是否创建平台
        let hasPlatform = forceCreate ? true : (layerIndex === 0 ? true : Phaser.Math.Between(0, 1) === 1);
        if (hasPlatform) {
            // 使用统一的平台纹理，避免重复生成
            /*if (!scene.textures.exists('platformTexture')) {
                const platformGraphics = scene.add.graphics();
                platformGraphics.fillStyle(0x0000ff, 1); // 蓝色
                platformGraphics.fillRoundedRect(0, 0, 100, 20, 5); // 宽100px，高20px，圆角半径5
                platformGraphics.generateTexture('platformTexture', 100, 20);
                platformGraphics.destroy();
            }*/

            const platformSprite = scene.physics.add.staticSprite(scene.regions[region], y + 10, 'platform').setDepth(0);

            // 可选：调整踏板的大小以适应游戏需求
            platformSprite.setDisplaySize(100, 30); // 根据踏板图片的实际尺寸进行调整

            scene.platforms.add(platformSprite);

            // 更新平台映射，存储平台精灵引用
            scene.platformsMap[layerIndex][region] = true;
            scene.platformPositions[layerIndex][region] = platformSprite;
        } else {
            scene.platformPositions[layerIndex][region] = null; // 没有踏板的位置设置为 null
        }
    }

    // 创建小球函数
    createBall(x, y) {
        const scene = this;

        // 使用统一的小球纹理，避免重复生成
        /*if (!scene.textures.exists('ballTexture')) {
            const ballGraphics = scene.add.graphics();
            ballGraphics.fillStyle(0xffa500, 1); // 橙色
            ballGraphics.fillCircle(15, 15, 15); // 减小小球直径
            ballGraphics.generateTexture('ballTexture', 30, 30); // 调整纹理大小
            ballGraphics.destroy();
        }*/

        // 使用预加载的小球图片
        const ballSprite = scene.physics.add.sprite(x, y, 'ball');
        ballSprite.setBounce(0); // 无弹性
        ballSprite.setDisplaySize(30, 30); // 根据需要调整大小
        ballSprite.body.setGravityY(600); // 设置重力

        

        return ballSprite;
    }

    // 创建UI函数
    createUI() {
        const scene = this;

        // 创建UI容器
        const uiContainer = scene.add.container(0, 0);
        uiContainer.setScrollFactor(0); // 确保UI容器固定不随摄像机移动


        // 创建重新开始按钮
        this.createRestartButton(uiContainer);

        // 创建顶部得分显示区域
        this.createTopScoreArea(uiContainer);

        // 创建抽卡包裹按钮
        this.createCardPack(700, 550, uiContainer); // 右下角

        // 创建确认按钮
        this.createConfirmButton(550, 550, uiContainer); // 左侧

    }

    // 创建重新开始按钮
    createRestartButton(uiContainer) {
        const scene = this;
        const restartButtonWidth = 120;
        const restartButtonHeight = 40;
        const restartButtonX = 650;
        const restartButtonY = 50;

        // 使用统一的重启按钮纹理，避免重复生成
        if (!scene.textures.exists('restartButton')) {
            const restartGraphics = scene.add.graphics();
            restartGraphics.fillStyle(0x8b0000, 1); // 红色
            restartGraphics.fillRoundedRect(0, 0, restartButtonWidth, restartButtonHeight, 10);
            restartGraphics.generateTexture('restartButton', restartButtonWidth, restartButtonHeight);
            restartGraphics.destroy();
            console.log('Restart button texture generated.');
        }

        const restartBtn = scene.add.sprite(restartButtonX, restartButtonY, 'restartButton')
            .setInteractive({ useHandCursor: true })
            .setName('restartButton')
            .setDepth(50)
            .setScrollFactor(0) // 固定位置
            .setOrigin(0.5); // 设置锚点为中心

        const restartText = scene.add.text(restartButtonX, restartButtonY, '重新开始', {
            fontSize: '20px',
            fill: '#fff',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(51)
            .setScrollFactor(0); // 固定位置

        restartBtn.on('pointerdown', () => {
            scene.scene.restart();
            console.log('游戏重新开始');
        });

        restartBtn.on('pointerover', () => {
            restartBtn.setTint(0xffff00);
        });

        restartBtn.on('pointerout', () => {
            restartBtn.clearTint();
        });

        // 直接添加到场景，而不是UI容器
        scene.add.existing(restartBtn);
        scene.add.existing(restartText);
        // 添加到UI容器
        //uiContainer.add([restartBtn, restartText]);
    }

    // 创建顶部得分显示区域
    
    createTopScoreArea(uiContainer) {
        const scene = this;
        const topHeight = 100;
        const topAreaX = 400; // 中心X坐标
        const topAreaY = topHeight / 2; // 中心Y坐标

        // 添加顶部背景图片
        const topArea = scene.add.sprite(topAreaX, topAreaY, 'topUI')
            .setOrigin(0.5)
            .setDepth(0)
            .setScrollFactor(0); // 固定位置

        // 添加得分文本
        scene.scoreText = scene.add.text(20, 50, '分数: 0', {
            fontSize: '30px',
            fill: '#f5f5dc',
            fontStyle: 'bold'
        })
            .setOrigin(0, 0.5) // 左对齐，垂直居中
            .setDepth(1)
            .setScrollFactor(0); // 固定位置

        // 添加到UI容器
        uiContainer.add([topArea, scene.scoreText]);
    }


    // 创建抽卡包裹按钮
    createCardPack(x, y, uiContainer) {
        const scene = this;
        const packWidth = 110;
        const packHeight = 80;

        // 使用统一的卡包纹理，避免重复生成
        /*if (!scene.textures.exists('cardPack')) {
            const packGraphics = scene.add.graphics();
            packGraphics.fillStyle(0x8B4513, 1); // 棕色
            packGraphics.fillRoundedRect(0, 0, packWidth, packHeight, 10);
            packGraphics.generateTexture('cardPack', packWidth, packHeight);
            packGraphics.destroy();
        }*/

        // 使用加载的“cardPack”图像
        const cardPack = scene.add.sprite(x, y, 'cardPack')
            .setInteractive({ useHandCursor: true })
            .setName('cardPack')
            .setDepth(2)
            .setScrollFactor(0) // 固定位置
            .setDisplaySize(packWidth, packHeight); // 确保显示尺寸为60x60


        // 创建框线（Rectangle Frame）
        const frame = scene.add.graphics();
        frame.lineStyle(4, 0xFFF4E0, 1); // 边框厚度4，颜色#FFF4E0
        frame.strokeRect(
            x - packWidth / 2 - 5, // 左上角X
            y - packHeight / 2 - 5, // 左上角Y
        packWidth + 10, // 宽度
        packHeight + 10 // 高度
        );
        frame.setVisible(false); // 初始不可见
        frame.setDepth(3); // 确保高于cardPack

        

        // 创建发光效果（Glow Effect） - 使用圆形渐变模拟柔和发光
        const glow = scene.add.graphics();
        const glowColor = 0xFFF4E0;
        const glowAlphaBase = 0.2; // 基础透明度
        const glowSteps = 5; // 发光层数
        const glowIncrement = 10; // 每层增加的半径

        for (let i = 1; i <= glowSteps; i++) {
            const alpha = glowAlphaBase / glowSteps;
            glow.fillStyle(glowColor, alpha);
            glow.fillCircle(x, y, (packWidth / 2) + i * glowIncrement);
        }
        glow.setVisible(false); // 初始不可见
        glow.setDepth(2); // 确保低于框线


        // 创建“抽卡”文字
        const cardText = scene.add.text(x, y, '抽卡', {
            fontSize: '20px',
            fill: '#FFF4E0',
            fontStyle: 'bold'
        })
            .setOrigin(0.5)
            .setDepth(3)
            .setScrollFactor(0) // 固定位置
            .setVisible(false); // 初始不可见


        // 添加交互事件
        cardPack.on('pointerover', () => {
            frame.setVisible(true);
            glow.setVisible(true);
            cardText.setVisible(true);

            // 添加发光动画（简单的淡入淡出）
            scene.tweens.add({
                targets: glow,
                alpha: 0.3,
                duration: 500,
                yoyo: true,
                repeat: -1
            });

            // 或者更复杂的发光动画，可以根据需要调整
        });

        cardPack.on('pointerout', () => {
            frame.setVisible(false);
            glow.setVisible(false);
            cardText.setVisible(false);

            // 停止发光动画
            scene.tweens.killTweensOf(glow);
            glow.setAlpha(glowAlphaBase); // 重置透明度
    });


            // 点击事件保持不变
            cardPack.on('pointerdown', () => {
                if (scene.isJumping) {
                    console.log('小球正在跳跃，无法抽卡。');
                    scene.showTemporaryMessage('小球正在跳跃，无法抽卡。');
                    return;
                }

                // 播放点击抽卡音乐
                scene.clickDrawCardSound.play();

                // 添加缩放动画（可选）
                scene.tweens.add({
                    targets: cardPack,
                    scaleX: 1.02,
                    scaleY: 1.02,
                    duration: 100,
                    yoyo: true,
                    onComplete: () => {
                        if (scene.drawCount < 3 && scene.jumpCards.length < 3) {
                            scene.drawCard();
                            scene.drawCount++;
                            console.log(`抽卡次数: ${scene.drawCount}`);
                        } else {
                            console.log('已经抽取了三张卡牌，无法再抽取。');
                            scene.showTemporaryMessage('每回合最多抽取三张卡牌！');
                        }
                    }
                });
            });

        cardPack.on('pointerover', () => {
            //cardPack.setTint(0xffff00);
        });

        cardPack.on('pointerout', () => {
            cardPack.clearTint();
        });

        // 添加到UI容器
        uiContainer.add([cardPack, cardText]);
    }

    // 创建确认按钮函数
    createConfirmButton(x, y, uiContainer) {
        const scene = this;
        const buttonWidth = 100;
        const buttonHeight = 60;

        // 使用统一的确认按钮纹理，避免重复生成
        if (!scene.textures.exists('confirmButton')) {
            const confirmGraphics = scene.add.graphics();
            confirmGraphics.fillStyle(0xFFA500, 1); // 绿色
            confirmGraphics.fillRoundedRect(0, 0, buttonWidth, buttonHeight, 10);
            confirmGraphics.generateTexture('confirmButton', buttonWidth, buttonHeight);
            confirmGraphics.destroy();
        }

        const confirmButton = scene.add.sprite(x, y, 'confirmButton')
            .setInteractive({ useHandCursor: true })
            .setName('confirmButton')
            .setDepth(1)
            .setScrollFactor(0); // 固定位置

        const confirmText = scene.add.text(x, y, '确定', {
            fontSize: '24px',
            fill: '#fff',
            fontStyle: 'bold'
        })
            .setOrigin(0.5)
            .setDepth(2)
            .setScrollFactor(0); // 固定位置

        confirmButton.on('pointerdown', () => {
            if (scene.isJumping) {
                console.log('小球正在跳跃，请稍后再试。');
                scene.showTemporaryMessage('小球正在跳跃，请稍后再试。');
                return;
            }

            // 播放点击确定音乐
            scene.clickConfirmSound.play();

            if (scene.jumpCards.length === 0) {
                console.log('没有选择任何卡牌。');
                scene.showTemporaryMessage('没有选择任何卡牌。');
                return;
            }

            scene.executeNextJump();
        });

        confirmButton.on('pointerover', () => {
            confirmButton.setTint(0xFFB347);
        });

        confirmButton.on('pointerout', () => {
            confirmButton.clearTint(0xFFA500);
        });

        confirmButton.setVisible(false); // 初始时不可见，只有有卡牌时才显示

        // 添加到UI容器
        uiContainer.add([confirmButton, confirmText]);

        // 将确认按钮存储在场景中，以便后续访问
        scene.confirmButton = confirmButton;
    }

    

    // 抽取一张卡牌
    drawCard() {
        const scene = this;
        const cardType = Phaser.Math.Between(0, 1) === 0 ? '左跳' : '右跳';
        scene.jumpCards.push(cardType);
        console.log(`抽取卡牌: ${cardType}, 当前卡牌数量: ${scene.jumpCards.length}`);
        scene.updateCardsDisplay();
    }

    // 显示临时消息函数
    showTemporaryMessage(message) {
        const scene = this;
        const messageText = scene.add.text(400, 100, message, {
            fontSize: '24px',
            fill: '#ff0000',
            backgroundColor: '#ffffff',
            padding: { x: 10, y: 10 },
            borderRadius: 5
        })
            .setOrigin(0.5)
            .setDepth(4)
            .setScrollFactor(0); // 固定位置

        scene.time.delayedCall(2000, () => {
            messageText.destroy();
        });
    }

    // 显示当前卡牌
    updateCardsDisplay() {
        const scene = this;

        // 清除之前的卡牌显示（包括卡牌和卡牌文字）
        scene.children.list.filter(child => child.name && (child.name.startsWith('card_') || child.name.startsWith('cardLabel_'))).forEach(child => child.destroy());

        const cardPositions = [
            { x: 100, y: 550 },
            { x: 220, y: 550 },
            { x: 340, y: 550 }
        ];

        
        scene.jumpCards.forEach((card, index) => {
            if (index >= 3) return; // 限制最多显示三张卡牌

            const cardType = card;
            const cardX = cardPositions[index].x;
            const cardY = cardPositions[index].y;
            const cardKey = cardType === '左跳' ? 'card_left' : 'card_right';
            
            // 检查是否加载了对应的卡牌图片
            if (!scene.textures.exists(cardKey)) {
                console.error(`卡牌纹理 "${cardKey}" 未加载！请确保在 preload 方法中正确加载了该纹理。`);
                return;
            }
            // 添加卡牌精灵
            const cardSprite = scene.add.sprite(cardX, cardY, cardKey)
                .setInteractive({ useHandCursor: true })
                .setName(`card_${index}`)
                .setDepth(0)
                .setScrollFactor(0) // 固定位置
                .setDisplaySize(100, 105); // 根据需要调整尺寸


            /*const cardLabel = scene.add.text(cardX, cardY, cardText, {
                fontSize: '18px',
                fill: '#fff',
                fontStyle: 'bold'
            })
                .setOrigin(0.5)
                .setDepth(1)
                .setName(`cardLabel_${index}`)
                .setScrollFactor(0); // 固定位置*/

            cardSprite.on('pointerdown', () => {
                if (scene.isJumping) {
                    console.log('小球正在跳跃，请稍后再试。');
                    scene.showTemporaryMessage('小球正在跳跃，请稍后再试。');
                    return;
                }

                if (!scene.selectedCards.includes(index)) {
                    scene.selectedCards.push(index);
                    scene.highlightCard(index);
                    if (scene.selectedCards.length === 2) {
                        const first = scene.selectedCards[0];
                        const second = scene.selectedCards[1];
                        [scene.jumpCards[first], scene.jumpCards[second]] = [scene.jumpCards[second], scene.jumpCards[first]];
                        scene.selectedCards = [];
                        scene.updateCardsDisplay();

                        // 播放消耗卡牌音乐
                        scene.consumeCardSound.play();
                    }
                }
            });
        });

        // 控制确认按钮的可见性
        if (scene.jumpCards.length > 0) {
            scene.confirmButton.setVisible(true);
        } else {
            scene.confirmButton.setVisible(false);
        }
    }

    // 高亮选中的卡牌
    highlightCard(index) {
        const scene = this;
        const cardSprite = scene.children.list.find(child => child.name === `card_${index}`);
        if (cardSprite) {
            // 添加边框颜色变化效果
            scene.tweens.add({
                targets: cardSprite,
                tint: 0xffff00, // 黄色
                duration: 200,
                yoyo: true,
                repeat: 1
            });
        }
    }

    hasAnyPlatformInRemainingLayers(startLayer) {
        const scene = this;
    
        // 从指定层开始，检查每一层是否有平台
        for (let layer = startLayer; layer < scene.layers.length; layer++) {
            if (scene.platformsMap[layer].some(platform => platform === true)) {
                return true; // 至少有一个平台，返回 true
            }
        }
        return false; // 所有剩余层都没有平台
    }

    // 执行下一个跳跃函数
    executeNextJump() {
        const scene = this;

        if (scene.jumpCards.length === 0) {
            scene.isJumping = false;
            scene.drawCount = 0; // 重置抽卡次数
            console.log('所有卡牌跳跃完成。');
            return;
        }

        const card = scene.jumpCards[0]; // 获取第一张卡牌
        let targetRegion;
        let targetLayer = scene.currentLayer + 1; // 每次跳跃到下一层，层数加一

        // 确定跳跃方向和目标区域
        if (card === '左跳') {
            targetRegion = scene.currentRegion - 1;
            if (targetRegion < 0) {
                targetRegion = 2; // 超出左边界则循环到右侧
            }
        } else if (card === '右跳') {
            targetRegion = scene.currentRegion + 1;
            if (targetRegion > 2) {
                targetRegion = 0; // 超出右边界则循环到左侧
            }
        }

        console.log(`当前区域: ${scene.currentRegion}, 卡牌: ${card}, 目标区域: ${targetRegion}`);

         // 检查目标区域是否有平台
        //const hasPlatform = scene.platformsMap[targetLayer] &&scene.platformsMap[targetLayer][targetRegion];
        // 查找目标区域是否有踏板
        const hasPlatform = scene.platformsMap[targetLayer] && scene.platformsMap[targetLayer][targetRegion];
        // 检查目标层及之后所有层是否没有平台
        if (!hasPlatform && !this.hasAnyPlatformInRemainingLayers(targetLayer)) {
            console.log('小球跳到一个无平台的层，且后续层也无平台，游戏结束。');
            scene.gameOver();
            return;
            }

        // 检查是否需要跨屏跳跃
        let isCrossScreen = false;
        if ((scene.currentRegion === 0 && card === '左跳') || (scene.currentRegion === 2 && card === '右跳')) {
            isCrossScreen = true;
        }

        

        console.log(`目标层级 ${targetLayer} 的区域 ${targetRegion} 是否有平台: ${hasPlatform}`);

        // 检查第四层无踏板的情况
        if (targetLayer === 3 && !hasPlatform) {
            // 第四层没有踏板，游戏结束
            console.log('小球跳到第四层，没有踏板，游戏结束。');
            scene.gameOver();
            return;
        }

        // 无论是否有踏板，都执行相同的跳跃动画
        const targetX = scene.regions[targetRegion];
        const targetY = scene.layers[targetLayer];
        const startX = scene.ball.x;
        const startY = scene.ball.y;

        let controlPoints;

        if (isCrossScreen) {
            // 跨屏跳跃，需要调整动画
            let adjustedStartX = startX;
            let adjustedTargetX = targetX;

            if (card === '左跳') {
                // 从左侧跳出，右侧进入
                adjustedTargetX = targetX - 800; // 目标位置向右偏移800像素
            } else if (card === '右跳') {
                // 从右侧跳出，左侧进入
                adjustedTargetX = targetX + 800; // 目标位置向左偏移800像素
            }

            controlPoints = [
                { x: adjustedStartX, y: startY }, // 起点
                { x: (adjustedStartX + adjustedTargetX) / 2, y: startY - 50 }, // 控制点
                { x: adjustedTargetX, y: targetY - scene.ball.displayHeight / 2 - 10 } // 终点
            ];
        } else {
            // 普通跳跃
            controlPoints = [
                { x: startX, y: startY }, // 起点
                { x: (startX + targetX) / 2, y: startY - 50 }, // 控制点
                { x: targetX, y: targetY - scene.ball.displayHeight / 2 - 10 } // 终点
            ];
        }

        scene.isJumping = true; // 设置跳跃状态

        // 播放起跳音乐
        scene.jumpSound.play();

        // 禁用小球的物理效果
        scene.ball.body.setAllowGravity(false);
        scene.ball.body.setVelocity(0);

        // 创建自定义路径
        const curve = new Phaser.Curves.Spline(controlPoints);

        // 创建 tween
        scene.tweens.addCounter({
            from: 0,
            to: 1,
            duration: 1000,
            onUpdate: (tween) => {
                const t = tween.getValue();
                let position = curve.getPoint(t);

                // 如果是跨屏跳跃，处理 x 坐标的取模运算
                if (isCrossScreen) {
                    position.x = ((position.x % 800) + 800) % 800; // 确保 x 坐标在 0 到 800 之间
                }

                scene.ball.setPosition(position.x, position.y);
            },
            onComplete: () => {
                // 恢复小球的物理效果
                scene.ball.body.setAllowGravity(true);

                if (isCrossScreen) {
                    // 跨屏跳跃结束后，调整小球的 x 坐标到目标区域的正确位置
                    scene.ball.x = targetX;
                }

                if (hasPlatform) {
                    console.log(`小球成功到达目标区域 ${targetLayer} 层的踏板`);

                    // 更新小球的状态
                    scene.currentLayer = targetLayer; // 更新当前层级
                    scene.currentRegion = targetRegion; // 更新当前区域
                    scene.score += 1; // 更新得分
                    scene.scoreText.setText(`分数: ${scene.score}`);

                    // 检查是否在第四层
                    if (scene.currentLayer === 3) { // 第四层的索引为3
                        // 执行层级更新和踏板生成
                        scene.handleLayerUpdate();
                    }
                    // 播放消耗卡牌音乐
                    scene.consumeCardSound.play();
                    // 移除已执行的卡牌
                    scene.jumpCards.shift();
                    scene.updateCardsDisplay();

                    // 延迟0.5秒后继续执行下一次跳跃
                    scene.time.delayedCall(500, () => {
                        scene.executeNextJump();
                    });
                } else {
                    // 没有平台，开始下落
                    console.log('目标位置没有踏板，小球开始下落。');

                    // 更新小球的状态
                    scene.currentLayer = targetLayer; // 更新当前层级
                    scene.currentRegion = targetRegion; // 更新当前区域
                    // 播放消耗卡牌音乐
                    scene.consumeCardSound.play();
                    // 移除已执行的卡牌
                    scene.jumpCards.shift();
                    scene.updateCardsDisplay();

                    // 延迟0.5秒后继续执行下一次跳跃
                    scene.time.delayedCall(500, () => {
                        scene.executeNextJump();
                    });
                }

                // 恢复跳跃状态
                scene.isJumping = false;
                scene.targetPlatform = null;
            }
        });
    }

    // 游戏结束函数
    gameOver() {
        const scene = this;

        // 防止重复触发游戏结束
        if (scene.isGameOver) return;
        scene.isGameOver = true;

        // 播放游戏结束音乐
        scene.gameOverSound.play();

        // 暂停小球的物理运动
        scene.ball.body.setVelocity(0);
        scene.ball.body.setAllowGravity(false);

        // 创建游戏结束界面容器
        const gameOverContainer = scene.add.container(0, 0).setDepth(1000);
        gameOverContainer.setScrollFactor(0); // 确保界面固定在屏幕上

        // 创建半透明背景
        const bg = scene.add.rectangle(400, 300, 800, 600, 0x000000, 0.7);
        gameOverContainer.add(bg);

        // 添加“游戏结束”文本
        const gameOverText = scene.add.text(400, 200, '游戏结束', {
            fontSize: '64px',
            fill: '#ffffff'
        }).setOrigin(0.5);
        gameOverContainer.add(gameOverText);

        // 显示最终得分
        const scoreText = scene.add.text(400, 300, `您的得分：${scene.score}`, {
            fontSize: '32px',
            fill: '#ffffff'
        }).setOrigin(0.5);
        gameOverContainer.add(scoreText);

        // 创建“重新开始”按钮
        const restartButton = scene.add.rectangle(400, 400, 200, 50, 0xff8c00)
            .setInteractive({ useHandCursor: true });
        const restartText = scene.add.text(400, 400, '重新开始', {
            fontSize: '24px',
            fill: '#ffffff'
        }).setOrigin(0.5);
        gameOverContainer.add(restartButton);
        gameOverContainer.add(restartText);

        // 添加按钮交互效果
        restartButton.on('pointerover', () => {
            restartButton.setFillStyle(0x800000); // 橙色
        });
        restartButton.on('pointerout', () => {
            restartButton.setFillStyle(0x8b0000); // 红色
        });

        // 添加点击事件
        restartButton.on('pointerdown', () => {
            // 重新开始游戏
            scene.scene.restart();
        });
    }

    // 层级更新函数
    handleLayerUpdate() {
        const scene = this;

        // 1. 删除最上方的三层踏板和层级数据
        for (let i = 0; i < 3; i++) {
            // 删除该层的踏板
            for (let region = 0; region < scene.regions.length; region++) {
                const platform = scene.platformPositions[i][region];
                if (platform) {
                    platform.destroy(); // 销毁踏板对象
                }
            }
        }

        // 从层级数组中移除前三层
        scene.layers.splice(0, 3);

        // 从平台映射中移除前三层的数据
        scene.platformsMap.splice(0, 3);
        scene.platformPositions.splice(0, 3);

        // 2. 上移剩余的踏板和小球
        const shiftY = 3 * 100; // 每层高度为100像素，总共上移300像素
        scene.ball.y -= shiftY;

        // 重置小球的物理身体
        scene.ball.body.reset(scene.ball.x, scene.ball.y);
        scene.ball.body.setVelocity(0); // 确保速度为零

        for (let layerIndex = 0; layerIndex < scene.layers.length; layerIndex++) {
            for (let region = 0; region < scene.regions.length; region++) {
                const platform = scene.platformPositions[layerIndex][region];
                if (platform) {
                    platform.y -= shiftY;
                    platform.refreshBody(); // 刷新踏板的物理身体
                }
            }
            // 更新层级的 Y 坐标
            scene.layers[layerIndex] -= shiftY;
        }

        // 3. 更新层级数组，添加新的三层
        for (let i = 1; i <= 3; i++) {
            const newLayerY = scene.layers[scene.layers.length - 1] + 100; // 新层的Y坐标
            scene.layers.push(newLayerY);

            // 初始化平台映射
            scene.platformsMap.push([false, false, false]);
            scene.platformPositions.push([null, null, null]);

            const newLayerIndex = scene.layers.length - 1;

            // 为新层生成踏板
            for (let region = 0; region < scene.regions.length; region++) {
                scene.createPlatform(region, newLayerIndex);
            }
        }

        // 4. 更新当前层级为第一层
        scene.currentLayer = 0;

        // 5. 调整摄像机的 scrollY
        scene.cameras.main.scrollY -= shiftY;
    }

    // 获取层级根据 Y 坐标
    getLayerByY(y) {
        const scene = this;
        for (let layer = 0; layer < scene.layers.length; layer++) {
            if (y <= scene.layers[layer] + 20) { // 20 是踏板的偏移量
                return layer;
            }
        }
        return scene.layers.length - 1;
    }

    // 获取区域根据 X 坐标
    getRegionByX(x) {
        const scene = this;
        if (x < scene.regions[0] + 50) {
            return 0; // 左
        } else if (x < scene.regions[1] + 50) {
            return 1; // 中
        } else {
            return 2; // 右
        }
    }

    // 碰撞回调函数
    hitPlatform(ballSprite, platform) {
        const scene = this;

        

        if (scene.isJumping && platform === scene.targetPlatform) {
            // 播放下落踏板音乐
            scene.landSound.play();
            
            // 停止小球的垂直和水平速度
            ballSprite.body.setVelocityX(0);
            ballSprite.body.setVelocityY(0);
            ballSprite.body.gravity.y = 600; // 恢复重力

            // 将小球位置调整到踏板上方
            ballSprite.setPosition(platform.x, platform.y - ballSprite.displayHeight / 2 - 10); // 10px为小球与踏板的间距

            // 更新当前层级和区域
            scene.currentLayer = scene.getLayerByY(platform.y);
            scene.currentRegion = scene.getRegionByX(platform.x);

            // 增加得分
            scene.score += 1;
            scene.scoreText.setText(`分数: ${scene.score}`);

            // 踏板闪烁效果
            scene.tweens.add({
                targets: platform,
                alpha: 0.5,
                yoyo: true,
                repeat: 3,
                duration: 200
            });

            // 移除已执行的卡牌
            scene.jumpCards.shift();
            scene.updateCardsDisplay();

            // 延迟0.5秒后执行下一张卡牌
            scene.time.delayedCall(500, () => {
                scene.executeNextJump();
            });

            // 恢复跳跃状态
            scene.isJumping = false;
            scene.targetPlatform = null;
        }
    }
}

//export default MainScene;
