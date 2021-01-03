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

import * as Util from './utility.mjs';




// TODO: Generator functions



//
// Physics Constants
//

// TODO: Maybe this should be generated and passed into functions?
const GAMEPLAY_CONSTANTS = {
  friction: 0.06,
  dampingCoef: 0.99 // Should be on range (0, 1], and ideally close to 1 (0.999 is good)
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
  const DISTANCE_TO_COLLISION = percentDistance *
      Util.distanceBetweenPoints(collisionPos, ogPosition);

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
  const DOT_VALUE = Util.dotProduct(collisionNormal, circle.vel);
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
  let v1 = Util.differenceVector(segment.pointA, circle.pos);
  let distance = Math.abs(Util.dotProduct(segment.normal, v1));
  if (distance > circle.radius) {
    return collisionData;
  }


  // Check 2, signage of vector & normal
  // can say true with certainty
  let v2 = Util.differenceVector(segment.pointB, circle.pos);
  let segVec = Util.differenceVector(segment.pointB, segment.pointA);

  let dotA = Util.dotProduct(v1, segVec);
  let dotB = Util.dotProduct(v2, segVec);
  if ((dotA <= 0 && dotB >= 0) || (dotA >= 0 && dotB <= 0)) {
    collisionData.colliding = true;
    collisionData.normal = segment.normal;
    return collisionData;
  }

  
  // Check 3, collision with endpoints
  // this is the final check to be exhaustive about collisions
  let intersectsPointA = Util.sqDistanceBetweenPoints(segment.pointA, circle.pos) <= circle.radius**2;
  let intersectsPointB = Util.sqDistanceBetweenPoints(segment.pointB, circle.pos) <= circle.radius**2;
  
  if (intersectsPointA) {
    collisionData.colliding = true;
    // Order matters!!!
    let colNormal = Util.normalizedVector(Util.differenceVector(circle.pos, segment.pointA));
    collisionData.normal = colNormal;
  } else if (intersectsPointB) {
    collisionData.colliding = true;
    let colNormal = Util.normalizedVector(Util.differenceVector(circle.pos, segment.pointB));
    collisionData.normal = colNormal;
  }

  return collisionData;
}








//
// Main Physics Loop
//

// TODO: Really, doPhysicsTick should return a dictionary with info about ball speed & goal status

export function ballMoving (ball) {
  return Util.sqLengthOfVector(ball.vel) > Util.EPSILON_ZERO;
}


export function inGoal (simStatics, ball) {
  const sqDistBetween = Util.sqDistanceBetweenPoints(simStatics.goal.pos, ball.pos);
  return sqDistBetween <= simStatics.goal.radius**2;
}


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
    if (totalDistanceLeft < Util.EPSILON_ZERO) {
      break;
    }

    // normalizedVector(...) creates a copy of the input vector
    let normalizedVel = Util.normalizedVector(ball.vel);
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



