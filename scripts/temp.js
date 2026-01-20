
function occursCheck2(variable, term, mapping) {
    if (term.type == "constant") {
        return false;
    }
    if (term.type == "variable") {
        if (term.equals(variable)) {
            return true;
        }
        if (mapping[term.name]) {
            return occursCheck2(variable, mapping[term.name], mapping);
        }
        return false;
    }
    if (term.type == "function") {
        let occurs = false;
        for (let t of term.terms) {
            if (occursCheck2(variable, t, mapping)) {
                occurs = true;
                break;
            }
        }
        return occurs;
    }
    throw new Error("Unrecognized term type in substituteMapping: " + term.type);
}

function unify2(terms1, terms2, mapping) {
    if (terms1.length == terms2.length) {
        let worklist = terms1.map((term, index) => [term, terms2[index]]);
        while (worklist.length > 0) {
            let currentPair = worklist.pop();
            let subbedPair = currentPair.map(t => substituteMapping(t, mapping));
            if (subbedPair[0].equals(subbedPair[1])) {
                continue;
            }
            let newMapping = structuredClone(mapping);
            newMapping[subbedPair[0].name] = subbedPair[1];
            if (subbedPair[0].type == "variable") {
                if (occursCheck2(subbedPair[0], subbedPair[1], newMapping)) {
                    return false;
                }
                // propogate new binding through rhs of mapping and worklist
                for (let binding of Object.keys(mapping)) {
                    mapping[binding] = substituteMapping(mapping[binding], { [subbedPair[0].name]: subbedPair[1] });
                }
                mapping[subbedPair[0].name] = subbedPair[1];
                continue;
            }
            if (subbedPair[1].type == "variable") {
                if (occursCheck2(subbedPair[1], subbedPair[0], newMapping)) {
                    return false;
                }
                // propogate new binding through rhs of mapping and worklist
                for (let binding of Object.keys(mapping)) {
                    mapping[binding] = substituteMapping(mapping[binding], { [subbedPair[1].name]: subbedPair[0] });
                }
                mapping[subbedPair[1].name] = subbedPair[0];
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


function unify(terms1, terms2, mapping) {
    if (terms1.length == terms2.length) {
        let worklist = terms1.map((term, index) => [term, terms2[index]]);
        while (worklist.length > 0) {
            let currentPair = worklist.pop();
            let subbedPair = currentPair.map(t => substituteMapping(t, mapping));
            if (subbedPair[0].equals(subbedPair[1])) {
                continue;
            }
            if (subbedPair[0].type == "variable") {
                if (occursCheck(subbedPair[0], subbedPair[1])) {
                    return false;
                }
                // propogate new binding through rhs of mapping and worklist
                for (let binding of Object.keys(mapping)) {
                    mapping[binding] = substituteMapping(mapping[binding], { [subbedPair[0].name]: subbedPair[1] });
                }
                mapping[subbedPair[0].name] = subbedPair[1];
                continue;
            }
            if (subbedPair[1].type == "variable") {
                if (occursCheck(subbedPair[1], subbedPair[0])) {
                    return false;
                }
                // propogate new binding through rhs of mapping and worklist
                for (let binding of Object.keys(mapping)) {
                    mapping[binding] = substituteMapping(mapping[binding], { [subbedPair[1].name]: subbedPair[0] });
                }
                mapping[subbedPair[1].name] = subbedPair[0];
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
        if (term.name in mapping) {
            return substituteMapping(mapping[term.name], mapping);
        }
        return term.clone()
    }
    if (term.type == "function") {
        return new Func(term.name, term.terms.map(t => substituteMapping(t, mapping)));
    }
    throw new Error("Unrecognized term type in substituteMapping: " + term.type);
}

function run() {
    while (this.agenda.length > 0) {
        let branch = this.branches[this.pickBranch()];
        if (!branch.open) {
            // this.agenda = this.agenda.filter(id => id !== branch.id);
            continue;
        }

        let contradictionSub = branch.tryClosing();
        if (contradictionSub != null) {
            let newBranch = branch.clone(this.nextBranchId, branch.id);
            newBranch.subIndex = contradictionSub;
            newBranch.open = false;
            this.branches[newBranch.id] = newBranch;
            this.nextBranchId++;
            continue;
        }
        let branchExpanded = false;
        let branchClosed = false;
        for (let formulaData of branch) {
            if (!formulaData.expanded) {
                formulaData.expanded = true;
                if (formulaData.expansionInfo.kind == "alpha") {
                    let newBranch = branch.clone(this.nextBranchId, branch.id);
                    this.nextBranchId++;
                    for (let f of formulaData.expansionInfo.formulas) {
                        if (!newBranch.add(f, "Alpha rule on formula: " + formulaData.id)) {
                            newBranch.open = false;
                            this.branches[newBranch.id] = newBranch;
                            branchClosed = true;
                            break;
                        }

                    }
                    if (branchClosed) {
                        break;
                    }
                    this.branches[newBranch.id] = newBranch;
                    this.agenda.push(newBranch.id);
                    break;
                }
                else {
                    for (let b of formulaData.expansionInfo.branches) {
                        let newBranch = branch.clone(this.nextBranchId, branch.id);
                        this.nextBranchId++;
                        for (let f of b) {
                            if (!newBranch.add(f, "Beta rule on formula: " + formulaData.id)) {
                                newBranch.open = false;
                                this.branches[newBranch.id] = newBranch;
                                continue;
                            }
                        }
                        this.branches[newBranch.id] = newBranch;
                        this.agenda.push(newBranch.id);
                    }
                    break;
                }
            }
        }
        if (!branchExpanded) {
            return false;
        }
    }
    return true;
}