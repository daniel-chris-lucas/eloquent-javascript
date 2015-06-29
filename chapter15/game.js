var simpleLevelPlan = [
  "                      ",
  "                      ",
  "  x              = x  ",
  "  x         o o    x  ",
  "  x @      xxxxx   x  ",
  "  xxxxx            x  ",
  "      x!!!!!!!!!!!!x  ",
  "      xxxxxxxxxxxxxx  ",
  "                      "
];

/**
 * Build a Level object.
 *
 * Initializes the level width and height. Reads the plan to setup the grid
 * and the actors in the level.
 * 
 * @param {string} plan Map of the level.
 */
function Level (plan) {
    this.width  = plan[0].length;
    this.height = plan.length;
    this.grid   = [];
    this.actors = [];

    for (var y = 0; y < this.height; y++) {
        var line     = plan[y],
            gridLine = [];

        /*
         Parse the grid line.
         x: wall
         !: lava
         */
        for (var x = 0; x < this.width; x++) {
            var ch        = line[x],
                fieldType = null,
                Actor     = actorChars[ch];

            if (Actor) {
                this.actors.push(new Actor(new Vector(x, y), ch));
            } else if (ch == "x") {
                fieldType = "wall";
            } else if (ch == "!") {
                fieldType = "lava";
            }

            gridLine.push(fieldType);
        }

        this.grid.push(gridLine);
    }

    this.player = this.actors.filter(function (actor) {
        return actor.type == "player";
    })[0];

    this.status = null;
    this.finishDelay = null;
}

/**
 * Check if the level is finished.
 * @return {Boolean} True if the level is finished.
 */
Level.prototype.isFinished = function () {
    return this.status != null && this.finishDelay < 0;
}

/**
 * Build Vector object.
 *
 * Vector object contains information of each coordinate on the Level.
 * 
 * @param {integer} x The x axis of the coordinate.
 * @param {integer} y The y axis of the coordiante.
 */
function Vector (x, y) {
    this.x = x;
    this.y = y;
}

/**
 * Add current vector with another one. 
 * @param  {Vector} other Vector to add to the current one.
 * @return {Vector}       Result of the addition of the vectors.
 */
Vector.prototype.plus = function (other) {
    return new Vector(this.x + other.x, this.y + other.y);
}

/**
 * Multiply the coordinates of the current Vector by the given factor.
 *
 * Useful for multiplying a speed vector by a time interval to get the
 * distance travelled during that time.
 * 
 * @param  {Number} factor Factor to multiply by.
 * @return {Vector}        Result of the multiplication.
 */
Vector.prototype.times = function (factor) {
    return new Vector(this.x * factor, this.y * factor);
}

/**
 * Symbol map for the different types of actors in the Level:
 *
 * @ : Player
 * o : Coin
 * =, |, v : Lava
 * 
 * @type {Object}
 */
var actorChars = {
    "@": Player,
    "o": Coin,
    "=": Lava,
    "|": Lava;
    "v": Lava
};

/**
 * Build Player object.
 *
 * Represents the player character in the Level.
 * A Player has the position, size and speed attributes.
 * 
 * @param {Vector} pos The coordinates of the Player.
 */
function Player (pos) {
    // Pull the player up because the height of the player is 1 and 1/2 squares.
    this.pos = pos.plus(new Vector(0, -0.5));
    this.size = new Vector(0.8, 1.5);
    this.speed = new Vector(0, 0);
}

/**
 * Type attribute for the Player.
 * @type {String}
 */
Player.prototype.type = "player";
