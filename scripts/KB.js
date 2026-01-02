// ============================================
// KNOWLEDGE BASE (KB)
// ============================================

/**
 * Knowledge Base for storing axioms, definitions, and proven theorems.
 * Used by the prover to access inference rules and facts.
 */
class KnowledgeBase {
    constructor() {
        this.axioms = [];      // Core axioms
        this.definitions = []; // Definitions (for expansion)
        this.theorems = [];    // Proven theorems
        this.axiomIndex = {};  // Quick lookup by name
        this.theoremIndex = {};
    }

    /**
     * Add an axiom to the KB
     */
    addAxiom(name, formula) {
        this.axioms.push({name, formula});
        this.axiomIndex[name] = formula;
    }

    /**
     * Add a definition (pattern → expansion)
     */
    addDefinition(name, pattern, expansion) {
        this.definitions.push({name, pattern, expansion});
    }

    /**
     * Add a proven theorem to the KB
     */
    addTheorem(name, formula) {
        this.theorems.push({name, formula});
        this.theoremIndex[name] = formula;
    }

    /**
     * Get axiom by name
     */
    getAxiom(name) {
        return this.axiomIndex[name];
    }

    /**
     * Get all axioms as formulas (for use in proofs)
     */
    getAllAxioms() {
        return this.axioms.map(a => a.formula);
    }

    /**
     * Get theorem by name
     */
    getTheorem(name) {
        return this.theoremIndex[name];
    }

    /**
     * Get all theorems as formulas
     */
    getAllTheorems() {
        return this.theorems.map(t => t.formula);
    }

    /**
     * List all axiom names
     */
    listAxioms() {
        return this.axioms.map(a => a.name);
    }

    /**
     * List all theorem names
     */
    listTheorems() {
        return this.theorems.map(t => t.name);
    }

    /**
     * Get all inference rules (axioms + theorems)
     */
    getAllRules() {
        return [
            ...this.axioms.map(a => ({type: "axiom", name: a.name, formula: a.formula})),
            ...this.theorems.map(t => ({type: "theorem", name: t.name, formula: t.formula}))
        ];
    }
}

// ============================================
// GROUP THEORY AXIOMS & SETUP
// ============================================

/**
 * Create and populate a knowledge base with group theory axioms
 */
function setupGroupTheoryKB() {
    let kb = new KnowledgeBase();

    // Group signature: op (binary operation), e (identity), domain is elements {e, a, b, ...}

    // Axiom 1: Associativity
    // ∀x ∀y ∀z: op(op(x,y),z) = op(x,op(y,z))
    kb.addAxiom("associativity", 
        parseFOL(tokenizeFOL("∀x ∀y ∀z op(op(x, y), z) = op(x, op(y, z))"))
    );

    // Axiom 2: Left Identity
    // ∀x: op(e,x) = x
    kb.addAxiom("left_identity",
        parseFOL(tokenizeFOL("∀x op(e, x) = x"))
    );

    // Axiom 3: Right Identity
    // ∀x: op(x,e) = x
    kb.addAxiom("right_identity",
        parseFOL(tokenizeFOL("∀x op(x, e) = x"))
    );

    // Axiom 4: Left Inverse
    // ∀x ∃y: op(y,x) = e
    kb.addAxiom("left_inverse",
        parseFOL(tokenizeFOL("∀x ∃y op(y, x) = e"))
    );

    // Axiom 5: Right Inverse
    // ∀x ∃y: op(x,y) = e
    kb.addAxiom("right_inverse",
        parseFOL(tokenizeFOL("∀x ∃y op(x, y) = e"))
    );

    // Axiom 6: Reflexivity of equality
    // ∀x: x = x
    kb.addAxiom("equality_reflexive",
        parseFOL(tokenizeFOL("∀x x = x"))
    );

    // Axiom 7: Symmetry of equality
    // ∀x ∀y: x = y ⟹ y = x
    kb.addAxiom("equality_symmetric",
        parseFOL(tokenizeFOL("∀x ∀y (x = y ⟹ y = x)"))
    );

    // Axiom 8: Transitivity of equality
    // ∀x ∀y ∀z: x = y ⟹ y = z ⟹ x = z
    kb.addAxiom("equality_transitive",
        parseFOL(tokenizeFOL("∀x ∀y ∀z ((x = y ⟹ y = z) ⟹ x = z)"))
    );

    // Axiom 9: Congruence of operation
    // ∀x ∀y ∀z ∀w: x = y ⟹ z = w ⟹ op(x,z) = op(y,w)
    kb.addAxiom("op_congruence",
        parseFOL(tokenizeFOL("∀x ∀y ∀z ∀w ((x = y ⟹ z = w) ⟹ op(x, z) = op(y, w))"))
    );

    return kb;
}

