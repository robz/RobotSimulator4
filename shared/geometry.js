var GLib = function () {
    var lib = {},
        
        abs = Math.abs,
        sqrt = Math.sqrt,
        atan = Math.atan,
        sin = Math.sin,
        cos = Math.cos,
        PI = Math.PI,
        
        SMALL_ENOUGH = 1e-6;
    
    // utility functions
    
    lib.euclidDist = function (p1, p2) {
        var xdif = p1.x - p2.x,
            ydif = p1.y - p2.y;
        
        return sqrt(xdif*xdif + ydif*ydif);
    };
    
    lib.atan2 = function (y, x) {
        var res;

        if (0 === x) {
            if (y > 0) {
                return PI/2;
            } else if (y < 0) {
                return 3*PI/2;
            } 

            return 0;
        }

        res = atan(y/x);

        if (x >= 0 && y >= 0) {
            return res;
        } else if (x < 0 && y >= 0) {
            return res + PI;
        } else if (x < 0 && y < 0) {
            return res + PI;
        } else if (x >= 0 && y < 0) {
            return res + 2*PI;
        }

        return null;
    };
    
    lib.boundAngle = function (angle) {
        return (angle%(2*PI) + 2*PI)%(2*PI);
    };
    
    lib.getParameterOfIntersection = function (x0, y0, theta0, x1, y1, theta1) {
        // return false if the angles are parallel
        if (abs(sin(theta0 - theta1)) < SMALL_ENOUGH) {
            return false;
        }

        return -(sin(theta0)*(x1 - x0) + cos(theta0)*(y0 - y1)) / 
            sin(theta0 - theta1);
    }
    
    lib.rotate = function (point, theta, out_point) {
        var x = point.x,
            y = point.y;
            
        if (out_point) {
            out_point.x = x*cos(theta) - y*sin(theta);
            out_point.y = x*sin(theta) + y*cos(theta);
        } else {
            return lib.createPoint(
                x*cos(theta) - y*sin(theta),
                x*sin(theta) + y*cos(theta)
            );
        }
    }
    
    // factory functions
    
    lib.createPoint = function (x, y) {
        var that = {};
        
        that.x = x;
        that.y = y;
        
        that.copy = function () {
            return lib.createPoint(that.x, that.y);
        };
        
        return that;
    };
    
    lib.createLineSeg = function (p0, p1) {
        var that = {};
        
        that.p0 = p0;
        that.p1 = p1;
        that.theta = lib.atan2(p1.y - p0.y, p1.x - p0.x);
        that.length = lib.euclidDist(p0, p1);
        
        that.lineSegIntersection = function (lineSeg, out_point) {
            var s = lib.getParameterOfIntersection(
                    that.p0.x, that.p0.y, that.theta,
                    lineSeg.p0.x, lineSeg.p0.y, lineSeg.theta), 
                t = lib.getParameterOfIntersection(
                    lineSeg.p0.x, lineSeg.p0.y, lineSeg.theta,
                    that.p0.x, that.p0.y, that.theta);
            
            if (false === s) {
                return false;
            }
            
            // use the parameter s and t to determine if the point lies on the segments
            if (s < 0 || s > lineSeg.length || t < 0 || t > that.length) {
                return false;
            }
            
            if (!out_point) {
                return lib.createPoint(lineSeg.p0.x + s*cos(lineSeg.theta), 
                                       lineSeg.p0.y + s*sin(lineSeg.theta));
            }
            
            out_point.x = lineSeg.p0.x + s*cos(lineSeg.theta);
            out_point.y = lineSeg.p0.y + s*sin(lineSeg.theta);
        };
        
        return that;
    };
    
    lib.createRay = function (point, theta, length) {
        var that = {};
        
        that.point = point;
        that.theta = lib.boundAngle(theta);
        that.length = length;
        
        that.lineSegIntersection = function (lineSeg, out_point) {
            var s = lib.getParameterOfIntersection(
                    that.point.x, that.point.y, that.theta,
                    lineSeg.p0.x, lineSeg.p0.y, lineSeg.theta),
                t = lib.getParameterOfIntersection(
                    lineSeg.p0.x, lineSeg.p0.y, lineSeg.theta,
                    that.point.x, that.point.y, that.theta);
            
            if (false === s) {
                return false;
            }
            
            // use the parameter s to determine if the point lies on lineSeg
            if (s < 0 || s > lineSeg.length || t < 0 || t > that.length) {
                return false;
            }
            
            if (!out_point) {
                return lib.createPoint(lineSeg.p0.x + s*cos(lineSeg.theta), 
                                       lineSeg.p0.y + s*sin(lineSeg.theta));
            }
            
            out_point.x = lineSeg.p0.x + s*cos(lineSeg.theta);
            out_point.y = lineSeg.p0.y + s*sin(lineSeg.theta);
        };
        
        that.lineIntersection = function (line, out_point) {
            var s = lib.getParameterOfIntersection(
                line.point.x, line.point.y, line.theta,
                that.point.x, that.point.y, that.theta
            );
            
            if (false === s) {
                return false;
            }
            
            // use the parameter s to determine if the point lies on the ray
            if (s < 0 || s > that.length) {
                return false;
            }
            
            if (!out_point) {
                return lib.createPoint(that.point.x + s*cos(that.theta), 
                                       that.point.y + s*sin(that.theta));
            }
            
            out_point.x = that.point.x + s*cos(that.theta);
            out_point.y = that.point.y + s*sin(thatthat.theta);
        };
    
        return that;
    };
    
    lib.createLine = function (point, theta) {
        var that = {};
        
        that.point = point;
        that.theta = lib.boundAngle(theta);
        
        that.lineIntersection = function (line, out_point) {
            var s = lib.getParameterOfIntersection(
                that.point.x, that.point.y, that.theta,
                line.point.x, line.point.y, line.theta
            );
            
            if (false === s) {
                return false;
            }
            
            if (!out_point) {
                return lib.createPoint(line.point.x + s*cos(line.theta), 
                                       line.point.y + s*sin(line.theta));
            }
            
            out_point.x = line.point.x + s*cos(line.theta);
            out_point.y = line.point.y + s*sin(line.theta);
        };
        
        that.lineSegIntersection = function (lineSeg, out_point) {
            var s = lib.getParameterOfIntersection(
                that.point.x, that.point.y, that.theta,
                lineSeg.p0.x, lineSeg.p0.y, lineSeg.theta
            );
            
            if (false === s) {
                return false;
            }
            
            // use the parameter s to determine if the point lies on lineSeg
            if (s < 0 || s > lineSeg.length) {
                return false;
            }
            
            if (!out_point) {
                return lib.createPoint(lineSeg.p0.x + s*cos(lineSeg.theta), 
                                       lineSeg.p0.y + s*sin(lineSeg.theta));
            }
            
            out_point.x = lineSeg.p0.x + s*cos(lineSeg.theta);
            out_point.y = lineSeg.p0.y + s*sin(lineSeg.theta);
        };
    
        return that;
    };
    
    lib.createCircle = function (center, radius) {
        var that = {};

        that.type = "circle";
        that.center = center;
        that.radius = radius;
        
        that.containsPoint = function (point) {
            return lib.euclidDist(that.center, point) < that.radius;
        };
        
        that.closestIntersectionDistance = function (lineSeg) {
            var line = lib.createLine(that.center, lineSeg.theta + PI/2), 
                intersection;
            
            var containsP1 = that.containsPoint(lineSeg.p0),
                containsP2 = that.containsPoint(lineSeg.p1);
                                  
            // if both endpoints are inside, the segment cannot intersect
            if (containsP1 && containsP2) {
                return false;
            }
            
            // if either endpoints are inside (but not both), the segment must intersect
            if (containsP1 || containsP2) {
                return true;
            }
            
            intersection = line.lineSegIntersection(lineSeg);

            if (intersection && that.containsPoint(intersection)) {
                return GLib.euclidDist(intersection, lineSeg.p0);
            }

            return false;
        };

        that.intersectsLineSeg = function (lineSeg) {
            var line = lib.createLine(that.center, lineSeg.theta + PI/2), 
                intersection;
            
            var containsP1 = that.containsPoint(lineSeg.p0),
                containsP2 = that.containsPoint(lineSeg.p1);
                                  
            // if both endpoints are inside, the segment cannot intersect
            if (containsP1 && containsP2) {
                return false;
            }
            
            // if either endpoints are inside (but not both), the segment must intersect
            if (containsP1 || containsP2) {
                return true;
            }
            
            intersection = line.lineSegIntersection(lineSeg);

            if (intersection) {
                return that.containsPoint(intersection);
            }

            return false;
        };
        
        that.intersectsCircle = function (circle) {
            var dist = lib.euclidDist(that.center, circle.center);
            
            if (dist <= that.radius + circle.radius) {
                if (dist + that.radius >= circle.radius ||
                    dist + circle.radius >= that.radius) {
                    return true;
                }
            }
            
            return false;
        };
        
        that.intersectsPoly = function (poly) {
            return poly.intersectsCircle(that);
        };
        
        that.draw = function (context, fill) {
            context.beginPath();
            context.arc(that.center.x, that.center.y, that.radius, 0, Math.PI*2, false);
            
            if (fill) {
                context.fill();
            }
            
            context.stroke();
        };
        
        return that;
    };
    
    lib.createPolygon = function (points) {
        var that = {},
        
            len = points.length,
            lineSegs = new Array(len),
            i;
        
        that.type = "polygon";
        that.points = points;
        
        for (i = 0; i < len; i++) {
            lineSegs[i] = lib.createLineSeg(points[i], points[(i+1)%len]);
        }
        
        that.closestIntersectionDistance = function (lineSeg) {
            var i, p, dist, minDist = lineSeg.length;
        
            for (i = 0; i < len; i++) {
                p = lineSeg.lineSegIntersection(lineSegs[i]);
                
                if (p) {
                    dist = lib.euclidDist(p, lineSeg.p0);
                    if (dist < minDist) {
                        minDist = dist;
                    }
                }
            }
            
            return minDist;
        };
        
        that.intersectsLineSeg = function (lineSeg) {
            var i;
        
            for (i = 0; i < len; i++) {
                if (lineSeg.lineSegIntersection(lineSegs[i])) {
                    return true;
                }
            }
            
            return false;
        };
        
        that.intersectsCircle = function (circle) {
            var i;
            
            for (i = 0; i < len; i++) {
                if (circle.intersectsLineSeg(lineSegs[i])) {
                    return true;
                }
            }
            
            return false;
        };
        
        that.intersectsPoly = function (poly) {
            var i;
            
            for (i = 0; i < lineSegs.length; i++) {
                if (poly.intersectsLineSeg(lineSegs[i])) {
                    return true;
                }
            }
            
            return false;
        };
    
        that.draw = function (context, fill) {
            var i;
        
            context.beginPath();
            context.moveTo(points[0].x, points[0].y);
            
            for (i = 1; i < points.length; i++) {
                context.lineTo(points[i].x, points[i].y);
            }
            
            context.closePath();
            
            if (fill) {
                context.fill();
            }
            
            context.stroke();
        };
    
        return that;
    };

    lib.createBoxPolygon = function (x, y, width, height) {
        var points = new Array(4);

        points[0] = lib.createPoint(x, y);
        points[1] = lib.createPoint(x + width, y);
        points[2] = lib.createPoint(x + width, y + height);
        points[3] = lib.createPoint(x, y + height);

        return lib.createPolygon(points);
    };
    
    return lib;
}();
