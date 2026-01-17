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

    tryClosing() {

    }
}

function tryClosing(branch) {
    if (branch.open) {
        let literalCombos = getCombos(2, branch.literals);
        for (let combo of literalCombos) {
            let mapping = { ...branch.subIndex };
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
                    unified = unify(negCore.terms, posCore.terms, mapping);
                }
            }
            if (negCore.type == "equality" && posCore.type == "equality") {
                unified = unify([negCore.left, negCore.right], [posCore.left, posCore.right], mapping);
                if (!unified) {
                    mapping = { ...branch.subIndex };
                    unified = unify([negCore.left, negCore.right], [posCore.right, posCore.left], mapping);
                }
            }
            if(unified) {
                branch.subIndex = mapping;
                branch.open = false;
                return true;
            }
        }
    }
    return false;
}

// ensure idempotence
// let normalisedMapping = {};
// for (let binding of Object.keys(mapping)) {
//     normalisedMapping[binding] = substituteMapping(mapping[binding], mapping);
// }
// if (!mappingEquals(normalisedMapping, mapping)) {
//     return false;
// }

function unify(terms1, terms2, mapping) {
    if(terms1.length == terms2.length) {
        let worklist = terms1.map((term, index) => [term, terms2[index]]);
        while(worklist.length > 0) {
            let currentPair = worklist.pop();
            let subbedPair = currentPair.map(t => substituteMapping(t, mapping));
            if(subbedPair[0].equals(subbedPair[1])) {
                continue;
            }
            console.log(
                "PAIR:",
                subbedPair[0],
                "≐",
                subbedPair[1]
            );
            if (subbedPair[0].type == "variable") {
                if (occursCheck(subbedPair[0], subbedPair[1])) {
                    return false;
                }
                // propogate new binding through rhs of mapping and worklist
                for (let binding of Object.keys(mapping)) {
                    mapping[binding] = substituteMapping(mapping[binding], { [subbedPair[0].name]: subbedPair[1] });
                }
                mapping[subbedPair[0].name] = subbedPair[1];
                for (let pair of worklist) {
                    pair[0] = substituteMapping(pair[0], mapping);
                    pair[1] = substituteMapping(pair[1], mapping);
                }
                continue;
            }
            if (subbedPair[1].type == "variable") {
                if (occursCheck(subbedPair[1], subbedPair[0])) {
                    return false;
                }
                // propogate new binding through rhs of mapping and worklist
                for(let binding of Object.keys(mapping)) {
                    mapping[binding] = substituteMapping(mapping[binding], { [subbedPair[1].name]: subbedPair[0] });
                }
                mapping[subbedPair[1].name] = subbedPair[0];
                for (let pair of worklist) {
                    pair[0] = substituteMapping(pair[0], mapping);
                    pair[1] = substituteMapping(pair[1], mapping);
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

function substituteMapping(term, mapping) {
    if (term.type == "constant") {
        return term.clone();
    }
    if (term.type == "variable") {
        if(term.name in mapping) {
            return substituteMapping(mapping[term.name], mapping);
        }
        return term.clone()
    }
    if (term.type == "function") {
        return new Func(term.name, term.terms.map(t => substituteMapping(t, mapping)));
    }
    throw new Error("Unrecognized term type in substituteMapping: " + term.type);
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
    throw new Error("Unrecognized term type in substituteMapping: " + term.type);
}

function occursCheck2(variable, term, mapping) {
    if(term.type == "constant") {
        return false;
    }
    if (term.type == "variable") {
        if(term.equals(variable)) {
            return true;
        }
        if (mapping[term.name]) {
            return occursCheck(variable, mapping[term.name], mapping);
        }
        return false;
    }
    if (term.type == "function") {
        let occurs = false;
        for (let t of term.terms) {
            if(occursCheck(variable, t, mapping)) {
                occurs = true;
                break;
            }
        }
        return occurs;
    }
    throw new Error("Unrecognized term type in substituteMapping: " + term.type);
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

// Helper - check if two mapping objects are same
function mappingEquals(m1, m2) {
    const k1 = Object.keys(m1);
    const k2 = Object.keys(m2);
    if (k1.length !== k2.length) return false;

    for (let k of k1) {
        if (!(k in m2)) return false;
        if (!m1[k].equals(m2[k])) return false;
    }
    return true;
}