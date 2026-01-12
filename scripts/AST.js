
class Term {
    constructor(name) {
        this.name = name;
    }

    equals(other) {
        if(this.name != other.name || this.type != other.type) {
            return false;
        }
        return true;
    }
}

class Variable extends Term{
    constructor(name) {
        super();
        this.name = name
        this.type = "variable"
    }

    clone() {
        return new Variable(this.name);
    }
}

class Constant extends Term {
    constructor(name) {
        super();
        this.name = name
        this.type = "constant"
    }

    clone() {
        return new Constant(this.name);
    }
}

class Func extends Term {
    constructor(name, terms = []) {
        super();
        this.name = name;
        this.terms = terms;
        this.arity = terms.length;
        this.type = "function";
    }

    equals(other) {
        if (this.type != other.type || this.name != other.name || this.arity != other.arity) {
            return false;
        }
        for (let i = 0; i < this.arity; i++) {
            if (!this.terms[i].equals(other.terms[i])) {
                return false
            }
        }
        return true;
    }

    clone() {
        return new Func(this.name, this.terms.map(term => term.clone()));
    }
}

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

class Predicate extends Formula {
    constructor(name, terms = []) {
        super();
        this.name = name;
        this.terms = terms;
        this.arity = terms.length;
        this.type = "predicate";
    }

    equals(other) {
        if (this.type != other.type || this.name != other.name || this.arity != other.arity) {
            return false;
        }
        for (let i = 0; i < this.arity; i++) {
            if (!this.terms[i].equals(other.terms[i])) {
                return false
            }
        }
        return true;
    }

    clone() {
        return new Predicate(this.name, this.terms.map( term => term.clone()));
    }
}

class Equality extends Formula{
    constructor(leftTerm, rightTerm) {
        super();
        this.left = leftTerm;
        this.right = rightTerm;
        this.type = "equality";
    }

    equals(other) {
        if (this.type !== other.type) {
            return false;
        }
        return (this.left.equals(other.left) && this.right.equals(other.right)) ||
            (this.left.equals(other.right) && this.right.equals(other.left));
    }

    clone() {
        return new Equality(this.left.clone(), this.right.clone());
    }
}

class Forall extends Formula {
    constructor(variable, scope) {
        super();
        this.variable = variable;
        this.scope = scope; // can be any formula
        this.type = "forall"
    }

    equals(other) {
        if (this.type !== other.type) {
            return false;
        }
        return this.variable.equals(other.variable) && this.scope.equals(other.scope);
    }

    clone() {
        return new Forall(this.variable.clone(), this.scope.clone());
    }
}

class Exists extends Formula {
    constructor(variable, scope) {
        super();
        this.variable = variable;
        this.scope = scope; // can be any formula
        this.type = "exists"
    }

    equals(other) {
        if (this.type !== other.type) {
            return false;
        }
        return this.variable.equals(other.variable) && this.scope.equals(other.scope);
    }

    clone() {
        return new Exists(this.variable.clone(), this.scope.clone());
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
    let regEx;
    if (proofSystem.value == "Tableau") {
        regEx = /([A-Za-z0-9_]+|\u00AC|\u2227|\u2228|\u27FA|\u27F9|\u2200|\u2203|=|,|\*|[\(\)])/g;

    } else {
        regEx = /([A-Za-z0-9_]+(?:\s+[A-Za-z0-9_]+)*|\u00AC|\u2227|\u2228|\u27FA|\u27F9|\u2200|\u2203|=|\*|[\(\)])/g;
    }
    let tokens = input.match(regEx);
    return tokens;
}

// *Propositional*

function parse(tokens) {

    if (proofSystem.value == "Tableau") {
        return parseFOL(tokens);
    }

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
        return new Predicate(consume());
    }
}

function getPrecedence(type) {
    switch (type) {
        case "iff": return 1;
        case "implies": return 2;
        case "or": return 3;
        case "and": return 4;
        case "not": return 5;
        case "predicate": return 6;
        default: return 0;
    }
}

