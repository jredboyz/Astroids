const FPS = 30;
const GAME_LIVES = 3; //starting number of lives
const LASER_DIST = 0.6; //max distance laser can travel as fraction of screen width
const LASER_MAX = 10; // maximun number of lasers on screen at once
const LASER_SPD = 500; // speed of lasers in pixels per second
const SHIP_SIZE = 30; // ship heigth in pixels
const SHIP_THRUST = 5; // acceleration of the in pxs per second per second
const SHIP_EXPLODE_DUR = 0.3; //duration of the ship duration
const LASER_EXPLODE_DUR = 0.1; //duration of the laser explosion in seconds
const SHIP_INV_DUR = 3; //duration of the ship invisibility in seconds
const SHIP_BLINK_DUR = 0.2; //duration of the ship blink during invisibility
const TURN_SPEED = 360; //turn speed in degrees per second
const FRICTION = 0.7; // friction coefficient of space (0 = no friction)
const ROIDS_JAG = 0.3;// jaggedness of the astroids (0 = none, 1 = lots)
const ROID_PTS_LRG = 20; //points scored for a large astroid
const ROID_PTS_MED = 50; //points scored for a medium astroid
const ROID_PTS_SML = 100; //points scored for a small astroid
const ROIDS_NUM = 1;// starting number of astroids
const ROIDS_SPD = 50;// max starting speed of astroids in pxs per second
const ROIDS_SIZE = 100;// starting size of astroids in pxs
const ROIDS_VERT = 10; // average number of vertices on each astroid
const SHOW_BOUNDING = false; // show or hide collison boundinh
const SHOW_CENTER_DOT = false; // show or hide ships center dot
const TEXT_FADE_TIME = 2.5; //text fade time in seconds
const TEXT_SIZE = 40; //text font height in pixels
const SAVE_KEY_SCORE = 'highscore'; //save key for local storage of high score
const SOUND_ON = true; //
const MUSIC_ON = true; //

/** @type {HTMLCanvasElement} */
var canv = document.getElementById('gameCanvas');
var ctx = canv.getContext('2d');

// set up sound effects
var fxHit = new Sound('sounds/hit.m4a', 5);
var fxThrust = new Sound('sounds/thrust.m4a');
var fxExplode = new Sound('sounds/explode.m4a');
var fxlaser = new Sound('sounds/laser.m4a', 5, 0.5);

//set up the music
var music = new Music('sounds/music-low.m4a', 'sounds/music-high.m4a');
var roidsLeft, roidsTotal;

//set up the game parameters
var level, lives, roids, score, scoreHigh, ship, text, textAlpha;
newGame();

// set up game loop
setInterval(update, 1000 / FPS)

//set up event handlers
document.addEventListener('keydown', keydown);
document.addEventListener('keyup', keyup);

function createAstroidBelt() {
  roids = [];
  roidsTotal = (ROIDS_NUM + level) * 7;
  roidsLeft = roidsTotal;
  var x, y;
  for (let i = 0; i < ROIDS_NUM + level; i++) {
    do {
      x = Math.floor(Math.random() * canv.width);
      y = Math.floor(Math.random() * canv.height);
    } while (distBetweenPoints(ship.x, ship.y, x, y) < ROIDS_SIZE * 2 + ship.r);
    roids.push(newAstroid(x, y, Math.ceil(ROIDS_SIZE / 2)));
  }
}

function destroyAstroid(index) {
  var x = roids[index].x;
  var y = roids[index].y;
  var r = roids[index].r;

  //split the astroid in two if necessary
  if (r == Math.ceil(ROIDS_SIZE / 2)) {
    roids.push(newAstroid(x, y, Math.ceil(ROIDS_SIZE / 4)));
    roids.push(newAstroid(x, y, Math.ceil(ROIDS_SIZE / 4)));
    score += ROID_PTS_LRG;
  } else if (r == Math.ceil(ROIDS_SIZE / 4)) {
    roids.push(newAstroid(x, y, Math.ceil(ROIDS_SIZE / 8)));
    roids.push(newAstroid(x, y, Math.ceil(ROIDS_SIZE / 8)));
    score += ROID_PTS_MED;
  } else {
    score += ROID_PTS_SML;
  }

  //check high score
  if ( score > scoreHigh) {
    scoreHigh = score;
    localStorage.setItem(SAVE_KEY_SCORE, scoreHigh);
  }

  //destroy the astroid
  roids.splice(index, 1);
  fxHit.play();

  //calculate the ratio of remaining astroids to determine music tempo
  roidsLeft--;
  music.setAstroidRatio(roidsLeft == 0 ? 1 : roidsLeft / roidsTotal);

  //new level when no more astroids
  if (roids.length == 0) {
    level++;
    newLevel();
  }
}

