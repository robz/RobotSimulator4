/*jslint browser: true */
/*global CodeMirror, createWorld, RobotFactory, createRobotAPIs, Worker, requestAnimationFrame */

(function () {
    "use strict";
    
    var canvas = document.getElementById("canvas"),
        context = canvas.getContext("2d"),
        buffer = context.getImageData(0, 0, canvas.width, canvas.height),

        codeTextarea = CodeMirror.fromTextArea(
            document.getElementById("code_textarea"),
            { lineNumbers: true }
        ),
        logTextarea = document.getElementById("log_textarea"),
        errorTextarea = document.getElementById("error_textarea"),
        programBtn = document.getElementById("gobutton"),
        resetBtn = document.getElementById("resetbutton"),
        pauseBtn = document.getElementById("pausebutton"),

        world = createWorld({
            bounds: [0, 0, canvas.width, canvas.height]
        }),

        gametimer = (function () {
            var time = new Date().getTime(),
                time_before_pause = 0,
                isPaused = false;
            
            return {
                getTime: function () {
                    if (isPaused) {
                        return time_before_pause;
                    }
                    
                    return new Date().getTime() - time + time_before_pause;
                },
                
                pause: function () {
                    time_before_pause += new Date().getTime() - time;
                    isPaused = true;
                },
                
                unpause: function () {
                    time = new Date().getTime();
                    isPaused = false;
                }
            };
        }()),

        robot = RobotFactory.createTankRobot({
            x: canvas.width / 2,
            y: canvas.height - canvas.height / 8,
            heading: Math.PI * 3 / 2,
            world: world,
            scale: 40,
            color: "green",
            getTime: gametimer.getTime
        }),

        isPaused = false,

        robotAPIs = createRobotAPIs(robot),
        
        log = function (obj) {
            var textarea = logTextarea;
            textarea.value += obj + "\n";
            textarea.scrollTop = textarea.scrollHeight;
        },

        worker = new Worker("src/worker.js"),
        
        readProgram = function () {
            // get the text that the user has typed
            var programString = codeTextarea.getValue();
            
            // store it locally so that it's persistent between page refereshes
            localStorage.setItem("robotProgram", programString);
            
            worker.postMessage({id: "readProgram", arg: programString});
        },

        drawStuff = function () {
            if (!isPaused) {
                robot.update();
            }

            context.putImageData(buffer, 0, 0);
            robot.draw(context);
            
            requestAnimationFrame(drawStuff);
        };

    // set the height of the code mirror, and compensate for the button heights (I couldn't figure out how to do this with CSS)
    codeTextarea.getScrollerElement().style.height = canvas.height - 50;
    codeTextarea.lineNumbers = true;
    
    //
    // setup button click behavior
    //
    programBtn.onclick = function () {
        readProgram();
        errorTextarea.value = "";
    };
    
    resetBtn.onclick = function () {
        robot = RobotFactory.createTankRobot({
            x: canvas.width / 2,
            y: canvas.height - canvas.height / 8,
            heading: Math.PI * 3 / 2,
            world: world,
            scale: 40,
            color: "green",
            getTime: gametimer.getTime
        });
    
        robotAPIs = createRobotAPIs(robot);
        
        worker.postMessage({id: "readProgram", arg: "function controlIteration() {}"});
        errorTextarea.value = "";
    };
    
    pauseBtn.onclick = function () {
        if (isPaused) {
            pauseBtn.innerHTML = "pause";
            gametimer.unpause();
        } else {
            pauseBtn.innerHTML = "unpause";
            gametimer.pause();
        }
        
        isPaused = !isPaused;
    };

    // use the last saved program, if it exists
    if (localStorage.getItem("robotProgram")) {
        codeTextarea.setValue(localStorage.getItem("robotProgram"));
    }
    
    //
    // set up webworker handler
    //
    worker.onmessage = function (e) {
        if (robotAPIs[e.data.id]) {
			robotAPIs[e.data.id](e.data.arg);
        } else if (e.data.id === "log") {
            log(e.data.arg);
        }
    };
    
    worker.onerror = function (e) {
        // TODO: print error to console
        var errorMessage = "line " + (e.lineno - 2) + ": " + e.message;
        errorTextarea.value += errorMessage + "\n";
        errorTextarea.scrollTop = errorTextarea.scrollHeight;
    };
    
    //
    // set up canvas background
    //
    context.fillStyle = "green";
    context.beginPath();
    context.arc(canvas.width / 2, 0, 20, 0, Math.PI * 2, false);
    context.fill();
    buffer = context.getImageData(0, 0, canvas.width, canvas.height);

    // "loop" over the user's iteration function (noops if program hasn't been pressed)
    setInterval(function () {
        if (isPaused) { return; }
        
        worker.postMessage({
            id: "iterate",
            arg: {
                leftEncoder: robotAPIs.getLeftEncoder(),
                rightEncoder: robotAPIs.getRightEncoder()
            }
        });
    }, 100);
    
    requestAnimationFrame(drawStuff);
}());