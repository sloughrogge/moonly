//BootScene.js

class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // 预加载开始页面图片
        this.load.image('startScreen', 'assets/images/kaichang.png');

        // 预加载按钮图片（如果使用）
        // this.load.image('startButton', 'assets/images/startButton.png');

        // 继续预加载其他资源（如音频、游戏图像等）
        this.load.audio('backgroundMusic', 'assets/audio/bgm.mp3');
        this.load.audio('jumpSound', 'assets/audio/qitiao.mp3');
        this.load.audio('landSound', 'assets/audio/luodi.mp3');
        this.load.audio('clickDrawCard', 'assets/audio/chouka.mp3');
        this.load.audio('clickConfirm', 'assets/audio/queding.mp3');
        this.load.audio('consumeCard', 'assets/audio/xiaoshi.mp3');
        this.load.audio('gameOverSound', 'assets/audio/jieshu.mp3');

        // 预加载其他游戏所需资源
    }

    create() {
        const { width, height } = this.scale;
        this.backgroundMusic = this.sound.add('backgroundMusic', { loop: true, volume: 0.2, autoDestroy: false });


        // 添加开始页面图片
        const startImage = this.add.image(width / 2, height / 2, 'startScreen');

        // 添加标题文本“哞哞橙汁店”
        const titleText = this.add.text(width / 2 - 60, height / 2 - (startImage.displayHeight / 2) + 370, '哞哞橙汁店', {
            fontSize: `${height * 0.08}px`, // 根据屏幕高度调整字体大小
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5)
          .setDepth(50);

        // 根据屏幕大小调整图片缩放
        const scaleX = width / startImage.width;
        const scaleY = height / startImage.height;
        const scale = Math.min(scaleX, scaleY);
        startImage.setScale(scale);

        // 添加“开始游戏”按钮
        const buttonWidth = width * 0.3; // 30% 屏幕宽度
        const buttonHeight = height * 0.1; // 10% 屏幕高度
        const buttonX = width / 2;
        const buttonY = height / 2 + (startImage.displayHeight / 2) - 100; // 调整按钮Y坐标


        // 创建按钮背景（矩形）
        const button = this.add.rectangle(buttonX, buttonY, buttonWidth, buttonHeight, 0x8B4513)
            .setInteractive({ useHandCursor: true })
            .setDepth(1); // 确保按钮在图片上方


        // 添加按钮文本
        const buttonText = this.add.text(buttonX, buttonY, '开始游戏', {
            fontSize: `${buttonHeight * 0.5}px`, // 按钮高度的50%
            fill: '#ffffff'
        }).setOrigin(0.5)
          .setDepth(10);

        // 按钮交互效果
        button.on('pointerover', () => {
            button.setFillStyle(0xA0522D, 0.8); // 高亮效果
        });

        button.on('pointerout', () => {
            button.setFillStyle(0x8B4513, 1);
        });

        // 按钮点击事件
        button.on('pointerdown', () => {
            if (!this.backgroundMusic.isPlaying) {
                this.backgroundMusic.play();
            }
            this.scene.start('MainScene');
        });
        
    }
}

//export default BootScene;