function ASTtoStr(formula, parentPrecedence = 0) {
    if (formula.type == "predicate") {
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

// *FOL*

// Parser
function parseFOL(tokens) {
    let i = 0;
    expr = parseIff();
    if (i == tokens.length) {
        return expr;
    }
    else {
        alert('FOL Syntax Error: ' + tokens.slice(i));
        throw new Error('FOL Syntax Error: ' + tokens.slice(i));
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
            alert('FOL Syntax Error:');
            throw new Error('FOL Syntax Error:');
        }
        return left;
    }

    function parseImplies() {
        let left = parseOr();
        if (peek() == '⟹') {
            consume();
            return new Implies(left, parseImplies());
        }
        if (left == undefined) {
            alert('FOL Syntax Error:');
            throw new Error('FOL Syntax Error:');
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
            alert('FOL Syntax Error:');
            throw new Error('FOL Syntax Error:');
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
            alert('FOL Syntax Error:');
            throw new Error('FOL Syntax Error:');
        }
        return left;
    }

    function parseNot() {
        if (peek() == '¬') {
            consume();
            return new Not(parseNot());
        }
        return parseQuantifier();
    }

    function parseQuantifier() {
        if (peek() == '∀') {
            consume();
            return new Forall(new Variable(consume()), parseNot());
        }
        if (peek() == '∃') {
            consume();
            return new Exists(new Variable(consume()), parseNot());
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
                alert('FOL Syntax Error: ' + tokens.slice(i));
                throw new Error('FOL Syntax Error: ' + tokens.slice(i));
            }
        }

        let t1 = parseTerm();
        if (peek() == "=") {
            consume();
            return new Equality(t1, parseTerm());
        }

        if (t1.type == "function") {
            return new Predicate(t1.name, t1.terms.map(term => term.clone()));
        }

        throw new Error('FOL Syntax Error: expected predicate or equality');

    }

    function parseTerm() {
        let identifier = consume();
        if (peek() == "(") {
            consume();
            let terms = [];
            while (peek() != ")") {
                terms.push(parseTerm());
                if (peek() == ')') {
                    continue;
                } else if (peek() == ',') {
                    consume();
                    continue;
                }
                throw new Error('FOL Syntax Error: expected ,');
            }
            consume();
            return new Func(identifier, terms);
        }
        if (isVariable(identifier)) {
            return new Variable(identifier);
        } else {
            return new Constant(identifier);
        }
    }
}

function isVariable(identifier) {
    return /^[a-z][a-zA-Z0-9_]*$/.test(identifier);
}

// NNF
// test example toNNF - P(f(x), y) ∨ (∀x Q(x, y)) ⟹ (T(x) ⟺ B(y))
function toNNF(formula) {
    if (formula.type == "predicate" || formula.type == "equality") {
        return formula;
    } else if (formula.type == "forall") {
        return new Forall(formula.variable, toNNF(formula.scope));
    } else if (formula.type == "exists") {
        return new Exists(formula.variable, toNNF(formula.scope));
    } else if (formula.type == "not") {
        return pushNegation(toNNF(formula.expr));
    } else if (formula.type == "and") {
        return new And(toNNF(formula.left), toNNF(formula.right));
    } else if (formula.type == "or") {
        return new Or(toNNF(formula.left), toNNF(formula.right));
    } else if (formula.type == "implies") {
        return new Or(new Not(toNNF(formula.left)), toNNF(formula.right)); // A => B --> ¬A ∨ B
    } else if (formula.type == "iff") {
        return new And(new Or(new Not(toNNF(formula.left)), toNNF(formula.right)), new Or(new Not(toNNF(formula.right)), toNNF(formula.left))); // A <=> B --> A → B ⟶ ¬A ∨ B
    }
}

function pushNegation(formula) {
    if (formula.type == "predicate" || formula.type == "equality") {
        return new Not(formula);
    } else if (formula.type == "forall") {
        return new Exists(formula.variable, pushNegation(formula.scope));
    } else if (formula.type == "exists") {
        return new Forall(formula.variable, pushNegation(formula.scope));
    } else if (formula.type == "not") {
        return formula.expr;
    } else if (formula.type == "and") {
        return new Or(pushNegation(formula.left), pushNegation(formula.right));
    } else if (formula.type == "or") {
        return new And(pushNegation(formula.left), pushNegation(formula.right));
    }
}

