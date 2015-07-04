/**
 * Halper function for making requests to the server.
 *
 * Hides away all the XMLHttpRequest details.
 * 
 * @param  {Object}   options  List of options to pass to the request.
 * @param  {Function} callback Function to run when making the request.
 */
function request (options, callback) {
    var req = new XMLHttpRequest();
    req.open(options.method || "GET", options.pathname, true);
    req.addEventListener("load", function () {
        if (req.status < 400) {
            callback(null, req.responseText);
        } else {
            callback(new Error("Request failed: " + req.statusText));
        }
    });
    req.addEventListener("error", function () {
        callback(new Error("Network error"));
    });
    req.send(options.body || null);
}

var lastServerTime = 0;

// When the page first loads make a request to the server to retrieve the
// list of talks.
request({pathname: "talks"}, function (error, response) {
    if (error) {
        reportError(error);
    } else {
        response = JSON.parse(response);
        displayTalks(response.talks);
        lastServerTime = response.serverTime;
        waitForChanges();
    }
});

/**
 * Display errors on the screen.
 * @param  {Object} error The error that occured.
 */
function reportError (error) {
    if (error) {
        alert(error.toString());
    }
}

var talkDiv    = document.querySelector("#talks"),
    shownTalks = Object.create(null);

/**
 * Function used when polling to handle the list of talks.
 * Inserts and deletes talks from the screen depending on their current status
 * and the server response.
 * 
 * @param  {Array} talks The list of talks.
 */
function displayTalks (talks) {
    talks.forEach(function (talk) {
        var shown = shownTalks[talk.title];

        if (talk.deleted) {
            if (shown) {
                talkDiv.removeChild(shown);
                delete shownTalks[talk.title];
            }
        } else {
            var node = drawTalk(talk);
            if (shown) {
                talkDiv.replaceChild(node, shown);
            } else {
                talkDiv.appendChild(node);
            }

            shownTalks[talk.title] = node;
        }
    });
}

/**
 * Parse the templates for adding a talk or a comment.
 * 
 * @param  {String} name   Name of the template to use: talk or comment
 * @param  {Object} values List of values to insert at placeholders.
 * @return {Element}       DOM element with parsed values.
 */
function instantiateTemplate (name, values) {
    function instantiateText (text) {
        return text.replace(/\{\{(\w+)\}\}/g, function (_, name) {
            return values[name];
        });
    }

    function instantiate (node) {
        if (node.nodeType == document.ELEMENT_NODE) {
            var copy = node.cloneNode();

            for (var i = 0; i < node.childNodes.length; i++) {
                copy.appendChild(instantiate(node.childNodes[i]));
            }
            return copy;
        } else if (node.nodeType == document.TEXT_NODE) {
            return document.createTextNode(instantiateText(node.nodeValue));
        } else {
            return node;
        }
    }

    var template = document.querySelector("#template ." + name);
    return instantiate(template);
}

/**
 * Create DOM node for a talk and all items related to the talk.
 * 
 * @param  {Object} talk The talk to create.
 * @return {Object}      DOM element for the talk.
 */
function drawTalk (talk) {
    var node     = instantiateTemplate("talk", talk),
        comments = node.querySelector(".comments");

    talk.comments.forEach(function (comment) {
        comments.appendChild(instantiateTemplate("comment", comment));
    });

    node.querySelector("button.del").addEventListener(
        "click",
        deleteTalk.bind(null, talk.title)
    );

    var form = node.querySelector("form");
    form.addEventListener("submit", function (event) {
        event.preventDefault();
        addComment(talk.title, form.elements.comment.value);
        form.reset();
    });

    return node;
}

/**
 * Helper function for retrieving the URL for a talk.
 * 
 * @param  {String} title The title of the talk.
 * @return {String}       The URL for the talk.
 */
function talkURL (title) {
    return "talks/" + encodeURIComponent(title);
}

/**
 * Send request to delete a talk.
 * 
 * @param  {String} title The title of the talk to delete.
 */
function deleteTalk (title) {
    request({
        pathname : talkURL(title),
        method   : "DELETE",
    }, reportError);
}

/**
 * Send request to add a comment to a talk.
 * 
 * @param {String} title   The title of the talk to add the comment to.
 * @param {String} comment The comment to add to the talk.
 */
function addComment (title, comment) {
    var comment = {author: nameField.value, message: comment};

    request({
        pathname : talkURL(title) + "/comments",
        body     : JSON.stringify(comment),
        method   : "POST"
    }, reportError);
}

var nameField = document.querySelector("#name");
// Default the comment author to the value in local storage if it exists.
nameField.value = localStorage.getItem("name") || "";

// When the author name is updated, update the value in local storage.
nameField.addEventListener("change", function () {
    localStorage.setItem("name", nameField.value);
});

var talkForm = document.querySelector("#newtalk");

// Event listener for when the talk form is submitted.
// Make request to the server so save a new talk.
talkForm.addEventListener("submit", function (event) {
    event.preventDefault();

    request({
        pathname: talkURL(talkForm.elements.title.value),
        method: "PUT",
        body: JSON.stringify({
            presenter : nameField.value,
            summary   : talkForm.elements.summary.value
        })
    }, reportError);

    talkForm.reset();
});

/**
 * Poll server for changes to the talks.
 */
function waitForChanges () {
    request({
        pathname: "talks?changesSince=" + lastServerTime
    }, function (error, response) {
        if (error) {
            setTimeout(waitForChanges, 2500);
            console.log(error.stack);
        } else {
            response = JSON.parse(response);
            displayTalks(response.talks);
            lastServerTime = response.serverTime;
            waitForChanges();
        }
    });
}
