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

BouncingCritter.prototype.act = function (view) {
    if (view.look(this.direction) !== " ") {
        this.direction = view.find(" ") || "s";
    }

    return {type: "move", direction: this.direction};
}

function elementFromChar (legend, char) {
    if (char == " ") {
        return null;
    }

    var element = new legend[char]();
    element.originChar = char;
    return element;
}

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

function charFromElement (element) {
    if (element == null) {
        return " ";
    }

    return element.originChar;
}

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

function Wall () {}

var world = new World(plan, {
    "#": Wall, 
    "o": BouncingCritter
});

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

World.prototype.turn = function () {
    var acted = [];

    this.grid.forEach(function (critter, vector) {
        if (critter.act && acted.indexOf(critter) == -1) {
            acted.push(critter);
            this.letAct(critter, vector);
        }
    }, this);
};

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

World.prototype.checkDestination = function (action, vector) {
    if (directions.hasOwnProperty(action.direction)) {
        var dest = vector.plus(directions[action.direction]);
        if (this.grid.isInside(dest)) {
            return dest;
        }
    }
};

function View(world, vector) {
    this.world = world;
    this.vector = vector;
}

View.prototype.look = function (dir) {
    var target = this.vector.plus(directions[dir]);
    if (this.world.grid.isInside(target)) {
        return charFromElement(this.world.grid.get(target));
    }

    return "#";
};

View.prototype.findAll = function (char) {
    var found = [];
    for (var dir in directions) {
        if (this.look(dir) == char) {
            found.push(dir);
        }
    }

    return found;
};

View.prototype.find = function (char) {
    var found = this.findAll(char);

    if (found.length == 0) {
        return null;
    }

    return randomElement(found);
};

for (var i = 0; i < 5; i++) {
    world.turn();
    console.log(world.toString());
}