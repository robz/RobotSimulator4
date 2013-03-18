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
            var i, list = [], N = 20;
            
            for (i = 0; i < N; i++) {
                list.push(SensorFactory.createDistanceSensor({
                    world: world,
                    offset: {
                        x: scale*2/3, 
                        y: 0, 
                        heading: i*Math.PI/(N-1) - Math.PI/2
                    },
                    range: 200
                }));
            }

            return list;
        })(),

        gps = SensorFactory.createGPS({
            world: world,
            offset: {x: 0, y: 7, heading: 0}
        }),

        compass = SensorFactory.createCompass({
            world: world,
            offset: {x: 0, y: -7, heading: 0}
        }),
 
        robot = RobotFactory.createTankRobot({
            x: canvas.width/2, 
            y: canvas.height/2,  
            color: "green",
            world: world, 
            length: .7,  
            scale: scale,
            ghostify: true,

            frame: GLib.createPolygon([
                GLib.createPoint(0, -scale/2),
                GLib.createPoint(scale*2/3, -scale/2 + 5),
                GLib.createPoint(scale*2/3, scale/2 - 5),
                GLib.createPoint(0, scale/2),
                GLib.createPoint(-scale*2/3, scale/2 - 5),
                GLib.createPoint(-scale*2/3, -scale/2 + 5),
            ]),
            
            sensors: distanceSensors.concat([gps, compass])
        }),

        drawStuff = function () {
            context.putImageData(buffer, 0, 0);

            //world.draw(context);
            robot.update();
            robot.draw(context);

            setTimeout(drawStuff, 1000/ANIMATION_FPS);
        };

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
        var N = 15, R = 20, rw = 150+R, rh = 100+R, 
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
                R
            ));
        }
    })();
    
    world.draw(context);  
    buffer = context.getImageData(0, 0, canvas.width, canvas.height);
    
    document.onkeydown = function (event) {
        robot.keyControl(event.which);
    };

    window.onload = function () {
        drawStuff();
    };
})();
