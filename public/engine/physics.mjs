/*
Physics.mjs

This file exports functions that
 - Generate game state dictionaries
 - Handle collisions between the ball & level

Internally there are also some useful math functions but
they are only relevant for this file, and so are not
exported. 

One day (probably when creating the playback engine)
it will be useful to pull them out into a utility file.

Instead of classes, this entire engine operates on dicts. Here
is a list of all dicts:

// Everything lives in 2D for now
position: {x: num, y: num}
velocity: {x: num, y: num}

circle: {
  pos: {..},
  radius: {..},
  [vel: {..}]
}

segment: {
  pointA: {..},
  pointB: {..},
  normal: {..}    <= Always normalized
}
*/





// TODO: Generator functions



//
// Physics Constants
//

/*
Engine constants:
Mostly just epsilons for float comparisons. They should not
be adjusted as they are set for stability.
*/

const EPSILON_ZERO = 0.00001;


/*
Gameplay constants:
Stuff like friction, damping, etc. Tweaking these is a game-design
decision and the engine should work with all values of these.
*/

// TODO: Maybe this should be generated and passed into functions?
const GAMEPLAY_CONSTANTS = {
  launchSpeed: 100,
  friction: 0.06,
  dampingCoef: 0.99 // Should be on range (0, 1], and ideally close to 1 (0.999 is good)
}









//
// Math Utility Functions
//
// All functoins return their value, there are NO mutations

function sqDistanceBetweenPoints (pointA, pointB) {
  return (pointA.x - pointB.x)**2 + (pointA.y - pointB.y)**2;
}

function distanceBetweenPoints (pointA, pointB) {
  return Math.sqrt((pointA.x - pointB.x)**2 + (pointA.y - pointB.y)**2);
}

function sqLengthOfVector (vec) {
  return vec.x**2 + vec.y**2;
}

function lengthOfVector (vec) {
  return Math.sqrt(vec.x**2 + vec.y**2);
}

function dotProduct (vecA, vecB) {
  return vecA.x * vecB.x + vecA.y * vecB.y;
}

/**
 * Returns A - B
 * i.e. the vector from B -> A
 */
function differenceVector (vecA, vecB) {
  return {'x': vecA.x - vecB.x, 'y': vecA.y - vecB.y};
}

function normalizedVector (vec) {
  if (Math.abs(vec.x) <= EPSILON_ZERO && Math.abs(vec.y) <= EPSILON_ZERO) {
    return {x: 0, y:0};
  }
  
  let localVec = {...vec}
  const length = lengthOfVector(localVec);
  localVec.x /= length;
  localVec.y /= length;
  return localVec;
}









//
// Collisions
//

/**
 * Oh boy this one is a bit of a woozy.
 * It updates circle in 2 ways
 *  - position => position at boundary collision
 *  - velocity => reflected velocity
 * 
 * Returns the distance travelled (i.e. distance from oldCircle to collision segment)
 */
