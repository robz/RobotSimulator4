(function () {
    var ANIMATION_FPS = 40, 
        canvas = document.getElementById("canvas"),
        context = canvas.getContext("2d"),
        buffer,

        world = createWorld({
            bounds: [0, 0, canvas.width, canvas.height]
        }),
        
        scale = 60,

        distanceSensors = (function () {
            var i, list = [], N = 50;
            
            for (i = 0; i < N; i++) {
                list.push(SensorFactory.createDistanceSensor({
                    world: world,
                    offset: {
                        x: scale*2/3, 
                        y: 0, 
                        heading: i*Math.PI/(N-1) - Math.PI/2
                    },
                    range: 100
                }));
            }

            return list;
        })(),

        GPS = SensorFactory.createGPS({
            world: world,
            offset: {x: 0, y: 7, heading: 0}
        }),

        compass = SensorFactory.createCompass({
            world: world,
            offset: {x: 0, y: -7, heading: 0}
        }),
 
        robot = RobotFactory.createTankRobot({
            ghostify: true,
            x: canvas.width/2, 
            y: canvas.height/2,  
            color: "green",
            world: world, 
            length: .7,  
            scale: scale,

            frame: GLib.createPolygon([
                GLib.createPoint(0, -scale/2),
                GLib.createPoint(scale*2/3, -scale/2 + 5),
                GLib.createPoint(scale*2/3, scale/2 - 5),
                GLib.createPoint(0, scale/2),
                GLib.createPoint(-scale*2/3, scale/2 - 5),
                GLib.createPoint(-scale*2/3, -scale/2 + 5),
            ]),
            
            sensors: distanceSensors.concat([GPS, compass])
        }),
        
        motors = SensorFactory.createMotors({robot:robot}),
        
        navigator = createNavigator(
            motors,
            distanceSensors,
            GPS, 
            compass
        ),

        drawStuff = function () {
            context.putImageData(buffer, 0, 0);

            //world.draw(context);
            robot.update();
            navigator.iterate();
            robot.draw(context);
            navigator.draw2(context);

            setTimeout(drawStuff, 1000/ANIMATION_FPS);
        };
    
    // add the navigator program's node to the robot so that
    // it can easily draw things in the robot's reference frame
    robot.addNode(navigator.node);

    world.addObstacle(GLib.createBoxPolygon(0, 0, canvas.width, 5));
    world.addObstacle(GLib.createBoxPolygon(0, 0, 5, canvas.height));
    world.addObstacle(GLib.createBoxPolygon(
        canvas.width - 5, 0, 5, canvas.height
    ));
    world.addObstacle(GLib.createBoxPolygon(
        0, canvas.height - 5, canvas.width, 5
    ));
    
    // generate barrels
    (function () {
        var N = 8, radius = 30, rw = 150 + radius, rh = 100 + radius, 
            rx = robot.getPose().x, ry = robot.getPose().y,
            i, x, y;

        for (i = 0; i < N; i++) {
            do {
                x = Math.random()*canvas.width;
                y = Math.random()*canvas.height;
            } while (x > rx - rw/2 && x < rx + rw/2 && 
                     y > ry - rh/2 && y < ry + rh/2);
            
            world.addObstacle(GLib.createCircle(
                GLib.createPoint(x, y), 
                radius
            ));
        }
    })();
    
    world.draw(context);  
    buffer = context.getImageData(0, 0, canvas.width, canvas.height);
    
    robot.update();
    navigator.setGoal(GLib.createPoint(canvas.width*2/3, canvas.height/2));
    
    document.onkeydown = function (event) {
        robot.keyControl(event.which);
    };
    
    document.getElementById("canvas").onmousedown = function (event) {
        var mouseX, mouseY, clickedPos;

        if (event.offsetX) {
            mouseX = event.offsetX;
            mouseY = event.offsetY;
        } else if (event.layerX) {
            mouseX = event.layerX - canvas.offsetLeft;
            mouseY = event.layerY - canvas.offsetTop;
        } else {
            console.log("bro, what click just happened?");
            return;
        }

        clickedPos = GLib.createPoint(mouseX, mouseY);
        navigator.setGoal(clickedPos);
    };

    window.onload = function () {
        drawStuff();
    };
})();
