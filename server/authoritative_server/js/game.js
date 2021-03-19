const players = {};
var playerCount = 0;
const config = {
  type: Phaser.HEADLESS,
  parent: 'phaser-example',
  width: 1000,
  height: 600,
  scale: {
    mode: Phaser.Scale.FIT,
    parent: 'cardGame',
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
      gravity: { y: 0 }
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  },
  autoFocus: false
};

function preload() {
}

function create() {
  const self = this;

  this.deck = Phaser.Utils.Array.NumberArray(0, 51);
  Phaser.Utils.Array.Shuffle(this.deck);

  io.on('connection', function (socket) {
    console.log('a user connected ' + socket.id);
    players[socket.id] = {
      cards: self.deck.slice(playerCount * 13, (playerCount + 1) * 13),
      id: socket.id,
      name: 'Player' + (playerCount + 1),
      score: 0,
      dropCardValue: -1
    }
    playerCount++;
    if (playerCount == 4) {
      io.emit('start', players);
    }
    socket.on('disconnect', function () {
      console.log('user disconnected ' + socket.id);
      delete players[socket.id];
      console.log(players);
      playerCount--;
    });
    socket.on("updateZone", (obj) => {
      players[obj.id].dropCardValue = obj.value % 13;
      io.emit("incrementDropCard");
    })
    socket.on("calculateScore", function () {
      var values = Object.keys(players).map((player, index) => {
        return players[player].dropCardValue;
      });
      values.sort((a, b) => { return b - a })
      values=Array.from(new Set(values));
      values.forEach((val, i) => {
        console.log(val,i);
        Object.keys(players).forEach((player, index) => {
          if (players[player].dropCardValue == val) {
            if (i == 0)
              players[player].score += 20;
            else if (i == 1)
              players[player].score += 15;
            else if (i == 2)
              players[player].score += 10;
            else if (i == 3)
              players[player].score += 5;
          }
        });
      });
      io.emit("updateScore",players);
    })
    socket.on("gameEnd",function(){
      console.log("GameEnd");
      socket.emit("announceWinner",players);
    })
  });
}

function update() {

}
const game = new Phaser.Game(config);
window.gameLoaded();
