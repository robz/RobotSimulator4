(function () {
    var i, ANIMATION_FPS = 40, 

        canvases = [
            document.getElementById("canvas0"),
            document.getElementById("canvas1"),
            document.getElementById("canvas2")
        ],

        contexts = new Array(3),
        buffers = new Array(3),

        robots = [ 
            RobotFactory.createAckermanRobot({
                x: canvases[0].width/2, 
                y: canvases[0].height/4, 
                heading: Math.PI/2,
                scale: 70,
                color: "blue"
            }),
            RobotFactory.createTankRobot({
                x: canvases[1].width/2, 
                y: canvases[1].height/4, 
                heading: Math.PI/2,
                scale: 80,
                color: "green"
            }),
            RobotFactory.createCrabRobot({
                x: canvases[2].width/2, 
                y: canvases[2].height/4, 
                heading: Math.PI/2,
                scale: 60,
                color: "red"
            })
        ],

        drawStuff = function () {
            var i;

            for (i = 0; i < 3; i++) {
                contexts[i].putImageData(buffers[i], 0, 0);
                robots[i].update();
                robots[i].draw(contexts[i]);
            }

            setTimeout(drawStuff, 1000/ANIMATION_FPS);
        },

        addKeyHandler = function (canvas, robot) {
            canvas.onkeydown = function (event) {
                robot.keyControl(event.which);
            };
        };

    for (i = 0; i < 3; i++) {
        contexts[i] = canvases[i].getContext("2d");
        buffers[i] = contexts[i].getImageData(
            0, 0, canvases[i].width, canvases[i].height);
        addKeyHandler(canvases[i], robots[i]);
    }

    window.onload = function () {
        drawStuff();
    }
})();