/*
robotAPIs:
    void setLeftMotor(number [-1, 1]);
    void setRightMotor(number [-1, 1]);
    number getLeftEncoder(void);
    number getRightEncoder(void);
*/

var program = (function () {
    var prevError = 0;

    var getError = function(robotAPIs) {
        var max = 10;
        var error = robotAPIs.getLeftEncoder() - robotAPIs.getRightEncoder();

        error = (error < -max) ? -max : (error > max) ? max : error;

        return error/max;
    };

    return function (robotAPIs) {
        var error = getError(robotAPIs);
        var d_error = error - prevError;
        robotAPIs.setLeftMotor(.5 - (.8 * error - .2 * d_error));
        robotAPIs.setRightMotor(.5 + (.8 * error - .2 * d_error));
        prevError = error;
    };
}());