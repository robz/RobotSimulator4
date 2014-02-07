var handlers = (function () {
	var that = {},
        
       	robotAPIs = {
        	setLeftMotor: function (power) {
				postMessage({
                	id: "setLeftMotor",
                    arg: power
                });
            },

            setRightMotor: function (power) {
				postMessage({
                	id: "setRightMotor",
                    arg: power
                });
            },
            
            getLeftEncoder: function () {
				return leftEncoder;
            },

            getRightEncoder: function (power) {
				return rightEncoder;
            }
        },
        
        log = function (s) {
            postMessage({
                id: "log",
                arg: s
            });
        },
        
        controlIteration = function () {};
    
    that.readProgram = function (programString) {
        // strict-ify the user's code so that it is executed in its own scope
        programString = "'use strict';\n\n" + programString + "\n\ncontrolIteration";
        
        // obtain a reference to the controlIteration function that the user wrote
        controlIteration = eval(programString);
	};
    
    that.iterate = function (robotData) {
        leftEncoder = robotData.leftEncoder;
        rightEncoder = robotData.rightEncoder;
        controlIteration(robotAPIs, log);
    };
    
    return that;
}());

onmessage = function (e) {
	if (handlers[e.data.id]) {
    	handlers[e.data.id](e.data.arg);   
    }
};