/*
This library provides a way of drawing tree-structured frames, and checking
for collisions with objects in the world. 
It depends on Sylvester for matrix math and GLib for points.

By the way, I don't like Sylvester because of how it depends on allocating 
return values on the heap (otherwise I'd use it exclusively and get rid of 
GLib). I haven't yet heard a good argument for doing it that way. I plan to 
eventually modifying/forking it to change the functions I need to use to make 
Sylvester functions modify a reference instead of allocating return values. 
*/

FTLib = (function () {
    var lib = {},
    
        cos = Math.cos,
        sin = Math.sin,
    
        // this is an interface to allow cross-compatibility between GLib's 
        //  points and sylvester's matrix and vector math
        createMatrix = function (a00, a01, a02, a10, a11, a12) {
            var that = {};
            
            // using 2D homogeneous coordiates in order to incorporate translations
            that.matrix = $M([[a00, a01, a02],[a10, a11, a12],[0, 0, 1]]);
            
            that.copy = function () {
                var a00 = that.matrix.e(1, 1),
                    a01 = that.matrix.e(1, 2),
                    a02 = that.matrix.e(1, 3),
                    a10 = that.matrix.e(2, 1),
                    a11 = that.matrix.e(2, 2),
                    a12 = that.matrix.e(2, 3);
                
                return createMatrix(a00, a01, a02, a10, a11, a12);
            };
            
            that.multiply = function (point, out_point) {
                var res = that.matrix.multiply(
                    $V([point.x, point.y, 1])
                );
                
                if (out_point) {
                    out_point.x = res.e(1);
                    out_point.y = res.e(2);
                } else {
                    return GLib.createPoint(res.e(1), res.e(2));
                }
            };
            
            that.translate = function (x, y) {
                that.matrix = that.matrix.multiply(
                    $M([[1, 0, x],
                        [0, 1, y],
                        [0, 0, 1]])
                );
            };
            
            that.rotate = function (t) {
                that.matrix = that.matrix.multiply(
                    $M([[ cos(t),-sin(t), 0],
                        [ sin(t), cos(t), 0],
                        [      0,      0, 1]])
                );
            };
            
            return that;
        },
    
        transformShape = function (shape, matrix) {
            if ("polygon" === shape.type) {
                var polyCopy, 
                    pointsCopy = new Array(shape.points.length);

                for (i = 0; i < shape.points.length; i++) {
                    pointsCopy[i] = matrix.multiply(shape.points[i]);
                }

                return GLib.createPolygon(pointsCopy);
            } else if ("circle" === shape.type) {
                var centerCopy = matrix.multiply(shape.center);
                
                return GLib.createCircle(centerCopy, shape.radius);
            } else {
                console.log("wtf kind of shape is " + shapeCopy.type);
            }
        };
    
    lib.createNode = function (shape, draw, offset, children) {
        var that = {};
        
        that.shape = shape;
        that.draw = draw;
        that.offset = offset;
        that.children = children || [];
        that.transform = null;
        
        return that;
    };
    
    lib.setTransforms = function (node, matrix) {
        var i, newMatrix, shapeCopy;

        newMatrix = (matrix) ? matrix.copy() : createMatrix(1,0,0,0,1,0);
        
        newMatrix.translate(node.offset.x, node.offset.y);
        if (typeof node.offset.heading !== 'undefined') {
            newMatrix.rotate(node.offset.heading);
        }
        
        node.transform = newMatrix;
        
        for (i = 0; i < node.children.length; i++) {
            lib.setTransforms(node.children[i], newMatrix);
        }
    };
    
    lib.isAllowed = function (node, world, matrix) {
        var i, newMatrix, shapeCopy;

        newMatrix = (matrix) ? matrix.copy() : createMatrix(1,0,0,0,1,0);
        
        newMatrix.translate(node.offset.x, node.offset.y);
        if (typeof node.offset.heading !== 'undefined') {
            newMatrix.rotate(node.offset.heading);
        }
        
        node.transform = newMatrix;
        
        if (node.shape) {
            shapeCopy = transformShape(node.shape, newMatrix);
            
            if ("polygon" === shapeCopy.type) {
                if (!world.isPolyAllowed(shapeCopy)) {
                    return false;
                }
            } else if ("circle" === shapeCopy.type) {
                if (!world.isCircleAllowed(shapeCopy)) {
                    return false;
                }
            } else {
                console.log("wtf kind of shape is " + shapeCopy.type);
            }
        }
        
        for (i = 0; i < node.children.length; i++) {
            if (!lib.isAllowed(node.children[i], world, newMatrix)) {
                return false;
            }
        }
        
        return true;
    };
    
    lib.drawTree = function (node, context) {
        var i;
    
        context.save();
        
        context.translate(node.offset.x, node.offset.y);
        if (typeof node.offset.heading !== 'undefined') {
            context.rotate(node.offset.heading);
        }

        node.draw(context);
        
        for (i = 0; i < node.children.length; i++) {
            lib.drawTree(node.children[i], context);
        }
        
        // node.draw(context);
        
        context.restore();
    };
    
    return lib;
})();
