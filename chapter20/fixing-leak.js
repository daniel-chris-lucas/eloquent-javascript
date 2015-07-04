/**
 * Fixing a leak
 *
 *
 * For easy remote access to some files, I might get into the habit of
 * having the file server defined in this chapter running on my machine, in
 * the /home/marijn/public directory. Then, one day, I find that someone
 * has gained access to all the passwords I stored in my browser.
 *
 * What happened?
 * If it isn’t clear to you yet, think back to the urlToPath function,
 * defined like this:
 *
 * function urlToPath ( url ) {
 *     var path = require (" url ") . parse ( url ). pathname ;
 *     return "." + decodeURIComponent ( path );
 * }
 *
 * Now consider the fact that paths passed to the "fs" functions can be
 * relative—they may contain "../" to go up a directory. What happens when
 * a client sends requests to URLs like the ones shown here?
 *
 * http :// myhostname :8000/../. config / config / google - chrome / Default / Web %20 Data
 * http :// myhostname :8000/../. ssh / id_dsa
 * http :// myhostname :8000/../../../ etc / passwd
 *
 * Change urlToPath to fix this problem. Take into account the fact that
 * Node on Windows allows both forward slashes and backslashes to separate
 * directories.
 * Also, meditate on the fact that as soon as you expose some half-baked system
 * on the Internet, the bugs in that system might be used to do bad things
 * to your machine.
 */

function urlToPath (url) {
    var path = url;
    var decoded = decodeURIComponent(path);
    return "." + decoded.replace(/(\/|\\)\.\.(\/|\\|$)/g, "/");
}