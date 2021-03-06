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

    this.status = this.finishDelay = null;
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
    "|": Lava,
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
    this.basePos = this.pos = pos.plus(new Vector(0.2, 0.1));
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

/**
 * Create a DOM element.
 * 
 * @param  {String} name      The type of DOM element to create.
 * @param  {String} className Optional class to add on the DOM element.
 * @return {Object}           The DOM element that has been created.
 */
function elt (name, className) {
    var elt = document.createElement(name);
    if (className) {
        elt.className = className;
    }
    return elt;
}

/**
 * Set up the DOM display.
 *
 * Creates a div that is injected into the game's frame.
 * Calls functions to draw the background, the actor layer and the frame.
 * 
 * @param {Object} parent The DOM object the game should be inserted in.
 * @param {Level} level   The Level object that represents the game.
 */
function DOMDisplay (parent, level) {
    this.wrap = parent.appendChild(elt('div', 'game'));
    this.level = level;

    this.wrap.appendChild(this.drawBackground());
    this.actorLayer = null;
    this.drawFrame();
}

// How much should a single unit be scaled by?
// A single pixel per unit would be tiny.
var scale = 20;

/**
 * Draw the background of the game.
 *
 * Creates a table for the DOM with the width and height of the Level.
 * Draws one table cell for each grid position.
 * 
 * @return {Object} DOM element for the background table.
 */
DOMDisplay.prototype.drawBackground = function () {
    var table = elt("table", "background");
    table.style.width = this.level.width * scale + "px";

    this.level.grid.forEach(function (row) {
        var rowElt = table.appendChild(elt("tr"));
        rowElt.style.height = scale + "px";
        row.forEach(function (type) {
            rowElt.appendChild(elt("td", type));
        });
    });

    return table;
};

/**
 * Draw the actor layer of the game.
 *
 * For each actor in the game drawActors will create a div for the DOM
 * that has a class of 'actor actor_type':
 * 'actor coin', 'actor player'...
 * 
 * @return {Object} DOM object (div) containing other DOM objects that
 * represent the different actors of the game.
 */
DOMDisplay.prototype.drawActors = function () {
    var wrap = elt("div");

    this.level.actors.forEach(function (actor) {
        var rect = wrap.appendChild(elt("div", "actor " + actor.type));
        rect.style.width = actor.size.x * scale + "px";
        rect.style.height = actor.size.y * scale + "px";
        rect.style.left = actor.pos.x * scale + "px";
        rect.style.top = actor.pos.y * scale + "px";
    });

    return wrap;
};

/**
 * Draw the frames.
 *
 * Each time the game is redrawn remove all the actors and redraw them.
 * With the number of actors on the screen it's not too resource intensive
 * and is quicker than trying to reuse existing items.
 */
DOMDisplay.prototype.drawFrame = function () {
    if (this.actorLayer) {
        this.wrap.removeChild(this.actorLayer);
    }

    this.actorLayer = this.wrap.appendChild(this.drawActors());
    this.wrap.className = "game " + (this.level.status || "");
    // If game is larger than screen make sure the player is in the viewport.
    this.scrollPlayerIntoView();
};

/**
 * Scroll the player into view.
 *
 * Make sure the player is in the center of the viewport if
 * the game is larger than the screen.
 */
DOMDisplay.prototype.scrollPlayerIntoView = function () {
    var width  = this.wrap.clientWidth,
        height = this.wrap.clientHeight,
        margin = width / 3;

    // The viewport
    var left   = this.wrap.scrollLeft,
        right  = left + width,
        top    = this.wrap.scrollTop,
        bottom = top + height,
        player = this.level.player,
        // To find center multiply the players size by half then multiply
        // by the scale.
        center = player.pos.plus(player.size.times(0.5)).times(scale);

    if (center.x < left + margin) {
        this.wrap.scrollLeft = center.x - margin;
    } else if (center.x > right - margin) {
        this.wrap.scrollLeft = center.x + margin - width;
    }

    if (center.y < top + margin) {
        this.wrap.scrollTop = center.y - margin;
    } else if (center.y > bottom - margin) {
        this.wrap.scrollTop = center.y + margin - height;
    }
};

