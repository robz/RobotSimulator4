var createWorld = function () {
    // define constants
    var sin = Math.sin,
        cos = Math.cos,
        
        badShape;
    
    return function (spec) {
        var that = {},
        
            drawBadShape = spec.drawBadShape || false;
        
        that.bounds = spec.bounds || null;
        that.obstacles = spec.obstacles || [];
        
        // shape could be poly or circle
        that.addObstacle = function (shape) {
            that.obstacles.push(shape);
        };
        
        that.isCircleAllowed = function (circle) {
            var i;
            
            // check to see if it is within bounds
            if (circle.center.x - circle.radius < that.bounds[0] ||
                circle.center.y - circle.radius < that.bounds[1] ||
                circle.center.x + circle.radius >= that.bounds[2] ||
                circle.center.y + circle.radius >= that.bounds[3]) {
                badShape = circle;
                return false;
            }
            
            // check all obstacles against frame polygon
            for (i = 0; i < that.obstacles.length; i++) {
                if (that.obstacles[i].intersectsCircle(circle)) {
                    badShape = circle;
                    return false;
                }
            }
            
            return true;
        };
        
        that.isPolyAllowed = function (poly) {
            var i;
        
            // check to see if it is within bounds
            for (i = 0; i < poly.points.length; i++) {
                if (poly.points[i].x < that.bounds[0] ||
                    poly.points[i].y < that.bounds[1] ||
                    poly.points[i].x >= that.bounds[2] ||
                    poly.points[i].y >= that.bounds[3]) {
                    badShape = poly;
                    return false;
                }
            }
            
            // check all obstacles against frame polygon
            for (i = 0; i < that.obstacles.length; i++) {
                if (that.obstacles[i].intersectsPoly(poly)) {
                    badShape = poly;
                    return false;
                }
            }
            
            return true;
        };
        
        that.getClosestIntersectionDistance = function (lineSeg) {
            var dist, minDist = lineSeg.length;
            
            for (i = 0; i < that.obstacles.length; i++) {
                dist = that.obstacles[i].closestIntersectionDistance(lineSeg);
                
                if (dist && dist < minDist) {
                    minDist = dist;
                }
            }
            
            return minDist;
        };
        
        that.draw = function (context) {
            var i;
            
            context.save();
            
            context.lineWidth = 3;
            context.strokeStyle = "blue";
            context.fillStyle = "lightBlue";
            
            for (i = 0; i < that.obstacles.length; i++) {
                that.obstacles[i].draw(context);
                context.fill();
            }
            
            if (drawBadShape && badShape) {
                context.lineWidth = 1;
                context.strokeStyle = "red";
                badShape.draw(context);
                badShape = null;
            }
            
            context.restore();
        };
        
        return that;
    };
}();
















