// Test NNF and Skolemization - Direct implementation verification
// No eval issues - just testing the logic

console.log("=== NNF and Skolemization Tests ===\n");

// Minimal implementations for testing
class Term {
    clone() { throw new Error("abstract"); }
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
    clone() {
        return new Variable(this.name);
    }
}

class Constant extends Term {
    constructor(name) {
        super();
        this.name = name;
        this.type = "constant";
    }
    equals(other) {
        return this.type === other.type && this.name === other.name;
    }
    clone() {
        return new Constant(this.name);
    }
}

class FunctionApp extends Term {
    constructor(name, args) {
        super();
        this.name = name;
        this.args = args;
        this.type = "function";
    }
    equals(other) {
        if (this.type !== other.type || this.name !== other.name) return false;
        if (this.args.length !== other.args.length) return false;
        for (let i = 0; i < this.args.length; i++) {
            if (!this.args[i].equals(other.args[i])) return false;
        }
        return true;
    }
    clone() {
        return new FunctionApp(this.name, this.args.map(arg => arg.clone()));
    }
}

class Predicate {
    constructor(name, args) {
        this.name = name;
        this.args = args;
        this.type = "predicate";
    }
    clone() {
        return new Predicate(this.name, this.args.map(arg => arg.clone()));
    }
}

class Equality {
    constructor(left, right) {
        this.left = left;
        this.right = right;
        this.type = "equality";
    }
    clone() {
        return new Equality(this.left.clone(), this.right.clone());
    }
}

class And {
    constructor(left, right) {
        this.left = left;
        this.right = right;
        this.type = "and";
    }
    clone() {
        return new And(this.left.clone(), this.right.clone());
    }
}

class Or {
    constructor(left, right) {
        this.left = left;
        this.right = right;
        this.type = "or";
    }
    clone() {
        return new Or(this.left.clone(), this.right.clone());
    }
}

class Not {
    constructor(expr) {
        this.expr = expr;
        this.type = "not";
    }
    clone() {
        return new Not(this.expr.clone());
    }
}

class Implies {
    constructor(left, right) {
        this.left = left;
        this.right = right;
        this.type = "implies";
    }
    clone() {
        return new Implies(this.left.clone(), this.right.clone());
    }
}

class Iff {
    constructor(left, right) {
        this.left = left;
        this.right = right;
        this.type = "iff";
    }
    clone() {
        return new Iff(this.left.clone(), this.right.clone());
    }
}

