var plan = ["############################",
            "#      #    #      o      ##",
            "#                          #",
            "#          #####           #",
            "##         #   #    ##     #",
            "###           ##     #     #",
            "#           ###      #     #",
            "#   ####                   #",
            "#   ##       o             #",
            "# o  #         o       ### #",
            "#    #                     #",
            "############################"];

/**
 * Vector constructor
 *
 * Sets the coordinates of objects.
 * 
 * @param {integer} x X value of the vector
 * @param {integer} y Y value of the vector
 */
function Vector (x, y) {
    this.x = x;
    this.y = y;
}

/**
 * Add another vector to this one.
 * 
 * @param  {Vector} other The vector to add to this one.
 * @return {Vector}       New vector which is the result of an addition of both vectors.
 */
Vector.prototype.plus = function (other) {
    if (other != null) {
        return new Vector(this.x + other.x, this.y + other.y);
    }
};

/**
 * Grid constructor.
 * 
 * @param {integer} width  The width of the grid.
 * @param {integer} height The height of the grid.
 */
function Grid (width, height) {
    this.space = new Array(width * height);
    this.width = width;
    this.height = height;
}

/**
 * Check if a vector is inside the grid.
 * @param  {Vector}  vector The vector to check
 * @return {Boolean}        True if the vector is in the grid.
 */
Grid.prototype.isInside = function (vector) {
    return vector.x >= 0 && vector.x < this.width &&
        vector.y >= 0 && vector.y < this.height;
};

/**
 * Return the value of a vector in the grid.
 * @param  {Vector} vector The vector to get.
 * @return {mixed}         The value of the vector.
 */
Grid.prototype.get = function (vector) {
    // the element at (x,y) is found at position x + (y × width) in the array
    return this.space[vector.x + this.width * vector.y];
};

/**
 * Set a new vector on the grid.
 * @param {Vector} vector The vector to add to the grid.
 * @param {mixed} value  The value attached to the vector.
 */
Grid.prototype.set = function (vector, value) {
    // the element at (x,y) is found at position x + (y × width) in the array
    this.space[vector.x + this.width * vector.y] = value;
}

// var grid = new Grid(5, 5);
// console.log(grid.get(new Vector(1, 1)));
// grid.set(new Vector(1, 1), "X");
// console.log(grid.get(new Vector(1, 1)));

var directions = {
    "n"  : new Vector(0, -1),
    "ne" : new Vector(1, -1),
    "e"  : new Vector(1, 0),
    "se" : new Vector(1, 1),
    "s"  : new Vector(0, 1),
    "sw" : new Vector(-1, 1),
    "w"  : new Vector(-1, 0),
    "nw" : new Vector(-1, -1)
};

/**
 * Retrieve a random element from an array.
 *
 * @param  {array} array  Array to pick from.
 * @return {mixed}        Item picked from the array.
 */
function randomElement (array) {
    return array[Math.floor(Math.random() * array.length)];
}

var directionNames = "n ne e se s sw w nw".split(" ");

/**
 * Critter constructor.
 *
 * Builds a new Critter object with a random direction.
 */
function BouncingCritter() {
    this.direction = randomElement(directionNames);
}

/**
 * Action for the critter.
 *
 * @param  {View}   view The surrounding view of the critter.
 * @return {object}      The action the critter should take.
 */
BouncingCritter.prototype.act = function (view) {
    if (view.look(this.direction) !== " ") {
        this.direction = view.find(" ") || "s";
    }

    return {type: "move", direction: this.direction};
}

/**
 * Transform a map element into a world object.
 * 
 * @param  {object} legend Map linking world objects to characters.
 * @param  {string} char   The character to transform.
 * @return {mixed}         The type of object that matches the character.
 */
function elementFromChar (legend, char) {
    if (char == " ") {
        return null;
    }

    var element = new legend[char]();
    element.originChar = char;
    return element;
}

/**
 * Build a new World.
 *
 * @param {string} map    String representation of the world.
 * @param {object} legend Map for linking characters to objects.
 */
function World (map, legend) {
    var grid = new Grid(map[0].length, map.length);
    this.grid = grid;
    this.legend = legend;

    map.forEach(function (line, y) {
        for (var x = 0; x < line.length; x++) {
            grid.set(new Vector(x, y), elementFromChar(legend, line[x]));
        }
    });
}

