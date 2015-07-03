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