function handleCollision (segmentArr, circle, oldCircle) {
  /*
  1. Find position when collision first occurs, move ball there
  2. Find correct reflected velocity, set velocity to be reflected velocity
  3. Return the distance travelled
  */

  /* 
  Step 1. Determine position of collision
  =======
  This is done with a binary search (BS) between oldCircle & circle position.
  At some point between ogPosition & finalPosition isColliding() begins returning
  true. The BS searches for that position as a percentage of the displacement.
  */
  const BS_DEPTH = 6;
  let percentDistance = 0;

  let ogPosition = oldCircle.pos;
  let finalPosition = circle.pos;
  let collisionNormal = segmentArr[0].normal;

  for (let bsStep=1; bsStep<=BS_DEPTH; bsStep++) {
    let testPercent = percentDistance + 1 / 2**bsStep;
    let lerpedCircle = {...circle};
    lerpedCircle.pos = {
      x: ogPosition.x + testPercent*(finalPosition.x - ogPosition.x),
      y: ogPosition.y + testPercent*(finalPosition.y - ogPosition.y)
    }

    let collisionOccured = false;
    for (var segIndex in segmentArr) {
      const seg = segmentArr[segIndex];
      // If collision exitst
      let collisionInfo = calculateCollisionInfo(seg, lerpedCircle) 
      if (collisionInfo.colliding) {
        collisionOccured = true;
        collisionNormal = collisionInfo.normal;
        break;
      }
    }

    if (collisionOccured) {
      continue;
    } else {
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
  // TODO: Implement specific cases (vel.x *= -1 & vel.y *= -1)?
  const DOT_VALUE = dotProduct(collisionNormal, circle.vel);
  circle.vel.x -= 2*collisionNormal.x*DOT_VALUE;
  circle.vel.y -= 2*collisionNormal.y*DOT_VALUE;


  return DISTANCE_TO_COLLISION;
}



/**
 * Determines whether the circle is colliding with
 * the given segment. Return is NOT boolean.
 * 
 * Return looks like this:
 * {
 *  colliding: true/false,
 *  normal: {x: num, y:num}
 * }
 * 
 * If the circle is on the wrong side of the segment,
 * the collision _will_ still register, i.e. collisions
 * here are 2-sided.
 */
function calculateCollisionInfo (segment, circle) {
  // Default value is no collision
  let collisionData = {
    colliding: false,
    normal: {x:0, y: 0}
  }

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
  let v1 = differenceVector(segment.pointA, circle.pos);
  let distance = Math.abs(dotProduct(segment.normal, v1));
  if (distance > circle.radius) {
    return collisionData;
  }


  // Check 2, signage of vector & normal
  // can say true with certainty
  let v2 = differenceVector(segment.pointB, circle.pos);
  let segVec = differenceVector(segment.pointB, segment.pointA);

  let dotA = dotProduct(v1, segVec);
  let dotB = dotProduct(v2, segVec);
  if ((dotA <= 0 && dotB >= 0) || (dotA >= 0 && dotB <= 0)) {
    collisionData.colliding = true;
    collisionData.normal = segment.normal;
    return collisionData;
  }

  
  // Check 3, collision with endpoints
  // this is the final check to be exhaustive about collisions
  let intersectsPointA = sqDistanceBetweenPoints(segment.pointA, circle.pos) <= circle.radius**2;
  let intersectsPointB = sqDistanceBetweenPoints(segment.pointB, circle.pos) <= circle.radius**2;
  
  if (intersectsPointA) {
    collisionData.colliding = true;
    // Order matters!!!
    let colNormal = normalizedVector(differenceVector(circle.pos, segment.pointA));
    collisionData.normal = colNormal;
  } else if (intersectsPointB) {
    collisionData.colliding = true;
    let colNormal = normalizedVector(differenceVector(circle.pos, segment.pointB));
    collisionData.normal = colNormal;
  }

  return collisionData;
}








//
// Main Physics Loop
//

export function ballMoving (ball) {
  return sqLengthOfVector(ball.vel) > EPSILON_ZERO;
}


// TODO: Check for reaching goal
export function doPhysicsTick (simStatics, simDynamics) {
  /*
  Roughly, this loop likes this:

  Per subframe:
   - move forward
   - check for collision
  
  - adjust velocity (usually a slow down due to friction)
  */
  
  // Move forward
  let ball = simDynamics.ball;
  // const MAX_DIST_PER_SUBFRAME = ball.radius * 0.5;
  const MAX_DIST_PER_SUBFRAME = ball.radius;

  let speed = Math.sqrt(ball.vel.x**2  + ball.vel.y**2);
  let totalDistanceLeft = speed; 

  const MAX_SUBFRAMES = 20;
  var subFrame = 0;
  for (; subFrame<MAX_SUBFRAMES; subFrame++) {
    if (totalDistanceLeft < EPSILON_ZERO) {
      break;
    }

    // normalizedVector(...) creates a copy of the input vector
    let normalizedVel = normalizedVector(ball.vel);
    let adjustedVel = {...ball.vel};

    let distanceMoved = 0;
    let oldBall = {...ball};
    oldBall.pos = {...ball.pos}; // pos is a dict, so when copied above it's by reference

    if (speed <= MAX_DIST_PER_SUBFRAME) {
      distanceMoved = speed;
    } else {
      distanceMoved = MAX_DIST_PER_SUBFRAME;
      adjustedVel.x = normalizedVel.x * MAX_DIST_PER_SUBFRAME;
      adjustedVel.y = normalizedVel.y * MAX_DIST_PER_SUBFRAME;
    }

    ball.pos.x += adjustedVel.x;
    ball.pos.y += adjustedVel.y;


    // Check for collision
    let collidingSegments = [];
    simStatics.walls.forEach((segment) => {
      if (calculateCollisionInfo(segment, ball).colliding) {
        collidingSegments.push(segment);
      }
    });

    if (collidingSegments.length > 0) {
      // distanceMoved = handleCollision(collidingSegments, ball, oldBall);
      handleCollision(collidingSegments, ball, oldBall);
    }

    totalDistanceLeft -= distanceMoved;
  }

  // console.log(`Ball Vel X: ${ball.vel.x}`);


  // Slow down the ball
  if (speed <= GAMEPLAY_CONSTANTS.friction) {
    ball.vel.x = 0;
    ball.vel.y = 0;
  } else {
    let factor = 1 - GAMEPLAY_CONSTANTS.friction / speed;
    factor *= GAMEPLAY_CONSTANTS.dampingCoef;
    ball.vel.x *= factor;
    ball.vel.y *= factor;
  }
}