/**
 * Clear the actors layer.
 *
 * Clear the actors layer from the game.
 * Used when moving to next level or resetting the current level.
 */
DOMDisplay.prototype.clear = function () {
    this.wrap.parentNode.removeChild(this.wrap);
};

/**
 * Detect if there is an obstacle at the given coordiantes.
 *
 * @param  {Vector} pos  The coordinates of the point.
 * @param  {Integer} size The size of the point.
 * @return {mixed|String}  The type of object at the point if there is something. 
 */
Level.prototype.obstacleAt = function (pos, size) {
    var xStart = Math.floor(pos.x),
        xEnd   = Math.ceil(pos.x + size.x),
        yStart = Math.floor(pos.y),
        yEnd   = Math.ceil(pos.y + size.y);

    if (xStart < 0 || xEnd > this.width || yStart < 0) {
        return "wall";
    }

    if (yEnd > this.height) {
        return "lava";
    }

    for (var y = yStart; y < yEnd; y++) {
        for (var x = xStart; x < xEnd; x++) {
            var fieldType = this.grid[y][x];
            if (fieldType) {
                return fieldType;
            }
        }
    }
};

/**
 * Check if there is an actor overlapping the position of the argument.
 * @param  {Object} actor The actor to check
 * @return {mixed|null}   The actor that os overlapping if there is one.
 */
Level.prototype.actorAt = function (actor) {
    for (var i = 0; i < this.actors.length; i++) {
        var other = this.actors[i];

        if (
            other != actor && 
            actor.pos.x + actor.size.x > other.pos.x &&
            actor.pos.x < other.pos.x + other.size.x &&
            actor.pos.y + actor.size.y > other.pos.y &&
            actor.pos.y < other.pos.y + other.size.y
        ) {
            return other;
        }
    }
};

var maxStep = 0.05;

/**
 * Move the actors on the screen.
 * @param  {Integer} step The step in seconds.
 * @param  {Object} keys Information about the arrow keys the player has pressed.
 */
Level.prototype.animate = function (step, keys) {
    if (this.status != null) {
        this.finishDelay -= step;
    }

    // Make sure that the step isn't too large.
    // Instead of having a large step like 0.12s cut it down into smaller steps
    // of 0.05 + 0.05 + 0.02
    while (step > 0) {
        var thisStep = Math.min(step, maxStep);
        this.actors.forEach(function (actor) {
            actor.act(thisStep, this, keys);
        }, this);
        step -= thisStep;
    }
};

/**
 * Action method for Lava.
 *
 * Make the Lava move, compute new position by adding product of the time
 * step and its current speed to its old position.
 * Move there if there is no obstacle.
 * If bouncing lava, invert the speed.
 * 
 * @param  {Integer} step  The step in seconds.
 * @param  {Level} level The Level that is being played.
 */
Lava.prototype.act = function (step, level) {
    var newPos = this.pos.plus(this.speed.times(step));
    if (! level.obstacleAt(newPos, this.size)) {
        this.pos = newPos;
    } else if (this.repeatPos) {
        this.pos = this.repeatPos;
    } else {
        this.speed = this.speed.times(-1);
    }
};

var wobbleSpeed = 8,
    wobbleDist  = 0.07;

/**
 * Action method for Coin.
 *
 * Make the Coin wobble. Coins don't worry about collision as they simply
 * wobble in their own square.
 * @param  {Integer} step The step in seconds.
 */
Coin.prototype.act = function (step) {
    this.wobble += step * wobbleSpeed;
    var wobblePos = Math.sin(this.wobble) * wobbleDist;
    this.pos = this.basePos.plus(new Vector(0, wobblePos));
};

var playerXSpeed = 7;

/**
 * Compute the horizontal motion of the player based on the state
 * of the left and right arrow keys.
 * 
 * @param  {Integer} step  The step in seconds.
 * @param  {Level} level The level the player is on.
 * @param  {Object} keys  Information about the status of the arrow keys.
 */
