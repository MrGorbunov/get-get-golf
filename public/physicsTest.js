const sim = require('./engine/physics');

let segs = sim.generateSegmentsArray([
  sim.generatePoint(0, 0),
  sim.generatePoint(10, 0),
  sim.generatePoint(10, 3),
  sim.generatePoint(0, 3)
]);

let circle = sim.generateCircle(0, 0, 1);

console.log("Finished");