// ============================================
// TABLEAU PROVER WITH KB INTEGRATION
// ============================================

/**
 * Extended tableau prover that uses KB for axioms
 */
class KBTableauProver {
    constructor(kb, premises = [], goal = null) {
        this.kb = kb;
        this.premises = premises;
        this.goal = goal;
        this.maxDepth = 50;
        this.maxInstances = 10; // Limit universal instantiations per variable
        this.statistics = {
            nodesExpanded: 0,
            branchesClosed: 0,
            axiomApplications: 0,
            instantiations: 0
        };
        this.instantiationCount = {}; // Track how many times we instantiate each var
    }

    /**
     * Prove the goal using KB axioms
     */
    prove() {
        // Collect all formulas to work with
        let formulas = [
            ...this.premises,
            ...this.kb.getAllAxioms()
        ];

        if (this.goal) {
            formulas.push(new Not(this.goal));
        }

        // Convert to NNF and Skolemize
        let processedFormulas = [];
        for (let f of formulas) {
            let nnf = toNNF(f);
            let skolemized = skolemize(nnf);
            processedFormulas.push(skolemized);
        }

        this.statistics.axiomApplications = this.kb.getAllAxioms().length;

        // Start proof search
        let result = this.searchProof(processedFormulas, 0);
        if (result.closed) {
            // Humanize steps before returning
            let humanSteps = this.humanizeSteps(result.steps || []);
            return { 
                success: true, 
                proof: "Tableau closed by unification", 
                steps: humanSteps,
                stats: this.statistics 
            };
        } else {
            return { 
                success: false, 
                proof: null, 
                stats: this.statistics 
            };
        }
    }

    /**
     * Humanize and normalize step strings for display
     */
    humanizeSteps(steps) {
        // Map internal symbols (w_x_*, sk#) to shorter readable names t1,t2,...
        let nameMap = {};
        let counter = 1;

        function mapName(n) {
            if (nameMap[n]) return nameMap[n];
            let short = 't' + (counter++);
            nameMap[n] = short;
            return short;
        }

        let humanized = steps.map(s => {
            if (!s || typeof s !== 'string') return String(s);

            // Replace witness variables like w_x_12 -> t1
            s = s.replace(/\b(w_[A-Za-z0-9_]+)\b/g, (m) => mapName(m));

            // Replace skolem functions sk<digits> -> sk1, sk2
            s = s.replace(/\bsk(\d+)\b/g, (m, p1) => 'sk' + p1);

            // Shorten repetitive whitespace and line breaks
            s = s.replace(/\s+/g, ' ').trim();

            // Tidy up patterns like "¬e1 = e2" -> "¬(e1 = e2)"
            s = s.replace(/¬([^\s]+ = [^\s]+)/g, (m, g1) => '¬(' + g1 + ')');

            return s;
        });

        return humanized;
    }

    /**
     * Recursive proof search with depth tracking
     */
    searchProof(formulas, depth) {
        if (depth > this.maxDepth) {
            return { closed: false, steps: [] };
        }

        // Check for closure: complementary literals (P and ¬P)
        let closureResult = this.checkClosure(formulas);
        if (closureResult.found) {
            this.statistics.branchesClosed++;
            return { 
                closed: true,
                steps: [closureResult.step]
            };
        }

        // Find a formula to expand
        let toExpand = this.selectFormulaToExpand(formulas);
        if (!toExpand) {
            // No more expansions possible
            return { closed: false, steps: [] };
        }

        // Expand based on type
        if (toExpand.formula.type === "forall") {
            // Universal instantiation: ∀x φ → φ[x := t]
            let expansions = this.instantiateUniversal(toExpand.formula, formulas);
            
            for (let instance of expansions) {
                let newFormulas = [...formulas];
                newFormulas[toExpand.index] = instance;
                this.statistics.instantiations++;

                // Record instantiation step (show the instantiated formula)
                let instStep = `Instantiate ${formulaToStr(toExpand.formula)} => ${formulaToStr(instance)}`;
                let result = this.searchProof(newFormulas, depth + 1);
                if (result.closed) {
                    return { closed: true, steps: [instStep, ...result.steps] };
                }
            }
        } else if (toExpand.formula.type === "and") {
            // Conjunction: both must be true
            let left = toExpand.formula.left;
            let right = toExpand.formula.right;
            let newFormulas = [...formulas];
            newFormulas[toExpand.index] = left;
            newFormulas.push(right);
            let result = this.searchProof(newFormulas, depth + 1);
            if (result.closed) {
                let step = `Expand ∧: ${formulaToStr(toExpand.formula)}`;
                return { closed: true, steps: [step, ...result.steps] };
            }
            return { closed: false, steps: [] };
        } else if (toExpand.formula.type === "or") {
            // Disjunction: try both branches
            let left = toExpand.formula.left;
            let right = toExpand.formula.right;
            
            // Branch 1: left
            let formulas1 = [...formulas];
            formulas1[toExpand.index] = left;
            let result1 = this.searchProof(formulas1, depth + 1);
            if (result1.closed) {
                let step = `Branch ∨ (left): ${formulaToStr(toExpand.formula)}`;
                return { closed: true, steps: [step, ...result1.steps] };
            }
            
            // Branch 2: right
            let formulas2 = [...formulas];
            formulas2[toExpand.index] = right;
            let result2 = this.searchProof(formulas2, depth + 1);
            if (result2.closed) {
                let step = `Branch ∨ (right): ${formulaToStr(toExpand.formula)}`;
                return { closed: true, steps: [step, ...result2.steps] };
            }
        }

        return { closed: false, steps: [] };
    }

