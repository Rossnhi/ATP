// ============================================
// FOL AST CLASSES
// ============================================

// Base classes from propositional logic (reuse)
// Var, And, Or, Not, Implies, Iff already defined in AST.js

// ============== TERMS ==============
// Terms: variables (x, y, z), constants (e, a, b), function applications (op(x,y))

class Term {
    equals(other) {
        return this.type === other.type && this.name === other.name;
    }

    clone() {
        return new this.constructor(this.name);
    }
}

class Constant extends Term {
    constructor(name) {
        super();
        this.name = name;
        this.type = "constant";
    }
}

class Variable extends Term {
    constructor(name) {
        super();
        this.name = name;
        this.type = "variable";
    }

    equals(other) {
        return this.type === other.type && this.name === other.name;
    }
}

class FunctionApp extends Term {
    constructor(name, args) {
        super();
        this.name = name;
        this.args = args; // array of Terms
        this.type = "function";
    }

    equals(other) {
        if (this.type !== other.type || this.name !== other.name) {
            return false;
        }
        if (this.args.length !== other.args.length) {
            return false;
        }
        for (let i = 0; i < this.args.length; i++) {
            if (!this.args[i].equals(other.args[i])) {
                return false;
            }
        }
        return true;
    }

    clone() {
        return new FunctionApp(this.name, this.args.map(arg => arg.clone()));
    }
}

// ============== PREDICATES ==============
// Atomic formulas: P(x), op(x,y) = z, x = y

class Predicate {
    constructor(name, args) {
        this.name = name;
        this.args = args; // array of Terms
        this.type = "predicate";
    }

    equals(other) {
        if (this.type !== other.type || this.name !== other.name) {
            return false;
        }
        if (this.args.length !== other.args.length) {
            return false;
        }
        for (let i = 0; i < this.args.length; i++) {
            if (!this.args[i].equals(other.args[i])) {
                return false;
            }
        }
        return true;
    }

    clone() {
        return new Predicate(this.name, this.args.map(arg => arg.clone()));
    }
}

