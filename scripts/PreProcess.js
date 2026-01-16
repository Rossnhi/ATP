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
function substituteTerm(toSub, subWith, term) {
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

function substituteFormula(toSub, subWith, formula) {
    if (formula.type == "predicate") {
        return new Predicate(formula.name, formula.terms.map(t => substituteTerm(toSub, subWith, t)));
    } else if (formula.type == "equality") {
        return new Equality(substituteTerm(toSub, subWith, formula.left), substituteTerm(toSub, subWith, formula.right));
    } else if (formula.type == "forall") {
        if (formula.variable.name == toSub) {
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
    for (let universal of activeUniversals) {
        if (universal.equals(v)) {
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
        let f = new Forall(formula.variable, skolemize(formula.scope));
        activeUniversals.pop();
        return f;
    } else if (formula.type == "exists") {
        let skolem;
        let copyEnv = [];
        if (active(formula.variable)) {
            copyEnv = [...activeUniversals];
            activeUniversals = activeUniversals.filter(v => !v.equals(formula.variable));
        }
        if (activeUniversals.length != 0) {
            let funcName = `sf${skolemCounterFunc}`;
            skolemCounterFunc++;
            skolem = skolemize(substituteFormula(formula.variable.name, new Func(funcName, [...activeUniversals]), formula.scope));
        } else {
            let constName = `SC${skolemCounterConst}`;
            skolemCounterConst++;
            skolem = skolemize(substituteFormula(formula.variable.name, new Constant(constName), formula.scope));
        }
        if (copyEnv.length != 0) {
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

// forall elimination
function dropForall(formula) {
    if (formula.type == "predicate" || formula.type == "equality") {
        return formula;
    } else if (formula.type == "forall") {
        return dropForall(formula.scope);
    } else if (formula.type == "not") {
        return new Not(dropForall(formula.expr));
    } else if (formula.type == "and") {
        return new And(dropForall(formula.left), dropForall(formula.right));
    } else if (formula.type == "or") {
        return new Or(dropForall(formula.left), dropForall(formula.right));
    } else {
        throw new Error("dropForall: unsupported formula type " + formula.type);
    }
}