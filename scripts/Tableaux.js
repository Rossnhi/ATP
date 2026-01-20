class Tableau {
    constructor() {
        this.agenda = []; // stores branch IDs
        this.branches = {};
        this.nextBranchId = 0;
        this.rootId;
    }

    initialize(formulas) {
        resetSkolemCounters();
        let rootBranch = new Branch(this.nextBranchId, null);
        this.nextBranchId++;
        this.branches[rootBranch.id] = rootBranch;
        this.rootId = rootBranch.id;
        for(let formula of formulas) {
            rootBranch.add(formula, "Premise")
        }
        this.agenda.push(this.rootId);
        this.branches[this.rootId] = rootBranch;
    }

    run() {
        while (this.agenda.length > 0) {
            let branch = this.branches[this.pickBranch()];
            if(!branch.open) {
                // this.agenda = this.agenda.filter(id => id !== branch.id);
                continue;
            }

            let contradictionSub = branch.tryClosing();
            if(contradictionSub != null) {
                let newBranch = branch.clone(this.nextBranchId, branch.id);
                newBranch.subIndex = contradictionSub;
                newBranch.open = false;
                this.branches[newBranch.id] = newBranch;
                this.nextBranchId++;
                continue;
            }
            let branchExpanded = false;
            let branchClosed = false;
            for(let formulaData of branch) {
                if (!formulaData.expanded) {
                    formulaData.expanded = true;
                    if(formulaData.expansionInfo.kind == "alpha") {
                        let newBranch = branch.clone(this.nextBranchId, branch.id);
                        this.nextBranchId++;
                        for(let f of formulaData.expansionInfo.formulas) {
                            if (!newBranch.add(f, "Alpha rule on formula: " + formulaData.id)) { // contradiction found in occurs check during adding
                                newBranch.open = false;
                                branchClosed = true;
                                break;
                            }
                        }
                        this.branches[newBranch.id] = newBranch;
                        if(branchClosed) {
                            break;
                        }
                        branchExpanded = true;
                        this.agenda.push(newBranch.id);
                        break;
                    }
                    else {
                        for(let b of formulaData.expansionInfo.branches) {
                            let newBranch = branch.clone(this.nextBranchId, branch.id);
                            this.nextBranchId++;
                            for (let f of b) {
                                if (!newBranch.add(f, "Beta rule on formula: " + formulaData.id)) { // contradiction found in occurs check during adding
                                    newBranch.open = false;
                                    branchClosed = true;
                                    break;
                                }
                            }
                            this.branches[newBranch.id] = newBranch;
                            if (branchClosed) {
                                break;
                            }
                            branchExpanded = true;
                            this.agenda.push(newBranch.id);
                        }
                        break;
                    }
                }
            }
            if (branchClosed) {
                continue;
            }
            if(!branchExpanded) {
                return false;
            }
        }
        return true;
    }

    // picks a branch and returns its ID
    pickBranch() {
        return this.agenda.pop();
    }

}



