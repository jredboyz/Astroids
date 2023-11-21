const FPS = 30;
const SHIP_SIZE = 30; // ship heigth in pixels
const SHIP_THRUST = 5; // acceleration of the in pxs per second per second
const TURN_SPEED = 360; //turn speed in degrees per second
const FRICTION = 0.7; // friction coefficient of space (0 = no friction)
const ROIDS_NUM = 3;// starting number of astroids
const ROIDS_SPD = 50;// max starting speed of astroids in pxs per second
const ROIDS_SIZE = 100;// starting size of astroids in pxs
const ROIDS_VERT = 10; // average number of vertices on each astroid

/** @type {HTMLCanvasElement} */
var canv = document.getElementById('gameCanvas');
var ctx = canv.getContext('2d');

var ship = {
  x: canv.width / 2,
  y: canv.height / 2,
  r: SHIP_SIZE / 2,
  a: 90 / 180 * Math.PI, //convert to radians
  rot: 0,
  thrusting: false,
  thrust: {
    x: 0,
    y: 0
  }
}

// set up astroids
var roids = [];
createAstroidBelt()

// set up game loop
setInterval(update, 1000 / FPS)

//set up event handlers
document.addEventListener('keydown', keydown);
document.addEventListener('keyup', keyup);

function createAstroidBelt() {
  roids = [];
  var x, y;
  for (let i = 0; i < ROIDS_NUM; i++) {
    x = Math.floor(Math.random() * canv.width);
    y = Math.floor(Math.random() * canv.height);
    roids.push(newAstroid(x, y));
  }
}

function keydown(/** {keyboardEvent} */ ev) {
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
  }
}

function keyup(/** {keyboardEvent} */ ev) {
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
  }
}

function newAstroid(x, y) {
  var roid = {
    x: x,
    y: y,
    xvel: Math.random() * ROIDS_SPD / FPS * (Math.random() < 0.5 ? 1 : -1),
    yvel: Math.random() * ROIDS_SPD / FPS * (Math.random() < 0.5 ? 1 : -1),
    r: ROIDS_SIZE / 2,
    a: Math.random() * Math.PI * 2, // in radians
    vert: Math.floor(Math.random() * (ROIDS_VERT + 1) + ROIDS_VERT / 2)
  }
}

function update() {
  // draw space
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canv.width, canv.height);

  // thrust the ship
  if (ship.thrusting) {
    ship.thrust.x += SHIP_THRUST * Math.cos(ship.a) / FPS;
    ship.thrust.y -= SHIP_THRUST * Math.sin(ship.a) / FPS;

    // draw the thruster
    ctx.fillStyle = 'red';
    ctx.strokeStyle = 'yellow';
    ctx.lineWidth = SHIP_SIZE / 30;
    ctx.beginPath();
    ctx.moveTo( // nose of the ship
    ship.x - ship.r * (2/3 * Math.cos(ship.a) + 0.5 * Math.sin(ship.a)),
    ship.y + ship.r * (2/3 * Math.sin(ship.a) - 0.5 * Math.cos(ship.a))
    );
    ctx.lineTo( // rear center behind the ship
      ship.x - ship.r * 6/3 * Math.cos(ship.a),
      ship.y + ship.r * 6/3 * Math.sin(ship.a)
    );
    ctx.lineTo(// rear right
      ship.x - ship.r * (2/3 * Math.cos(ship.a) - 0.5 * Math.sin(ship.a)),
      ship.y + ship.r * (2/3 * Math.sin(ship.a) + 0.5 * Math.cos(ship.a))
    );
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

  } else {
    ship.thrust.x -= FRICTION * ship.thrust.x / FPS;
    ship.thrust.y -= FRICTION * ship.thrust.y / FPS;
  }

  // draw a triangular ship
  ctx.strokeStyle = 'white';
  ctx.lineWidth = SHIP_SIZE / 30;
  ctx.beginPath();
  ctx.moveTo( // nose of the ship
    ship.x + 4/3 * ship.r * Math.cos(ship.a),
    ship.y - 4/3 * ship.r * Math.sin(ship.a)
  );
  ctx.lineTo( // rear left
    ship.x - ship.r * (2/3 * Math.cos(ship.a) + Math.sin(ship.a)),
    ship.y + ship.r * (2/3 * Math.sin(ship.a) - Math.cos(ship.a))
  );
  ctx.lineTo(// rear right
    ship.x - ship.r * (2/3 * Math.cos(ship.a) - Math.sin(ship.a)),
    ship.y + ship.r * (2/3 * Math.sin(ship.a) + Math.cos(ship.a))
  );
  ctx.closePath();
  ctx.stroke();

  //draw the astroids
  ctx.strokeStyle = 'slategrey';
  ctx.lineWidth = SHIP_SIZE / 30;
  for (let i = 0; i < roids.length; i++) {
    // get the astroid properties
     x = roids[i].x;
     y = roids[i].y;
     r = roids[i].x;
     a = roids[i].x;
     vert = roids[i].x;

    // draw a path
    ctx.beginPath();
    ctx.moveTo(

    )
    // draw the polygon

    // move the astroid

    // handle the edge of screen
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

  // rotate ship
  ship.a += ship.rot;

  // move the ship
  ship.x += ship.thrust.x;
  ship.y += ship.thrust.y;

  //center dot
  ctx.fillStyle = 'red';
  // ctx.fillRect(ship.x - 1, ship.y - 1, 2, 2)
}