/*
Golf.js

So rn I have bad-gold where everything is hardcoded
and golf-ugly where everything is too seperate.

This file is here to act as a hopeful middle ground
and become the ideal route.
*/



/*
Model struct
*/

// Bruh how tf am I gonna do a spatial partition??
// I could probably have a seperate gameModel per partition

/*
let gameModel = {
  ball: 
  {
    pos: {'x': 30,'y': 30},
    vel: {'x': 0, 'y': 0},
    radius: 10
  },

  // Drawing statics can be expensive, so
  // having everything as seperate items in a dict
  // is a-ok
  statics: 
  {
    // As of now these are just a bunch of segments
    // maybe in the future they should be split up between
    // the outer walls & inner islands?
    walls: [
      { pointA: {'x': 0, 'y': 10}, pointB: {'x': 10, 'y': 10}, normal: {'x': 0,  'y': 1} },
    ],

    obstacles: [
      // Each obstacle is just a wall segment
      [ 
        { pointA: {..}, pointB: {..}, normal: {..} },
        { ... }
      ]
    ]
  }
}
*/




// TODO: Create generator functions

let simConstants = {
  launchSpeed: 100,
  friction: 0
}

// Currently only contains segment arrays, all of which are
// colliders.
//
// In the future should also have an outer bounding box
let simStatics = {
  walls: [
    /*
    This is the configuration

      --------
      |      |
      |      |
       \     |
         \___|
    */
    { pointA: {x:0, y:0},     pointB: {x:100, y:0},   normal: {x:0, y:-1} },
    { pointA: {x:100, y:0},   pointB: {x:100, y:100}, normal: {x:-1, y:0} },
    { pointA: {x:100, y:100}, pointB: {x:25, y:100},  normal: {x:0, y:1} },
    { pointA: {x:25, y:100},  pointB: {x:0, y:75},    normal: {x:0.707107, y:-0.707107} },
    { pointA: {x:0, y:75},    pointB: {x:0, y:0},     normal: {x:1, y:0} },
  ],

  obstacles: [
    // *chirp* *chirp*
  ]
}

let simDynamics = {
  ball: {
    pos: {x: 20, y:50},
    vel: {x: 1, y:2.5},
    radius: 10,
  }
}







const DEBUG_PALLETE = {
  'background': 0x383221,
  'obstacles': 0xed8c78,
  // 'normals': 0x,
  'ball': 0x8cbace
}



// TODO: Draw normals for the segments & velocity for the ball

/**
 * Returns a Container (PIXI.Graphics) containing a line
 * segment for each line segment in simStatics. Specifically,
 * it loops through simStatics.walls for segments,
 * 
 * // TODO: Also loop through simStatics.obstacles
 */
function generateDebugStaticsContainer (simStatics) {

  let wallsGraphic = new PIXI.Graphics();
  wallsGraphic.lineStyle(2, DEBUG_PALLETE.obstacles);

  // This way we're not assuming the walls are continuous
  simStatics.walls.forEach((segment) => {
    wallsGraphic.moveTo(segment.pointA.x, segment.pointA.y);
    wallsGraphic.lineTo(segment.pointB.x, segment.pointB.y);
  });

  return wallsGraphic;
}


/**
 * Returns a Container (PIXI.Graphics) of a circle.
 * The center of the circle is the center of the Container
 * but the Container itself is offset according to the x & y
 * of the ballDict.
 */
function generateDebugBallContainer (ballDict) {
  let ballGraphic = new PIXI.Graphics();

  ballGraphic.beginFill(DEBUG_PALLETE.ball);
  ballGraphic.lineStyle(0);
  ballGraphic.drawCircle(0, 0, ballDict.radius);

  ballGraphic.position.set(ballDict.pos.x, ballDict.pos.y);

  return ballGraphic;
}






//
// Physics
//

