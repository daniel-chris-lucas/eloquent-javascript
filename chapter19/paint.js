/**
 * Helper function for creating DOM elements.
 *
 * First 2 params are used as the name and attributes of the element.
 * All following arguments are are child nodes, strings are automatically
 * converted to text nodes.
 * 
 * @param  {String} name       The name of the element to create.
 * @param  {Object} attributes Attributes to add to the element.
 * @return {Object}            The create DOM element.
 */
function elt (name, attributes) {
    var node = document.createElement(name);

    if (attributes) {
        for (var attr in attributes) {
            if (attributes.hasOwnProperty(attr)) {
                node.setAttribute(attr, attributes[attr]);
            }
        }
    }

    for (var i = 2; i < arguments.length; i++) {
        var child = arguments[i];

        if (typeof child == "string") {
            child = document.createTextNode(child);
        }

        node.appendChild(child);
    }

    return node;
}

// Holder object for functions to initialize the controls.
var controls = Object.create(null);

/**
 * Insert a div into the wrapper containing the canvas and the toolbar.
 * 
 * @param  {Object} parent The parent DOM element to insert the editor inside.
 */
function createPaint (parent) {
    var canvas  = elt("canvas", {width: 500, height: 300}),
        cx      = canvas.getContext("2d"),
        toolbar = elt("div", {class: "toolbar"});

    for (var name in controls) {
        toolbar.appendChild(controls[name](cx));
    }

    var panel = elt("div", {class: "picturepanel"}, canvas);
    parent.appendChild(elt("div", null, panel, toolbar));
}

// Holder object for tool items.
var tools = Object.create(null);

/**
 * Create the tool select.
 *
 * Populates the list of tools and deactivates the default event
 * so that the tools can be used correctly.
 * 
 * @param  {Object} cx The 2d context.
 * @return {Object}    The generated list of tools.
 */
controls.tool = function (cx) {
    var select = elt("select");

    for (var name in tools) {
        select.appendChild(elt("option", null, name));
    }

    cx.canvas.addEventListener("mousedown", function (event) {
        if (event.which == 1) {
            tools[select.value](event, cx);
            event.preventDefault();
        }
    });

    return elt("span", null, "Tool: ", select);
};

/**
 * Retrieve canvas-relative coordinates of a given mouse event.
 * 
 * @param  {Event} event    The mouse event.
 * @param  {Object} element The element the event is happening on.
 * @return {Object}         X and Y coordinates relative to the element.
 */
function relativePos (event, element) {
    var rect = element.getBoundingClientRect();

    return {
        x: Math.floor(event.clientX - rect.left),
        y: Math.floor(event.clientY - rect.top)
    };
}

/**
 * Listen for mousemove events as long as the mouse button is held down.
 *
 * Takes care of the event registration and unregistration for mouse
 * dragging.
 * 
 * @param  {Function} onMove Function to run while mouse is moving.
 * @param  {Function} onEnd  Optional function to run when button is released.
 */
function trackDrag (onMove, onEnd) {
    function end (event) {
        removeEventListener("mousemove", onMove);
        removeEventListener("mouseup", end);

        if (onEnd) {
            onEnd(event);
        }
    }

    addEventListener("mousemove", onMove);
    addEventListener("mouseup", end);
};

/**
 * Line tool.
 * 
 * @param {Event} event  The mouse event.
 * @param {Object} cx    The context to draw on.
 * @param {Function} onEnd Callback to run when finished.
 */
tools.Line = function (event, cx, onEnd) {
    cx.lineCap = "round";

    var pos = relativePos(event, cx.canvas);

    trackDrag(function (event) {
        cx.beginPath();
        cx.moveTo(pos.x, pos.y);
        pos = relativePos(event, cx.canvas);
        cx.lineTo(pos.x, pos.y);
        cx.stroke();
    }, onEnd);
};

/**
 * Earse tool.
 * 
 * @param {Event} event The mouse event.
 * @param {Object} cx    The context to draw on.
 */
tools.Erase = function (event, cx) {
    // Change the way drawing affects touched pixels. Remove them.
    cx.globalCompositeOperation = "destination-out";
    tools.Line(event, cx, function () {
        // Set the drawing type to draw over the top of existing pixels.
        cx.globalCompositeOperation = "source-over";
    });
};

/**
 * Create color picker to change color of tools.
 * 
 * @param  {Object} cx The context to draw on.
 * @return {Object}    Color picker element.
 */
controls.color = function (cx) {
    var input = elt("input", {type: "color"});

    input.addEventListener("change", function () {
        cx.fillStyle = input.value;
        cx.strokeStyle = input.value;
    });

    return elt("span", null, "Color: ", input);
};