Player.prototype.moveX = function (step, level, keys) {
    this.speed.x = 0;

    if (keys.left) {
        this.speed.x -= playerXSpeed;
    }

    if (keys.right) {
        this.speed.x += playerXSpeed;
    }

    var motion   = new Vector(this.speed.x * step, 0),
        newPos   = this.pos.plus(motion),
        obstacle = level.obstacleAt(newPos, this.size);

    if (obstacle) {
        level.playerTouched(obstacle);
    } else {
        this.pos = newPos;
    }
};

var gravity   = 30,
    jumpSpeed = 17;

/**
 * Accelerate player vertically at the beginning to account for gravity.
 * If the player is moving down and pressing up, revserse speed when player
 * hits the ground.
 * If going up and no obstacle move the player.
 * 
 * @param  {Integer} step  The step in seconds.
 * @param  {Level} level The level the player is on.
 * @param  {Object} keys  Details about the status of the keys.
 */
Player.prototype.moveY = function (step, level, keys) {
    this.speed.y += step * gravity;

    var motion   = new Vector(0, this.speed.y * step),
        newPos   = this.pos.plus(motion),
        obstacle = level.obstacleAt(newPos, this.size);

    if (obstacle) {
        level.playerTouched(obstacle);

        if (keys.up && this.speed.y > 0) {
            this.speed.y = -jumpSpeed;
        } else {
            this.speed.y = 0;
        }
    } else {
        this.pos = newPos;
    }
};

/**
 * Action method for Player.
 *
 * Call the moveX and moveY methods.
 * If the player has touched something call the playerTouched method.
 * If the player has lost, make the player shrink down.
 * 
 * @param  {[type]} step  [description]
 * @param  {[type]} level [description]
 * @param  {[type]} keys  [description]
 * @return {[type]}       [description]
 */
Player.prototype.act = function (step, level, keys) {
    this.moveX(step, level, keys);
    this.moveY(step, level, keys);

    var otherActor = level.actorAt(this);
    if (otherActor) {
        level.playerTouched(otherActor.type, otherActor);
    }

    // Losing animation
    if (level.status == "lost") {
        this.pos.y += step;
        this.size.y -= step;
    }
};

/**
 * When the player touches something decide what to do.
 *
 * If the player has touched lava the game is lost.
 * If a coin is touched it is removed from the array of actors.
 * If it was the last coin the game is won.
 * 
 * @param  {String} type  The type of actor that was touched.
 * @param  {mixed} actor The value of the actor that was touched.
 */
Level.prototype.playerTouched = function (type, actor) {
    if (type == "lava" && this.status == null) {
        this.status = "lost";
        this.finishDelay = 1;
    } else if (type == "coin") {
        this.actors = this.actors.filter(function (other) {
            return other != actor;
        });

        if (! this.actors.some(function (actor) {
            return actor.type == "coin";
        })) {
            this.status = "won";
            this.finishDelay = 1;
        }
    }
};

var arrowCodes = {37: "left", 38: "up", 39: "right"};

/**
 * Detect which key the user is pressing.
 * @param  {Object} codes Map of what the arrow keys should do.
 * @return {Object}       Details of the key that was pressed.
 */
function trackKeys (codes) {
    var pressed = Object.create(null);

    function handler (event) {
        if (codes.hasOwnProperty(event.keyCode)) {
            var state = event.type == "keydown";

            pressed[codes[event.keyCode]] = state;
            event.preventDefault();
        }
    }

    addEventListener("keydown", handler);
    addEventListener("keyup", handler);

    pressed.unregister = function () {
        removeEventListener("keydown", handler);
        removeEventListener("keyup", handler);
    };

    return pressed;
}

/**
 * Helper function for handling animations. Hide away use of requestAnimationFrame.
 *
 * @param  {Function} frameFunc Callback to use when calling runAnimation.
 */
