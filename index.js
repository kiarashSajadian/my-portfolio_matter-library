// Wait for DOM to be fully loaded before initializing
document.addEventListener("DOMContentLoaded", function () {
  // Check if the container exists before proceeding
  const matterContainer = document.querySelector("#matter-container");
  if (!matterContainer) {
    console.error(
      "Matter container not found! Make sure you have an element with id 'matter-container'"
    );
    return;
  }

  // Constants
  const THICCNESS = 60;
  const SVG_PATH_SELECTOR = "#matter-path";
  const SVG_WIDTH_IN_PX = 100;
  const SVG_WIDTH_AS_PERCENT_OF_CONTAINER_WIDTH = 0.3;
  const START_DELAY = 2000; // 2 second delay before starting

  // Wait a moment to ensure all resources are loaded
  setTimeout(function () {
    initPhysics(matterContainer);
  }, 100);

  function initPhysics(container) {
    // Check if Matter.js is loaded
    if (typeof Matter === "undefined") {
      console.error("Matter.js library not loaded!");
      return;
    }

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
      element: container,
      engine: engine,
      options: {
        width: container.clientWidth,
        height: container.clientHeight,
        background: "transparent",
        wireframes: false,
        showAngleIndicator: false,
      },
    });

    // Setup all physics bodies
    var ground, leftWall, rightWall;

    function setupWorld() {
      // Create physics bodies
      createCircle();
      createSvgBodies();

      ground = Bodies.rectangle(
        container.clientWidth / 2,
        container.clientHeight + THICCNESS / 2,
        27184,
        THICCNESS,
        { isStatic: true }
      );

      leftWall = Bodies.rectangle(
        0 - THICCNESS / 2,
        container.clientHeight / 2,
        THICCNESS,
        container.clientHeight * 5,
        {
          isStatic: true,
        }
      );

      rightWall = Bodies.rectangle(
        container.clientWidth + THICCNESS / 2,
        container.clientHeight / 2,
        THICCNESS,
        container.clientHeight * 5,
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
            visible: false,
          },
        },
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
        container.clientWidth * SVG_WIDTH_AS_PERCENT_OF_CONTAINER_WIDTH;
      let circle = Bodies.circle(
        container.clientWidth / 2,
        10,
        circleDiameter / 2,
        {
          friction: 0.3,
          frictionAir: 0.00001,
          restitution: 0.8,
          render: {
            fillStyle: "#ECA869",
            strokeStyle: "#ECA869",
          },
        }
      );
      Composite.add(engine.world, circle);
    }

    function createSvgBodies() {
      const paths = document.querySelectorAll(SVG_PATH_SELECTOR);
      if (paths.length === 0) {
        console.warn("No SVG paths found with selector: " + SVG_PATH_SELECTOR);
      }

      paths.forEach((path, index) => {
        let vertices = Svg.pathToVertices(path);
        let scaleFactor =
          (container.clientWidth * SVG_WIDTH_AS_PERCENT_OF_CONTAINER_WIDTH) /
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
              lineWidth: 1,
            },
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
          (container.clientWidth * SVG_WIDTH_AS_PERCENT_OF_CONTAINER_WIDTH) /
          bodyWidth;

        Body.scale(body, scaleFactor, scaleFactor);
      });
    }

    function handleResize() {
      // set canvas size to new values
      render.canvas.width = container.clientWidth;
      render.canvas.height = container.clientHeight;

      // reposition ground
      Body.setPosition(
        ground,
        Vector.create(
          container.clientWidth / 2,
          container.clientHeight + THICCNESS / 2
        )
      );

      // reposition right wall
      Body.setPosition(
        rightWall,
        Vector.create(
          container.clientWidth + THICCNESS / 2,
          container.clientHeight / 2
        )
      );

      scaleBodies();
    }

    // Set up the physics world
    setupWorld();

    // Start the simulation after delay
    console.log("Starting simulation after " + START_DELAY / 1000 + " seconds");
    setTimeout(function () {
      // run the renderer
      Render.run(render);

      // create runner
      var runner = Runner.create();

      // run the engine
      Runner.run(runner, engine);

      console.log("Physics simulation started");
    }, START_DELAY);

    // Handle window resizing
    window.addEventListener("resize", function () {
      handleResize();
    });
  }
});
