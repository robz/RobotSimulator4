var SensorFactory = function () {
    var factory = {};
    
    factory.createSensor = function (spec, my) {
        var my = my || {},
            that = {};
         
        my.offset = spec.offset;
        my.world = spec.world;
        
        var p1 = GLib.createPoint(0, 0),
            p2 = GLib.createPoint(1, 0),
            p3 = GLib.createPoint(0, 0),
            p4 = GLib.createPoint(0, 0);
        
        my.getPose = function () {
            var heading;
            
            that.node.transform.multiply(p1, p3);
            that.node.transform.multiply(p2, p4);
            
            p3.heading = GLib.atan2(p4.y - p3.y, p4.x - p3.x);
            
            return p3;
        };
            
        that.node = FTLib.createNode(
            null, 
            function (context) { that.draw(context); }, // ya thas right go change ur pants
            my.offset
        );
        
        return that;
    };
    
    factory.createLineSensor = function () {
        var that = {};
        return that;
    };
    
    factory.createLineSensorArray = function () {
        var that = {};
        return that;
    };
    
    var sindex = 0;

    factory.createDistanceSensor = function (spec, my) {
        var my = my || {},
            that = factory.createSensor(spec, my),

            radius = (typeof spec.radius !== 'undefined') ? spec.radius : 5,
            length = (typeof spec.length !== 'undefined') ? spec.length : 10,
            range = (typeof spec.range !== 'undefined') ? spec.range : 300,
            
            latestRead = null;
            
        that.myindex = sindex++;
        
        that.draw = function (context) {
            context.save();
        
            context.fillStyle = "lightGray";
            context.strokeStyle = "black";
            context.lineWidth = 1;
            
            context.beginPath();
            context.arc(0, 0, radius, 0, 2*Math.PI, false);
            context.stroke();
            context.fill();
            
            context.lineWidth = 3;
            
            context.beginPath();
            context.moveTo(0, 0);
            context.lineTo(length, 0);
            context.stroke();
            
            if (latestRead) {
                context.strokeStyle = "darkGray";
                context.lineWidth = 1;
                
                context.beginPath();
                context.moveTo(0, 0);
                context.lineTo(latestRead, 0);
                context.stroke();
            }
            
            context.restore();
        };
        
        that.update = function () {
            // get pose in global reference frame
            var pose = my.getPose();
            
            // create ray
            var lineSeg = GLib.createLineSeg(
                pose, 
                GLib.createPoint(
                    pose.x + range*Math.cos(pose.heading), 
                    pose.y + range*Math.sin(pose.heading)
                )
            );
            
            // find closest intersection with all obstacles
            latestRead = my.world.getClosestIntersectionDistance(lineSeg);
        };
        
        that.read = function () {
            return latestRead;
        };
        
        return that;
    };
    
    factory.createGPS = function (spec, my) {
        var my = my || {}
            that = factory.createSensor(spec, my),
            
            radius = (typeof spec.radius !== 'undefined') ? spec.radius : 6,

            latestRead = null;

        that.draw = function (context) {
            context.save();

            context.lineWidth = 2;
            context.strokeStyle = "black";

            context.beginPath();
            context.arc(0, 0, radius, 0, 2*Math.PI, false);
            context.stroke();

            context.beginPath();
            context.moveTo(radius, 0);
            context.lineTo(-radius, 0);
            context.stroke();
    
            context.beginPath();
            context.moveTo(0, radius);
            context.lineTo(0, -radius);
            context.stroke();

            if (latestRead) {

            }

            context.restore();
        };

        that.update = function () {
            var pose = my.getPose();

            if (null === latestRead) {
                latestRead = GLib.createPoint(0,0);
            }

            latestRead.x = pose.x;
            latestRead.y = pose.y;
        };

        that.read = function () {
            return latestRead;
        };

        return that;
    };
    
    factory.createCompass = function () {
        var that = {};
        return that;
    };
    
    factory.createPushSensor = function () {
        var that = {};
        return that;
    }
    
    factory.createEncoders = function () {
        var that = {};
        return that;
    };
    
    return factory;
}();