function runAnimation (frameFunc) {
    var lastTime = null;

    function frame (time) {
        var stop = false;

        if (lastTime != null) {
            // Maximum frame step of 100ms.
            var timeStep = Math.min(time - lastTime, 100) / 100;
            stop = frameFunc(timeStep) === false;
        }

        lastTime = time;

        if (! stop) {
            requestAnimationFrame(frame);
        }
    }

    requestAnimationFrame(frame);
}

var arrows = trackKeys(arrowCodes);

/**
 * Function for running the level. Sets up the display and runs the animations.
 *
 * @param  {Level} level   The Level the player is on.
 * @param  {Display} Display The display class the game should use.
 * @param  {Function} andThen Callback function for when the level is finished.
 */
function runLevel (level, Display, andThen) {
    var display = new Display(document.body, level),
        running = "yes";

    function handleKey (event) {
        if (event.keyCode == 27) {
            if (running == "no") {
                running = "yes";
                runAnimation(animation);
            } else if (running == "pausing") {
                running = "yes";
            } else if (running == "yes") {
                running = "pausing";
            }
        }
    }

    addEventListener("keydown", handleKey);
    var arrows = trackKeys(arrowCodes);

    function animation (step) {
        if (running == "pausing") {
            running = "no";
            return false;
        }

        level.animate(step, arrows);
        display.drawFrame(step);

        if (level.isFinished()) {
            display.clear();
            // Remove all event handlers
            removeEventListener("keydown", handleKey);
            arrows.unregister();

            if (andThen) {
                andThen(level.status);
            }

            return false;
        }
    }

    runAnimation(animation);
}

function runGame (plans, Display) {
    function startLevel (n) {
        runLevel(new Level(plans[n]), Display, function (status) {
            if (status == "lost") {
                startLevel(n);
            } else if (n < plans.length - 1) {
                startLevel(n + 1);
            } else {
                console.log('You win')
            }
        });
    }

    function startLevelWithLives (n, lives) {
        runLevel(new Level(plans[n]), Display, function (status) {
            if (status == "lost") {
                if (lives > 0) {
                    startLevelWithLives(n, lives - 1);
                } else {
                    console.log("Game over");
                    startLevelWithLives(0, 3);
                }
            } else if (n < plans.length - 1) {
                startLevelWithLives(n + 1, lives);
            } else {
                console.log('You win');
            }
        });
    }

    startLevelWithLives(0, 3);
}

/**
 * Build Canvas Display.
 *
 * Replacement Display class for the DOMDisplay.
 * 
 * @param {Object} parent The game wrapper
 * @param {Level} level  The Level the player is on.
 */
function CanvasDisplay (parent, level) {
    this.canvas = document.createElement("canvas");
    this.canvas.width = Math.min(600, level.width * scale);
    this.canvas.height = Math.min(450, level.height * scale);
    parent.appendChild(this.canvas);
    this.cx = this.canvas.getContext("2d");

    this.level = level;
    this.animationTime = 0;
    this.flipPlayer = false;

    this.viewport = {
        left: 0,
        top: 0,
        width: this.canvas.width / scale,
        height: this.canvas.height / scale
    };

    this.drawFrame(0);
}

/**
 * Clear the Canvas Display
 */
CanvasDisplay.prototype.clear = function () {
    this.canvas.parentNode.removeChild(this.canvas);
};

/**
 * Method for drawing the frame.
 *
 * Calls necessary functions to clear the game, draw the background
 * and add Actors to the screen.
 * 
 * @param  {Integer} step The step in seconds.
 */
CanvasDisplay.prototype.drawFrame = function (step) {
    this.animationTime += step;
    this.updateViewport();
    this.clearDisplay();
    this.drawBackground();
    this.drawActors();
};

/**
 * Move the viewport so that the player is always inside.
 */