    /**
     * Check if there are complementary literals that close the branch
     * Also checks for transitive equality chains
     */
    checkClosure(formulas) {
        // Look for P and ¬P at the formula level
        for (let i = 0; i < formulas.length; i++) {
            for (let j = i + 1; j < formulas.length; j++) {
                let f1 = formulas[i];
                let f2 = formulas[j];

                // f2 = ¬f1?
                if (f2.type === "not" && this.formulasUnify(f1, f2.expr)) {
                    return { 
                        found: true, 
                        step: `${formulaToStr(f1)} and ¬${formulaToStr(f1.type === 'equality' ? f1 : f1)}` 
                    };
                }

                // f1 = ¬f2?
                if (f1.type === "not" && this.formulasUnify(f2, f1.expr)) {
                    return { 
                        found: true, 
                        step: `${formulaToStr(f2)} and ¬${formulaToStr(f2)}`
                    };
                }
            }
        }

        // Check for transitive closure of equalities
        // If we have a=b, b=c, and ¬(a=c), the branch closes
        let equalityFormulas = formulas.filter(f => f.type === "equality");
        let negatedGoals = formulas.filter(f => f.type === "not" && f.expr && f.expr.type === "equality");

        for (let eq1 of equalityFormulas) {
            for (let eq2 of equalityFormulas) {
                if (eq1 === eq2) continue;

                // Try all pairing patterns for transitivity
                const patterns = [
                    {a: eq1.left, b: eq1.right, c: eq2.left, d: eq2.right, make: (s) => new Equality(applySubstToTerm(eq1.right, s), applySubstToTerm(eq2.right, s))},
                    {a: eq1.left, b: eq1.right, c: eq2.right, d: eq2.left, make: (s) => new Equality(applySubstToTerm(eq1.right, s), applySubstToTerm(eq2.left, s))},
                    {a: eq1.right, b: eq1.left, c: eq2.left, d: eq2.right, make: (s) => new Equality(applySubstToTerm(eq1.left, s), applySubstToTerm(eq2.right, s))},
                    {a: eq1.right, b: eq1.left, c: eq2.right, d: eq2.left, make: (s) => new Equality(applySubstToTerm(eq1.left, s), applySubstToTerm(eq2.left, s))},
                ];

                for (let p of patterns) {
                    let subst = {};
                    if (unify(p.a, p.c, subst) !== null) {
                        let transitiveEq = p.make(subst);
                        for (let negGoal of negatedGoals) {
                            if (this.formulasUnify(transitiveEq, negGoal.expr)) {
                                // Mention the unification that made this transitivity chain possible
                                let unifyMsg = `Unify ${termToStr(p.a)} with ${termToStr(p.c)}`;
                                return {
                                    found: true,
                                    step: `${unifyMsg}; Transitivity: ${formulaToStr(eq1)} + ${formulaToStr(eq2)} => ${formulaToStr(transitiveEq)}, contradicts ${formulaToStr(negGoal)}`
                                };
                            }
                        }
                    }
                }
            }
        }

        return { found: false };
    }

    /**
     * Select a formula to expand (preference: quantifiers first, then operators)
     */
    selectFormulaToExpand(formulas) {
        // Priority 1: Universal quantifiers
        for (let i = 0; i < formulas.length; i++) {
            if (formulas[i].type === "forall") {
                return { formula: formulas[i], index: i };
            }
        }

        // Priority 2: Conjunctions and disjunctions
        for (let i = 0; i < formulas.length; i++) {
            if (formulas[i].type === "and" || formulas[i].type === "or") {
                return { formula: formulas[i], index: i };
            }
        }

        return null;
    }

