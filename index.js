<script src="https://cdnjs.cloudflare.com/ajax/libs/matter-js/0.18.0/matter.min.js" integrity="sha512-5T245ZTH0m0RfONiFm2NF0zcYcmAuNzcGyPSQ18j8Bs5Pbfhp5HP1hosrR8XRt5M3kSRqzjNMYpm2+it/AUX/g==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
<script src="https://cdn.jsdelivr.net/npm/pathseg@1.2.1/pathseg.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/poly-decomp@0.3.0/build/decomp.min.js"></script>
// Set the delay time in milliseconds before starting the physics simulation
const START_DELAY = 2000; // 2 seconds

const THICCNESS = 60;
const SVG_PATH_SELECTOR = "#matter-path";
const SVG_WIDTH_IN_PX = 100;
const SVG_WIDTH_AS_PERCENT_OF_CONTAINER_WIDTH = 0.3;

const matterContainer = document.querySelector("#matter-container");

// module aliases
var Engine = Matter.Engine,
  Render = Matter.Render,
  Runner = Matter.Runner,
  Bodies = Matter.Bodies,
  Composite = Matter.Composite,
  Body = Matter.Body,
  Svg = Matter.Svg,
  Vector = Matter.Vector,
  Vertices = Matter.Vertices;

// create an engine
var engine = Engine.create();

// create a renderer
var render = Render.create({
  element: matterContainer,
  engine: engine,
  options: {
    width: matterContainer.clientWidth,
    height: matterContainer.clientHeight,
    background: "transparent",
    wireframes: false,
    showAngleIndicator: false
  }
});

// All setup happens immediately, but we'll start the physics after the delay
setupPhysicsWorld();

// Delayed start of the physics simulation
setTimeout(() => {
  // run the renderer
  Render.run(render);
  
  // create runner
  var runner = Runner.create();
  
  // run the engine
  Runner.run(runner, engine);
  
  console.log("Physics simulation started after", START_DELAY/1000, "seconds");
}, START_DELAY);

// Setup function that creates all physics bodies
function setupPhysicsWorld() {
  createCircle();
  createSvgBodies();
  
  var ground = Bodies.rectangle(
    matterContainer.clientWidth / 2,
    matterContainer.clientHeight + THICCNESS / 2,
    27184,
    THICCNESS,
    { isStatic: true }
  );
  
  let leftWall = Bodies.rectangle(
    0 - THICCNESS / 2,
    matterContainer.clientHeight / 2,
    THICCNESS,
    matterContainer.clientHeight * 5,
    {
      isStatic: true
    }
  );
  
  let rightWall = Bodies.rectangle(
    matterContainer.clientWidth + THICCNESS / 2,
    matterContainer.clientHeight / 2,
    THICCNESS,
    matterContainer.clientHeight * 5,
    { isStatic: true }
  );
  
  // add all of the bodies to the world
  Composite.add(engine.world, [ground, leftWall, rightWall]);
  
  let mouse = Matter.Mouse.create(render.canvas);
  let mouseConstraint = Matter.MouseConstraint.create(engine, {
    mouse: mouse,
    constraint: {
      stiffness: 0.2,
      render: {
        visible: false
      }
    }
  });
  
  Composite.add(engine.world, mouseConstraint);
  
  // allow scroll through the canvas
  mouseConstraint.mouse.element.removeEventListener(
    "mousewheel",
    mouseConstraint.mouse.mousewheel
  );
  mouseConstraint.mouse.element.removeEventListener(
    "DOMMouseScroll",
    mouseConstraint.mouse.mousewheel
  );
  
  console.log("Physics world set up, waiting to start");
}

function createCircle() {
  let circleDiameter =
    matterContainer.clientWidth * SVG_WIDTH_AS_PERCENT_OF_CONTAINER_WIDTH;
  let circle = Bodies.circle(
    matterContainer.clientWidth / 2,
    10,
    circleDiameter / 2,
    {
      friction: 0.3,
      frictionAir: 0.00001,
      restitution: 0.8,
      render: {
        fillStyle: "#ECA869",
        strokeStyle: "#ECA869"
      }
    }
  );
  Composite.add(engine.world, circle);
}

function createSvgBodies() {
  const paths = document.querySelectorAll(SVG_PATH_SELECTOR);
  paths.forEach((path, index) => {
    let vertices = Svg.pathToVertices(path);
    let scaleFactor =
      (matterContainer.clientWidth * SVG_WIDTH_AS_PERCENT_OF_CONTAINER_WIDTH) /
      SVG_WIDTH_IN_PX;
    vertices = Vertices.scale(vertices, scaleFactor, scaleFactor);
    let svgBody = Bodies.fromVertices(
      index * SVG_WIDTH_IN_PX + 200,
      0,
      [vertices],
      {
        friction: 0.3,
        frictionAir: 0.00001,
        restitution: 0.8,
        render: {
          fillStyle: "#464655",
          strokeStyle: "#464655",
          lineWidth: 1
        }
      }
    );
    Composite.add(engine.world, svgBody);
  });
}

function scaleBodies() {
  const allBodies = Composite.allBodies(engine.world);

  allBodies.forEach((body) => {
    if (body.isStatic === true) return; // don't scale walls and ground
    const { min, max } = body.bounds;
    const bodyWidth = max.x - min.x;
    let scaleFactor =
      (matterContainer.clientWidth * SVG_WIDTH_AS_PERCENT_OF_CONTAINER_WIDTH) /
      bodyWidth;

    Body.scale(body, scaleFactor, scaleFactor);
  });
}

function handleResize(matterContainer) {
  // set canvas size to new values
  render.canvas.width = matterContainer.clientWidth;
  render.canvas.height = matterContainer.clientHeight;

  // reposition ground
  Body.setPosition(
    ground,
    Vector.create(
      matterContainer.clientWidth / 2,
      matterContainer.clientHeight + THICCNESS / 2
    )
  );

  // reposition right wall
  Body.setPosition(
    rightWall,
    Vector.create(
      matterContainer.clientWidth + THICCNESS / 2,
      matterContainer.clientHeight / 2
    )
  );

  scaleBodies();
}

window.addEventListener("resize", () => handleResize(matterContainer));