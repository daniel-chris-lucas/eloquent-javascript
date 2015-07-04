var http     = require("http"),
    Router   = require("./router"),
    ecstatic = require("ecstatic");

var fileServer = ecstatic({root: "./public"});
var router     = new Router();

// Set up the server
http.createServer(function (request, response) {
    if (! router.resolve(request, response)) {
        // If the route wasn't found check for static files.
        fileServer(request, response);
    }
}).listen(8001);

/**
 * Helper function to send off responses.
 * 
 * @param  {Object} response
 * @param  {Object} status
 * @param  {Object} data
 * @param  {String} type
 */
function respond (response, status, data, type) {
    response.writeHead(status, {
        "Content-Type": type || "text/plain"
    });

    response.end(data);
}

/**
 * Helper function to send of a JSON response.
 *
 * @param  {Object} response
 * @param  {Object} status
 * @param  {Object} data
 * @param  {String} type
 */
function respondJSON(response, status, data) {
    respond(response, status, JSON.stringify(data), "application/json");
}

// Keeps track of the talks
var talks = Object.create(null);

/**
 * Retrieve a talk from the server.
 */
router.add("GET", /^\/talks\/([^\/]+)$/, function (request, response, title) {
    if (title in talks) {
        respondJSON(response, 200, talks[title]);
    } else {
        respond(response, 404, "No talk '" + title + "' found");
    }
});

/**
 * Delete a talk from the server.
 */
router.add("DELETE", /^\/talks\/([^\/]+)$/, function (request, response, title) {
    if (title in talks) {
        delete talks[title];
        registerChange(title);
    }

    respond(response, 204, null);
});

/**
 * Handler for parsing JSON in request body.
 * @param  {Object}   stream
 * @param  {Function} callback
 */
function readStreamAsJSON (stream, callback) {
    var data = "";

    stream.on("data", function (chunk) {
        data += chunk;
    });

    stream.on("end", function () {
        var result,
            error;

        try {
            result = JSON.parse(data);
        } catch (e) {
            error = e;
        }

        callback(error, result);
    });

    stream.on("error", function (error) {
        callback(error);
    });
}

/**
 * Add a talk on the server.
 */
router.add("PUT", /^\/talks\/([^\/]+)$/, function (request, response, title) {
    readStreamAsJSON(request, function (error, talk) {
        if (error) {
            respond(response, 400, error.toString());
        } else if (! talk ||
                   typeof talk.presenter != "string" ||
                   typeof talk.summary != "string"
        ) {
            respond(response, 400, "Bad talk data");
        } else {
            talks[title] = {
                title: title,
                presenter: talk.presenter,
                summary: talk.summary,
                comments: []
            };

            registerChange(title);
            respond(response, 204, null);
        }
    });
});

/**
 * Add a comment to a talk.
 */
router.add("POST", /^\/talks\/([^\/]+)\/comments$/, 
    function (request, response, title
) {
    readStreamAsJSON(request, function (error, comment) {
        if (error) {
            respond(response, 400, error.toString());
        } else if (! comment ||
                   typeof comment.author != "string" ||
                   typeof comment.message != "string"
        ) {
            respond(response, 400, "Bad comment data");
        } else if (title in talks) {
            talks[title].comments.push(comment);
            registerChange(title);
            respond(response, 204, null);
        } else {
            respond(response, 404, "No talk '" + title + "' found");
        }
    });
});

/**
 * Send list of talks to the client.
 * @param  {Object} talks    List of talks to send.
 * @param  {Object} response
 */
function sendTalks (talks, response) {
    respondJSON(response, 200, {
        serverTime : Date.now(),
        talks      : talks
    });
}

/**
 * Get the list of talks.
 */
router.add("GET", /^\/talks$/, function (request, response) {
    // Second param of parse is to tell URL module to parse query params.
    var query = require("url").parse(request.url, true).query;

    if (query.changesSince == null) {
        var list = [];

        for (var title in talks) {
            list.push(talks[title]);
        }

        sendTalks(list, response);
    } else {
        var since = Number(query.changesSince);
        if (isNaN(since)) {
            respond(response, 400, "Invalid parameter");
        } else {
            var changed = getChangedTalks(since);
            if (changed.length > 0) {
                sendTalks(changed, response);
            } else {
                waitForChanges(since, response);
            }
        }
    }
});

var waiting = [];

/**
 * Function for waiting for changes. Will poll for changes every 90 seconds.
 */
function waitForChanges (since, response) {
    var waiter = {since: since, response: response};
    waiting.push(waiter);
    setTimeout(function () {
        var found = waiting.indexOf(waiter);
        if (found > -1) {
            waiting.splice(found, 1);
            sendTalks([], response);
        }
    }, 90 * 1000);
}

var changes = [];

/**
 * Function for registering when a change has been made to the list of talks.
 * Adds an element to the chnages array which is used for keeping track
 * of things.
 */
function registerChange (title) {
    changes.push({title: title, time: Date.now()});
    waiting.forEach(function (waiter) {
        sendTalks(getChangedTalks(waiter.since), waiter.response);
    });
    waiting = [];
}

/**
 * Get the list of talks that have changed since last request.
 * @param  {Number} since Timestamp of the last request.
 * @return {Array}        List of the changed talks.
 */
function getChangedTalks (since) {
    var found = [];

    function alreadySeen (title) {
        return found.some(function (f) {
            return f.title == title;
        });
    }

    for (var i = changes.length - 1; i >= 0; i--) {
        var change = changes[i];
        if (change.time <= since) {
            break;
        } else if (alreadySeen(change.title)) {
            continue;
        } else if (change.title in talks) {
            found.push(talks[change.title]);
        } else {
            found.push({
                title   : change.title,
                deleted : true
            });
        }
    }

    return found;
}
