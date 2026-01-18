class Branch {
    constructor(id, parent) {
        this.id = id;
        this.parent = parent;
        this.literals = [];
        this.formulasIndex = [];
        this.subIndex = new Substitution();
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
        clone.subIndex = this.subIndex.clone();
        clone.open = this.open;
        return clone;
    }

    tryClosing(branch) {
        if (branch.open) {
            let literalCombos = getCombos(2, branch.literals);
            for (let combo of literalCombos) {
                let newSub = branch.subIndex.clone();
                let negCore = undefined;
                let posCore = undefined;
                let unified = false;
                if (combo[0].literal.type == "not" && combo[1].literal.type != "not") {
                    negCore = combo[0].literal.expr;
                    posCore = combo[1].literal;
                } else if (combo[0].literal.type != "not" && combo[1].literal.type == "not") {
                    negCore = combo[1].literal.expr;
                    posCore = combo[0].literal;
                }
                if (negCore.type == "predicate" && posCore.type == "predicate") {
                    if (negCore.name == posCore.name) {
                        unified = unify(negCore.terms, posCore.terms, newSub);
                    }
                }
                if (negCore.type == "equality" && posCore.type == "equality") {
                    unified = unify([negCore.left, negCore.right], [posCore.left, posCore.right], newSub);
                    if (!unified) {
                        newSub = branch.subIndex.clone();
                        unified = unify([negCore.left, negCore.right], [posCore.right, posCore.left], newSub);
                    }
                }
                if (unified) {
                    branch.subIndex = newSub;
                    branch.open = false;
                    return true;
                }
            }
        }
        return false;
    }
}

class Substitution {
    constructor(mapping = {}) {
        this.mapping = mapping;
    }

    apply(term) {
        if (term.type == "constant") {
            return term.clone();
        }
        if (term.type == "variable") {
            if (term.name in this.mapping) {
                return this.apply(this.mapping[term.name], this.mapping);
            }
            return term.clone()
        }
        if (term.type == "function") {
            return new Func(term.name, term.terms.map(t => this.apply(t)));
        }
        throw new Error("Unrecognized term type in substitution.apply(): " + term.type);
    }

    extend(variable, term) {
        let newMapping = { ...this.mapping };
        term = this.apply(term);
        if (occursCheck(variable, term)) {
            return null;
        }
        newMapping[variable.name] = term;
        for (let binding of Object.keys(newMapping)) {
            if (binding != variable.name) {
                newMapping[binding] = this.apply(newMapping[binding]);
            }
        }
        this.mapping = newMapping;
        return true;
    }

    clone() {
        return new Substitution({ ...this.mapping });
    }

    equals(other) {
        const k1 = Object.keys(this.mapping)
        const k2 = Object.keys(other.mapping);
        if (k1.length !== k2.length) return false;

        for (let k of k1) {
            if (!(k in other.mapping)) return false;
            if (!this.mapping[k].equals(other.mapping[k])) return false;
        }
        return true;
    }
}

function unify(terms1, terms2, substitution) {
    if (terms1.length == terms2.length) {
        let worklist = terms1.map((term, index) => [term, terms2[index]]);
        while (worklist.length > 0) {
            let currentPair = worklist.pop();
            let subbedPair = currentPair.map(t => substitution.apply(t));
            if (subbedPair[0].equals(subbedPair[1])) {
                continue;
            }
            if (subbedPair[0].type == "variable") {
                if (!substitution.extend(subbedPair[0], subbedPair[1])) {
                    return false;
                }
                continue;
            }
            if (subbedPair[1].type == "variable") {
                if (!substitution.extend(subbedPair[1], subbedPair[0])) {
                    return false;
                }
                continue;
            }
            if (subbedPair[0].type == "constant" && subbedPair[1].type == "constant") {
                if (subbedPair[0].name != subbedPair[1].name) {
                    return false;
                }
                continue;
            }
            if (subbedPair[0].type == "function" && subbedPair[1].type == "function") {
                if (subbedPair[0].name != subbedPair[1].name) {
                    return false;
                }
                if (subbedPair[0].arity != subbedPair[1].arity) {
                    return false;
                }
                for (let i = 0; i < subbedPair[0].terms.length; i++) {
                    worklist.push([subbedPair[0].terms[i], subbedPair[1].terms[i]]);
                }
                continue;
            }
            return false;
        }
        return true;
    }
    return false;
}

function occursCheck(variable, term) {
    if (term.type == "constant") {
        return false;
    }
    if (term.type == "variable") {
        return term.equals(variable);
    }
    if (term.type == "function") {
        let occurs = false;
        for (let t of term.terms) {
            if (occursCheck(variable, t)) {
                occurs = true;
                break;
            }
        }
        return occurs;
    }
    throw new Error("Unrecognized term type in occursCheck: " + term.type);
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

// Helper - get all list of size k of combinations of elements of l
function getCombos(k, l) {
    if (k == 1) {
        return l.map(x => [x]);
    }
    let combos = [];
    for (let i = 0; i < l.length; i++) {
        let rest = getCombos(k - 1, l.slice(0, i).concat(l.slice(i + 1))); // l.slice(0, i).concat(l.slice(i + 1)) or l.slice(i + 1)
        for (let r of rest) {
            combos.push([l[i], ...r]);
        }
    }
    return combos;
}