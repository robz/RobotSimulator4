/*jslint browser: true */
/*global CodeMirror, createWorld, RobotFactory, createRobotAPIs, Worker */

(function () {
    "use strict";
    
    var ANIMATION_FPS = 40,

        canvas = document.getElementById("canvas"),
        context = canvas.getContext("2d"),
        buffer = context.getImageData(0, 0, canvas.width, canvas.height),
        
        codeTextarea = CodeMirror.fromTextArea(document.getElementById("code_textarea")),
        logTextarea = document.getElementById("log_textarea"),
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
    
        robotAPIs = createRobotAPIs(robot),
        
        isPaused = false,
            
        worker = new Worker("src/worker.js"),
        
        readProgram = function () {
            // get the text that the user has typed
            var programString = codeTextarea.getValue();
            
            // store it locally so that it's persistent between page refereshes
            localStorage.setItem("robotProgram", programString);
            
            worker.postMessage({id: "readProgram", arg: programString});
        },
        
        log = function (obj) {
            var textarea = logTextarea;
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

    programBtn.onclick = function () {
        readProgram();
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

    if (localStorage.getItem("robotProgram")) {
        codeTextarea.setValue(localStorage.getItem("robotProgram"));
    }

    codeTextarea.getScrollerElement().style.height = canvas.height - 50;
    
    worker.onmessage = function (e) {
        if (robotAPIs[e.data.id]) {
			robotAPIs[e.data.id](e.data.arg);
        } else if (e.data.id === "log") {
            log(e.data.arg);
        }
    };
    
    worker.onerror = function (e) {
        // TODO: print error to console
    };
    
    // "loop" over the user's provided controlIteration function (noops if flash hasn't been pressed)
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
    
    drawStuff();
}());