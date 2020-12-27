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

const Graphics = new PIXI.Graphics();
const PALLETE = {
  'background': 0x1E252F,
  'obstacle': 0x7AD585,
  'ball': 0xB786AD
}

export function getGraphicsObject () {
  return Graphics;
}







//
// Actual Drawing
//

export function drawCircle (circle) {
  Graphics.beginFill(PALLETE.ball);
  Graphics.drawCircle(circle.center.x, circle.center.y, circle.radius);
}

export function drawSegment (segment) {
  Graphics.lineStyle(2, PALLETE.obstacle);
  Graphics.moveTo(segment.pointA.x, segment.pointA.y);
  Graphics.lineTo(segment.pointB.x, segment.pointB.y);
}

export function drawSegmentArray (segmentArray, fillIn=true) {
  if (fillIn) {
    Graphics.beginFill(PALLETE.obstacle);
    let firstPoint = segmentArray[0].pointA;
    Graphics.moveTo(firstPoint.x, firstPoint.y);

    segmentArray.forEach((segment) => {
      Graphics.lineTo(segment.pointB.x, segment.pointB.y);
    });
    Graphics.closePath();
    Graphics.endFill();

  } else {
    segmentArray.forEach((segment) => {drawSegment(segment)});
  }
}

