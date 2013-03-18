// user program

var createNavigator = function (motors, distanceSensors, GPS, compass) {
    var prgm = {},

        CLOSE_ENOUGH_TO_GOAL = 20,
        MIN_CLEARANCE = 70,
        MIN_EDGE_CLEARANCE = 140,
        CLOSE_ENOUGH_TO_MAX = 1,
        MAX_POWER = .01,
        MAX_ANGULAR = .05,
        MAX_LINEAR = .1,
        ANGLE_THREASHOlD = .2,
        
        WEIGHTS = {
            CUR_HEADING: .01,
            GOAL_HEADING: .9,
            CLEARANCE: .09
        },

        goal = GLib.createPoint(0, 0),
        hasGoal = false,
        maxDist = distanceSensors[0].range,
        gapIndexes = [],
        dirs = [], 
        bestHeading = null, 
        goalIndex = -1,
        turningAround = false, 
        oppositeAngle = null,
        turningDir = 0, // 1 means turning left, 2 means right

        createDirection = function (heading, clearance) {
            return {
                heading: heading,
                clearance: clearance
            };
        },
        
        calcClearance = function (angle1, angle2, dist) {
            var x1 = dist*Math.cos(angle1),
                y1 = dist*Math.sin(angle1),
                x2 = dist*Math.cos(angle2),
                y2 = dist*Math.sin(angle2);
            
            return Math.sqrt((x1 - x2)*(x1 - x2) 
                           + (y1 - y2)*(y1 - y2));
        },

        calcViableDirs = function () {
            var i, angle, dist, atMax, nextAtMax,
                inGap = false,
                directions = [];
                
            gapIndexes = [];
        
            // loop through distance sensors & find gaps
            for (i = 0; i < distanceSensors.length; i++) {
                angle = distanceSensors[i].node.offset.heading;
                dist = distanceSensors[i].read();
                
                atMax = Math.abs(maxDist - dist) <= CLOSE_ENOUGH_TO_MAX;
                
                nextAtMax = false;
                if (i < distanceSensors.length - 1) {
                    nextAtMax = Math.abs(maxDist - distanceSensors[i+1].read())
                                <= CLOSE_ENOUGH_TO_MAX;
                }
                
                if (i === 0 && atMax) {
                    gapIndexes.push(i);
                    inGap = true;
                } else if (inGap && !atMax) {
                    gapIndexes.push(i);
                    inGap = false;
                } else if (!inGap && nextAtMax) {
                    gapIndexes.push(i);
                    inGap = true;
                } else if (inGap && i === distanceSensors.length - 1) {
                    gapIndexes.push(i);
                    inGap = false;
                } 
            }
            
            (function () {
                var angle1, dist1, angle2, dist2, x1, y1, x2, y2, clearance, i, j, k,
                    distN, angleN;
            
                for (i = 0; i < gapIndexes.length; i+=2) {
                    angle1 = distanceSensors[gapIndexes[i]].node.offset.heading;
                    dist1 = distanceSensors[gapIndexes[i]].read();
                    angle2 = distanceSensors[gapIndexes[i+1]].node.offset.heading;
                    dist2 = distanceSensors[gapIndexes[i+1]].read();
                    
                    angle = GLib.boundAngle((angle1 + angle2)/2);
                    dist = (dist1 < dist2) ? dist1 : dist2;
                    
                    clearance = calcClearance(angle1, angle2, dist);
                                        
                    if (clearance >= MIN_CLEARANCE) {    
                        numDirs = Math.floor(clearance/MIN_CLEARANCE);
                        deltaAngle = GLib.angleDif(angle1, angle2);
                        
                        directions.push(createDirection(angle, clearance));
                        
                        // add left-most direction
                        for (j = gapIndexes[i] + 1; j < gapIndexes[i+1]; j++) {
                            distN = distanceSensors[j].read();
                            angleN = distanceSensors[j].node.offset.heading;
                        
                            angle = GLib.boundAngle((angle1 + angleN)/2);
                            dist = (dist1 < distN) ? dist1 : distN;
                            
                            clearance = calcClearance(angle1, angleN, dist);
                            
                            if (clearance > MIN_EDGE_CLEARANCE) {
                                directions.push(createDirection(angle, clearance));
                                break;
                            }
                        }
                        
                        // add right-most direction
                        for (j = gapIndexes[i+1] - 1; j >= gapIndexes[i]; j--) {
                            distN = distanceSensors[j].read();
                            angleN = distanceSensors[j].node.offset.heading;
                        
                            angle = GLib.boundAngle((angle2 + angleN)/2);
                            dist = (dist2 < distN) ? dist2 : distN;
                            
                            clearance = calcClearance(angle2, angleN, dist);
                            
                            if (clearance > MIN_EDGE_CLEARANCE) {
                                directions.push(createDirection(angle, clearance));
                                break;
                            }
                        }
                    } 
                }
            })();
            
            return directions;
        },

        calcGoalClearance = function (goalHeading, distToGoal) {
            var i, right, left;
            goalIndex = -1;
        
            if (goalHeading > Math.PI) {
                return false;
            }
        
            // find the closest index matching goalHeading
            goalIndex = Math.floor(goalHeading/(Math.PI/distanceSensors.length));

            if (Math.abs(maxDist - distanceSensors[goalIndex].read()) 
                    > CLOSE_ENOUGH_TO_MAX) {
                if (distToGoal < distanceSensors[goalIndex].read()) {
                    return MIN_CLEARANCE;
                } else {
                    return 0;
                }
            }
            
            // find left & right most indexes
            for (i = 0; goalIndex + i < distanceSensors.length 
                        && goalIndex - i >= 0; i++) {
                right = goalIndex + i;
                left = goalIndex - i;
                
                if (Math.abs(maxDist - distanceSensors[right].read()) 
                        > CLOSE_ENOUGH_TO_MAX
                 || Math.abs(maxDist - distanceSensors[left].read()) 
                        > CLOSE_ENOUGH_TO_MAX) {
                    break;
                }
            }
            
            // calculate the clearance
            var dist1 = distanceSensors[right].read(),
                angle1 = distanceSensors[right].node.offset.heading,
                dist2 = distanceSensors[left].read(),
                angle2 = distanceSensors[left].node.offset.heading,
                dist = (dist1 < dist2) ? dist1 : dist2,
                clearance = calcClearance(angle1, angle2, dist);
                
            if (clearance < MIN_CLEARANCE) {
                if (distToGoal < dist1 && distToGoal < dist2) {
                    return MIN_CLEARANCE;
                }
            }
            
            return clearance;
        },

        findBestHeading = function (dirs, curHeading, goalHeading) {
            var bestIndex = -1,
                bestRes = 1;
        
            for (i = 0; i < dirs.length; i++) {
                // get values
                var curHeadingCloseness = 
                        Math.abs(GLib.angleDif(dirs[i].heading, curHeading)),
                    goalHeadingCloseness = 
                        Math.abs(GLib.angleDif(dirs[i].heading, goalHeading)),
                    clearance = dirs[i].clearance;
                    
                // normalize
                curHeadingCloseness /= (Math.PI/2);
                goalHeadingCloseness /= Math.PI;
                clearance = 1 - clearance/(maxDist*2);
                
                var res = WEIGHTS.CUR_HEADING*curHeadingCloseness + 
                          WEIGHTS.GOAL_HEADING*goalHeadingCloseness + 
                          WEIGHTS.CLEARANCE*clearance;
                          
                if (res < bestRes) {
                    bestRes = res;
                    bestIndex = i;
                }
            }
            
            return dirs[bestIndex].heading;
        },

        followHeading = function (heading, curHeading) {
            var error = GLib.angleDif(heading, curHeading)/(Math.PI/2);
                angular = MAX_ANGULAR*error,
                linear = MAX_LINEAR*(1 - Math.abs(error)),
                left = (linear + angular)/2,
                right = (linear - angular)/2;
                //left = Math.max(MAX_POWER, MAX_POWER + 2*MAX_POWER*error),
                //right = Math.max(MAX_POWER, MAX_POWER - 2*MAX_POWER*error);
            
            motors.setMotorPowers(right, left);
        },

        drawLine = function (context, angle, dist) {
            context.beginPath();
            context.moveTo(0, 0);
            context.lineTo(dist*Math.cos(angle), dist*Math.sin(angle));
            context.stroke();
        };
        
    prgm.draw = function (context) {
        var i, angle, dist,
            maxDist = distanceSensors[0].range;
    
        context.save();
        
        context.lineWidth = 2;
        
        for (i = 0; i < gapIndexes.length; i++) {
            context.strokeStyle = (i%2 === 0) ? "blue" : "purple";
        
            angle = distanceSensors[gapIndexes[i]].node.offset.heading;
            dist = distanceSensors[gapIndexes[i]].read();
                    
            drawLine(context, angle, dist);
        }
    
        if (dirs.length > 0) {
            context.save();
            context.rotate(-compass.read());
            
            context.lineWidth = 3;
            context.strokeStyle = "black";
        
            for (i = 0; i < dirs.length; i++) {
                angle = dirs[i].heading;
                
                drawLine(context, angle, maxDist);
            };
            
            context.restore();
        }
        
        if (-1 !== goalIndex) {
            context.lineWidth = 1;
            context.strokeStyle = "red";
        
            angle = distanceSensors[goalIndex].node.offset.heading;
            dist = distanceSensors[goalIndex].read();
                    
            drawLine(context, angle, dist);
        }   
        
        if (null !== bestHeading) {
            context.save();
            context.rotate(-compass.read());
            
            context.lineWidth = 4;
            context.strokeStyle = "orange";
            
            drawLine(context, bestHeading, maxDist);
            
            context.restore();
        }
        
        if (null !== oppositeAngle) {
            context.save();
            context.rotate(-compass.read());
            
            context.lineWidth = 4;
            context.strokeStyle = "darkGray";
            
            drawLine(context, oppositeAngle, maxDist);
            
            context.restore();
        }
        
        context.restore();
    };
    
    prgm.draw2 = function (context) {
        if (hasGoal) {
            context.lineWidth = 3;
            context.strokeStyle = "black";
            
            context.beginPath();
            context.arc(goal.x, goal.y, CLOSE_ENOUGH_TO_GOAL, 0, 2*Math.PI, false);
            context.stroke();
        }
    }
 
    prgm.getGoal = function (out_goal) {
        out_goal.x = goal.x;
        out_goal.y = goal.y;
    };
    
    prgm.setGoal = function (newGoal) {
        goal.x = newGoal.x;
        goal.y = newGoal.y;
        hasGoal = true;
    };
    
    // find the best direction and then move towards it    
    prgm.iterate = function () {
        var curHeading, pos, distToGoal, goalHeading, localGoalHeading,
            goalClearance;
        
        bestHeading = null;
        dirs = [];
        gapIndexes = [];
        goalIndex = -1;

        if (!hasGoal) {
            motors.setMotorPowers(0, 0);
            return;
        }

        // find current heading and position
        curHeading = compass.read();
        pos = GPS.read();
        
        // UGH -- this is a hack that would not be needed if frametree 
        //  provided inverse transforms. It translates our position, given by 
        //  the GPS, to the location of lidar sensor. Offsets are hardcoded for
        //  simplicity.
        pos = GLib.createPoint(
            pos.x - 7*Math.cos(curHeading + Math.PI/2) 
                  + 40*Math.cos(curHeading),
            pos.y - 7*Math.sin(curHeading + Math.PI/2) 
                  + 40*Math.sin(curHeading)
        );
        
        // decide if we're already close enough to the goal
        distToGoal = GLib.euclidDist(goal, pos);

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

        // rotate goal heading by robot heading to translate it into the range 
        //  [0, PI]
        localGoalHeading = GLib.boundAngle(goalHeading - curHeading + Math.PI/2);

        // calculate goal direction clearance
        goalClearance = calcGoalClearance(localGoalHeading, distToGoal);

        // add goal direction to viable direction list if it is viable
        if (MIN_CLEARANCE <= goalClearance) {
            dirs.push(createDirection(goalHeading, goalClearance));
        } 
        
        // if there are no options, turn around until there are
        if (turningAround && dirs.length === 0) {
            console.log(turningDir);
        
            if (Math.abs(curHeading - oppositeAngle) < ANGLE_THREASHOlD) {
                console.log("setting to false!");
                turningAround = false;
                turningDir = 0;
            } else if (1 === turningDir) {    
                motors.setMotorPowers(-MAX_POWER, MAX_POWER);
            } else if (2 === turningDir) {    
                motors.setMotorPowers(MAX_POWER, -MAX_POWER);
            }
            
            return;
        } else if (dirs.length === 0) {
            turningAround = true;
            
            var coin = Math.random();
            console.log(coin);
            if (coin < .5) {
                oppositeAngle = GLib.boundAngle(curHeading - ANGLE_THREASHOlD);
                turningDir = 1;
                motors.setMotorPowers(-MAX_POWER, MAX_POWER);
            } else  if (coin >= .5) {
                oppositeAngle = GLib.boundAngle(curHeading + ANGLE_THREASHOlD);
                turningDir = 2;
                motors.setMotorPowers(MAX_POWER, -MAX_POWER);
            }
            
            return;
        }
        
        turningAround = false;
        oppositeAngle = null;

        // evaluate all directions based on current heading, goal direction, 
        //  and clearance, then pick the best heading
        bestHeading = findBestHeading(dirs, curHeading, goalHeading);
        
        // set motors to follow the best heading
        followHeading(bestHeading, curHeading);
    };
    
    prgm.node = FTLib.createNode(
        null, 
        prgm.draw,
        {
            x: distanceSensors[0].node.offset.x,
            y: distanceSensors[0].node.offset.y,
            heading: 0
        }
    );

    return prgm;
};