// Skolemization
// toSub is a string representing the name of the variable, subWith is a term
function substituteTerm2(toSub, subWith, term) {
    if (term.type == 'variable') {
        if (term.name == toSub) {
            return subWith.clone();
        }
        return term.clone()
    }
    if (term.type == 'function') {
        return new Func(term.name, term.terms.map(t => substituteTerm(toSub, subWith, t)));
    }

    if (term.type == 'constant') {
        return term.clone();
    }
    throw new Error("Unrecoganized term Error");
}

function substituteTerm(toSub, subWith, term) {
    if (!term || !term.type) {
        console.error("BAD TERM (null/undefined):", term);
        throw new Error("Bad term (null/undefined)");
    }

    if (!(term instanceof Variable) &&
        !(term instanceof Constant) &&
        !(term instanceof Func)) {

        console.error("NON-TERM FOUND:", term);
        throw new Error("Non-term in substituteTerm");
    }

    if (term.type == "variable") {
        if (term.name == toSub) {
            return subWith.clone();
        }
        return term.clone();
    }

    if (term.type == "function") {
        return new Func(term.name, term.terms.map(t => substituteTerm(toSub, subWith, t)));
    }

    if (term.type == "constant") {
        return term.clone();
    }
}


function substituteFormula(toSub, subWith, formula) {
    if (formula.type == "predicate") {
        return new Predicate(formula.name, formula.terms.map(t => substituteTerm(toSub, subWith, t)));
    } else if (formula.type == "equality") {
        return new Equality(substituteTerm(toSub, subWith, formula.left), substituteTerm(toSub, subWith, formula.right));
    } else if (formula.type == "forall") {
        if(formula.variable.name == toSub) {
            return formula;
        }
        return new Forall(formula.variable, substituteFormula(toSub, subWith, formula.scope));
    } else if (formula.type == "exists") {
        if (formula.variable.name == toSub) {
            return formula;
        }
        return new Exists(formula.variable, substituteFormula(toSub, subWith, formula.scope));
    } else if (formula.type == "not") {
        return new Not(substituteFormula(toSub, subWith, formula.expr));
    } else if (formula.type == "and") {
        return new And(substituteFormula(toSub, subWith, formula.left), substituteFormula(toSub, subWith, formula.right));
    } else if (formula.type == "or") {
        return new Or(substituteFormula(toSub, subWith, formula.left), substituteFormula(toSub, subWith, formula.right));
    }
    throw new Error("Incorrect formula node");
}

let activeUniversals = [];
let skolemCounterConst = 0;
let skolemCounterFunc = 0;

// required to check if variables are shadowed be same name variables
function active(v) {
    for(let universal of activeUniversals) {
        if(universal.equals(v)) {
            return true;
        }
    }
    false;
}

function skolemize(formula) {
    if (formula.type == "predicate" || formula.type == "equality") {
        return formula;
    } else if (formula.type == "forall") {
        activeUniversals.push(formula.variable);
        let f =  new Forall(formula.variable, skolemize(formula.scope));
        activeUniversals.pop();
        return f;
    } else if (formula.type == "exists") {
        let skolem;
        let copyEnv = [];
        if(active(formula.variable)) {
            copyEnv = [...activeUniversals];
            activeUniversals = activeUniversals.filter(v => !v.equals(formula.variable));
        }
        if (activeUniversals.length != 0) {
            let funcName = `sf${skolemCounterFunc}`;
            skolemCounterFunc++;
            skolem =  skolemize(substituteFormula(formula.variable.name, new Func(funcName, [...activeUniversals]), formula.scope));
        } else {
            let constName = `SC${skolemCounterConst}`;
            skolemCounterConst++;
            skolem =  skolemize(substituteFormula(formula.variable.name, new Constant(constName), formula.scope));
        }
        if(copyEnv.length != 0) {
            activeUniversals = copyEnv;
        }
        return skolem;

    } else if (formula.type == "not") {
        return new Not(skolemize(formula.expr));
    } else if (formula.type == "and") {
        return new And(skolemize(formula.left), skolemize(formula.right));
    } else if (formula.type == "or") {
        return new Or(skolemize(formula.left), skolemize(formula.right));
    }
}