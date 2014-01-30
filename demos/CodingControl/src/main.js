(function () {
    "use strict";
    
    var ANIMATION_FPS = 40,

        canvas = document.getElementById("canvas"),
        context = canvas.getContext("2d"),
        buffer = context.getImageData(0, 0, canvas.width, canvas.height),
        
        codeMirror = CodeMirror.fromTextArea(document.getElementById("code_textarea")),
        
        world = createWorld({
            bounds: [0, 0, canvas.width, canvas.height]
        }),
        
        robot = RobotFactory.createTankRobot({
            x: canvas.width / 2,
            y: canvas.height - canvas.height / 8,
            heading: Math.PI * 3 / 2,
            world: world,
            scale: 40,
            color: "green"
        }),
    
        robotAPIs = createRobotAPIs(robot),
        
        isPaused = false,
        controlIteration = function () {},
        
        readProgram = function () {
            // get the text that the user has typed
            var programString = codeMirror.getValue();
            
            // store it locally so that it's persistent between page refereshes
            localStorage.setItem("robotProgram", programString);
            
            // strict-ify the user's code so that it is executed in its own scope
            programString = "'use strict';\n\n" + programString + "\n\ncontrolIteration";
            
            // obtain a reference to the controlIteration function that the user wrote
            controlIteration = eval(programString);
        },
        
        log = function (obj) {
            var textarea = document.getElementById("log_textarea");
            textarea.value += obj + "\n";
            textarea.scrollTop = textarea.scrollHeight;
        },

        drawStuff = function () {
            if (!isPaused) {
                robot.update();
            }
            
            context.putImageData(buffer, 0, 0);
            robot.draw(context);
            
            setTimeout(drawStuff, 1000 / ANIMATION_FPS);
        };

    document.getElementById("gobutton").onclick = function () {
        readProgram();
    };
    
    document.getElementById("resetbutton").onclick = function () {
        robot = RobotFactory.createTankRobot({
            x: canvas.width / 2,
            y: canvas.height - canvas.height / 8,
            heading: Math.PI * 3 / 2,
            world: world,
            scale: 40,
            color: "green"
        });
    
        robotAPIs = createRobotAPIs(robot);
        
        controlIteration = function () {};
    };
    
    document.getElementById("pausebutton").onclick = function () {
        if (isPaused) {
            document.getElementById("pausebutton").innerHTML = "pause";
        } else {
            document.getElementById("pausebutton").innerHTML = "unpause";
        }
        
        isPaused = !isPaused;
    };

    if (localStorage.getItem("robotProgram")) {
        codeMirror.setValue(localStorage.getItem("robotProgram"));
    }

    codeMirror.getScrollerElement().style.height = canvas.height - 50;
    
    // "loop" over the user's provided controlIteration function (noops if flash hasn't been pressed)
    setInterval(function () {
        if (!isPaused) {
            controlIteration(robotAPIs, log);
        }
    }, 100);

    drawStuff();
}());