function distBetweenPoints(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x2-x1, 2) + Math.pow(y2-y1,2));
}

function drawShip(x, y, a, color = 'white') {
  ctx.strokeStyle = color;
  ctx.lineWidth = SHIP_SIZE / 30;
  ctx.beginPath();
  ctx.moveTo( // nose of the ship
    x + 4/3 * ship.r * Math.cos(a),
    y - 4/3 * ship.r * Math.sin(a)
  );
  ctx.lineTo( // rear left
    x - ship.r * (2/3 * Math.cos(a) + Math.sin(a)),
    y + ship.r * (2/3 * Math.sin(a) - Math.cos(a))
  );
  ctx.lineTo(// rear right
    x - ship.r * (2/3 * Math.cos(a) - Math.sin(a)),
    y + ship.r * (2/3 * Math.sin(a) + Math.cos(a))
  );
  ctx.closePath();
  ctx.stroke();
}

function explodeShip() {
  ship.explodeTime = Math.ceil(SHIP_EXPLODE_DUR * FPS)
  fxExplode.play();
}

function gameOver() {
  ship.dead = true;
  text = 'Game Over';
  textAlpha = 1.0;
}

function keydown(/** {keyboardEvent} */ ev) {

  if (ship.dead) {
    return;
  }

  switch(ev.keyCode) {
    case 37: //left arrow (rotate ship left)
      ship.rot = TURN_SPEED / 180 * Math.PI / FPS;
      break;
    case 38: // up arrow (thrust ship forward)
      ship.thrusting = true;
      // console.log('start thrusting')
      break;
    case 39: // right arrow (rotate ship right)
      ship.rot = -TURN_SPEED / 180 * Math.PI / FPS;
      break;
      case 32: // spacebar (shoot the laser)
      shootLaser();
      break;
  }
}

function keyup(/** {keyboardEvent} */ ev) {

  if (ship.dead) {
    return;
  }

  switch(ev.keyCode) {
    case 37: //left arrow (stop rotating left)
      ship.rot = 0;
      break;
    case 38: // up arrow (stop thrusting)
      // console.log('stop thrusting')
      ship.thrusting = false;
      break;
    case 39: // right arrow (stop rotating leftt)
      ship.rot = 0;
      break;
    case 32: // spacebar (allow shooting again)
      ship.canShoot = true;
      break;
  }
}

function newAstroid(x, y, r) {
  var lvlMult = 1 + 0.1 * level;
  var roid = {
    x: x,
    y: y,
    xvel: Math.random() * ROIDS_SPD * lvlMult / FPS * (Math.random() < 0.5 ? 1 : -1),
    yvel: Math.random() * ROIDS_SPD * lvlMult / FPS * (Math.random() < 0.5 ? 1 : -1),
    r: r,
    a: Math.random() * Math.PI * 2, // in radians
    vert: Math.floor(Math.random() * (ROIDS_VERT + 1) + ROIDS_VERT / 2),
    offs: []
  }

  //create the vertex offset array
  for (var i = 0; i < roid.vert; i++) {
    roid.offs.push(Math.random() * ROIDS_JAG * 2 + 1 - ROIDS_JAG)
  }
  return roid;
}

function newGame() {
  level = 0
  lives = GAME_LIVES;
  score = 0;
  ship = newShip();

  // get the high score from local storage
  var scoreStr = localStorage.getItem(SAVE_KEY_SCORE);
  if (scoreStr == null) {
    scoreHigh = 0;
  } else {
    scoreHigh = parseInt(scoreStr)
  }
  newLevel();
}

function newLevel() {
  text = `Level ${(level + 1)}`;
  textAlpha = 1.0;
  createAstroidBelt();
}

