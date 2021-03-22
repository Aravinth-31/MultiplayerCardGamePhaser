class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }
    preload() {
        for (var i = 0; i < 52; i++)
            this.load.image('card' + i, 'assets/' + i + '.svg');
        this.load.image('cardBack', 'assets/CardBack.png');
    }
    create() {
        var self = this;
        this.socket = io();
        this.players = this.physics.add.group();
        this.cards = [];
        this.scores = {};
        this.playingCards = this.add.group();
        this.playerName = "";
        this.playedCards = 0;
        //  A drop zone
        var zone = this.add.zone(600, 150, 400, 200).setRectangleDropZone(400, 200);
        zone.setData({ cards: 0 });
        //  Just a visual display of the drop zone
        var graphics = this.add.graphics();
        graphics.lineStyle(2, 0xffff00);
        graphics.strokeRect(zone.x - zone.input.hitArea.width / 2, zone.y - zone.input.hitArea.height / 2, zone.input.hitArea.width, zone.input.hitArea.height);
        graphics.setVisible(false);

        var waitingText=this.add.text(500,300,"Waiting For More Players To Join...",{fill:"#11c8d6",fontSize:"35px"}).setOrigin(0.5,0.5) ;

        this.socket.on("start", function (players) {
            waitingText.destroy();
            Object.keys(players).forEach(player => {
                if (player == self.socket.id) {
                    self.playerName = players[player].name;
                    self.cards = players[player].cards;
                    self.displayCards();
                    console.log(self.playerName);
                }
            });
            graphics.setVisible(true);
            for (var i = 1; i <= 4; i++) {
                if ("Player" + i === self.playerName)
                    self.scores["Player" + i] = self.add.text(80, (i * 30), "Player" + i + ": 0", { fontSize: "25px", fill: '#0f0' });
                else
                    self.scores["Player" + i] = self.add.text(80, (i * 30), "Player" + i + ": 0", { fontSize: "25px", fill: '#f00' });
            }
        })
        this.socket.on("announceWinner", function (players) {
            var max = -1;
            var winner = "";
            Object.keys(players).forEach((player, index) => {
                if (players[player].score > max) {
                    max = players[player].score;
                    winner = players[player].name;
                }
            });
            self.players.clear();
            graphics.setVisible(false);
            Object.keys(self.scores).forEach((score) => {
                self.scores[score].destroy();
            });
            var winningText = self.add.text(400, 200, winner + " Winning !", { fontSize: 40, fill: "#fff" });
            self.tweens.add({
                targets: winningText,
                fontSize: 40,
                alpha: 0,
                ease: "Linear",
                duration: 2000,
                repeat: 0,
                onComplete: () => {
                    winningText.destroy();
                }
            });
        })
        this.zoneCards = this.add.group();
        this.zoneCards.add(this.add.image(zone.x - 75, zone.y, 'cardBack').setDisplaySize(125, 175).setVisible(false));
        this.zoneCards.add(this.add.image(zone.x - 25, zone.y, 'cardBack').setDisplaySize(125, 175).setVisible(false));
        this.zoneCards.add(this.add.image(zone.x + 25, zone.y, 'cardBack').setDisplaySize(125, 175).setVisible(false));
        this.zoneCards.add(this.add.image(zone.x + 75, zone.y, 'cardBack').setDisplaySize(125, 175).setVisible(false));

        this.socket.on("incrementDropCard", function () {
            self.zoneCards.getChildren()[zone.data.list.cards++].setVisible(true);
            if (zone.data.list.cards == 4) {
                zone.setData({ cards: 0 });
            }
        });
        this.socket.on("updateScore", function (players) {
            Object.keys(players).forEach((player, index) => {
                self.scores[players[player].name].text = players[player].name + " " + players[player].score;
            });
            self.players.children.each((player) => {
                player.input.draggable = true;
            })
            self.zoneCards.getChildren().forEach((zoneCard) => {
                zoneCard.setVisible(false);
            })
            self.playedCards++;
            self.time.delayedCall(1000, () => {
                if (self.playedCards == 13) {
                    self.playedCards = 0;
                    self.socket.emit("gameEnd");
                }
            });
        })
        onblur(this,()=>{
            console.log("blur");
        })
        this.input.on("drag", function (pointer, gameobject, dragX, dragY) {
            gameobject.x = dragX;
            gameobject.y = dragY;
        })
        this.input.on('dragenter', function (pointer, gameObject, dropZone) {
            graphics.clear();
            graphics.lineStyle(2, 0x00ffff);
            graphics.strokeRect(zone.x - zone.input.hitArea.width / 2, zone.y - zone.input.hitArea.height / 2, zone.input.hitArea.width, zone.input.hitArea.height);
        });
        this.input.on('dragleave', function (pointer, gameObject, dropZone) {
            graphics.clear();
            graphics.lineStyle(2, 0xffff00);
            graphics.strokeRect(zone.x - zone.input.hitArea.width / 2, zone.y - zone.input.hitArea.height / 2, zone.input.hitArea.width, zone.input.hitArea.height);
        });
        this.input.on('drop', function (pointer, gameObject, dropZone) {
            self.players.children.each((player) => {
                player.input.draggable = false;
            })
            self.socket.emit("updateZone", { id: self.socket.id, value: gameObject.value });
            gameObject.destroy();
            if (zone.data.list.cards == 3)
                self.socket.emit("calculateScore");
            self.time.delayedCall(500, () => {
                console.log(self.playedCards);
                if (self.playedCards == 13) {
                    self.socket.emit("restart");
                }
            });
            graphics.clear();
            graphics.lineStyle(2, 0xffff00);
            graphics.strokeRect(zone.x - zone.input.hitArea.width / 2, zone.y - zone.input.hitArea.height / 2, zone.input.hitArea.width, zone.input.hitArea.height);
        });

        this.input.on('dragend', function (pointer, gameObject, dropped) {
            if (!dropped) {
                gameObject.x = gameObject.input.dragStartX;
                gameObject.y = gameObject.input.dragStartY;
            }
        });
    }
    update() {
    }
    displayCards() {
        this.cards.forEach((card, index) => {
            var playingCard = this.add.sprite(180 + index * 53, 450, 'card' + card).setDisplaySize(125, 175).setOrigin(0.5, 0.5).setInteractive();
            playingCard.value = card;
            this.input.setDraggable(playingCard);
            this.players.add(playingCard);
        })
    }
}