// Special predicate for equality: x = y
class Equality {
    constructor(left, right) {
        this.left = left; // Terms
        this.right = right;
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

// ============== QUANTIFIERS ==============

class ForAll {
    constructor(variable, formula) {
        this.variable = variable; // Variable object
        this.formula = formula; // Formula
        this.type = "forall";
    }

    equals(other) {
        if (this.type !== other.type) {
            return false;
        }
        return this.variable.equals(other.variable) && this.formula.equals(other.formula);
    }

    clone() {
        return new ForAll(this.variable.clone(), this.formula.clone());
    }
}

class Exists {
    constructor(variable, formula) {
        this.variable = variable;
        this.formula = formula;
        this.type = "exists";
    }

    equals(other) {
        if (this.type !== other.type) {
            return false;
        }
        return this.variable.equals(other.variable) && this.formula.equals(other.formula);
    }

    clone() {
        return new Exists(this.variable.clone(), this.formula.clone());
    }
}

// ============================================
// FOL PARSER (extends propositional parser)
// ============================================

function tokenizeFOL(input) {
    // Tokens: predicate names (uppercase), variables/constants (lowercase), logical symbols, equality, parens, comma, and * for op
    let regEx = /([A-Z][A-Za-z0-9]*|[a-z][A-Za-z0-9]*|\u00AC|\u2227|\u2228|\u27F9|\u27FA|\u2200|\u2203|=|\*|[\(\),])/g;
    let tokens = input.match(regEx);
    return tokens || [];
}

function parseFOL(tokens) {
    let i = 0;

    function peek() {
        return tokens[i];
    }

    function consume() {
        return tokens[i++];
    }

    function parseFormula() {
        return parseIff();
    }

    function parseIff() {
        let left = parseImplies();
        if (peek() === '⟺') {
            consume();
            return new Iff(left, parseIff());
        }
        return left;
    }

    function parseImplies() {
        let left = parseOr();
        if (peek() === '⟹') {
            consume();
            return new Implies(left, parseImplies());
        }
        return left;
    }

    function parseOr() {
        let left = parseAnd();
        while (peek() === '∨') {
            consume();
            left = new Or(left, parseAnd());
        }
        return left;
    }

    function parseAnd() {
        let left = parseNot();
        while (peek() === '∧') {
            consume();
            left = new And(left, parseNot());
        }
        return left;
    }

    function parseNot() {
        if (peek() === '¬') {
            consume();
            return new Not(parseNot());
        }
        return parseQuantifier();
    }

    function parseQuantifier() {
        if (peek() === '∀') {
            consume();
            let varName = consume();
            if (peek() === ',') consume(); // optional comma
            let variable = new Variable(varName);
            let formula = parseQuantifier(); // allows nested quantifiers
            return new ForAll(variable, formula);
        }
        if (peek() === '∃') {
            consume();
            let varName = consume();
            if (peek() === ',') consume();
            let variable = new Variable(varName);
            let formula = parseQuantifier();
            return new Exists(variable, formula);
        }
        return parseAtom();
    }

    function parseAtom() {
        if (peek() === '(') {
            consume();
            let formula = parseFormula();
            if (peek() !== ')') {
                throw new Error('FOL Syntax Error: expected )');
            }
            consume();
            return formula;
        }

        // Predicate or equality: P(...) or t1 = t2
        let term1 = parseTerm();

        if (peek() === '=') {
            consume();
            let term2 = parseTerm();
            return new Equality(term1, term2);
        }

        // If term1 is a predicate (function name with args), it's already a Predicate
        if (term1.type === "predicate") {
            return term1;
        }

        // Otherwise it's an atom/variable that should have been a predicate
        throw new Error('FOL Syntax Error: expected predicate or equality');
    }

    function parseTerm() {
        // Parse factors and handle infix * operator as left-associative
        function parseFactor() {
            let tok = peek();
            if (tok === '(') {
                consume();
                let t = parseTerm();
                if (peek() !== ')') throw new Error('FOL Syntax Error: expected )');
                consume();
                return t;
            }

            // variable or constant or function application (lowercase name)
            if (/^[a-z]/.test(tok)) {
                consume();
                // function application with explicit syntax name(...)
                if (peek() === '(') {
                    consume();
                    let args = parseArguments();
                    if (peek() !== ')') throw new Error('FOL Syntax Error: expected )');
                    consume();
                    return new FunctionApp(tok, args);
                }
                if (tok.length === 1) return new Variable(tok);
                return new Constant(tok);
            }

            // Uppercase tokens are predicates treated at formula level, not terms
            throw new Error('FOL Syntax Error: unexpected term token ' + tok);
        }

        // Build left-associative chain for * -> op
        let left = parseFactor();
        while (peek() === '*') {
            consume();
            let right = parseFactor();
            left = new FunctionApp('op', [left, right]);
        }
        return left;
    }

    function parseArguments() {
        let args = [];
        if (peek() === ')') {
            return args;
        }
        args.push(parseTerm());
        while (peek() === ',') {
            consume();
            args.push(parseTerm());
        }
        return args;
    }

    let result = parseFormula();
    if (i < tokens.length) {
        throw new Error('FOL Syntax Error: unexpected tokens ' + tokens.slice(i));
    }
    return result;
}

// ============================================
// FOL to STRING (for readable output)
// ============================================

function termToStr(term) {
    if (term.type === "variable" || term.type === "constant") {
        return term.name;
    }
    if (term.type === "function") {
        // Render the group operation `op` as infix `*` for readability when binary
        if (term.name === 'op' && term.args && term.args.length === 2) {
            return `${termToStr(term.args[0])} * ${termToStr(term.args[1])}`;
        }
        let args = term.args.map(arg => termToStr(arg)).join(", ");
        return `${term.name}(${args})`;
    }
    throw new Error('Unknown term type: ' + term.type);
}

function formulaToStr(formula, parentPrecedence = 0) {
    if (formula.type === "predicate") {
        let args = formula.args.map(arg => termToStr(arg)).join(", ");
        return `${formula.name}(${args})`;
    }

    if (formula.type === "equality") {
        return `${termToStr(formula.left)} = ${termToStr(formula.right)}`;
    }

    if (formula.type === "forall") {
        return `∀${formula.variable.name} ${formulaToStr(formula.formula)}`;
    }

    if (formula.type === "exists") {
        return `∃${formula.variable.name} ${formulaToStr(formula.formula)}`;
    }

    // Propositional connectives (reuse logic from AST.js)
    if (formula.type === "var") {
        return formula.name;
    }

    if (formula.type === "not") {
        if (formula.expr.type === "forall" || formula.expr.type === "exists") {
            return `¬(${formulaToStr(formula.expr)})`;
        }
        return `¬${formulaToStr(formula.expr)}`;
    }

    if (formula.type === "and" || formula.type === "or" || formula.type === "implies" || formula.type === "iff") {
        const prec = getPrecedence(formula.type);
        let leftStr = formulaToStr(formula.left, prec);
        let rightStr = formulaToStr(formula.right, prec);

        if ((formula.type === "implies" || formula.type === "iff") && getPrecedence(formula.left.type) <= prec) {
            leftStr = "(" + leftStr + ")";
        } else if (getPrecedence(formula.left.type) < prec) {
            leftStr = "(" + leftStr + ")";
        }

        if ((formula.type === "and" || formula.type === "or") && getPrecedence(formula.right.type) <= prec) {
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

        return leftStr + op + rightStr;
    }

    throw new Error('Unknown formula type: ' + formula.type);
}

// ============================================
// UTILITY: Get Free Variables in a Formula
// ============================================

function getFreeVariables(formula, bound = new Set()) {
    if (formula.type === "variable") {
        if (!bound.has(formula.name)) {
            return new Set([formula.name]);
        }
        return new Set();
    }

    if (formula.type === "constant" || formula.type === "equality") {
        // For equality, recurse on left and right
        if (formula.left && formula.right) {
            let leftVars = getTermVars(formula.left, bound);
            let rightVars = getTermVars(formula.right, bound);
            return new Set([...leftVars, ...rightVars]);
        }
        return new Set();
    }

    if (formula.type === "predicate") {
        let vars = new Set();
        for (let arg of formula.args) {
            let argVars = getTermVars(arg, bound);
            argVars.forEach(v => vars.add(v));
        }
        return vars;
    }

    if (formula.type === "forall" || formula.type === "exists") {
        let newBound = new Set(bound);
        newBound.add(formula.variable.name);
        return getFreeVariables(formula.formula, newBound);
    }

    if (formula.type === "not") {
        return getFreeVariables(formula.expr, bound);
    }

    if (formula.type === "and" || formula.type === "or" || formula.type === "implies" || formula.type === "iff") {
        let leftVars = getFreeVariables(formula.left, bound);
        let rightVars = getFreeVariables(formula.right, bound);
        return new Set([...leftVars, ...rightVars]);
    }

    return new Set();
}

function getTermVars(term, bound = new Set()) {
    if (term.type === "variable") {
        if (!bound.has(term.name)) {
            return new Set([term.name]);
        }
        return new Set();
    }

    if (term.type === "constant") {
        return new Set();
    }

    if (term.type === "function") {
        let vars = new Set();
        for (let arg of term.args) {
            let argVars = getTermVars(arg, bound);
            argVars.forEach(v => vars.add(v));
        }
        return vars;
    }

    return new Set();
}

// ============================================
// UNIFICATION (Robinson's Algorithm)
// ============================================

/**
 * Unify two terms. Returns a substitution (map) if successful, null if fails.
 * Substitution: { "x": Term, "y": Term, ... }
 */
function unify(term1, term2, subst = {}) {
    // Apply current substitution to both terms first
    term1 = deref(term1, subst);
    term2 = deref(term2, subst);

    // Same term
    if (term1.equals(term2)) {
        return subst;
    }

    // Variable cases
    if (term1.type === "variable") {
        return unifyVariable(term1.name, term2, subst);
    }

    if (term2.type === "variable") {
        return unifyVariable(term2.name, term1, subst);
    }

    // Both are function applications
    if (term1.type === "function" && term2.type === "function") {
        if (term1.name !== term2.name || term1.args.length !== term2.args.length) {
            return null; // Fail
        }
        // Unify arguments left-to-right
        for (let i = 0; i < term1.args.length; i++) {
            subst = unify(term1.args[i], term2.args[i], subst);
            if (subst === null) return null;
        }
        return subst;
    }

    // Different types or constants don't unify
    return null;
}

/**
 * Bind a variable to a term (with occur check)
 */
function unifyVariable(varName, term, subst) {
    if (subst[varName]) {
        return unify(subst[varName], term, subst);
    }

    if (term.type === "variable" && subst[term.name]) {
        return unify(new Variable(varName), subst[term.name], subst);
    }

    // Occur check: ensure varName doesn't appear in term
    if (occursIn(varName, term, subst)) {
        return null; // Fail
    }

    subst[varName] = term;
    return subst;
}

/**
 * Check if a variable occurs in a term (prevents infinite structures)
 */
function occursIn(varName, term, subst) {
    term = deref(term, subst);

    if (term.type === "variable") {
        return term.name === varName;
    }

    if (term.type === "constant") {
        return false;
    }

    if (term.type === "function") {
        return term.args.some(arg => occursIn(varName, arg, subst));
    }

    return false;
}

/**
 * Dereference: follow substitution chain to get the final term
 */
function deref(term, subst) {
    if (term.type === "variable" && subst[term.name]) {
        return deref(subst[term.name], subst);
    }
    return term;
}

/**
 * Apply substitution to a term
 */
function applySubstToTerm(term, subst) {
    term = deref(term, subst);

    if (term.type === "variable" || term.type === "constant") {
        return term.clone();
    }

    if (term.type === "function") {
        let newArgs = term.args.map(arg => applySubstToTerm(arg, subst));
        return new FunctionApp(term.name, newArgs);
    }

    return term.clone();
}

/**
 * Apply substitution to a formula
 */
function applySubstToFormula(formula, subst) {
    if (formula.type === "predicate") {
        let newArgs = formula.args.map(arg => applySubstToTerm(arg, subst));
        return new Predicate(formula.name, newArgs);
    }

    if (formula.type === "equality") {
        return new Equality(
            applySubstToTerm(formula.left, subst),
            applySubstToTerm(formula.right, subst)
        );
    }

    if (formula.type === "not") {
        return new Not(applySubstToFormula(formula.expr, subst));
    }

    if (formula.type === "and") {
        return new And(
            applySubstToFormula(formula.left, subst),
            applySubstToFormula(formula.right, subst)
        );
    }

    if (formula.type === "or") {
        return new Or(
            applySubstToFormula(formula.left, subst),
            applySubstToFormula(formula.right, subst)
        );
    }

    if (formula.type === "implies") {
        return new Implies(
            applySubstToFormula(formula.left, subst),
            applySubstToFormula(formula.right, subst)
        );
    }

    if (formula.type === "iff") {
        return new Iff(
            applySubstToFormula(formula.left, subst),
            applySubstToFormula(formula.right, subst)
        );
    }

    if (formula.type === "forall") {
        return new ForAll(
            formula.variable.clone(),
            applySubstToFormula(formula.formula, subst)
        );
    }

    if (formula.type === "exists") {
        return new Exists(
            formula.variable.clone(),
            applySubstToFormula(formula.formula, subst)
        );
    }

    return formula.clone();
}

/**
 * Compose two substitutions: apply s2 to all values of s1
 */
function composeSubst(s1, s2) {
    let result = {};

    // Apply s2 to values of s1
    for (let varName in s1) {
        result[varName] = applySubstToTerm(s1[varName], s2);
    }

    // Add mappings from s2 that aren't in s1
    for (let varName in s2) {
        if (!result[varName]) {
            result[varName] = s2[varName].clone();
        }
    }

    return result;
}

/**
 * Rename variables in a formula to avoid capture.
 * E.g., rename(∀x P(x), "_1") → ∀x_1 P(x_1)
 */
function renameVariables(formula, suffix) {
    let renameMap = {};

    function renameFormula(f) {
        if (f.type === "variable") {
            if (!renameMap[f.name]) {
                renameMap[f.name] = new Variable(f.name + suffix);
            }
            return renameMap[f.name].clone();
        }

        if (f.type === "constant") {
            return f.clone();
        }

        if (f.type === "predicate") {
            let newArgs = f.args.map(arg => renameTerm(arg));
            return new Predicate(f.name, newArgs);
        }

        if (f.type === "equality") {
            return new Equality(renameTerm(f.left), renameTerm(f.right));
        }

        if (f.type === "not") {
            return new Not(renameFormula(f.expr));
        }

        if (f.type === "and" || f.type === "or" || f.type === "implies" || f.type === "iff") {
            return new f.constructor(renameFormula(f.left), renameFormula(f.right));
        }

        if (f.type === "forall") {
            if (!renameMap[f.variable.name]) {
                renameMap[f.variable.name] = new Variable(f.variable.name + suffix);
            }
            return new ForAll(renameMap[f.variable.name].clone(), renameFormula(f.formula));
        }

        if (f.type === "exists") {
            if (!renameMap[f.variable.name]) {
                renameMap[f.variable.name] = new Variable(f.variable.name + suffix);
            }
            return new Exists(renameMap[f.variable.name].clone(), renameFormula(f.formula));
        }

        return f.clone();
    }

    function renameTerm(t) {
        if (t.type === "variable") {
            if (!renameMap[t.name]) {
                renameMap[t.name] = new Variable(t.name + suffix);
            }
            return renameMap[t.name].clone();
        }

        if (t.type === "constant") {
            return t.clone();
        }

        if (t.type === "function") {
            let newArgs = t.args.map(arg => renameTerm(arg));
            return new FunctionApp(t.name, newArgs);
        }

        return t.clone();
    }

    return renameFormula(formula);
}

// ============================================
// NEGATION NORMAL FORM (NNF)
// ============================================

/**
 * Convert formula to NNF:
 * 1. Eliminate ↔ and →
 * 2. Push negations inward
 * 3. Result: only ∧, ∨, ¬ (¬ applied only to atoms), ∀, ∃
 */
function toNNF(formula) {
    // Step 1: Eliminate ↔ and →
    formula = eliminateConnectives(formula);

    // Step 2: Push negations inward
    formula = pushNegations(formula);

    return formula;
}

/**
 * Eliminate implies and iff
 * p → q becomes ¬p ∨ q
 * p ↔ q becomes (¬p ∨ q) ∧ (¬q ∨ p)
 */
function eliminateConnectives(formula) {
    if (formula.type === "implies") {
        // p → q becomes ¬p ∨ q
        return new Or(
            new Not(eliminateConnectives(formula.left)),
            eliminateConnectives(formula.right)
        );
    }

    if (formula.type === "iff") {
        // p ↔ q becomes (¬p ∨ q) ∧ (¬q ∨ p)
        let left = formula.left;
        let right = formula.right;
        return new And(
            new Or(new Not(eliminateConnectives(left)), eliminateConnectives(right)),
            new Or(new Not(eliminateConnectives(right)), eliminateConnectives(left))
        );
    }

    if (formula.type === "not") {
        return new Not(eliminateConnectives(formula.expr));
    }

    if (formula.type === "and") {
        return new And(
            eliminateConnectives(formula.left),
            eliminateConnectives(formula.right)
        );
    }

    if (formula.type === "or") {
        return new Or(
            eliminateConnectives(formula.left),
            eliminateConnectives(formula.right)
        );
    }

    if (formula.type === "forall") {
        return new ForAll(formula.variable, eliminateConnectives(formula.formula));
    }

    if (formula.type === "exists") {
        return new Exists(formula.variable, eliminateConnectives(formula.formula));
    }

    // Atoms: predicate, equality, var
    return formula.clone();
}

/**
 * Push negations inward using De Morgan's laws
 * ¬(p ∧ q) becomes ¬p ∨ ¬q
 * ¬(p ∨ q) becomes ¬p ∧ ¬q
 * ¬¬p becomes p
 * ¬∀x p becomes ∃x ¬p
 * ¬∃x p becomes ∀x ¬p
 */
function pushNegations(formula) {
    if (formula.type === "not") {
        return pushNegationInward(formula.expr);
    }

    if (formula.type === "and") {
        return new And(
            pushNegations(formula.left),
            pushNegations(formula.right)
        );
    }

    if (formula.type === "or") {
        return new Or(
            pushNegations(formula.left),
            pushNegations(formula.right)
        );
    }

    if (formula.type === "forall") {
        return new ForAll(formula.variable, pushNegations(formula.formula));
    }

    if (formula.type === "exists") {
        return new Exists(formula.variable, pushNegations(formula.formula));
    }

    // Atoms
    return formula.clone();
}

/**
 * Push a negation inward from ¬(formula)
 */
function pushNegationInward(formula) {
    // Double negation
    if (formula.type === "not") {
        return pushNegations(formula.expr);
    }

    // De Morgan: ¬(p ∧ q) = ¬p ∨ ¬q
    if (formula.type === "and") {
        return new Or(
            pushNegationInward(formula.left),
            pushNegationInward(formula.right)
        );
    }

    // De Morgan: ¬(p ∨ q) = ¬p ∧ ¬q
    if (formula.type === "or") {
        return new And(
            pushNegationInward(formula.left),
            pushNegationInward(formula.right)
        );
    }

    // Quantifier distribution
    if (formula.type === "forall") {
        // ¬∀x p becomes ∃x ¬p
        return new Exists(formula.variable, new Not(formula.formula));
    }

    if (formula.type === "exists") {
        // ¬∃x p becomes ∀x ¬p
        return new ForAll(formula.variable, new Not(formula.formula));
    }

    // Atom: just wrap in negation
    return new Not(formula.clone());
}

// ============================================
// SKOLEMIZATION
// ============================================

/**
 * Skolemize a formula in NNF.
 * For each ∃x φ, replace x with a Skolem function and remove the quantifier.
 * Maintains order of universal quantifiers for Skolem function arity.
 */
let skolemCounter = 0;

function skolemize(formula, boundVars = []) {
    if (formula.type === "exists") {
        // ∃x φ becomes φ[x := f(y1, ..., yn)] where f is a Skolem function
        // and y1, ..., yn are the universally quantified variables
        let existVar = formula.variable;
        let skolemFunc = new FunctionApp(
            "sk" + (skolemCounter++),
            boundVars.map(v => new Variable(v))
        );

        // Substitute the existential variable with the Skolem function
        let subst = {};
        subst[existVar.name] = skolemFunc;
        let result = applySubstToFormula(formula.formula, subst);

        // Continue skolemizing the result
        return skolemize(result, boundVars);
    }

    if (formula.type === "forall") {
        // Track the universal variable
        let newBound = [...boundVars, formula.variable.name];
        return new ForAll(
            formula.variable,
            skolemize(formula.formula, newBound)
        );
    }

    if (formula.type === "and") {
        return new And(
            skolemize(formula.left, boundVars),
            skolemize(formula.right, boundVars)
        );
    }

    if (formula.type === "or") {
        return new Or(
            skolemize(formula.left, boundVars),
            skolemize(formula.right, boundVars)
        );
    }

    if (formula.type === "not") {
        return new Not(skolemize(formula.expr, boundVars));
    }

    // Atoms
    return formula.clone();
}

/**
 * Convert formula to Clause Normal Form (CNF)
 * Input: NNF formula
 * Output: List of clauses (each clause is a disjunction of literals)
 *
 * This is simplified for tableaux: we don't fully convert to CNF,
 * instead we work with formulas directly in the tableau.
 */
function toCNF(formula) {
    // For now, just ensure it's in NNF and Skolemized
    // A proper CNF would distribute ∨ over ∧
    // But for tableaux, we can work with trees directly
    return formula;
}

// ============================================
// NOTE: FOL Prover implementation moved to KB.js
// ============================================
// The actual working tableau prover with KB integration
// is in KBTableauProver in KB.js. Use that instead.