function newShip () {
  return {
          x: canv.width / 2,
          y: canv.height / 2,
          r: SHIP_SIZE / 2,
          a: 90 / 180 * Math.PI, //convert to radians
          explodeTime: 0,
          blinkNum: Math.ceil(SHIP_INV_DUR / SHIP_BLINK_DUR),
          blinkTime: Math.ceil(SHIP_BLINK_DUR * FPS),
          canShoot: true,
          dead: false,
          lasers: [],
          rot: 0,
          thrusting: false,
          thrust: {
            x: 0,
            y: 0
          }
        }
}

function shootLaser() {
  //create the laser object
  if (ship.canShoot && ship.lasers.length < LASER_MAX) {
    ship.lasers.push({
      x: ship.x + 4/3 * ship.r * Math.cos(ship.a),
      y: ship.y - 4/3 * ship.r * Math.sin(ship.a),
      xv: LASER_SPD * Math.cos(ship.a) / FPS,
      yv: -LASER_SPD * Math.sin(ship.a) / FPS,
      dist: 0,
      explodeTime: 0,
    })
    fxlaser.play();
  }
  //prevent further shooting
  ship.canShoot = false;
}

function Sound(src, maxStreams = 1, vol = 1.0) {
  this.streamNum = 0;
  this.streams =[];
  for (var i = 0; i < maxStreams; i++) {
    this.streams.push(new Audio(src));
    this.streams[i].volume = vol;
  }

  this.play = function() {
    if (SOUND_ON) {
      this.streamNum = (this.streamNum + 1) % maxStreams;
      this.streams[this.streamNum].play();
    }
  }

  this.stop = function() {
    this.streams[this.streamNum].pause();
    this.streams[this.streamNum].currentTime = 0;
  }
}

function Music(srcLow, srcHigh) {
  this.soundLow = new Audio(srcLow);
  this.soundHigh = new Audio(srcHigh);
  this.low = true;

  this.tempo = 1.0; // seconds per beat
  this.beatTime = 0; // frames left until next beat

  this.play = function() {
    if (MUSIC_ON) {
      if(this.low) {
        this.soundLow.play();
      } else {
        this.soundHigh.play();
      }
      this.low = !this.low;
    }
  }

  this.setAstroidRatio = function(ratio) {
    this.tempo = 1.0 - 0.75 * (1.0 - ratio);
  }

  this.tick = function() {
    if (this.beatTime == 0) {
      this.play();
        this.beatTime = Math.ceil(this.tempo * FPS);
    } else {
      this.beatTime--;
    }
  }

}

