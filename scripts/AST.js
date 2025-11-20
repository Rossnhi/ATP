class Formula {
    equals(other) {
        if (this.type != other.type) {
            return false;
        }
        if ((this.left.equals(other.left) && this.right.equals(other.right)) || (this.left.equals(other.right) && this.right.equals(other.left))) {
            return true;
        }
        return false;
    }

    clone() {
        return new this.constructor(this.left.clone(), this.right.clone());
    }
}

class Var extends Formula{
    constructor(name) {
        super();
        this.name = name;
        this.type = "var";
    }

    equals(other) {
        if (this.type != other.type) {
            return false;
        }
        if (this.name == other.name) {
            return true;
        }
        return false;
    }

    clone() {
        return new Var(this.name);
    }
}

class And extends Formula {
    constructor(left, right) {
        super();
        this.left = left;
        this.right = right;
        this.type = "and";
    }
}

class Or extends Formula {
    constructor(left, right) {
        super();
        this.left = left;
        this.right = right;
        this.type = "or";
    }
}

class Not extends Formula {
    constructor(expr) {
        super();
        this.expr = expr;
        this.type = "not";
    }

    equals(other) {
        if (this.type != other.type) {
            return false;
        }
        if (this.expr.equals(other.expr)) {
            return true;
        }
        return false;
    }

    clone() {
        return new Not(this.expr.clone());
    }
}

class Implies extends Formula {
    constructor(left, right) {
        super();
        this.left = left;
        this.right = right;
        this.type = "implies";
    }

    equals(other) {
        if (this.type != other.type) {
            return false;
        }
        if (this.left.equals(other.left) && this.right.equals(other.right)) {
            return true;
        }
        return false;
    }
}

class Iff extends Formula {
    constructor(left, right) {
        super();
        this.left = left;
        this.right = right;
        this.type = "iff";
    }
}

// returns a list like ['p', '⟹', '¬', '(', 'q', '∨', 'r', ')', '∧', 'p']
function tokenize(input) {
    let regEx = /([A-Za-z0-9^+]+(?:\s+[A-Za-z0-9^+]+)*|\u00AC|\u2227|\u2228|\u27FA|\u27F9|[\(\)])/g;
    let tokens = input.match(regEx);
    return tokens;
}

function parse(tokens) {
    let i = 0;
    expr = parseIff();
    if (i == tokens.length) {
        return expr;
    }
    else {
        alert('Propositional Syntax Error: ' + tokens.slice(i));
        throw new Error('Propositional Syntax Error: ' + tokens.slice(i));
    }

    function peek() {
        return tokens[i];
    }

    function consume() {
        return tokens[i++]; // returns token[i] and makes i = i + 1
    }

    function parseIff() {
        let left = parseImplies();
        if (peek() == '⟺') {
            consume();
            return new Iff(left, parseIff());
        }
        if (left == undefined) {
            alert('Propositional Syntax Error:');
            throw new Error('Propositional Syntax Error:');
        }
        return left;
    }

    function parseImplies() {
        let left = parseOr();
        if (peek() == '⟹') {
            consume();
            return new Implies( left, parseImplies());
        }
        if (left == undefined) {
            alert('Propositional Syntax Error:');
            throw new Error('Propositional Syntax Error:');
        }
        return left;
    }

    function parseOr() {
        let left = parseAnd();
        while (peek() == '∨') {
            consume();
            left = new Or(left, parseAnd());
        }
        if (left == undefined) {
            alert('Propositional Syntax Error:');
            throw new Error('Propositional Syntax Error:');
        }
        return left;
    }

    function parseAnd() {
        let left = parseNot();
        while (peek() == '∧') {
            consume();
            left = new And(left, parseNot());
        }
        if (left == undefined) {
            alert('Propositional Syntax Error:');
            throw new Error('Propositional Syntax Error:');
        }
        return left;
    }

    function parseNot() {
        if (peek() == '¬') {
            consume();
            return new Not(parseNot());
        }
        return parsePrimary();
    }

    function parsePrimary() {
        if (peek() == '(') {
            consume();
            let expr = parseIff();
            if (peek() == ')') {
                consume();
                return expr;
            }
            else {
                alert('Propositional Syntax Error: ' + tokens.slice(i));
                throw new Error('Propositional Syntax Error: ' + tokens.slice(i));
            }
        }
        return new Var(consume());
    }
}

function getPrecedence(type) {
    switch (type) {
        case "iff": return 1;
        case "implies": return 2;
        case "or": return 3;
        case "and": return 4;
        case "not": return 5;
        case "var": return 6;
        default: return 0;
    }
}

function ASTtoStr(formula, parentPrecedence = 0) {
    if (formula.type == "var") {
        return formula.name;
    }
    if (formula.type == "not") {
        if (getPrecedence(formula.expr.type) < getPrecedence("not")) {
            return "¬(" + ASTtoStr(formula.expr) + ")";
        }
        return "¬" + ASTtoStr(formula.expr);
    }
    if (formula.type == "and" || formula.type == "or" || formula.type == "implies" || formula.type == "iff") {
        const prec = getPrecedence(formula.type);
        let leftStr = ASTtoStr(formula.left, prec);
        let rightStr = ASTtoStr(formula.right, prec);

        // For right-associative (implies, iff), add parentheses to left if precedence <=
        if (
            (formula.type === "implies" || formula.type === "iff") &&
            getPrecedence(formula.left.type) <= prec
        ) {
            leftStr = "(" + leftStr + ")";
        } else if (getPrecedence(formula.left.type) < prec) {
            leftStr = "(" + leftStr + ")";
        }

        // For left-associative (and, or), add parentheses to right if precedence <=
        if (
            (formula.type === "and" || formula.type === "or") &&
            getPrecedence(formula.right.type) <= prec
        ) {
            rightStr = "(" + rightStr + ")";
        } else if (getPrecedence(formula.right.type) < prec) {
            rightStr = "(" + rightStr + ")";
        }

        let op = {
            "and": " ∧ ",
            "or": " ∨ ",
            "implies": " ⟹ ",
            "iff": " ⟺ "
        }[formula.type];

        let str = leftStr + op + rightStr;
        return str;
    }
}
