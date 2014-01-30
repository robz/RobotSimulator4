var createRobotAPIs = function (robot, spec) {
    "use strict";
    
    var MAX_MOTOR_SPEED = (spec && spec.MAX_MOTOR_SPEED) || 1,
    
        leftMotorSpeed = (spec && spec.leftMotorSpeed) || 0,
        rightMotorSpeed = (spec && spec.rightMotorSpeed) || 0,
        
        leftMotorScale = null,
        rightMotorScale = null;
    
    do {
        leftMotorScale = Math.random() * 0.5 + 0.5;
        rightMotorScale = Math.random() * 0.5 + 0.5;
    } while (Math.abs(leftMotorScale - rightMotorScale) < 0.1); // make sure they don't get lucky! 

    leftMotorScale *= MAX_MOTOR_SPEED;
    rightMotorScale *= MAX_MOTOR_SPEED;

    return {
        setLeftMotor: function (power) {
            if (power === undefined) { return; }
            power *= 0.2;
            leftMotorSpeed = power * leftMotorScale;
            robot.setWheelVelocities(rightMotorSpeed, leftMotorSpeed);
        },

        setRightMotor: function (power) {
            if (power === undefined) { return; }
            power *= 0.2;
            rightMotorSpeed = power * rightMotorScale;
            robot.setWheelVelocities(rightMotorSpeed, leftMotorSpeed);
        },

        getLeftEncoder: function () {
            return robot.getWheelDistances()[0];
        },

        getRightEncoder: function () {
            return robot.getWheelDistances()[1];
        }
    };
};