function doPhysicsTick (simConstants, simStatics, simDynamics) {
  /*
  Roughly, this loop likes this:

  Per subframe:
   - move forward
   - check for collision
  
  - adjust velocity (usually a slow down due to friction)
  */
  
  // TODO: Actually do subframes
  // Move forward
  let ball = simDynamics.ball;
  let oldBall = {...simDynamics.ball};  // Create new dict object 
  oldBall.pos = {...simDynamics.ball.pos}; // pos is a dict, so when copied above it's by reference

  ball.pos.x += ball.vel.x;
  ball.pos.y += ball.vel.y;

  // Check for collision
  // TODO: Account for multiple walls found
  let collisionSegment = null;
  simStatics.walls.forEach((segment) => {
    if (isColliding(segment, ball)) {
      collisionSegment = segment;
    }
  });

  if (collisionSegment !== null) {
    // console.log("Bruh collision");
    // console.log(ball);
    // console.log(oldBall);
    handleCollision(collisionSegment, ball, oldBall);
  }


  // Adjust velocity
  let speed = Math.sqrt(ball.vel.x**2 + ball.vel.y**2);
  if (speed <= simConstants.friction) {
    ball.vel.x = 0;
    ball.vel.y = 0;
  } else {
    const factor = 1 - simConstants.friction / speed;
    ball.vel.x *= factor;
    ball.vel.y *= factor;
  }

}

/**
 * Oh boy this one is a bit of a woozy.
 * It updates circle in 2 ways
 *  - position => position at boundary collision
 *  - velocity => reflected velocity
 * 
 * Returns the distance travelled (i.e. distance from oldCircle to collision segment)
 */
function handleCollision (segment, circle, oldCircle) {
  /*
  1. Find position when collision first occurs, move ball there
  2. Find correct reflected velocity, set velocity to be reflected velocity
  3. Return the distance travelled
  */

  // console.log("Handling new collision!");
  // console.log("Segment: ", segment);
  // console.log(`circle in segment: (${circle.pos.x}, ${circle.pos.y})`);
  // console.log(`safe circle: (${oldCircle.pos.x}, ${oldCircle.pos.y})`);

  /* 
  Step 1. Determine position of collision
  =======
  This is done with a binary search (BS) between oldCircle & circle position.
  */
  const BS_DEPTH = 6;
  let percentDistance = 0;

  let ogPosition = oldCircle.pos;
  let finalPosition = circle.pos;

  for (let bsStep=1; bsStep<=BS_DEPTH; bsStep++) {
    let testPercent = percentDistance + 1 / 2**bsStep;
    let lerpedCircle = {...circle};
    lerpedCircle.pos = {
      x: ogPosition.x + testPercent*(finalPosition.x - ogPosition.x),
      y: ogPosition.y + testPercent*(finalPosition.y - ogPosition.y)
    }

    if (!isColliding(segment, lerpedCircle)) {
      percentDistance += 1 / 2**bsStep;
    }
  }

  let collisionPos = {x: 0, y:0};
  collisionPos.x = ogPosition.x + percentDistance*(finalPosition.x - ogPosition.x);
  collisionPos.y = ogPosition.y + percentDistance*(finalPosition.y - ogPosition.y);
  
  // This gets returned at the end
  const DISTANCE_TO_COLLISION = percentDistance * Math.sqrt(
      sqDistanceBetweenPoints(collisionPos, ogPosition));

  // Ultimately we need to update the incoming circle
  circle.pos = collisionPos;
  // console.log("Final BSed Position: ", collisionPos);


  /*
  Step 2. Find correct reflected velocity
  =======
  This is a simple plug & chug:
  incoming velocity  = vo = <xo, yo>
  segment normal     = n  = <xn, yn>   (Assumed to be normalized)
  reflected velocity = v' = <x', y'>

  From the following 2 equations:
  v' = vo + k*n
  || v' || = ||vo||

  We get
  x' = xo - 2(vo*n)xn
  y' = yo - 2(vo*n)yn

  i.e.
  xo -= 2*(vo*n) * xn
  yo -= 2*(vo*n) * yn
  */
  // TODO: Implement specific cases (reflect x & y)?
  const DOT_VALUE = dotProduct(segment.normal, circle.vel);
  circle.vel.x -= 2*segment.normal.x*DOT_VALUE;
  circle.vel.y -= 2*segment.normal.y*DOT_VALUE;

  // console.log("Reflected velocity: ", circle.vel);


  return DISTANCE_TO_COLLISION;
}


