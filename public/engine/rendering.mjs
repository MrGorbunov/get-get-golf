/*
Rendering.js

Thie file converts the dicts of from physics.js to
actual things on the screen.

PIXI.Application must be instantiated seperately,
instead this file takes in the PIXI.Application. Also,
pixi.min.js _must_ have been called prior to this.
*/


//
// Globals of this file
//

const PALLETE = {
  'background': 0x1E252F,
  'obstacle': 0x7AD585,
  'ball': 0xB786AD
}








//
// Debug Drawing
//

export function drawDebugCircle (graphicsObject, circle) {
  graphicsObject.lineStyle(0);
  graphicsObject.beginFill(PALLETE.ball);
  graphicsObject.drawCircle(circle.center.x, circle.center.y, circle.radius);
}

export function drawDebugSegment (graphicsObject, segment) {
  graphicsObject.lineStyle(2, PALLETE.obstacle);
  graphicsObject.moveTo(segment.pointA.x, segment.pointA.y);
  graphicsObject.lineTo(segment.pointB.x, segment.pointB.y);
}

export function drawDebugSegmentArray (graphicsObject, segmentArray, fillIn=true) {
  if (fillIn) {
    graphicsObject.lineStyle(0);
    graphicsObject.beginFill(PALLETE.obstacle);
    let firstPoint = segmentArray[0].pointA;
    graphicsObject.moveTo(firstPoint.x, firstPoint.y);

    segmentArray.forEach((segment) => {
      graphicsObject.lineTo(segment.pointB.x, segment.pointB.y);
    });
    graphicsObject.closePath();
    graphicsObject.endFill();

  } else {
    segmentArray.forEach((segment) => {drawDebugSegment(graphicsObject, segment)});
  }
}


