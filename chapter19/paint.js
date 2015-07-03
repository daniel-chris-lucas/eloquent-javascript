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