/**
 * Retrieve the character matching a world element.
 *
 * @param  {mixed} element  The world element.
 * @return {string}         The character matching the world element.
 */
function charFromElement (element) {
    if (element == null) {
        return " ";
    }

    return element.originChar;
}

/**
 * Outputs the world in string format.
 *
 * @return {string} String representation of the world.
 */
World.prototype.toString = function () {
    var output = "";
    for (var y = 0; y < this.grid.height; y++) {
        for (var x = 0; x < this.grid.width; x++) {
            var element = this.grid.get(new Vector(x, y));
            output += charFromElement(element);
        }

        output += "\n";
    }

    return output;
};

/**
 * Build a wall.
 */
function Wall () {}

var world = new World(plan, {
    "#": Wall, 
    "o": BouncingCritter
});

/**
 * forEach method for the Grid.
 *
 * @param  {function} f     Callback to use when looping over the Grid.
 * @param  {mixed}  context The context from which the method is being called.
 */
Grid.prototype.forEach = function (f, context) {
    for (var y = 0; y < this.height; y++) {
        for (x = 0; x < this.width; x++) {
            var value = this.space[x + y * this.width];

            if (value != null) {
                f.call(context, value, new Vector(x, y));
            }
        }
    }
};

/**
 * Simulate one turn in the World.
 */
World.prototype.turn = function () {
    var acted = [];

    this.grid.forEach(function (critter, vector) {
        if (critter.act && acted.indexOf(critter) == -1) {
            acted.push(critter);
            this.letAct(critter, vector);
        }
    }, this);
};

/**
 * Trigger the action method on the inhabitants of the world.
 * 
 * @param  {BouncingCritter} critter The critter to call the action on.
 * @param  {Vector} vector  The critter's vector
 */
World.prototype.letAct = function (critter, vector) {
    var action = critter.act(new View(this, vector));
    if (action && action.type == "move") {
        var dest = this.checkDestination(action, vector);
        if (dest && this.grid.get(dest) == null) {
            this.grid.set(vector, null);
            this.grid.set(dest, critter);
        }
    }
};

/**
 * Check if a destination is valid.
 *
 * @param  {object} action The action that is being used.
 * @param  {Vector} vector The vector that is being used.
 * @return {Vector}        The new vector after moving.
 */
World.prototype.checkDestination = function (action, vector) {
    if (directions.hasOwnProperty(action.direction)) {
        var dest = vector.plus(directions[action.direction]);
        if (this.grid.isInside(dest)) {
            return dest;
        }
    }
};

/**
 * Build a View.
 *
 * @param {World}  world  The World object.
 * @param {Vector} vector The Vector object.
 */
function View(world, vector) {
    this.world = world;
    this.vector = vector;
}

/**
 * Look around the current position.
 *
 * @param  {string} dir The direction to look in.
 * @return {string}     The character of the object where we are looking.
 */
View.prototype.look = function (dir) {
    var target = this.vector.plus(directions[dir]);
    if (this.world.grid.isInside(target)) {
        return charFromElement(this.world.grid.get(target));
    }

    return "#";
};

/**
 * Find all of the specified objects around the position.
 *
 * @param  {string} char The character matching the objects we are looking for.
 * @return {array}       Array of all the matching objects around our current position.
 */
View.prototype.findAll = function (char) {
    var found = [];
    for (var dir in directions) {
        if (this.look(dir) == char) {
            found.push(dir);
        }
    }

    return found;
};

/**
 * Find one object matching the character around the current position.
 *
 * @param  {string} char Character matching the object we are looking for.
 * @return {mixed}       Vector of the object if one exists, else null.
 */
View.prototype.find = function (char) {
    var found = this.findAll(char);

    if (found.length == 0) {
        return null;
    }

    return randomElement(found);
};

/**
 * Rotate the direction of an object.
 *
 * @param  {string} dir The current direction name.
 * @param  {integer} n  Amount to ratate by.
 * @return {Vector}     Vector to go toward.
 */
function dirPlus (dir, n) {
    var index = directionNames.indexOf(dir);
    return directionNames[(index + n + 8) % 8];
}

/**
 * Build a WallFollower.
 *
 * Extends BouncingCritter.
 */
function WallFollower () {
    this.dir = "s";
}

