var handlers = (function () {
	var that = {},
        
       	robotAPIs = {
            leftEncoder: null,
            rightEncoder: null,
            
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
				return this.leftEncoder;
            },

            getRightEncoder: function (power) {
				return this.rightEncoder;
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
        // strict-ify the user's code so that it doesn't create globals
        programString = "'use strict';\n\n" + programString + "\n\ncontrolIteration";
        
        // obtain a reference to the controlIteration function that the user wrote
        controlIteration = eval(programString);
	};
    
    that.iterate = function (robotData) {
        robotAPIs.leftEncoder = robotData.leftEncoder;
        robotAPIs.rightEncoder = robotData.rightEncoder;
        controlIteration(robotAPIs, log);
    };
    
    return that;
}());

onmessage = function (e) {
	if (handlers[e.data.id]) {
    	handlers[e.data.id](e.data.arg);   
    }
};