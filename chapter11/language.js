/**
 * Check if the expression is a string, value or word.
 *
 * @param  {string} program The element to check.
 * @return {[type]}         [description]
 */
function parseExpression (program) {
    program = skipSpace(program);
    var match, expr;

    if (match = /^"([^"]*)"/.exec(program)) {
        expr = {type: "value", value: match[1]};
    } else if (match = /^\d+\b/.exec(program)) {
        expr = {type: "value", value: Number(match[0])};
    } else if (match = /^[^\s(),"]+/.exec(program)) {
        expr = {type: "word", name: match[0]};
    } else {
        throw new SyntaxError("Unexpected syntax: " + program);
    }

    return parseApply(expr, program.slice(match[0].length));
}

/**
 * Remove white space from the functions
 */
function skipSpace (string) {
    var first = string.search(/\S/);
    if (first == -1) {
        return "";
    }

    return string.slice(first);
}

/**
 * Check whether an expression is an application.
 */
function parseApply (expr, program) {
    program = skipSpace(program);

    if (program[0] != "(") {
        return {expr: expr, rest: program};
    }

    program = skipSpace(program.slice(1));
    expr = {type: "apply", operator: expr, args: []};

    while (program[0] != ")") {
        var arg = parseExpression(program);
        expr.args.push(arg.expr);
        program = skipSpace(arg.rest);

        if (program[0] == ",") {
            program = skipSpace(program.slice(1));
        } else if (program[0] != ")") {
            throw new SyntaxError("Expected ',' or ')'");
        }
    }

    return parseApply(expr, program.slice(1));
}

/**
 * Check that the parser has reached the end of the input string after 
 * parsing the expression and return the program’s data structure.
 */
function parse (program) {
    var result = parseExpression(program);
    if (skipSpace(result.rest).length > 0) {
        throw new SyntaxError("Unexpected text after program");
    }
    return result.expr;
}

/**
 * Evaluate expression that the syntax tree represents and return its value.
 * @param  {object} expr Syntax tree
 * @param  {obj} env  Envirnment
 */
function evaluate(expr, env) {
    switch (expr.type) {
        case "value":
            return expr.value;
        case "word":
            if (expr.name in env) {
                return env[expr.name];
            } else {
                throw new ReferenceError("Undefined variable: " + expr.name);
            }
        case "apply":
            if (expr.operator.type == "word" && expr.operator.name in specialForms) {
                return specialForms[expr.operator.name](expr.args, env);
            }

            var op = evaluate(expr.operator, env);
            if (typeof op != "function") {
                throw new TypeError("Applying a non-function");
            }

            return op.apply(null, expr.args.map(function (arg) {
                return evaluate(arg, env);
            }));
    }
}

/**
 * SpecialForms contains items such as if, while...
 * @type {[type]}
 */
var specialForms = Object.create(null);

/**
 * If statement.
 */
specialForms["if"] = function (args, env) {
    if (args.length != 3) {
        throw new SyntaxError("Bad number of args to if");
    }

    if (evaluate(args[0], env) !== false) {
        return evaluate(args[1], env);
    } else {
        return evaluate(args[2], env);
    }
};

/**
 * While statement.
 */
specialForms["while"] = function (args, env) {
    if (args.length != 2) {
        throw new SyntaxError("Bad number of args to while");
    }

    while (evaluate(args[0], env) !== false) {
        evaluate(args[1], env);
    }

    // Since undefined does not exist in Egg, we return false,
    // for lack of a meaninful result.
    return false;
};

/**
 * Do statement.
 */
specialForms["do"] = function (args, env) {
    var value = false;
    args.forEach(function (arg) {
        value = evaluate(arg, env);
    });

    return value;
};

/**
 * Define statement.
 */
specialForms["define"] = function (args, env) {
    if (args.length != 2 || args[0].type != "word") {
        throw new SyntaxError("Bad use of define");
    }

    var value = evaluate(args[1], env);
    env[args[0].name] = value;
    return value;
}

/**
 * User interface for language
 */
var topEnv = Object.create(null);
/**
 * Booleans
 */
topEnv["true"] = true;
topEnv["false"] = false;

/**
 * Math operators
 */
["+", "-", "*", "/", "==", "<", ">"].forEach(function (op) {
    topEnv[op] = new Function("a, b", "return a " + op + " b;");
});

/**
 * Debug print function.
 */
topEnv["print"] = function (value) {
    console.log(value);
    return value;
};

/**
 * Run the program.
 */
function run() {
    var env     = Object.create(topEnv),
        program = Array.prototype.slice.call(arguments, 0).join("\n");

    return evaluate(parse(program), env);
}

/**
 * Functions.
 */
specialForms["fun"] = function (args, env) {
    if (!args.length) {
        throw new SyntaxError("Functions need a body");
    }

    function name (expr) {
        if (expr.type != "word") {
            throw new SyntaxError("Arg names must be words");
        }
        return expr.name;
    }

    var argNames = args.slice(0, args.length - 1).map(name),
        body     = args[args.length - 1];

    return function () {
        if (arguments.length != argNames.length) {
            throw new TypeError("Wrong number of arguments");
        }

        var localEnv = Object.create(env);
        for (var i = 0; i < arguments.length; i++) {
            localEnv[argNames[i]] = arguments[i];
        }

        return evaluate(body, localEnv);
    };
};

/**
 * Array
 */
topEnv["array"] = function () {
    return Array.prototype.slice.call(arguments, 0);
};

topEnv["length"] = function (array) {
    return array.length;
};

topEnv["element"] = function (array, i) {
    return array[i];
};