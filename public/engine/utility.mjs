/*
Utility.mjs

Contains utility functions & variables, right now just
vector operations & epsilons.
*/



//
// Epsilons
//

export const EPSILON_ZERO = 0.00001;





//
// Vector Functions
//
// All functoins return their value, there are NO mutations

export function sqDistanceBetweenPoints (pointA, pointB) {
  return (pointA.x - pointB.x)**2 + (pointA.y - pointB.y)**2;
}

export function distanceBetweenPoints (pointA, pointB) {
  return Math.sqrt((pointA.x - pointB.x)**2 + (pointA.y - pointB.y)**2);
}

export function sqLengthOfVector (vec) {
  return vec.x**2 + vec.y**2;
}

export function lengthOfVector (vec) {
  return Math.sqrt(vec.x**2 + vec.y**2);
}

export function dotProduct (vecA, vecB) {
  return vecA.x * vecB.x + vecA.y * vecB.y;
}

/**
 * Returns A - B
 * i.e. the vector from B -> A
 */
export function differenceVector (vecA, vecB) {
  return {'x': vecA.x - vecB.x, 'y': vecA.y - vecB.y};
}

export function normalizedVector (vec) {
  if (Math.abs(vec.x) <= EPSILON_ZERO && Math.abs(vec.y) <= EPSILON_ZERO) {
    return {x: 0, y:0};
  }
  
  let localVec = {...vec}
  const length = lengthOfVector(localVec);
  localVec.x /= length;
  localVec.y /= length;
  return localVec;
}

