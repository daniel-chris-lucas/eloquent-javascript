/**
 * Content negotiation, again
 *
 * 
 * In Chapter 17, the first exercise was to make several requests to
 * eloquent-javascript.net/author, asking for different types of content
 * by passing different Accept headers.
 *
 * Do this again, using Node’s http.request function. Ask for at least the
 * media types text/plain, text/html, and application/json. Remember that
 * headers to a request can be given as an object, in the headers property
 * of http.request’s first argument.
 *
 * Write out the content of the responses to each request.
 */
var http = require("http");

function readStreamAsString (stream, callback) {
    var content = "";
    stream.on("data", function (chunk) {
        content += chunk;
    });
    stream.on("end", function () {
        callback(null, content);
    });
    stream.on("error", function (error) {
        callback(error);
    });
}

fileTypes = [
    "text/plain",
    "text/html",
    "application/json"
];

fileTypes.forEach(function (type) {
    http.request({
        hostname: "eloquentjavascript.net",
        path: "/author",
        headers: {Accept: type}
    }, function (response) {
        readStreamAsString(response, function (error, content) {
            if (error) {
                throw error;
            }

            console.log("Type " + type + ": " + content);
        });
    }).end();
});