/**
 * Determines whether the circle is colliding with
 * the given segment.
 * 
 * If the circle is on the wrong side of the segment,
 * the collision _will_ still register, i.e. collisions
 * here are 2-sided.
 */
function isColliding (segment, circle) {
  /*
  Lmao this math is on paper

  d = || proj_n(h) || = n dot h / || n || = n * h

  However, we care about the segment not just the line.
  So we check if the collision is within the segment.
    1. If sign (v1 * n) =/= sign (v2 * n)
    2. If circle collides with either end point
  */

  // Check 1, distance
  // can say false with certainty
  let v1 = subtractVectors(segment.pointA, circle.pos);
  let distance = Math.abs(dotProduct(segment.normal, v1));
  if (distance > circle.radius) {
    return false;
  }


  // Check 2, signage of vector & normal
  // can say true with certainty
  let v2 = subtractVectors(segment.pointB, circle.pos);
  let segVec = subtractVectors(segment.pointB, segment.pointA);

  let dotA = dotProduct(v1, segVec);
  let dotB = dotProduct(v2, segVec);
  if ((dotA <= 0 && dotB >= 0) || (dotA >= 0 && dotB <= 0)) {
    return true;
  }

  
  // Check 3, collision with endpoints
  // this is the final check to be exhaustive about collisions
  return (sqDistanceBetweenPoints(segment.pointA, circle.pos) <= circle.radius**2 ||
          sqDistanceBetweenPoints(segment.pointB, circle.pos) <= circle.radius**2)
}


function sqDistanceBetweenPoints (pointA, pointB) {
  return (pointA.x - pointB.x)**2 + (pointA.y - pointB.y)**2;
}

function dotProduct (vecA, vecB) {
  return vecA.x * vecB.x + vecA.y * vecB.y;
}

/**
 * Returns A - B
 * i.e. the vector from B -> A
 */
function subtractVectors (vecA, vecB) {
  return {'x': vecA.x - vecB.x, 'y': vecA.y - vecB.y};
}








function updateDynamicsContainer (simDynamics, ballContainer) {
  ballContainer.x = simDynamics.ball.pos.x;
  ballContainer.y = simDynamics.ball.pos.y;
}















let containerGameplay;
let containerStatics;
let containerBall;

let app = new PIXI.Application({
  width: 400,
  height: 400,
  antialias: true,
  resolution: 1,
  background: DEBUG_PALLETE.background
});

document.body.appendChild(app.view);

PIXI.loader.load(setup);





function setup () {
  containerStatics = generateDebugStaticsContainer(simStatics);
  // Basically, each dynamic will be its own container so that
  // position can just be update every frame.
  containerBall = generateDebugBallContainer(simDynamics.ball);

  containerGameplay = new PIXI.Container();
  containerGameplay.addChild(containerStatics);
  containerGameplay.addChild(containerBall);

  containerGameplay.position.set(20, 20);
  containerGameplay.scale.set(3, 3);

  app.stage.addChild(containerGameplay);

  app.ticker.add(delta => update(delta));
}




function update (delta) {
  doPhysicsTick(simConstants, simStatics, simDynamics);

  updateDynamicsContainer(simDynamics, containerBall);
}

// function loop () {
//   physicsTick(gameModel); 

//   // Rendering
//   updateDynamicsContainer(gameModel, ballContainer);
// }