CanvasDisplay.prototype.updateViewport = function () {
    var view   = this.viewport,
        margin = view.width / 3,
        player = this.level.player,
        center = player.pos.plus(player.size.times(0.5));

    if (center.x < view.left + margin) {
        view.left = Math.max(center.x - margin, 0);
    } else if (center.x > view.left + view.width - margin) {
        view.left = Math.min(
            center.x + margin - view.width, 
            this.level.width - view.width
        );
    }

    if (center.y < view.top + margin) {
        view.top = Math.max(center.y - margin, 0);
    } else if (center.y > view.top + view.height - margin) {
        view.top = Math.min(
            center.y + margin - view.height, 
            this.level.height - view.height
        );
    }
};

/**
 * Clear the game.
 *
 * Draw a solid color across the whole canvas to clear it.
 */
CanvasDisplay.prototype.clearDisplay = function () {
    if (this.level.status == "won") {
        this.cx.fillStyle = "rgb(68, 191, 255)";
    } else if (this.level.status == "lost") {
        this.cx.fillStyle = "rgb(44, 136, 214)";
    } else {
        this.cx.fillStyle = "rgb(52, 166, 251)";
    }

    this.cx.fillRect(0, 0, this.canvas.width, this.canvas.height);
};

var otherSprites = document.createElement("img");
otherSprites.src = "img/sprites.png";

/**
 * Draw the background.
 */
CanvasDisplay.prototype.drawBackground = function () {
    var view   = this.viewport,
        xStart = Math.floor(view.left),
        xEnd   = Math.ceil(view.left + view.width),
        yStart = Math.floor(view.top),
        yEnd   = Math.ceil(view.top + view.height);

    for (var y = yStart; y < yEnd; y++) {
        for (var x = xStart; x < xEnd; x++) {
            var tile = this.level.grid[y][x];
            if (tile == null) {
                continue;
            }

            var screenX = (x - view.left) * scale,
                screenY = (y - view.top) * scale,
                tileX   = tile == "lava" ? scale : 0;

            this.cx.drawImage(
                otherSprites, 
                tileX, 0, scale, scale, 
                screenX, screenY, scale, scale);
        }
    }
};

var playerSprites = document.createElement("img");
playerSprites.src = "img/player.png";
var playerXOverlap = 4;

/**
 * Helper function for horizontally flipping an element.
 */
function flipHorizontally (context, around) {
    context.translate(around, 0);
    context.scale(-1, 1);
    context.translate(-around, 0);
}

/**
 * Display the player.
 *
 * Checks what the player is doing and displays the sprite for the player.
 * 
 * @param  {Integer} x      The player's x position
 * @param  {Integer} y      The player's y position 
 * @param  {Integer} width  The width of the player
 * @param  {Integer} height The height of the player
 */
CanvasDisplay.prototype.drawPlayer = function (x, y, width, height) {
    var sprite = 8,
        player = this.level.player;

    width += playerXOverlap * 2;
    x -= playerXOverlap;

    if (player.speed.x != 0) {
        this.flipPlayer = player.speed.x < 0;
    }

    if (player.speed.y != 0) {
        sprite = 9;
    } else if (player.speed.x != 0) {
        sprite = Math.floor(this.animationTime * 12) % 8;
    }

    this.cx.save();
    if (this.flipPlayer) {
        flipHorizontally(this.cx, x + width / 2);
    }

    this.cx.drawImage(
        playerSprites, 
        sprite * width, 0, width, height, 
        x, y, width, height
    );

    this.cx.restore();
};

/**
 * Draw the actors on the screen.
 *
 * If not the player, coin sprite is third, lava is second.
 */
CanvasDisplay.prototype.drawActors = function () {
    this.level.actors.forEach(function (actor) {
        var width  = actor.size.x * scale,
            height = actor.size.y * scale,
            x      = (actor.pos.x - this.viewport.left) * scale,
            y      = (actor.pos.y - this.viewport.top) * scale;

        if (actor.type == "player") {
            this.drawPlayer(x, y, width, height);
        } else {
            var tileX = (actor.type == "coin" ? 2 : 1) * scale;
            this.cx.drawImage(
                otherSprites, 
                tileX, 0, width, height, 
                x, y, width, height
            );
        }
    }, this);
};
