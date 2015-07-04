/**
 * Router constructor.
 */
var Router = module.exports = function () {
    this.routes = [];
};

/**
 * Register new handlers.
 */
Router.prototype.add = function (method, url, handler) {
    this.routes.push({
        method  : method,
        url     : url,
        handler : handler
    });
};

/**
 * Resolve requests.
 * @return {Boolean}          True if a handler was found.
 */
Router.prototype.resolve = function (request, response) {
    var path = require("url").parse(request.url).pathname;

    return this.routes.some(function (route) {
        var match = route.url.exec(path);

        if (! match || route.method != request.method) {
            return false;
        }

        var urlParts = match.slice(1).map(decodeURIComponent);
        route.handler.apply(null, [request, response].concat(urlParts));
        return true;
    });
};