/**
 * Declare the actions a WallFollower can do.
 *
 * @param  {View} view   The surrounding view.
 * @return {object}      Object containing the action to take.
 */
WallFollower.prototype.act = function (view) {
    var start = this.dir;

    if (view.look(dirPlus(this.dir, -3)) != " ") {
        start = this.dir = dirPlus(this.dir, -2);
    }

    while (view.look(this.dir) != " ") {
        this.dir = dirPlus(this.dir, 1);
        if (this.dir == start) {
            break;
        }
    }

    return {type: "move", direction: this.dir};
};

/**
 * Build a LifeLikeWorld.
 *
 * Extends World.
 *
 * @param {string} map    String representation of the world to play in.
 * @param {object} legend Object matching characters to objects.
 */
function LifeLikeWorld (map, legend) {
    World.call(this, map, legend);
}
LifeLikeWorld.prototype = Object.create(World.prototype);

var actionTypes = Object.create(null);

/**
 * Triggers the actions of objects living in the world.
 * 
 * @param  {BouncingCritter} critter Critter to execute action on.
 * @param  {Vector} vector  The current vector of the critter.
 */
LifeLikeWorld.prototype.letAct = function (critter, vector) {
    var action = critter.act(new View(this, vector)),
        handled = action && actionTypes[action.type].call(this, critter, vector, action);

    if (! handled) {
        critter.energy -= 0.2;
        if (critter.energy <= 0) {
            this.grid.set(vector, null);
        }
    }
};

/**
 * Grow.
 *
 * Increase elements energy by 0.5.
 *
 * @param  {BouncingCritter} critter The element to execute action on.
 * @return {boolean}         Always true
 */
actionTypes.grow = function (critter) {
    critter.energy += 0.5;
    return true;
};

/**
 * Move the element.
 *
 * After moving, the element loses 1 energy point.
 * 
 * @param  {BouncingCritter} critter The element to execute action on.
 * @param  {Vector} vector  The current vector of the element.
 * @param  {object} action  The action to execute on the element.
 * @return {boolean}        True if the element is able to move.
 */
actionTypes.move = function (critter, vector, action) {
    var dest = this.checkDestination(action, vector);

    if (dest == null || critter.energy <= 1 || this.grid.get(dest) != null) {
        return false;
    }

    // Move the critter: set new vector to critter, old vector to null.
    critter.energy -= 1;
    this.grid.set(vector, null);
    this.grid.set(dest, critter);
    return true;
};

/**
 * Make the element eat.
 *
 * Increases energy by the amount of energy the eaten element has.
 *
 * @param  {BouncingCritter} critter The element to execute action on.
 * @param  {Vector} vector   The current vector of the element.
 * @param  {object} action   The action to execute on the element.
 * @return {boolean}         True if the element can eat.
 */
actionTypes.eat = function (critter, vector, action) {
    var dest = this.checkDestination(action, vector),
        atDest = dest != null && this.grid.get(dest);

    if (! atDest || atDest.energy == null) {
        return false;
    }

    critter.energy += atDest.energy;
    this.grid.set(dest, null);
    return true;
};

/**
 * Make the element reproduce.
 *
 * Reproducing costs the element twice the energy of the baby.
 * 
 * @param  {BouncingCritter} critter The element to execute the action on.
 * @param  {Vector} vector  The current vector of the element.
 * @param  {object} action  The action to execute on the element.
 * @return {boolean}        True if the element is able to reproduce.
 */
actionTypes.reproduce = function (critter, vector, action) {
    var baby = elementFromChar(this.legend, critter.originChar),
        dest = this.checkDestination(action, vector);

    if (dest == null || 
        critter.energy <= 2 * baby.energy || 
        this.grid.get(dest) != null) {
        return false;
    }

    critter.energy -= 2 * baby.energy;
    this.grid.set(dest, baby);
    return true;
}

/**
 * Build a new Plant.
 */
function Plant () {
    this.energy = 3 + Math.random() * 4;
}

/**
 * Actions that can be executed by a Plant.
 *
 * @param  {World} context  The environment the element is in.
 * @return {object}         The action to execute on the element.
 */
Plant.prototype.act = function (context) {
    if (this.energy > 15) {
        var space = context.find(" ");
        if (space) {
            return {type: "reproduce", direction: space};
        }

        if (this.energy < 20) {
            return {type: "grow"};
        }
    }
};

