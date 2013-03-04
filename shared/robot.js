var RobotFactory = function () {
    var factory = {},

        sin = Math.sin,
        cos = Math.cos,
        tan = Math.tan,
        abs = Math.abs,
        PI = Math.PI,

        SMALL_ENOUGH = 1e-6,
        KEY_W = "W".charCodeAt(0),
        KEY_A = "A".charCodeAt(0),
        KEY_S = "S".charCodeAt(0),
        KEY_D = "D".charCodeAt(0),
        KEY_SPACE = " ".charCodeAt(0);

    factory.createRobot = function (spec, my)
    /*
    Supported 'spec' properties (defaults in parens):
     * x (0)
     * y (0)
     * heading (0)
     * width (1*scale)
     * length (1*scale)
     * wheelWidth (.2*scale)
     * wheelLength (.375*scale)
     * scale (1)
     * getTime (realtime)
     * velInc (.01)
     * minVel (-.2)
     * maxVel (.2)
     * logActions (false)
     * color ("black")
     * world (null)
     * frame (basic square)
     * sensors ([])
    */
    {
        var my = my || {},
            that = {};

        // private members

        var getTime,
            lastTimeUpdated;

        if (spec && spec.getTime) {
            getTime = spec.getTime;
        } else {
            getTime = function () {
                return new Date().getTime();
            };
        }

        // protected members

        my.drawWheel = function (context, wheelDistanceTravelled) {
            var i, wheelCorners = my.wheel.points;

            context.save();

            context.lineWidth = 1;
            context.strokeStyle = "black";
            context.fillStyle = "lightGray";
            
            my.wheel.draw(context, true);

            // draw spokes if wheel distance was specified
            var numSpokes = 6,
                spokeLength = my.wheelLength/2,
                dtheta = wheelDistanceTravelled/spokeLength,
                theta, 
                dx;

            for (i = 0; i < numSpokes; i++) {
                theta = GLib.boundAngle(i*PI*2/numSpokes - dtheta);
                dx = spokeLength*cos(theta);

                if (theta < PI) {
                    context.beginPath();
                    context.moveTo(wheelCorners[0].x + my.wheelLength/2 + dx,
                                   wheelCorners[0].y);
                    context.lineTo(wheelCorners[0].x + my.wheelLength/2 + dx,
                                   wheelCorners[0].y + my.wheelWidth);
                    context.stroke();
                }
            }

            context.restore();
        };
            
        my.sensors = (spec && spec.sensors) || [];
        that.sensors = my.sensors;
        my.world = (spec && spec.world) || null;

        my.x = (spec && spec.x) || 0;
        my.y = (spec && spec.y) || 0;
        my.heading = (spec && spec.heading) || 0;

        my.width = (spec && typeof spec.width !== 'undefined')
            ? spec.width : 1;
        my.length = (spec && typeof spec.length !== 'undefined')
            ? spec.length : 1;
        my.wheelWidth = (spec && typeof spec.wheelWidth !== 'undefined')
            ? spec.wheelWidth : .2;
        my.wheelLength = (spec && typeof spec.wheelLength !== 'undefined')
            ? spec.wheelLength : .375;
        my.scale = (spec && typeof spec.scale !== 'undefined')
            ? spec.scale : 1;

        my.width *= my.scale;
        my.length *= my.scale;
        my.wheelWidth *= my.scale;
        my.wheelLength *= my.scale;

        my.velInc = (spec && typeof spec.velInc !== 'undefined')
            ? spec.velInc : .01;
        my.minVel = (spec && typeof spec.minVel !== 'undefined')
            ? spec.minVel : -.2;
        my.maxVel = (spec && typeof spec.maxVel !== 'undefined')
            ? spec.maxVel : .2;

        my.logActions = (spec && spec.logActions) || false;
        my.color = (spec && spec.color) || "black";

        if (spec && spec.frame) {
            my.frame = spec.frame;  
        } else {
            my.frame = GLib.createPolygon([
                GLib.createPoint(0, -my.width/2),
                GLib.createPoint(my.length, -my.width/2),
                GLib.createPoint(my.length, my.width/2),
                GLib.createPoint(0, my.width/2)
            ]);
        }

        my.wheel = GLib.createPolygon([
            GLib.createPoint(-my.wheelLength/2, -my.wheelWidth/2),
            GLib.createPoint(my.wheelLength/2, -my.wheelWidth/2),
            GLib.createPoint(my.wheelLength/2, my.wheelWidth/2),
            GLib.createPoint(-my.wheelLength/2, my.wheelWidth/2)
        ]);
        
        my.isPosePossible = function (x, y, heading) {
            var res,    
                tx = my.root.offset.x,
                ty = my.root.offset.y,
                theading = my.root.offset.heading;
                
            my.root.offset.x = x;
            my.root.offset.y = y;
            my.root.offset.heading = heading;
            
            res = FTLib.isAllowed(my.root, my.world);
                
            my.root.offset.x = tx;
            my.root.offset.y = ty;
            my.root.offset.heading = theading;
            
            return res;
        };

        // public members

        that.setControls = function (controls) {
            throw new Error("abstract method 'setControls' not implemented");
        };

        that.step = function (dt) {
            throw new Error("abstract method 'step' not implemented");
        };

        that.keyControl = function (key) {
            if (!my.keyFunctions) {
                throw new Error("keyFunctions not implemented");
            }

            switch (key) {
                case KEY_W:
                    my.logActions && console.log("forward");
                    my.keyFunctions[key]();
                    break;
                case KEY_A:
                    my.logActions && console.log("left");
                    my.keyFunctions[key]();
                    break;
                case KEY_S:
                    my.logActions && console.log("backward");
                    my.keyFunctions[key]();
                    break;
                case KEY_D:
                    my.logActions && console.log("right");
                    my.keyFunctions[key]();
                    break;
                case KEY_SPACE:
                    my.logActions && console.log("stop");
                    my.keyFunctions[key]();
                    break;
            }
        };

        that.update = function () {
            var curTime = getTime(),
                dt = 0;

            if (typeof lastTimeUpdated !== 'undefined') {
                dt = curTime - lastTimeUpdated;
            }

            lastTimeUpdated = curTime;

            that.step(dt);
        };

        // if out_pose is defined, sets outpose's x, y, heading members
        // otherwise returns new pose object
        that.getPose = function (out_pose) {
            if (out_pose && out_pose.x && out_pose.y && out_pose.heading) {
                out_pose.x = my.x;
                out_pose.y = my.y;
                out_pose.heading = my.heading;
            } else {
                return {
                    x: my.x,
                    y: my.y,
                    heading: my.heading
                };
            }
        };

        that.toString = function () {
            return JSON.stringify(my);
        };

        return that;
    };

    factory.createTankRobot = function (spec, my)
    /*
    Additional 'spec' properties (defaults in parens):
     * leftWheelVel (0)
     * rightWheelVel (0)
     * casterRadius (.1*scale)
    */
    {
        var my = my || {},
            that = factory.createRobot(spec, my);

        // private members

        var caster = {x: my.length, y:0},
            casterShape;

        caster.radius = (spec && typeof spec.casterRadius !== 'undefined')
            ? spec.casterRadius : .1;
        caster.radius *= my.scale;
        
        casterShape = GLib.createCircle(
            GLib.createPoint(0, 0), 
            caster.radius
        );

        // protected members

        my.wheelInfo = {
            numWheels: 2,
            distanceTravelled: [0, 0],
            poses: [{x: 0, y: -my.width/2, heading: 0}, 
                    {x: 0, y: my.width/2, heading: 0}]
        };
        
        my.root = FTLib.createNode(
            my.frame, 
            function (context) {
                context.save();
                
                context.lineWidth = 3;
                context.fillStyle = "lightGray";
                context.strokeStyle = my.color;
                my.frame.draw(context, true);
                
                context.restore();
            }, 
            my, 
            [
                FTLib.createNode(
                    my.wheel, 
                    function (context) {
                        my.drawWheel(
                            context, 
                            my.wheelInfo.distanceTravelled[0]
                        );
                    }, 
                    my.wheelInfo.poses[0]
                ),
                FTLib.createNode(
                    my.wheel, 
                    function (context) {
                        my.drawWheel(
                            context, 
                            my.wheelInfo.distanceTravelled[1]
                        );
                    }, 
                    my.wheelInfo.poses[1]
                ),
                FTLib.createNode(
                    casterShape, 
                    casterShape.draw, 
                    caster
                ) 
            ]
        );
        
        FTLib.setTransforms(my.root);
        
        for (i = 0; i < my.sensors.length; i++) {
            my.root.children.push(my.sensors[i].node);
        }

        my.leftWheelVel = (spec && spec.leftWheelVel) || 0;
        my.rightWheelVel = (spec && spec.rightWheelVel) || 0;

        my.keyFunctions = {};
        my.keyFunctions[KEY_W] = function () {
            that.setWheelVelocities(my.leftWheelVel + my.velInc,
                                    my.rightWheelVel + my.velInc);
        };
        my.keyFunctions[KEY_A] = function () {
            that.setWheelVelocities(my.leftWheelVel + my.velInc,
                                    my.rightWheelVel - my.velInc);
        };
        my.keyFunctions[KEY_S] = function () {
            that.setWheelVelocities(my.leftWheelVel - my.velInc,
                                    my.rightWheelVel - my.velInc);
        };
        my.keyFunctions[KEY_D] = function () {
            that.setWheelVelocities(my.leftWheelVel - my.velInc,
                                    my.rightWheelVel + my.velInc);
        };
        my.keyFunctions[KEY_SPACE] = function () {
            that.setWheelVelocities(0, 0);
        };

        // public members

        that.setWheelVelocities = function (leftWheelVel, rightWheelVel) {
            if (leftWheelVel > my.maxVel) {
                my.leftWheelVel = my.maxVel;
            } else if (leftWheelVel < my.minVel) {
                my.leftWheelVel = my.minVel;
            } else {
                my.leftWheelVel = leftWheelVel;
            }

            if (rightWheelVel > my.maxVel) {
                my.rightWheelVel = my.maxVel;
            } else if (rightWheelVel < my.minVel) {
                my.rightWheelVel = my.minVel;
            } else {
                my.rightWheelVel = rightWheelVel;
            }
        };

        that.step = function (dt) {
            var new_x, new_y, new_heading, R, wd,
                x = my.x, y = my.y, heading = my.heading, width = my.width,
                leftVel = my.leftWheelVel, rightVel = my.rightWheelVel,
                i;
            
            if (abs(leftVel - rightVel) <= SMALL_ENOUGH) {
                new_x = x + dt*leftVel*cos(heading);
                new_y = y + dt*leftVel*sin(heading);
                new_heading = heading;
            } else {
                R = width*(leftVel + rightVel)/(2*(rightVel - leftVel));
                wd = dt*(rightVel - leftVel)/width;

                new_x = x + R*sin(wd + heading) - R*sin(heading);
                new_y = y - R*cos(wd + heading) + R*cos(heading);
                new_heading = ((heading + wd)%(2*PI) + 2*PI)%(2*PI);
            }

            my.wheelInfo.distanceTravelled[0] += dt*rightVel;
            my.wheelInfo.distanceTravelled[1] += dt*leftVel;

            if (my.world && !my.isPosePossible(new_x, new_y, new_heading)) {
                return;
            }
          
            
            for (i = 0; i < my.sensors.length; i++) {
                my.sensors[i].update();
            }

            my.x = new_x;
            my.y = new_y;
            my.heading = new_heading;
        };

        that.draw = function (context) {
            FTLib.drawTree(my.root, context);
        };

        return that;
    };

    factory.createAckermanRobot = function (spec, my)
    /*
    Additional 'spec' properties (defaults in parens):
     * velocity (0)
     * steeringAngle (0)
     * steerInc (PI/20)
     * minSteer (-3*PI/4)
     * maxSteer (3*PI/4)
    */
    {
        var my = my || {},
            that = factory.createRobot(spec, my);
            
        // protected members

        my.wheelInfo = {
            numWheels: 4,
            distanceTravelled: [0, 0, 0, 0],
            poses: [{x: 0, y: -my.width/2, heading: 0}, 
                    {x: my.length, y: -my.width/2, heading: 0},
                    {x: my.length, y: my.width/2, heading: 0}, 
                    {x: 0, y: my.width/2, heading: 0}]
        };
        
        my.root = FTLib.createNode(
            my.frame, 
            function (context) {
                context.save();
                
                context.lineWidth = 3;
                context.fillStyle = "lightGray";
                context.strokeStyle = my.color;
                my.frame.draw(context, true);
                
                context.restore();
            }, 
            my, 
            [
                FTLib.createNode(
                    my.wheel, 
                    function (context) {
                        my.drawWheel(
                            context, 
                            my.wheelInfo.distanceTravelled[0]
                        );
                    }, 
                    my.wheelInfo.poses[0]
                ),
                FTLib.createNode(
                    my.wheel, 
                    function (context) {
                        my.drawWheel(
                            context, 
                            my.wheelInfo.distanceTravelled[1]
                        );
                    }, 
                    my.wheelInfo.poses[1]
                ),
                FTLib.createNode(
                    my.wheel, 
                    function (context) {
                        my.drawWheel(
                            context, 
                            my.wheelInfo.distanceTravelled[2]
                        );
                    }, 
                    my.wheelInfo.poses[2]
                ),
                FTLib.createNode(
                    my.wheel, 
                    function (context) {
                        my.drawWheel(
                            context, 
                            my.wheelInfo.distanceTravelled[3]
                        );
                    }, 
                    my.wheelInfo.poses[3]
                ), 
            ]
        );
        
        my.steerInc = (spec && typeof spec.steerInc !== 'undefined')
            ? spec.steerInc : PI/20;
        my.minSteer = (spec && typeof spec.minSteer !== 'undefined')
            ? spec.minSteer : -PI/4;
        my.maxSteer = (spec && typeof spec.maxSteer !== 'undefined')
            ? spec.maxSteer : PI/4;

        my.velocity = (spec && spec.velocity) || 0;
        my.steeringAngle = (spec && spec.steeringAngle) || 0;

        my.keyFunctions = {};
        my.keyFunctions[KEY_W] = function () {
            that.setVelocity(my.velocity + my.velInc);
        };
        my.keyFunctions[KEY_A] = function () {
            that.setSteeringAngle(my.steeringAngle - my.steerInc);
        };
        my.keyFunctions[KEY_S] = function () {
            that.setVelocity(my.velocity - my.velInc);
        };
        my.keyFunctions[KEY_D] = function () {
            that.setSteeringAngle(my.steeringAngle + my.steerInc);
        };
        my.keyFunctions[KEY_SPACE] = function () {
            that.setVelocity(0);
        };

        // public members

        that.setVelocity = function (velocity) {
            if (velocity > my.maxVel) {
                my.velocity = my.maxVel;
            } else if (velocity < my.minVel) {
                my.velocity = my.minVel;
            } else {
                my.velocity = velocity;
            }
        };

        that.setSteeringAngle = function (steeringAngle) {
            if (steeringAngle > my.maxSteer) {
                my.steeringAngle = my.maxSteer;
            } else if (steeringAngle < my.minSteer) {
                my.steeringAngle = my.minSteer;
            } else {
                my.steeringAngle = steeringAngle;
            }

            for (i = 1; i < 3; i++) {
                my.wheelInfo.poses[i].heading = my.steeringAngle;
            }
        };

        that.step = function (dt) {
            var new_x, new_y, new_heading, beta, R,
                x = my.x, y = my.y, heading = my.heading, length = my.length,
                velocity = my.velocity, steeringAngle = my.steeringAngle,

                delta_distance = dt*velocity;

            if (abs(delta_distance) < SMALL_ENOUGH) {
                new_x = x;
                new_y = y;
                new_heading = heading;
            } else if (abs(steeringAngle) < SMALL_ENOUGH) {
                new_x = x + delta_distance*cos(heading);
                new_y = y + delta_distance*sin(heading);
                new_heading = heading;
            } else {
                beta = (delta_distance/length)*tan(steeringAngle);
                R = delta_distance/beta;

                new_heading = ((heading + beta)%(2*PI) + 2*PI)%(2*PI);
                new_x = x - R*sin(heading) + R*sin(new_heading);
                new_y = y + R*cos(heading) - R*cos(new_heading);
            }

            my.wheelInfo.distanceTravelled[1] += delta_distance;
            my.wheelInfo.distanceTravelled[2] += delta_distance;

            if (typeof beta !== 'undefined') {
                my.wheelInfo.distanceTravelled[0] += beta*(R + my.width/2);
                my.wheelInfo.distanceTravelled[3] += beta*(R - my.width/2);
            } else {
                my.wheelInfo.distanceTravelled[0] += delta_distance;
                my.wheelInfo.distanceTravelled[3] += delta_distance;
            }

            if (my.world && !my.isPosePossible(new_x, new_y, new_heading,
                    my.WheelInfo.directions)) {
                return;
            }

            my.x = new_x;
            my.y = new_y;
            my.heading = new_heading;
        };

        that.draw = function (context) {
            FTLib.drawTree(my.root, context);
        };

        return that;
    }

    factory.createCrabRobot = function (spec, my)
    /*
    Additional 'spec' properties (defaults in parens):
     * velocity (0)
     * steeringAngle (0)
     * steerInc (PI/20)
     * minSteer (-3*PI/4)
     * maxSteer (3*PI/4)
    */
    {
        var my = my || {},
            that = factory.createRobot(spec, my);
        
        // protected members

        my.wheelInfo = {
            numWheels: 4,
            distanceTravelled: [0, 0, 0, 0],
            poses: [{x: 0, y: -my.width/2, heading: 0}, 
                    {x: my.length, y: -my.width/2, heading: 0},
                    {x: my.length, y: my.width/2, heading: 0}, 
                    {x: 0, y: my.width/2, heading: 0}]
        };
        
        
        my.root = FTLib.createNode(
            my.frame, 
            function (context) {
                context.save();
                
                context.lineWidth = 3;
                context.fillStyle = "lightGray";
                context.strokeStyle = my.color;
                my.frame.draw(context, true);
                
                context.restore();
            }, 
            my, 
            [
                FTLib.createNode(
                    my.wheel, 
                    function (context) {
                        my.drawWheel(
                            context, 
                            my.wheelInfo.distanceTravelled[0]
                        );
                    }, 
                    my.wheelInfo.poses[0]
                ),
                FTLib.createNode(
                    my.wheel, 
                    function (context) {
                        my.drawWheel(
                            context, 
                            my.wheelInfo.distanceTravelled[1]
                        );
                    }, 
                    my.wheelInfo.poses[1]
                ),
                FTLib.createNode(
                    my.wheel, 
                    function (context) {
                        my.drawWheel(
                            context, 
                            my.wheelInfo.distanceTravelled[2]
                        );
                    }, 
                    my.wheelInfo.poses[2]
                ),
                FTLib.createNode(
                    my.wheel, 
                    function (context) {
                        my.drawWheel(
                            context, 
                            my.wheelInfo.distanceTravelled[3]
                        );
                    }, 
                    my.wheelInfo.poses[3]
                ), 
            ]
        );

        my.steerInc = (spec && typeof spec.steerInc !== 'undefined')
            ? spec.steerInc : PI/20;
        my.minSteer = (spec && typeof spec.minSteer !== 'undefined')
            ? spec.minSteer : -3*PI/4;
        my.maxSteer = (spec && typeof spec.maxSteer !== 'undefined')
            ? spec.maxSteer : 3*PI/4;

        my.velocity = (spec && spec.velocity) || 0;
        my.steeringAngle = (spec && spec.steeringAngle) || 0;

        my.keyFunctions = {};
        my.keyFunctions[KEY_W] = function () {
            that.setVelocity(my.velocity + my.velInc);
        };
        my.keyFunctions[KEY_A] = function () {
            that.setSteeringAngle(my.steeringAngle - my.steerInc);
        };
        my.keyFunctions[KEY_S] = function () {
            that.setVelocity(my.velocity - my.velInc);
        };
        my.keyFunctions[KEY_D] = function () {
            that.setSteeringAngle(my.steeringAngle + my.steerInc);
        };
        my.keyFunctions[KEY_SPACE] = function () {
            that.setVelocity(0);
        };

        // public members

        that.setVelocity = function (velocity) {
            if (velocity > my.maxVel) {
                my.velocity = my.maxVel;
            } else if (velocity < my.minVel) {
                my.velocity = my.minVel;
            } else {
                my.velocity = velocity;
            }
        };

        that.setSteeringAngle = function (steeringAngle) {
            var i;

            if (steeringAngle > my.maxSteer) {
                my.steeringAngle = my.maxSteer;
            } else if (steeringAngle < my.minSteer) {
                my.steeringAngle = my.minSteer;
            } else {
                my.steeringAngle = steeringAngle;
            }

            for (i = 0; i < my.wheelInfo.numWheels; i++) {
                my.wheelInfo.poses[i].heading = my.steeringAngle;
            }
        };

        that.step = function (dt) {
            var i, new_x, new_y, new_heading,
                x = my.x, y = my.y, heading = my.heading,

                delta_distance = dt*my.velocity,
                direction = heading + my.steeringAngle;

            new_x = x + delta_distance*cos(direction);
            new_y = y + delta_distance*sin(direction);
            new_heading = heading;

            for (i = 0; i < my.wheelInfo.numWheels; i++) {
                my.wheelInfo.distanceTravelled[i] += delta_distance;
            }

            if (my.world && !my.isPosePossible(new_x, new_y, new_heading,
                    my.WheelInfo.directions)) {
                return;
            }

            my.x = new_x;
            my.y = new_y;
            my.heading = new_heading;
        };

        that.draw = function (context) {
            FTLib.drawTree(my.root, context);
        };

        return that;
    }

    return factory;
}();
