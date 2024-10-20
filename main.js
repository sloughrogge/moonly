// main.js

// 引入 BootScene 和 MainScene
// 如果您使用模块化系统（如 ES6 模块），请通过 import 语句引入
// 例如：
//import BootScene from './BootScene.js';
//import MainScene from './MainScene.js';

// 这里假设 BootScene 和 MainScene 已在同一文件中定义，或者已正确导入

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,

    parent: 'game-container', // 确保您的 HTML 中有一个 id 为 'game-container' 的元素
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 600 }, // 全局重力
            debug: false
        }
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [BootScene, MainScene], // 按顺序添加场景，BootScene 先启动
};

const game = new Phaser.Game(config);
