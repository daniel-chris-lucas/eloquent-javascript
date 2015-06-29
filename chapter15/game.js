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

    this.status = 
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

/**
 * Build Lava object.
 *
 * Different characters behave differently.
 * '=': horizontal lava bounces back and forth
 * '|': dripping lava moves up and down
 * 'v': dripping lava. Jumps back to top.
 * 
 * @param {Vector} pos The coordinates of the Lava.
 * @param {string} ch  The character representing the Lava.
 */
function Lava (pos, ch) {
    this.pos = pos;
    this.size = new Vector(1, 1);

    if (ch == "=") {
        this.speed = new Vector(2, 0);
    } else if (ch == "|") {
        this.speed = new Vector(0, 2);
    } else if (ch == "v") {
        this.speed = new Vector(0, 3);
        this.repeatPos = pos;
    }
}

/**
 * Type attribute for the Lava.
 * @type {String}
 */
Lava.prototype.type = "lava";

/**
 * Build Coin object.
 *
 * The coins move in a wavy motion going from 0 to 2π.
 * To avoid all coins moving synchronously the starting point is
 * set randomly.
 * 
 * @param {Vector} pos The coordinates of the Coin.
 */
function Coin (pos) {
    this.basePos = 
    this.pos = pos.plus(new Vector(0.2, 0.1));
    this.size = new Vector(0.6, 0.6);
    this.wobble = Math.random() * Math.PI * 2;
}

/**
 * Type attribute for the Coin.
 * @type {String}
 */
Coin.prototype.type = "coin";

// Build the Level using the plan.
var simpleLevel = new Level(simpleLevelPlan);