function update() {
  var blinkOn = ship.blinkNum % 2 === 0;
  var exploding = ship.explodeTime > 0;

  //tick the music
  music.tick();


  // draw space
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canv.width, canv.height);

  // thrust the ship
  if (ship.thrusting && !ship.dead) {
    ship.thrust.x += SHIP_THRUST * Math.cos(ship.a) / FPS;
    ship.thrust.y -= SHIP_THRUST * Math.sin(ship.a) / FPS;
    fxThrust.play();

    // draw the thruster
    if (!exploding && blinkOn) {
      ctx.fillStyle = 'red';
      ctx.strokeStyle = 'yellow';
      ctx.lineWidth = SHIP_SIZE / 30;
      ctx.beginPath();
      ctx.moveTo(
      ship.x - ship.r * (2/3 * Math.cos(ship.a) + 0.5 * Math.sin(ship.a)),
      ship.y + ship.r * (2/3 * Math.sin(ship.a) - 0.5 * Math.cos(ship.a))
      );
      ctx.lineTo(
        ship.x - ship.r * 6/3 * Math.cos(ship.a),
        ship.y + ship.r * 6/3 * Math.sin(ship.a)
      );
      ctx.lineTo(
        ship.x - ship.r * (2/3 * Math.cos(ship.a) - 0.5 * Math.sin(ship.a)),
        ship.y + ship.r * (2/3 * Math.sin(ship.a) + 0.5 * Math.cos(ship.a))
      );
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

  } else {
    ship.thrust.x -= FRICTION * ship.thrust.x / FPS;
    ship.thrust.y -= FRICTION * ship.thrust.y / FPS;
    fxThrust.stop();
  }

  // draw a triangular ship
  if (!exploding) {
    if(blinkOn && !ship.dead) {
      drawShip(ship.x, ship.y, ship.a);
    }

    //handle blinking
    if (ship.blinkNum > 0) {
      //reduce the blink time
      ship.blinkTime--;

      //reduce the blink num
      if (ship.blinkTime == 0) {
        ship.blinkTime = Math.ceil(SHIP_BLINK_DUR * FPS)
        ship.blinkNum--;
      }
    }
  } else {
    //draw the explosion
    ctx.fillStyle = 'maroon';
    ctx.beginPath();
    ctx.arc(ship.x, ship.y, ship.r * 1.7, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(ship.x, ship.y, ship.r * 1.4, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.fillStyle = 'orange';
    ctx.beginPath();
    ctx.arc(ship.x, ship.y, ship.r * 1.1, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.fillStyle = 'yellow';
    ctx.beginPath();
    ctx.arc(ship.x, ship.y, ship.r * 0.8, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(ship.x, ship.y, ship.r * 0.5, 0, Math.PI * 2, false);
    ctx.fill();
  }

  if (SHOW_BOUNDING) {
    ctx.strokeStyle = 'lime';
    ctx.beginPath();
    ctx.arc(ship.x, ship.y, ship.r, 0, Math.PI * 2, false);
    ctx.stroke();
  }

  //draw the astroids
  var x, y, r, a, vert, offs;
  for (var i = 0; i < roids.length; i++) {
    ctx.strokeStyle = 'slategrey';
    ctx.lineWidth = SHIP_SIZE / 30;
    // get the astroid properties
     x = roids[i].x;
     y = roids[i].y;
     r = roids[i].r;
     a = roids[i].a;
     vert = roids[i].vert;
     offs = roids[i].offs;

    // draw a path
    ctx.beginPath();
    ctx.moveTo(
      x + r * offs[0] * Math.cos(a),
      y + r * offs[0] * Math.sin(a)
    )
    // draw the polygon
    for (var j = 0; j < vert; j++) {
      ctx.lineTo(
        x + r * offs[j] * Math.cos(a + j * Math.PI * 2 / vert),
        y + r * offs[j] * Math.sin(a + j * Math.PI * 2 / vert)
      )
    }
    ctx.closePath();
    ctx.stroke();

    if (SHOW_BOUNDING) {
      ctx.strokeStyle = 'lime';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2, false);
      ctx.stroke();
    }

  }

  //  handle edge of screen
  if (ship.x < 0 - ship.r) {
    ship.x = canv.width + ship.r;
  } else if (ship.x > canv.width + ship.r) {
    ship.x = 0 - ship.r;
  }

  if (ship.y < 0 - ship.r) {
    ship.y = canv.height + ship.r;
  } else if (ship.y > canv.height + ship.r) {
    ship.y = 0 - ship.r;
  }

  // check for astroid collisions
  if (!exploding) {

    //only check when not blinking
    if (ship.blinkNum === 0 && !ship.dead) {
      for (var i = 0; i < roids.length; i++) {
        if (distBetweenPoints(ship.x, ship.y, roids[i].x, roids[i].y) < ship.r + roids[i].r) {
          explodeShip();
          destroyAstroid(i);
          break;
        }
      }
    }

    // rotate ship
    ship.a += ship.rot;

    // move the ship
    ship.x += ship.thrust.x;
    ship.y += ship.thrust.y;
  } else {
    //reduce the explosion time
    ship.explodeTime--;

    //reset the ship after the explosion has finished
    if (ship.explodeTime === 0) {
      lives--;
      if (lives === 0) {
        gameOver();
      } else {
        ship = newShip();
      }
    }
  }

  //move the lasers
  for (var i = ship.lasers.length - 1; i >= 0; i--) {
    //check distance travelsed
    if (ship.lasers[i].dist > LASER_DIST * canv.width) {
      ship.lasers.splice(i, 1);
      continue;
    }

    //handle the explosion
    if (ship.lasers[i].explodeTime > 0) {
      ship.lasers[i].explodeTime--

      //destory the laser after durtaion is up
      if (ship.lasers[i].explodeTime == 0) {
        ship.lasers.splice(i, 1);
        continue;
      }
    } else {
      //move the lasers
      ship.lasers[i].x += ship.lasers[i].xv;
      ship.lasers[i].y += ship.lasers[i].yv;

      //calculate the distance traveled
      ship.lasers[i].dist += Math.sqrt(Math.pow(ship.lasers[i].xv, 2) + Math.pow(ship.lasers[i].yv, 2));
    }


    //handle edge of screen for lasers
    if (ship.lasers[i].x < 0) {
      ship.lasers[i].x = canv.width
    } else if (ship.lasers[i].x > canv.width) {
      ship.lasers[i].x = 0
    }
    if (ship.lasers[i].y < 0) {
      ship.lasers[i].y = canv.height
    } else if (ship.lasers[i].y > canv.height) {
      ship.lasers[i].y = 0
    }
  }

  // move the astroid
  for (var i = 0; i < roids.length; i++) {
    roids[i].x += roids[i].xvel;
    roids[i].y += roids[i].yvel;

    // handle the edge of screen
    if (roids[i].x < 0 - roids[i].r) {
      roids[i].x = canv.width + roids[i].r;
    } else if (roids[i].x > canv.width + roids[i].r) {
      roids[i].x = 0 - roids[i].r;
    }

    if (roids[i].y < 0 - roids[i].r) {
      roids[i].y = canv.height + roids[i].r;
    } else if (roids[i].y > canv.height + roids[i].r) {
      roids[i].y = 0 - roids[i].r;
    }
  }

  //center dot
  if (SHOW_CENTER_DOT) {
    ctx.fillStyle = 'red';
    ctx.fillRect(ship.x - 1, ship.y - 1, 2, 2)
  }

  //draw the lasers
  for (var i = 0; i < ship.lasers.length; i++) {
    if (ship.lasers[i].explodeTime == 0) {
      ctx.fillStyle = 'salmon';
      ctx.beginPath();
      ctx.arc(ship.lasers[i].x, ship.lasers[i].y, SHIP_SIZE / 15, 0, Math.PI * 2, false);
      ctx.fill();
    } else {
      ctx.fillStyle = 'orangered';
      ctx.beginPath();
      ctx.arc(ship.lasers[i].x, ship.lasers[i].y, ship.r * 0.75, 0, Math.PI * 2, false);
      ctx.fill();
      ctx.fillStyle = 'salmon';
      ctx.beginPath();
      ctx.arc(ship.lasers[i].x, ship.lasers[i].y, ship.r * 0.5, 0, Math.PI * 2, false);
      ctx.fill();
      ctx.fillStyle = 'pink';
      ctx.beginPath();
      ctx.arc(ship.lasers[i].x, ship.lasers[i].y, ship.r * 0.25, 0, Math.PI * 2, false);
      ctx.fill();
    }
  }

  //draw the game text
  if(textAlpha >= 0) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255, 255, 255, ' + textAlpha + ')';
    ctx.font = `small-caps ${TEXT_SIZE}px Arial`;
    ctx.fillText(text, canv.width / 2, canv.height * 0.75);
    textAlpha -= (1.0 / TEXT_FADE_TIME / FPS);
  } else if (ship.dead) {
    newGame();
  }

  //draw the lives
  var lifeColor;
  for (var i = 0; i < lives; i++) {
    lifeColor = exploding && i == lives - 1 ? 'red' : 'white';
    drawShip(SHIP_SIZE + i * SHIP_SIZE * 1.2, SHIP_SIZE, 0.5 * Math.PI, lifeColor);
  }

  //draw the score
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'white';
  ctx.font = `${TEXT_SIZE}px Arial`;
  ctx.fillText(score, canv.width - SHIP_SIZE / 2, SHIP_SIZE);
  //draw the high score
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'white';
  ctx.font = `${TEXT_SIZE * 0.5}px Arial`;
  ctx.fillText(`HIGH SCORE: ${scoreHigh}`, canv.width / 2, SHIP_SIZE);


  //detect laser hits on astroids
  var ax, ay, ar, lx, ly;
  for (var i = roids.length - 1; i >= 0; i--) {

    // grab the astroid properties
    ax = roids[i].x;
    ay = roids[i].y;
    ar = roids[i].r;

    //loop over the lasers
    for (var j = ship.lasers.length - 1; j >= 0; j--) {

      //grab the laser properties
      lx = ship.lasers[j].x;
      ly = ship.lasers[j].y;

      //detect hits
      if (ship.lasers[j].explodeTime == 0 && distBetweenPoints(ax, ay, lx, ly) < ar) {


        //destroy the astroids and activate laser explosion
        destroyAstroid(i);
        ship.lasers[j].explodeTime = Math.ceil(LASER_EXPLODE_DUR * FPS)
        break;
      }
    }
  }
}