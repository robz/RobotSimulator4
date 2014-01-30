(function () {
    "use strict";
    
    var ANIMATION_FPS = 40,

        canvas = document.getElementById("canvas"),
        context = canvas.getContext("2d"),
        buffer = context.getImageData(0, 0, canvas.width, canvas.height),
        
        robot = RobotFactory.createTankRobot({
            x: canvas.width / 2,
            y: canvas.height - canvas.height / 8,
            heading: Math.PI * 3 / 2,
            scale: 40,
            color: "green"
        }),
    
        robotAPIs = createRobotAPIs(robot),
        
        program = { iteration: function () {} },
        
        readProgram = function () {
            var programString = document.getElementById("textarea").value;
            localStorage.setItem("robotProgram", programString);
            programString = "'use strict';\n\n" + programString + "\n\nprogram";
            program = eval(programString);
        },
        
        drawStuff = function () {
            context.putImageData(buffer, 0, 0);
            
            program.iteration(robotAPIs);
            robot.update();
            robot.draw(context);

            setTimeout(drawStuff, 1000 / ANIMATION_FPS);
        };

    document.getElementById("gobutton").onclick = function () {
        readProgram();
    };
    
    if (localStorage.getItem("robotProgram")) {
        document.getElementById("textarea").value = localStorage.getItem("robotProgram");
    }
    
    makeTabsWork("textarea");

    drawStuff();
}());