var SensorFactory = function () {
    var factory = {};
    
    factory.createSensor = function (spec, my) {
        var my = my || {},
            that = {};
        
        my.uplink = spec.uplink;
        my.world = spec.world;
        my.offsetPoint = spec.offsetPoint;
        my.offsetDir = spec.offsetDir;
        
        that.getGlobalPose = function () {
            var newPoint = GLib.rotate(my.offsetPoint, my.uplink.heading);
            newPoint.heading = my.uplink.heading + my.offsetDir;
            return newPoint;
        };
        
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
    
    factory.createDistanceSensor = function (spec, my) {
        var my = my || {},
            that = factory.createSensor(spec, my);
        
        that.read = function () {
            // get point in global reference frame
            var pose = that.getGlobalPose();
            
            // create ray
            var ray = GLib.createRay(pose, pose.heading);
            
            // find closest intersection with all obstacles
            return world.getClosestIntersectionDistance(ray);
        }
        
        return that;
    };
    
    factory.createLIDAR = function () {
        var that = {};
        return that;
    };
    
    factory.createGPS = function () {
        var that = {};
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