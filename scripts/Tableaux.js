class Branch {
    constructor(id, parent) {
        this.id = id;
        this.parent = parent;
        this.literals = [];
        this.formulasIndex = [];
        this.subIndex = {};
        this.open = true;
    }

    add(formula, justification) {
        let expansion = classify(formula);
        if (expansion.kind == "literal") {
            this.literals.push({ literal: formula, id: this.formulasIndex.length});
        }
        this.formulasIndex.push({
            formula: formula,
            id: this.formulasIndex.length,
            justification : justification,
            expanded: false,
            expansionInfo: expansion
        });
    }

    *[Symbol.iterator]() {
        for (const formula of this.formulasIndex) {
            yield formula;
        }
    }

    isPresent(formula) {
        for (let metaFormula of this) {
            if(metaFormula.formula.equals(formula)) {
                return true;
            }
        }
        return false;
    }

    clone(id, parent) {
        let clone = new Branch(id, parent);
        clone.literals = this.literals.map(l => {
            return {
                literal : l.literal.clone(),
                id : l.id
            };
        });
        clone.formulasIndex = this.formulasIndex.map(f => {
            return {
                formula: f.formula.clone(),
                id: f.id,
                justification: f.justification,
                expanded: f.expanded,
                expansionInfo: f.expansionInfo
            };
        });
        clone.subIndex = structuredClone(this.subIndex);
        clone.open = this.open;
        return clone;
    }
}


function classify(formula) {
    let expansion = {};
    if (formula.type == "predicate" || formula.type == "equality" || formula.type == "not") {
        expansion.kind = "literal";
        return expansion;
    } else if (formula.type == "and") {
        expansion.kind = "alpha";
        expansion.formulas = [formula.left, formula.right];
        return expansion;
    } else if (formula.type == "or") {
        expansion.kind = "beta";
        expansion.branches = [[formula.left], [formula.right]];
        return expansion;
    } else {
        throw new Error("Unrecognized formula type in classify: " + formula.type);
    }
}