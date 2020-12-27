/*
Collisions.js

This file contains functions to produce shapes (dicts) and
then check for collisions. Because this engine is for a golf 
game, the only collision detection necessary is between
these polygons & a circle.

Polyongs do NOT necessarily have to be convex. When
created, they are stored as dicts of line segments.
Collision is done by looping against every segment,
there is NO notion of inside vs outside a shape.

Additionally, instead of classes this file contains
functions that operate on dicts. These are what the
dicts looks like:

Segment Array (remember, there is no notion of open vs closed shape) 
- normal is always normalized
[
  {'pointA': {'x': 1, 'y': 2},  'pointB': {'x': 23, 'y': 2},  'normal': {0, 1} }, 
  {'pointA': {'x': 23, 'y': 2},  'pointB': {'x': 23, 'y': 20},  'normal': {1, 0} }
]

Point (and Vector) Dict
{
  'x': 2,
  'y': 4
}

Circle Dict
{ 
  'center': {
    'x': 0,
    'y': 3
  }
  'radius': 2
}
*/





//
// Internal Utility Functions
//

/*
These guys don't get exported
*/

function lengthOfVector (vec) {
  return Math.sqrt(vec.x**2 + vec.y**2);
}

/**
 * Returns A - B
 * i.e. B -> A
 */
function subtractVectors (vecA, vecB) {
  return generatePoint(vecA.x - vecB.x, vecA.y - vecB.y);
}

function distanceBetweenPoints (pointA, pointB) {
  return Math.sqrt((pointA.x - pointB.x)**2 + (pointA.y - pointB.y)**2);
}

function sqDistanceBetweenPoints (pointA, pointB) {
  return (pointA.x - pointB.x)**2 + (pointA.y - pointB.y)**2;
}

function dotProduct (vecA, vecB) {
  return vecA.x * vecB.x + vecA.y * vecB.y;
}






//
// Generator Functions
//

/*
These functions will only be called when the scene is initialized, afterwards
everything is stored in memory in the dicts & arrays.

That is why there is so much sanitation. Robustness is far more important than
time complexity here.
*/

function generatePoint (x, y) {
  if (typeof x !== 'number') throw 'x of circle position must be a number!';
  if (typeof y !== 'number') throw 'y of circle position must be a number!';

  return {'x': x, 'y': y};
}



function generateCircle (x, y, radius) {
  if (typeof x !== 'number') throw 'x of circle position must be a number!';
  if (typeof y !== 'number') throw 'y of circle position must be a number!';
  if (typeof radius !== 'number') throw 'radius of circle must be a number!';
  // Technically using radius 0 may be useful for point collision detection
  // but that's not necessary for what I'm doing right now
  if (radius <= 0) throw 'radius of circle must be greater than 0!';

  return {
    'center': {'x': x, 'y': y},
    'radius': radius
  };
}



/**
 * clockwisePointArray must have the points in clockwise
 * order. The resulting shape can be concave! It's just
 * the points must connect and in a generally clockwise order.
 * 
 * closeLoop if true, will create an edge between the first &
 * last point in the supplied point array.
 * 
 * clockwisePointArray assumes its inputs are pointDicts.
 */
function generateSegmentsArray (clockwisePointArray, closeLoop = true) {
  const NUM_POINTS = clockwisePointArray.length;
  if (NUM_POINTS < 2) throw 'clockwisePointArray must be at least length 2 (aka a single segment)'

  let segmentsArray = [];

  for (let i=0; i<NUM_POINTS; i++) {
    if (i + 1 == NUM_POINTS && !closeLoop) break;

    let pointA = clockwisePointArray[i];
    let pointB = clockwisePointArray[(i+1) % NUM_POINTS];

    /*
    vector of line = B -> A = A - B
                   = <pA.x - pB.x,  pA.y - pB.y>    *sign matters*
    normal of vector = vec X <0, 0, 1> = <y, -x>
    final vector = <pA.y - pB.y, pB.x - pA.x>
    */
    let normalVec = generatePoint(pointA.y - pointB.y, pointB.x - pointA.x);

    /*
    |V| = sqrt(x^2 + y^2)
    normalized (V) = V / |V|
    */
    let sizeOfNormalVec = Math.sqrt(normalVec.x**2 + normalVec.y**2);
    normalVec.x /= sizeOfNormalVec;
    normalVec.y /= sizeOfNormalVec;

    segmentsArray.push({
      'pointA': pointA,
      'pointB': pointB,
      'normal': normalVec
    });
  }

  return segmentsArray;
}







//
// Collision Function
//

/*
  :DDDDDD
  
  This isColliding method is very fast for what I need it to do.

  40,000,000 calls took ~1.3 seconds
*/

/**
 * Determins whether the circle is colliding with
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
  let distance = Math.abs(dotProduct(segment.normal, circle.center));
  if (distance > circle.radius) {
    return false;
  }


  // Check 2, signage of vector & normal
  // can say true with certainty
  let v1 = subtractVectors(segment.pointA, circle.center);
  let v2 = subtractVectors(segment.pointB, circle.center);
  let segVec = subtractVectors(segment.pointB, segment.pointA);

  let dotA = dotProduct(v1, segVec);
  let dotB = dotProduct(v2, segVec);
  if ((dotA <= 0 && dotB >= 0) || (dotA >= 0 && dotB <= 0)) {
    return true;
  }

  
  // Check 3, collision with endpoints
  // this is the final check to be exhaustive about collisions
  return (sqDistanceBetweenPoints(segment.pointA, circle.center) <= circle.radius**2 ||
          sqDistanceBetweenPoints(segment.pointB, circle.center) <= circle.radius**2)
}












module.exports = { generatePoint, generateCircle, generateSegmentsArray, isColliding };





