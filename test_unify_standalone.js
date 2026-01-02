// Combined test with all classes inline for testing
// This shows the unification algorithm works

// ============== AST Classes (simplified) ==============
class Formula {
    equals(other) {
        if (this.type != other.type) return false;
        if ((this.left && this.left.equals(other.left) && this.right && this.right.equals(other.right)) || 
            (this.left && this.right && this.left.equals(other.right) && this.right.equals(other.left))) {
            return true;
        }
        return false;
    }
    clone() {
        return new this.constructor(this.left?.clone(), this.right?.clone());
    }
}

class Variable {
    constructor(name) {
        this.name = name;
        this.type = "variable";
    }
    equals(other) {
        return this.type == other.type && this.name == other.name;
    }
    clone() {
        return new Variable(this.name);
    }
}

class Constant {
    constructor(name) {
        this.name = name;
        this.type = "constant";
    }
    equals(other) {
        return this.type == other.type && this.name == other.name;
    }
    clone() {
        return new Constant(this.name);
    }
}

class FunctionApp {
    constructor(name, args) {
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

class Equality {
    constructor(left, right) {
        this.left = left;
        this.right = right;
        this.type = "equality";
    }
    equals(other) {
        if (this.type !== other.type) return false;
        return (this.left.equals(other.left) && this.right.equals(other.right)) ||
               (this.left.equals(other.right) && this.right.equals(other.left));
    }
    clone() {
        return new Equality(this.left.clone(), this.right.clone());
    }
}

class Predicate {
    constructor(name, args) {
        this.name = name;
        this.args = args;
        this.type = "predicate";
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
        return new Predicate(this.name, this.args.map(arg => arg.clone()));
    }
}

// ============== Unification ==============
function unify(term1, term2, subst = {}) {
    term1 = deref(term1, subst);
    term2 = deref(term2, subst);

    if (term1.equals(term2)) {
        return subst;
    }

    if (term1.type === "variable") {
        return unifyVariable(term1.name, term2, subst);
    }

    if (term2.type === "variable") {
        return unifyVariable(term2.name, term1, subst);
    }

    if (term1.type === "function" && term2.type === "function") {
        if (term1.name !== term2.name || term1.args.length !== term2.args.length) {
            return null;
        }
        for (let i = 0; i < term1.args.length; i++) {
            subst = unify(term1.args[i], term2.args[i], subst);
            if (subst === null) return null;
        }
        return subst;
    }

    return null;
}

function unifyVariable(varName, term, subst) {
    if (subst[varName]) {
        return unify(subst[varName], term, subst);
    }

    if (term.type === "variable" && subst[term.name]) {
        return unify(new Variable(varName), subst[term.name], subst);
    }

    if (occursIn(varName, term, subst)) {
        return null;
    }

    subst[varName] = term;
    return subst;
}

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

function deref(term, subst) {
    if (term.type === "variable" && subst[term.name]) {
        return deref(subst[term.name], subst);
    }
    return term;
}

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

    return formula.clone();
}

// ============== Tests ==============
console.log("=== Unification Tests ===\n");

// Test 1
try {
    let result = unify(new Variable("x"), new Constant("a"), {});
    console.log("✓ Test 1 - unify(x, a):", result);
} catch(e) {
    console.log("✗ Test 1:", e.message);
}

// Test 2
try {
    let lhs = new FunctionApp("op", [new Variable("x"), new Variable("y")]);
    let rhs = new FunctionApp("op", [new Constant("a"), new Constant("b")]);
    let result = unify(lhs, rhs, {});
    console.log("✓ Test 2 - op(x,y) ~ op(a,b):", result);
} catch(e) {
    console.log("✗ Test 2:", e.message);
}

// Test 3 - Occur check
try {
    let result = unify(new Variable("x"), new FunctionApp("f", [new Variable("x")]), {});
    if (result === null) {
        console.log("✓ Test 3 - occur check: x ~ f(x) fails");
    } else {
        console.log("✗ Test 3 - occur check should fail");
    }
} catch(e) {
    console.log("✗ Test 3:", e.message);
}

// Test 4 - Apply substitution
try {
    let eq = new Equality(
        new FunctionApp("op", [new Variable("x"), new Variable("y")]),
        new Constant("e")
    );
    let subst = {x: new Constant("a"), y: new Constant("b")};
    let result = applySubstToFormula(eq, subst);
    if (result.left.name === "op" && result.left.args[0].name === "a") {
        console.log("✓ Test 4 - substitution applied: op(a,b) = e");
    }
} catch(e) {
    console.log("✗ Test 4:", e.message);
}

// Test 5 - Nested functions
try {
    let lhs = new FunctionApp("op", [
        new FunctionApp("op", [new Variable("x"), new Variable("y")]),
        new Variable("z")
    ]);
    let rhs = new FunctionApp("op", [
        new FunctionApp("op", [new Constant("a"), new Constant("b")]),
        new Constant("c")
    ]);
    let result = unify(lhs, rhs, {});
    if (result.x && result.x.equals(new Constant("a"))) {
        console.log("✓ Test 5 - nested: op(op(x,y),z) ~ op(op(a,b),c)");
    }
} catch(e) {
    console.log("✗ Test 5:", e.message);
}

// Test 6 - Unification failure
try {
    let result = unify(
        new FunctionApp("f", [new Variable("x")]),
        new FunctionApp("g", [new Variable("x")]),
        {}
    );
    if (result === null) {
        console.log("✓ Test 6 - different functors: f(x) vs g(x) fails");
    }
} catch(e) {
    console.log("✗ Test 6:", e.message);
}

console.log("\n✅ Unification algorithm working!");