/**
 * Build a new PlantEater.
 */
function PlantEater () {
    this.energy = 20;
}

/**
 * Actions that can be executed by a Plant.
 *
 * @param  {World} context  The environment the element is in.
 * @return {object}         The action to execute on the element.
 */
PlantEater.prototype.act = function (context) {
    var space = context.find(" ");
    if (this.energy > 60 && space) {
        return {type: "reproduce", direction: space};
    }

    var plant = context.find("*");
    if (plant) {
        return {type: "eat", direction: plant};
    }
    if (space) {
        return {type: "move", direction: space};
    }
};

/**
 * Build a new SmartPlantEater.
 */
function SmartPlantEater () {
    this.energy = 30;
    this.direction = "e";
}

/**
 * Actions that can be executed by a Plant.
 *
 * @param  {World} context  The environment the element is in.
 * @return {object}         The action to execute on the element.
 */
SmartPlantEater.prototype.act = function (context) {
    var space = context.find(" ");
    if (this.energy > 90 && space) {
        return {type: "reproduce", direction: space};
    }

    var plants = context.findAll("*");
    if (plants.length > 1) {
        return {type: "eat", direction: randomElement(plants)};
    }
    if (context.look(this.direction) != " " && space) {
        this.direction = space;
    }

    return {type: "move", direction: this.direction};
};

/**
 * Build a new Tiger.
 */
function Tiger() {
    this.energy = 100;
    this.direction = "w";
    // Used to track the amount of prey seen per turn in the last six turns
    this.preySeen = [];
}

/**
 * Actions that can be executed by a Plant.
 *
 * @param  {World} context  The environment the element is in.
 * @return {object}         The action to execute on the element.
 */
Tiger.prototype.act = function (context) {
    // Average number of prey seen per turn
    var seenPerTurn = this.preySeen.reduce(function (a, b) {
        return a + b;
    }, 0) / this.preySeenlength;

    var prey = context.findAll("O");
    this.preySeen.push(prey.length);
    // Drop the first element from the array when it is longer than 6
    if (this.preySeen.length > 6) {
        this.preySeen.shift();
    }

    // Only eat if the predator saw more than 1/4 prey animal per turn
    if (prey.length && seenPerTurn > 0.25) {
        return {type: "eat", direction: randomElement(prey)};
    }

    var space = context.find(" ");
    if (this.energy > 400 && space) {
        return {type: "reproduce", direction: space};
    }
    if (context.look(this.direction) != " " && space) {
        this.direction = space;
    }

    return {type: "move", direction: this.direction};
};

// Code for a map with grass and smart critters.
var valleyPlan = ["############################",
                   "#####                 ######",
                   "##   ***                **##",
                   "#   *##**         **  O  *##",
                   "#    ***     O    ##**    *#",
                   "#       O         ##***    #",
                   "#                 ##**     #",
                   "#   O       #*             #",
                   "#*          #**       O    #",
                   "#***        ##**    O    **#",
                   "##****     ###***       *###",
                   "############################"];

var valley = new LifeLikeWorld(valleyPlan, {
    "#": Wall,
    "O": SmartPlantEater,
    "*": Plant
});

// Code for a map with predators, smart critters and grass.
var predatorPlan = ["####################################################",
                    "#                 ####         ****              ###",
                    "#   *  @  ##                 ########       OO    ##",
                    "#   *    ##        O O                 ****       *#",
                    "#       ##*                        ##########     *#",
                    "#      ##***  *         ****                     **#",
                    "#* **  #  *  ***      #########                  **#",
                    "#* **  #      *               #   *              **#",
                    "#     ##              #   O   #  ***          ######",
                    "#*            @       #       #   *        O  #    #",
                    "#*                    #  ######                 ** #",
                    "###          ****          ***                  ** #",
                    "#       O                        @         O       #",
                    "#   *     ##  ##  ##  ##               ###      *  #",
                    "#   **         #              *       #####  O     #",
                    "##  **  O   O  #  #    ***  ***        ###      ** #",
                    "###               #   *****                    ****#",
                    "####################################################"];

var jurassicWorld = new LifeLikeWorld(predatorPlan, {
    "#": Wall,
    "@": Tiger,
    "O": SmartPlantEater,
    "*": Plant
});