/**
 * Create list of sizes for tools.
 * 
 * @param  {Object} cx Context to draw on.
 * @return {Object}    Element for the list of sizes.
 */
controls.brushSize = function (cx) {
    var select = elt("select"),
        sizes  = [1, 2, 3, 5, 8, 12, 25, 35, 50, 75, 100];

    sizes.forEach(function (size) {
        select.appendChild(elt("option", {value: size}, size + " pixels"));
    });

    select.addEventListener("change", function () {
        cx.lineWidth = select.value;
    });

    return elt("span", null, "Brush size: ", select);
};

/**
 * Save the contents of the canvas.
 *
 * Transform the contents of the context into a data URL (base64 encoded).
 * 
 * @param  {Object} cx The context to draw on.
 * @return {String}    The data URL of the context data.
 */
controls.save = function (cx) {
    var link = elt("a", {href: '/'}, "Save");

    function update () {
        try {
            link.href = cx.canvas.toDataURL();
        } catch (e) {
            if (e instanceof SecurityError) {
                link.href = "javascript:alert(" + 
                    JSON.stringify("Can't save: " + e.toString()) + ")";
            } else {
                throw e;
            }
        }
    }

    // We only want to update the link when the save button is in focus
    // as generating the data URL can be resource intensive.
    link.addEventListener("mouseover", update);
    link.addEventListener("focus", update);
    return link;
};

/**
 * Load an image from a URL and resize the canvas to the size of the image.
 * 
 * @param  {Object} cx  The context to draw on.
 * @param  {String} url URL of the image to load.
 */
function loadImageURL(cx, url) {
    var image = document.createElement("img");

    image.addEventListener("load", function () {
        var color = cx.fillStyle,
            size  = cx.lineWidth;

        cx.canvas.width  = image.width;
        cx.canvas.height = image.height;
        cx.drawImage(image, 0, 0);
        cx.fillStyle   = color;
        cx.strokeStyle = color;
        cx.lineWidth   = size;
    });

    image.src = url;
}

/**
 * Open file control.
 * 
 * @param  {Object} cx Context to draw on.
 * @return {Object}    Element containing the file control.
 */
controls.openFile = function (cx) {
    var input = elt("input", {type: "file"});

    input.addEventListener("change", function () {
        if (input.files.length == 0) {
            return;
        }

        var reader = new FileReader();
        reader.addEventListener("load", function () {
            loadImageURL(cx, reader.result);
        });

        reader.readAsDataURL(input.files[0]);
    });

    return elt("div", null, "Open file: ", input);
};

/**
 * Control for opening a saved image.
 * 
 * @param  {Object} cx The context to draw on.
 * @return {Object}    Element containing the URL form.
 */
controls.openURL = function (cx) {
    var input = elt("input", {type: "text"}),
        form  = elt(
            "form", null, 
            "Open URL: ", input, 
            elt("button", {type: "submit"}, "load")
        );

    form.addEventListener("submit", function (event) {
        event.preventDefault();
        loadImageURL(cx, input.value);
    });

    return form;
};

/**
 * Text tool.
 *
 * @param {Event} event The mouse event
 * @param {Object} cx   The context to draw on.
 */
tools.Text = function (event, cx) {
    var text = prompt("Text:", "");
    if (text) {
        var pos = relativePos(event, cx.canvas);
        cx.font = Math.max(7, cx.lineWidth) + "px sans-serif";
        cx.fillText(text, pos.x, pos.y);
    }
};

/**
 * Spray tool.
 * @param {Event} event The mouse event
 * @param {Object} cx   The context to draw on.
 */
tools.Spray = function (event, cx) {
    var radius      = cx.lineWidth / 2,
        area        = radius * radius * Math.PI,
        dotsPerTick = Math.ceil(area/ 30),
        currentPos  = relativePos(event, cx.canvas);

    var spray = setInterval(function () {
        for (var i = 0; i  < dotsPerTick; i++) {
            var offset = randomPointInRadius(radius);
            cx.fillRect(currentPos.x + offset.x, currentPos.y + offset.y, 1, 1);
        }
    }, 25);

    trackDrag(function (event) {
        currentPos = relativePos(event, cx.canvas);
    }, function () {
        clearInterval(spray);
    });
};

/**
 * Function for generating random points withing a defined radius.
 * 
 * @param  {Number} radius The radius points should be drawn in.
 * @return {Object}        Object containing x and y coordinates of the points.
 */
function randomPointInRadius (radius) {
    for (;;) {
        var x = Math.random() * 2 - 1,
            y = Math.random() * 2 - 1;

        if (x * x + y * y <= 1) {
            return {x: x * radius, y: y * radius};
        }
    }
}