    /**
     * Instantiate a universal formula with witness terms
     */
    instantiateUniversal(formula, context) {
        if (formula.type !== "forall") {
            return [];
        }

        let varName = formula.variable.name;
        
        // Track instantiations to avoid infinite loops
        this.instantiationCount[varName] = (this.instantiationCount[varName] || 0) + 1;
        if (this.instantiationCount[varName] > this.maxInstances) {
            return [];
        }

        let instances = [];
        let seenTerms = new Set(); // Avoid duplicate instantiations

        // Collect terms from a Term (variable, constant, function)
        function collectTermsFromTerm(t, out) {
            if (!t) return;
            if (t.type === 'variable' || t.type === 'constant' || t.type === 'function') {
                out.push(t);
            }
            if (t.type === 'function') {
                for (let a of t.args) collectTermsFromTerm(a, out);
            }
        }

        // Recursively collect terms from any formula node
        function collectTermsFromFormula(f, out) {
            if (!f) return;
            if (f.type === 'equality') {
                collectTermsFromTerm(f.left, out);
                collectTermsFromTerm(f.right, out);
                return;
            }
            if (f.type === 'predicate') {
                for (let a of f.args) collectTermsFromTerm(a, out);
                return;
            }
            if (f.type === 'not') return collectTermsFromFormula(f.expr, out);
            if (f.type === 'forall' || f.type === 'exists') return collectTermsFromFormula(f.formula, out);
            if (f.type === 'and' || f.type === 'or' || f.type === 'implies' || f.type === 'iff') {
                collectTermsFromFormula(f.left, out);
                collectTermsFromFormula(f.right, out);
                return;
            }
        }

        // Instantiation 1: With a fresh variable (witness)
        let freshVar = new Variable("w_" + varName + "_" + this.statistics.instantiations);
        let subst1 = {[varName]: freshVar};
        instances.push(applySubstToFormula(formula.formula, subst1));
        seenTerms.add(termToStr(freshVar));

        // Instantiation 2: Extract candidate terms from the entire context (including nested inside quantifiers)
        let candidates = [];
        for (let contextFormula of context) {
            collectTermsFromFormula(contextFormula, candidates);
        }

        // Also include terms from the formula body itself
        collectTermsFromFormula(formula.formula, candidates);

        // Filter and deduplicate candidates, avoid Skolem and witness terms
        let filtered = [];
        let seenC = new Set();
        for (let term of candidates) {
            if (!term) continue;
            // skip Skolem functions and generated witness vars
            if (term.type === 'function' && typeof term.name === 'string' && term.name.startsWith('sk')) continue;
            if (term.type === 'variable' && typeof term.name === 'string' && term.name.startsWith('w_')) continue;
            let tstr = termToStr(term);
            if (seenC.has(tstr)) continue;
            seenC.add(tstr);
            filtered.push(term);
        }

        // Cap candidates to avoid explosion
        const MAX_CANDIDATES = 12;
        filtered = filtered.slice(0, MAX_CANDIDATES);

        for (let term of filtered) {
            if (!term) continue;
            // Only consider constants, variables and function apps as instantiations
            if (term.type === 'constant' || term.type === 'variable' || term.type === 'function') {
                let tstr = termToStr(term);
                if (seenTerms.has(tstr)) continue;
                // Occur-check: don't instantiate variable with term that contains the variable
                if (typeof occursIn === 'function' && occursIn(varName, term, {})) continue;
                seenTerms.add(tstr);
                // Debug log for critical constants
                if (tstr === 'e1' || tstr === 'e2') {
                    console.log('instantiateUniversal: will instantiate', varName, '->', tstr, 'for formula', formulaToStr(formula));
                }
                let subst = {};
                subst[varName] = term;
                instances.push(applySubstToFormula(formula.formula, subst));
            }
        }

        return instances;
    }

    /**
     * Check if two formulas unify
     */
    formulasUnify(f1, f2) {
        if (f1.type === "equality" && f2.type === "equality") {
            let subst = {};
            let result = unify(f1.left, f2.left, subst);
            if (result === null) return false;
            result = unify(f1.right, f2.right, result);
            return result !== null;
        }

        if (f1.type === "predicate" && f2.type === "predicate") {
            if (f1.name !== f2.name || f1.args.length !== f2.args.length) {
                return false;
            }
            let subst = {};
            for (let i = 0; i < f1.args.length; i++) {
                let result = unify(f1.args[i], f2.args[i], subst);
                if (result === null) return false;
                subst = result;
            }
            return true;
        }

        return f1.equals(f2);
    }
}

/**
 * Convenience function to prove with KB
 */
function proveGroupTheory(kb, premises, goal) {
    let prover = new KBTableauProver(kb, premises, goal);
    return prover.prove();
}
