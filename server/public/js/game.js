/** @type {import('../../../typings/phaser')} */

var config = {
  type: Phaser.AUTO,
  parent: 'phaser-example',
  width: 1000,
  height: 600,
  scale: {
    mode: Phaser.Scale.FIT,
    parent: 'cardGame',
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [MainScene]
};

var game = new Phaser.Game(config);