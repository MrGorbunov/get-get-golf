/*
Golf.js

So rn I have bad-golf where everything is hardcoded
and golf-ugly where everything is too seperate.

This file is here to act as a hopeful middle ground
and become the ideal route.
*/

import * as Sim from './engine/physics.mjs';



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




// Currently only contains segment arrays, all of which are
// colliders.
//
// In the future should also have an outer bounding box
let simStatics = {
  goal: {
    pos: {x: 75, y:25},
    radius: 15
  },

  walls: [
   {
    pointA: { x: 50, y: 0 },
    pointB: { x: 100, y: 0 },
    normal: { x: 0, y: 1 }
  },
  {
    pointA: { x: 100, y: 0 },
    pointB: { x: 100, y: 50 },
    normal: { x: -1, y: 0 }
  },
  {
    pointA: { x: 100, y: 50 },
    pointB: { x: 50, y: 50 },
    normal: { x: 0, y: -1 }
  },
  {
    pointA: { x: 50, y: 50 },
    pointB: { x: 50, y: 100 },
    normal: { x: -1, y: 0 }
  },
  {
    pointA: { x: 50, y: 100 },
    pointB: { x: 0, y: 100 },
    normal: { x: 0, y: -1 }
  },
  {
    pointA: { x: 0, y: 100 },
    pointB: { x: 0, y: 50 },
    normal: { x: 1, y: 0 }
  },
  {
    pointA: { x: 0, y: 50 },
    pointB: { x: 50, y: 0 },
    normal: { x: 0.7071067811865475, y: 0.7071067811865475 }
  }
  ],
}

let simDynamics = {
  ball: {
    pos: {x: 40, y:40},
    vel: {x: 10, y:1},
    radius: 10,
  }
}







const DEBUG_PALLETE = {
  'background': 0x383221, // #383221
  'obstacles': 0xed8c78,  // #ed8c78
  'goal': 0xfd9c98,       // #bd5c58
  // 'normals': 0x,
  'ball': 0x8cbace        // #8cbace
}






//
// Rendering Functions
//

// TODO: Draw normals for the segments & velocity for the ball

/**
 * Returns a Container (PIXI.Graphics) with graphics representing
 * simStatics. It loops through simStatics.walls for segments & 
 * also draws simStatics.goal.
 */
function generateDebugStaticsContainer (simStatics) {

  let wallsGraphic = new PIXI.Graphics();
  wallsGraphic.lineStyle(2, DEBUG_PALLETE.obstacles);

  // This way we're not assuming the walls are continuous
  simStatics.walls.forEach((segment) => {
    wallsGraphic.moveTo(segment.pointA.x, segment.pointA.y);
    wallsGraphic.lineTo(segment.pointB.x, segment.pointB.y);
  });

  // And now we draw the goal (circle);
  wallsGraphic.beginFill(DEBUG_PALLETE.goal);
  wallsGraphic.lineStyle(0);
  let goal = simStatics.goal;
  wallsGraphic.drawCircle(goal.pos.x, goal.pos.y, goal.radius);

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


function updateBallContainer (simDynamics, ballContainer) {
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
  // If the ball is moving we want to keep simulating
  if (Sim.ballMoving(simDynamics.ball)) {
    Sim.doPhysicsTick(simStatics, simDynamics);
    updateBallContainer(simDynamics, containerBall);

  // When it stops we can take input
  } else {

  }

}