/**
 * Create rectangle using 2 points (oposite corners)
 * @param  {Object} a Coordinates of the first corner
 * @param  {Object} b Coordinates of the second corner
 * @return {Object}   Information of the rectangle (left, top, width, height)
 */
function rectangleFrom (a, b) {
    return {
        left   : Math.min(a.x, b.x),
        top    : Math.min(a.y, b.y),
        width  : Math.abs(a.x - b.x),
        height : Math.abs(a.y - b.y)
    };
}

/**
 * Rectangle tool.
 * 
 * @param {Event} event  The mouse event
 * @param {Object} cx    The context to draw on
 */
tools.Rectangle = function (event, cx) {
    var relativeStart = relativePos(event, cx.canvas),
        pageStart     = {x: event.pageX, y: event.pageY},
        trackingNode  = document.createElement("div");

    trackingNode.style.position = "absolute";
    trackingNode.style.background = cx.fillStyle;
    document.body.appendChild(trackingNode);

    trackDrag(function (event) {
        var rect = rectangleFrom(pageStart, {x: event.pageX, y: event.pageY});

        trackingNode.style.left   = rect.left + "px";
        trackingNode.style.top    = rect.top + "px";
        trackingNode.style.width  = rect.width + "px";
        trackingNode.style.height = rect.height + "px";
    }, function (event) {
        var rect = rectangleFrom(relativeStart, relativePos(event, cx.canvas));
        cx.fillRect(rect.left, rect.top, rect.width, rect.height);
        document.body.removeChild(trackingNode);
    });
};

/**
 * Get the color of the pixel at the given coordinates.
 * 
 * @param  {Object} cx The context to draw on.
 * @param  {Number} x  The x coordinate value
 * @param  {Number} y  The y coordinate value
 * @return {String}    The RGB value of the color.
 */
function colorAt (cx, x, y) {
    var pixel = cx.getImageData(x, y, 1, 1).data;
    return "rgb(" + pixel[0] + ", " + pixel[1] + ", " + pixel[2] + ")";
}

/**
 * Pick color tool.
 * 
 * @param  {Event} event  The mouse event
 * @param  {Object} cx    The context to draw on.
 */
tools["Pick color"] = function (event, cx) {
    var pos = relativePos(event, cx.canvas);
    try {
        var color = colorAt(cx, pos.x, pos.y);
    } catch (e) {
        if (e instanceof SecurityError) {
            alert("Unable to access your picture's pixel data");
            return;
        } else {
            throw e;
        }
    }

    cx.fillStyle = color;
    cx.strokeStyle = color;
};

/**
 * Call a given function for all horizontal and vertical neighbors
 * of a given point.
 * 
 * @param  {Object}   point The point x and y coordinates
 * @param  {Function} fn    The function to call.
 */
function forAllNeighbors (point, fn) {
    fn({x: point.x, y: point.y + 1});
    fn({x: point.x, y: point.y - 1});
    fn({x: point.x + 1, y: point.y});
    fn({x: point.x - 1, y: point.y});
}

/**
 * Check if two points are the same color.
 *
 * @param  {Object}  data The image data.
 * @param  {Object}  pos1 The x + y coordinates of the first point.
 * @param  {Object}  pos2 The x + y coordinates of the second point.
 * @return {Boolean}      True if both points are the same color.
 */
function isSameColor (data, pos1, pos2) {
    var offset1 = (pos1.x + pos1.y * data.width) * 4,
        offset2 = (pos2.x + pos2.y * data.width) * 4;

    for (var i = 0; i < 4; i++) {
        if (data.data[offset1 + i] != data.data[offset2 + i]) {
            return false;
        }
    }

    return true;
}

/**
 * Flood fill tool.
 *
 * @param  {Event} event  The mouse event
 * @param  {Object} cx    The context to draw on
 */
tools["Flood fill"] = function (event, cx) {
    var startPos = relativePos(event, cx.canvas),
        data     = cx.getImageData(0, 0, cx.canvas.width, cx.canvas.height);

    // Array with one place for each pixel in the image.
    var alreadyFilled = new Array(data.width * data.height);

    var workList = [startPos];
    while (workList.length) {
        var pos    = workList.pop(),
            offset = pos.x + data.width * pos.y;

        if (alreadyFilled[offset]) {
            continue;
        }

        cx.fillRect(pos.x, pos.y, 1, 1);
        alreadyFilled[offset] = true;

        forAllNeighbors(pos, function (neighbor) {
            if (neighbor.x >= 0 && neighbor.x < data.width &&
                neighbor.y >= 0 && neighbor.y < data.height &&
                isSameColor(data, startPos, neighbor)
            ) {
                workList.push(neighbor);
            }
        });
    }
};
