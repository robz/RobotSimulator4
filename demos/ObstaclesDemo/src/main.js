(function () {
    var ANIMATION_FPS = 40, 
        canvas = document.getElementById("canvas"),
        context = canvas.getContext("2d"),
        buffer = context.getImageData(0, 0, canvas.width, canvas.height),

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
            ])
        }),

        drawStuff = function () {
            context.putImageData(buffer, 0, 0);
            
            robot.update();
            robot.draw(context);
            world.draw(context);    
            
            setTimeout(drawStuff, 1000/ANIMATION_FPS);
        };
        
    world.addObstacle(GLib.createPolygon([
        GLib.createPoint(200, 200),
        GLib.createPoint(300, 300),
        GLib.createPoint(200, 300)
    ]));
    
    world.addObstacle(GLib.createCircle(
        GLib.createPoint(420, 240), 
        10
    ));
    
    document.onkeydown = function (event) {
        robot.keyControl(event.which);
    };

    window.onload = function () {
        drawStuff();
    };
})();