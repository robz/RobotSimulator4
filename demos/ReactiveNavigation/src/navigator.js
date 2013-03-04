// user program

var createNavigator = function (leftMotor, rightMotor, distanceSensors, GPS, compass) {
    var prgm = {},

        CLOSE_ENOUGH_TO_GOAL = 10,
        MIN_CLEARANCE = 50,

        goal = GLib.createPoint(0, 0),
        hasGoal = false,

        createDirection = function (heading, clearance) {
            return {
                heading: heading,
                clearance: clearance
            };
        },

        calcViableDirs = function () {
            
        },

        calcGoalClearance = function (goalHeading) {

        },

        calcBestDir = function (dirs, curHeading, goalHeading) {

        },

        followDir = function (heading) {

        };
 
    prgm.setGoal = function (newGoal) {
        goal.x = newGoal.x;
        goal.y = newGoal.y;
        hasGoal = true;
    };
    
    // find the best direction and then move towards it    
    prgm.iterate = function () {
        var curHeading, pos, distToGoal, dirs, goalHeading, localGoalHeading,
            goalClearance, bestDir;

        if (!hasGoal) {
            return;
        }

        // find current heading and position

        curHeading = compass.read();
        pos = GPS.read();

        // decide if we're already close enough to the goal

        distToGoal = GLib.euclidDist(pos, goal)

        if (CLOSE_ENOUGH_TO_GOAL > distToGoal) {
            hasGoal = false;
            return;
        }

        // find other viable directions & calculate their clearances

        dirs = calcViableDirs();

        // rotate directions by heading to translate them into the global
        //  reference frame

        for (i = 0; i < dirs.length; i++) {
            dirs[i].heading = GLib.boundAngle(dirs[i].heading + curHeading);
        }
 
        // calculate goal heading

        goalHeading = GLib.atan2(goal.y - pos.y, goal.x - pos.x);

        // rotate goal heading by robot heading to translate it into the local 
        //  reference frame

        localGoalHeading = GLib.boundAngle(goalHeading - curHeading);

        // calculate goal direction clearance

        goalClearance = calcGoalClearance(localGoalHeading);

        // add goal direction to viable direction list if it is viable

        if (MIN_CLEARANCE < goalClearance) {
            dirs.push(createDirection(goalHeading, goalClearance));
        }

        // evaluate all directions based on current heading, goal direction, 
        //  and clearance, then pick the best heading

        bestHeading = calcBestDir(dirs, curHeading, goalHeading);

        // set motors to follow the best heading, if one exists

        if (bestHeading) {
            followHeading(bestHeading);
        }
    };

    return prgm;
}();
