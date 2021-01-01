// Aliases & App initialization
let Application = PIXI.Application,
    // InteractionManager = PIXI.interaction.InteractionManager,
    TextureCache = PIXI.utils.TextureCache,
    Sprite = PIXI.Sprite;

const app = new PIXI.Application({
  width: 400, 
  height: 400,
  antialias: true,
  transparent: false,
  resolution: 1
});
document.body.appendChild(app.view);



// Pre-load all images
PIXI.loader.add([
  "img/course-square.png",
  "img/assets-ball.json"
]).load(setup);

let courseSprite, 
    ballSprite, previewSprite;



// Data
let dragStart = [0.0, 0.0]; // x & y mouse position
let dragEnd = [0.0, 0.0];
let ballVel = [0.0, 0.0];

const MIN_X = 30;
const MAX_X = 370;
const MIN_Y = 30;
const MAX_Y = 370;

const LAUNCH_SPEED_FACTOR = 0.1;
const FRICTION_ACCEL = 0.1; // (de) acceleration due to friction
const DAMPING_COEF = 0.99;  // Just so that high speeds to deduce down



// Setup call
function setup () {
  // The ball course will always be static in the background
  courseSprite = new Sprite(TextureCache['img/course-square.png']);
  app.stage.addChild(courseSprite);

  ballSprite = new Sprite(TextureCache['assets-ball.png']);
  ballSprite.pivot.set(ballSprite.width / 2, ballSprite.height / 2);
  ballSprite.x = app.view.width / 2;
  ballSprite.y = app.view.height / 2;

  ballSprite.interactive = true;
  ballSprite.buttonMode = true;
  ballSprite.on('pointerdown', startSwing)
            .on('pointermove', moveIndicator)
            .on('pointerup', cancelSwing)
            .on('pointerupoutside', endSwing)
  app.stage.addChild(ballSprite);

  previewSprite = new Sprite(TextureCache['ui-trajectory-ball.png']);
  previewSprite.pivot.set(previewSprite.width / 2, previewSprite.height / 2);
  previewSprite.visible = false;
  app.stage.addChild(previewSprite);

  app.ticker.add((delta) => gameLoop(delta));
}

function gameLoop (delta) {
  if (ballVel[0] != 0 || ballVel[1] != 0) {
    doPhysicsTick();
  }
}



//
// Physics
//
function doPhysicsTick () {
  /*
    Some things to note about this physics:
    - It _must_ be deterministic
    - All frames are considered equal time frames
    - Physical accuracy is not necessary, it's for a game

    Each physics call consists of:
    TODO: Add subframes?
    - Move forward
    - Check for collision
    - Reduce speed
  */

  /*
  Move Forward
  ============
  Simply add ballVel to the current position
  */
  ballSprite.x += ballVel[0];
  ballSprite.y += ballVel[1];

  /*
  Check for Collision
  ===================
  Right now we live in a square, so collisions
  are just x & y inequalities
  */
  if (ballSprite.x - ballSprite.width / 2 <= MIN_X) {
    ballSprite.x = MIN_X + ballSprite.width / 2;
    ballVel[0] *= -1;
  } else if (ballSprite.x + ballSprite.width / 2 >= MAX_X) {
    ballSprite.x = MAX_X - ballSprite.width / 2;
    ballVel[0] *= -1;
  }

  if (ballSprite.y - ballSprite.height / 2 <= MIN_Y) {
    ballSprite.y = MIN_Y + ballSprite.height / 2;
    ballVel[1] *= -1;
  } else if (ballSprite.y + ballSprite.height / 2 >= MAX_Y) {
    ballSprite.y = MAX_Y - ballSprite.height / 2;
    ballVel[1] *= -1;
  }
  
  /*
  Reduce Speed
  ============
  Normalize speed, multiply by friction
  Then substract
  - or -
  if current speed < friction reduction 
    speed -> 0
  */
  // Big sad that I have to use a sqrt but I think it's unavoidable
  let ballSpeed = Math.sqrt(ballVel[0]*ballVel[0] + ballVel[1]*ballVel[1]);

  if (ballSpeed < FRICTION_ACCEL) {
    ballVel = [0, 0];
  } else {
    // let frictionForce = [-ballVel[0] / ballSpeed * FRICTION_ACCEL, -ballVel[1] / ballSpeed * FRICTION_ACCEL];
    ballVel = [ballVel[0] * (1 - FRICTION_ACCEL / ballSpeed), ballVel[1] * (1 - FRICTION_ACCEL / ballSpeed)];
    ballVel = [ballVel[0] * DAMPING_COEF, ballVel[1] * DAMPING_COEF];
  }


}




//
// Shot wind up
//

function startSwing (event) {
  dragStart = [ballSprite.x, ballSprite.y];
  previewSprite.visible = true;
}

function endSwing (event) {
  let posDict = event.data.global;
  dragEnd = [posDict.x, posDict.y];
  previewSprite.visible = false;

  // This starts the physics
  ballVel = [dragStart[0] - dragEnd[0], dragStart[1] - dragEnd[1]];
  ballVel[0] *= LAUNCH_SPEED_FACTOR;
  ballVel[1] *= LAUNCH_SPEED_FACTOR;
}

function moveIndicator (event) {
  // Quick Maths here we go
  /*
    Basically, we want to draw the trajIndicator to be across the
    the ball.
    T = indicator, X = ball, M = mouse

      T    
       \
        X
         \
          M

    M -> X = X -> T,
    X + (M -> x) = position of T
  */
  let mousePosDict = event.data.global;
  let MtoX = [ballSprite.x - mousePosDict.x, ballSprite.y - mousePosDict.y];
  previewSprite.position.set(ballSprite.x + MtoX[0], ballSprite.y + MtoX[1]);
}

function cancelSwing (event) {
  endSwing(event);
  // previewSprite.visible = false;
  // console.log("Cancelled");
}
