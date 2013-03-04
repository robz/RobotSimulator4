var circle = GLib.createCircle(
        GLib.createPoint(0, 0), 
        10
    ),
    
    polygon = GLib.createPolygon([
        GLib.createPoint(5,0), 
        GLib.createPoint(-20,0), 
        GLib.createPoint(-20,20), 
        GLib.createPoint(5,20)
    ]),
    
    seg = GLib.createLineSeg(
        GLib.createPoint(-20,0), 
        GLib.createPoint(20,0)
    );
    
console.log(circle.intersectsPoly(polygon));
console.log(polygon.intersectsCircle(circle));
console.log(circle.intersectsLineSeg(seg));