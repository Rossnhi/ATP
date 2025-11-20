A = new MetaVar("A");
B = new MetaVar("B");

rulesOfInference = {
    andIntro : {
        premises : [A, B],
        conclusion: [new And(A, B), new And(B, A)],
        name : "∧-Intro"
    },
    andElim : {
        premises : [new And(A, B)],
        conclusion : [A, B],
        name : "∧-Elim"
    },
    orIntro : {
        premises : [A],
        conclusion: [new Or(A, B), new Or(B, A)],
        name : "∨-Intro"
    },
    implicationElim : {
        premises : [A, new Implies(A, B)],
        conclusion : [B],
        name : "⟹-Elim"
    },
    notElim : {
        premises : [A, new Not(A)],
        conclusion : [false],
        name : "¬-Elim"
    },
    iffElim : {
        premises : [new Iff(A, B)],
        conclusion : [new Implies(A, B), new Implies(B, A)],
        name : "⟹-Elim"
    },
}

let proofState = [];

function displayProof() {
let proofUL = document.getElementById("proof");
for (let i = 0; i < proofState.length; i++) {
    const item = proofState[i];
    const li = document.createElement("li");
    li.style.display = "flex";
    li.style.justifyContent = "space-between";
    li.style.alignItems = "center";

    // Formula on the left
    const formulaSpan = document.createElement("span");
    formulaSpan.textContent = i + 1 + ". " + ASTtoStr(item.formula);

    // Justification and parents on the right
    const rightSpan = document.createElement("span");
    let parentStr = item.parent.length > 0 ? ` [${item.parent.join(", ")}]` : "";
    rightSpan.textContent = `${item.justification}${parentStr}`;

    li.appendChild(formulaSpan);
    li.appendChild(rightSpan);
    proofUL.appendChild(li);
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

function prove() {
    premisesAST = window.appData.premisesAST;
    goalAST = window.appData.conclusionsAST;

    // add premises to proofState
    proofState = [];
    for (let premise in premisesAST) {
        proofState.push({
            id : parseInt(premise),
            formula : premisesAST[premise],
            justification : "premise",
            parent : []
        });
    }

    const ruleOrder = ["andElim", "implicationElim", "iffElim", "notElim", "andIntro"]; // orIntro
    let changed = true;
    while(changed) {
        changed = false;
        let match;
        for (let ruleName of ruleOrder) {
            let rule = rulesOfInference[ruleName];
            let combos = getCombos(rule.premises.length, proofState);
            let matchFound;
            for (let combo of combos) {
                let mapping = {};
                matchFound = true;
                for (let i = 0; i < combo.length; i++) {
                    if (!matchAxiomSchema(rule.premises[i], combo[i].formula, mapping)) {
                        matchFound = false;
                        break;
                    }
                }
                let conclusion = null;
                if (matchFound) {
                    matchFound = false;
                    for (let con of rule.conclusion) {
                        conclusion = subAxiomSchema(con, mapping);
                        if (ruleName == "andIntro" && (conclusion.left.type == "and" || conclusion.right.type == "and")) {
                            break;
                        }
                        if (!inProofState(conclusion)) {
                            match = { combo: combo, conclusion: conclusion };
                            matchFound = true;
                            break;
                        }
                    }

                    if (matchFound) {
                        break;
                    }
                    
                }
            }
            if (matchFound) {
                proofState.push({
                    id: proofState.length,
                    formula: match.conclusion,
                    justification: rule.name,
                    parent: match.combo.map(f => f.id + 1)
                });
                changed = true;
                break;
            }
        }
        if (goalAST && match && match.conclusion.equals(goalAST)) {
            break;
        }
    }
}

function inProofState(formula) {
    for (proofline of proofState) {
        if(formula.equals(proofline.formula)) {
            return true;
        }
    }
    return false;
}

function verify() {
    premisesAST = window.appData.premisesAST;
    goalAST = window.appData.conclusionsAST;
    proofInpAST = window.appData.proofInput;
    
    proofState = [];

    for (let proofline of proofInpAST) {
        let matchFound;
        let match;
        for (let premise in premisesAST) {
            if (proofline.equals(premisesAST[premise])) {
                proofState.push({
                    id: proofState.length,
                    formula: proofline,
                    justification: "premise",
                    parent: []
                });
                matchFound = true;
                break;
            }
        }
        if(matchFound) {
            continue;
        }

        for (let rule in rulesOfInference) {
            for (let con of rulesOfInference[rule].conclusion) {
                let mapping = {};
                if (matchAxiomSchema(con, proofline, mapping)){
                    let combos = getCombos(rulesOfInference[rule].premises.length, proofState);
                    for (let combo of combos) {
                        let premiseMapping = {...mapping}; 
                        matchFound = true;
                        for (let i = 0; i < combo.length; i++) {
                            if (!matchAxiomSchema(rulesOfInference[rule].premises[i], combo[i].formula, premiseMapping)) {
                                matchFound = false;
                                break;
                            }
                        }
                        if (matchFound) {
                            match = combo;
                            break;
                        }
                    }
                    if (matchFound) {
                        break;
                    }
                }
            }
            if (matchFound) {
                proofState.push({
                    id: proofState.length,
                    formula: proofline,
                    justification: rulesOfInference[rule].name,
                    parent: match.map(p => p.id + 1)
                });
                break;
            }
        }
        if (!matchFound) {
            proofState.push({
                id: proofState.length,
                formula: proofline,
                justification: "ERROR!",
                parent: []
            });
            break;
        }
    }
}

function displayVerify() {
    let verifier = document.getElementById("verifier");
    for (let proofline of proofState) {
        let parentStr = proofline.parent.length > 0 ? ` [${proofline.parent.join(", ")}]` : "";
        let textContent = `${proofline.justification}${parentStr}`;
        verifier.value += textContent + "\n";
    }
}