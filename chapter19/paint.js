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

tools.Text = function (event, cx) {
    var text = prompt("Text:", "");
    if (text) {
        var pos = relativePos(event, cx.canvas);
        cx.font = Math.max(7, cx.lineWidth) + "px sans-serif";
        cx.fillText(text, pos.x, pos.y);
    }
};