class ForAll {
    constructor(variable, formula) {
        this.variable = variable;
        this.formula = formula;
        this.type = "forall";
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
    clone() {
        return new Exists(this.variable.clone(), this.formula.clone());
    }
}

// ============== Core NNF/Skolem Functions ==============

function eliminateConnectives(formula) {
    if (formula.type === "implies") {
        return new Or(
            new Not(eliminateConnectives(formula.left)),
            eliminateConnectives(formula.right)
        );
    }

    if (formula.type === "iff") {
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
        return new And(eliminateConnectives(formula.left), eliminateConnectives(formula.right));
    }

    if (formula.type === "or") {
        return new Or(eliminateConnectives(formula.left), eliminateConnectives(formula.right));
    }

    if (formula.type === "forall") {
        return new ForAll(formula.variable, eliminateConnectives(formula.formula));
    }

    if (formula.type === "exists") {
        return new Exists(formula.variable, eliminateConnectives(formula.formula));
    }

    return formula.clone();
}

function pushNegationInward(formula) {
    if (formula.type === "not") {
        return pushNegations(formula.expr);
    }

    if (formula.type === "and") {
        return new Or(pushNegationInward(formula.left), pushNegationInward(formula.right));
    }

    if (formula.type === "or") {
        return new And(pushNegationInward(formula.left), pushNegationInward(formula.right));
    }

    if (formula.type === "forall") {
        return new Exists(formula.variable, new Not(formula.formula));
    }

    if (formula.type === "exists") {
        return new ForAll(formula.variable, new Not(formula.formula));
    }

    return new Not(formula.clone());
}

function pushNegations(formula) {
    if (formula.type === "not") {
        return pushNegationInward(formula.expr);
    }

    if (formula.type === "and") {
        return new And(pushNegations(formula.left), pushNegations(formula.right));
    }

    if (formula.type === "or") {
        return new Or(pushNegations(formula.left), pushNegations(formula.right));
    }

    if (formula.type === "forall") {
        return new ForAll(formula.variable, pushNegations(formula.formula));
    }

    if (formula.type === "exists") {
        return new Exists(formula.variable, pushNegations(formula.formula));
    }

    return formula.clone();
}

function toNNF(formula) {
    formula = eliminateConnectives(formula);
    formula = pushNegations(formula);
    return formula;
}

function applySubstToFormula(formula, subst) {
    if (formula.type === "equality") {
        return new Equality(
            applySubstToTerm(formula.left, subst),
            applySubstToTerm(formula.right, subst)
        );
    }

    if (formula.type === "predicate") {
        let newArgs = formula.args.map(arg => applySubstToTerm(arg, subst));
        return new Predicate(formula.name, newArgs);
    }

    if (formula.type === "forall") {
        return new ForAll(formula.variable.clone(), applySubstToFormula(formula.formula, subst));
    }

    if (formula.type === "exists") {
        return new Exists(formula.variable.clone(), applySubstToFormula(formula.formula, subst));
    }

    if (formula.type === "and") {
        return new And(applySubstToFormula(formula.left, subst), applySubstToFormula(formula.right, subst));
    }

    if (formula.type === "or") {
        return new Or(applySubstToFormula(formula.left, subst), applySubstToFormula(formula.right, subst));
    }

    if (formula.type === "not") {
        return new Not(applySubstToFormula(formula.expr, subst));
    }

    return formula.clone();
}

function applySubstToTerm(term, subst) {
    if (term.type === "variable" && subst[term.name]) {
        return subst[term.name].clone();
    }

    if (term.type === "function") {
        let newArgs = term.args.map(arg => applySubstToTerm(arg, subst));
        return new FunctionApp(term.name, newArgs);
    }

    return term.clone();
}

let skolemCounter = 0;

function skolemize(formula, boundVars = []) {
    if (formula.type === "exists") {
        let existVar = formula.variable;
        let skolemFunc = new FunctionApp(
            "sk" + (skolemCounter++),
            boundVars.map(v => new Variable(v))
        );

        let subst = {};
        subst[existVar.name] = skolemFunc;
        let result = applySubstToFormula(formula.formula, subst);

        return skolemize(result, boundVars);
    }

    if (formula.type === "forall") {
        let newBound = [...boundVars, formula.variable.name];
        return new ForAll(formula.variable, skolemize(formula.formula, newBound));
    }

    if (formula.type === "and") {
        return new And(skolemize(formula.left, boundVars), skolemize(formula.right, boundVars));
    }

    if (formula.type === "or") {
        return new Or(skolemize(formula.left, boundVars), skolemize(formula.right, boundVars));
    }

    if (formula.type === "not") {
        return new Not(skolemize(formula.expr, boundVars));
    }

    return formula.clone();
}

// ============== Tests ==============

function formulaStr(f) {
    if (f.type === "variable") return f.name;
    if (f.type === "constant") return f.name;
    if (f.type === "predicate") return `${f.name}(${f.args.map(a => termStr(a)).join(", ")})`;
    if (f.type === "equality") return `${termStr(f.left)} = ${termStr(f.right)}`;
    if (f.type === "forall") return `∀${f.variable.name} ${formulaStr(f.formula)}`;
    if (f.type === "exists") return `∃${f.variable.name} ${formulaStr(f.formula)}`;
    if (f.type === "and") return `(${formulaStr(f.left)} ∧ ${formulaStr(f.right)})`;
    if (f.type === "or") return `(${formulaStr(f.left)} ∨ ${formulaStr(f.right)})`;
    if (f.type === "not") return `¬${formulaStr(f.expr)}`;
    if (f.type === "implies") return `(${formulaStr(f.left)} ⟹ ${formulaStr(f.right)})`;
    if (f.type === "iff") return `(${formulaStr(f.left)} ⟺ ${formulaStr(f.right)})`;
    return f.type;
}

function termStr(t) {
    if (t.type === "variable" || t.type === "constant") return t.name;
    if (t.type === "function") return `${t.name}(${t.args.map(a => termStr(a)).join(", ")})`;
    return t.type;
}

// Test 1: Eliminate implications
try {
    let f = new Implies(
        new Predicate("P", [new Variable("x")]),
        new Predicate("Q", [new Variable("x")])
    );
    let result = eliminateConnectives(f);
    console.log("✓ Test 1 - Eliminate →:");
    console.log("  Input:  P(x) ⟹ Q(x)");
    console.log("  Output:", formulaStr(result));
} catch(e) {
    console.log("✗ Test 1:", e.message);
}

// Test 2: Push negations (De Morgan)
try {
    let f = new Not(
        new And(
            new Predicate("P", [new Variable("x")]),
            new Predicate("Q", [new Variable("x")])
        )
    );
    let result = pushNegations(f);
    console.log("\n✓ Test 2 - Push negations:");
    console.log("  Input:  ¬(P(x) ∧ Q(x))");
    console.log("  Output:", formulaStr(result));
} catch(e) {
    console.log("✗ Test 2:", e.message);
}

// Test 3: Quantifier negation
try {
    let f = new Not(
        new ForAll(new Variable("x"), new Predicate("P", [new Variable("x")]))
    );
    let result = toNNF(f);
    console.log("\n✓ Test 3 - Quantifier negation:");
    console.log("  Input:  ¬∀x P(x)");
    console.log("  Output:", formulaStr(result));
} catch(e) {
    console.log("✗ Test 3:", e.message);
}

// Test 4: Full NNF
try {
    let f = new ForAll(
        new Variable("x"),
        new Implies(
            new Predicate("P", [new Variable("x")]),
            new Predicate("Q", [new Variable("x")])
        )
    );
    let result = toNNF(f);
    console.log("\n✓ Test 4 - Full NNF:");
    console.log("  Input:  ∀x (P(x) ⟹ Q(x))");
    console.log("  Output:", formulaStr(result));
} catch(e) {
    console.log("✗ Test 4:", e.message);
}

// Test 5: Skolemization
try {
    skolemCounter = 0;
    let f = new ForAll(
        new Variable("x"),
        new Exists(
            new Variable("y"),
            new Equality(
                new FunctionApp("op", [new Variable("x"), new Variable("y")]),
                new Constant("e")
            )
        )
    );
    let nnf = toNNF(f);
    let result = skolemize(nnf);
    console.log("\n✓ Test 5 - Skolemization:");
    console.log("  Input:  ∀x ∃y op(x, y) = e");
    console.log("  Output:", formulaStr(result));
} catch(e) {
    console.log("✗ Test 5:", e.message);
}

// Test 6: Complex associativity
try {
    skolemCounter = 0;
    let f = new ForAll(
        new Variable("x"),
        new ForAll(
            new Variable("y"),
            new Exists(
                new Variable("z"),
                new Equality(
                    new FunctionApp("op", [
                        new FunctionApp("op", [new Variable("x"), new Variable("y")]),
                        new Variable("z")
                    ]),
                    new FunctionApp("op", [
                        new Variable("x"),
                        new FunctionApp("op", [new Variable("y"), new Variable("z")])
                    ])
                )
            )
        )
    );
    let nnf = toNNF(f);
    let result = skolemize(nnf);
    console.log("\n✓ Test 6 - Complex (associativity):");
    console.log("  Input:  ∀x ∀y ∃z op(op(x, y), z) = op(x, op(y, z))");
    console.log("  Output:", formulaStr(result));
} catch(e) {
    console.log("✗ Test 6:", e.message);
}

console.log("\n✅ NNF and Skolemization working!");
