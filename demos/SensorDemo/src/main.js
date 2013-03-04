(function () {
    var ANIMATION_FPS = 40, 
        canvas = document.getElementById("canvas"),
        context = canvas.getContext("2d"),
        buffer,

        world = createWorld({
            bounds: [0, 0, canvas.width, canvas.height]
        }),
        
        scale = 60,
        
        robot = RobotFactory.createTankRobot({
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
            sensors: (function () {
                var i, list = [], N = 20;
                
                for (i = 0; i < N; i++) {
                    list.push(SensorFactory.createDistanceSensor({
                        world: world,
                        offset: {x: scale*3/4, y: 0, 
                                 heading: i*Math.PI/(N-1) - Math.PI/2},
                        range: 400
                    }));
                }

                return list;
            })() 
        }),
        

        drawStuff = function () {
            context.putImageData(buffer, 0, 0);
            
            world.draw(context);  
            robot.update();
            robot.draw(context);  
            
            setTimeout(drawStuff, 1000/ANIMATION_FPS);
        };
        
    world.addObstacle(GLib.createPolygon([
        GLib.createPoint(500, 200),
        GLib.createPoint(500, 300),
        GLib.createPoint(600, 300),
        GLib.createPoint(600, 200)
    ]));
    
    world.addObstacle(GLib.createCircle(
        GLib.createPoint(220, 240), 
        10
    ));
    
    world.draw(context);  
    buffer = context.getImageData(0, 0, canvas.width, canvas.height);
    
    document.onkeydown = function (event) {
        robot.keyControl(event.which);
    };

    window.onload = function () {
        drawStuff();
    };
})();













