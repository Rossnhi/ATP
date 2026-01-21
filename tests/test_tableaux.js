/* =========================================
   TABLEAU ENGINE TEST SUITE
   ========================================= */

function tableauTest(name, input, expectedUnsat) {
    try {
        const tokens = tokenize(input);
        const ast = parseFOL(tokens);
        const pre = preprocess(ast);

        const engine = new Tableau();
        engine.initialize([pre]);

        const result = engine.run(); // true = UNSAT, false = SAT

        if (result === expectedUnsat) {
            console.log("✅ PASSED:", name);
            return engine;
        } else {
            console.error("❌ FAILED:", name);
            console.error("   Formula:", input);
            console.error("   Expected:", expectedUnsat ? "UNSAT" : "SAT");
            console.error("   Got:", result ? "UNSAT" : "SAT");
        }
    } catch (e) {
        console.error("❌ ERROR:", name);
        console.error("   Formula:", input);
        console.error(e.message);
    }
}

/* =========================================
   BASIC PROPOSITIONAL CONTRADICTIONS
   ========================================= */

tableauTest(
    "Simple contradiction",
    "P(x) ∧ ¬P(x)",
    true
);

tableauTest(
    "Symmetric contradiction",
    "¬P(x) ∧ P(x)",
    true
);

/* =========================================
   ALPHA EXPANSION (∧)
   ========================================= */

tableauTest(
    "Alpha contradiction",
    "(P(x) ∧ Q(x)) ∧ ¬P(x)",
    true
);

tableauTest(
    "Alpha satisfiable",
    "(P(x) ∧ Q(x)) ∧ R(x)",
    false
);

/* =========================================
   BETA EXPANSION (∨)
   ========================================= */

tableauTest(
    "Simple beta SAT",
    "(P(x) ∨ Q(x)) ∧ ¬P(x)",
    false
);

tableauTest(
    "Beta UNSAT",
    "(P(x) ∨ Q(x)) ∧ ¬P(x) ∧ ¬Q(x)",
    true
);

/* =========================================
   IMPLICATIONS (→ eliminated internally)
   ========================================= */

tableauTest(
    "Modus ponens contradiction",
    "(P(x) ⟹ Q(x)) ∧ P(A) ∧ ¬Q(A)",
    true
);

tableauTest(
    "Implication satisfiable",
    "(P(x) ⟹ Q(x)) ∧ ¬Q(A)",
    false
);

/* =========================================
   UNIVERSAL QUANTIFIERS
   ========================================= */

tableauTest(
    "Universal instantiation contradiction",
    "∀x P(x) ∧ ¬P(A)",
    true
);

tableauTest(
    "Universal implication contradiction",
    "∀x (P(x) ⟹ Q(x)) ∧ P(A) ∧ ¬Q(A)",
    true
);

tableauTest(
    "Universal satisfiable",
    "∀x (P(x) ∨ Q(x))",
    false
);

/* =========================================
   EXISTENTIAL QUANTIFIERS (SKOLEMIZED)
   ========================================= */

tableauTest(
    "Simple existential SAT",
    "∃x P(x)",
    false
);

tableauTest(
    "Existential contradiction",
    "∃x (P(x) ∧ ¬P(x))",
    true
);

/* =========================================
   UNIFICATION AND VARIABLES
   ========================================= */

tableauTest(
    "Unification closure",
    "P(x) ∧ ¬P(A)",
    true    
);


tableauTest(
    "Occurs check prevents closure",
    "P(x) ∧ ¬P(f(x))",
    false
);

tableauTest(
    "Function unification",
    "P(f(x)) ∧ ¬P(f(A))",
    true
);

/* =========================================
   EQUALITY (BUILT-IN)
   ========================================= */

tableauTest(
    "Equality contradiction",
    "A = B ∧ ¬(A = B)",
    true
);

tableauTest(
    "Symmetric equality contradiction",
    "A = B ∧ ¬(B = A)",
    true
);

tableauTest(
    "Equality satisfiable",
    "A = B",
    false
);

/* =========================================
   GROUP THEORY STYLE FORMULAS
   ========================================= */

tableauTest(
    "Left inverse contradiction",
    "∀x (*(x,inv(x)) = E) ∧ ¬(*(A,inv(A)) = E)",
    true
);

tableauTest(
    "Associativity satisfiable",
    "∀x ∀y ∀z (*(*(x,y),z) = *(x,*(y,z)))",
    false
);

tableauTest(
    "Inverse existence satisfiable",
    "∀x ∃y (*(x,y) = E ∧ *(y,x) = E)",
    false
);

/* =========================================
   MIXED QUANTIFIER STRUCTURE
   ========================================= */

tableauTest(
    "Nested quantifier UNSAT",
    "∀x ∃y P(x,y) ∧ ∃x ∀y ¬P(x,y)",
    true
);

tableauTest(
    "Deep nesting SAT",
    "∀x (P(x) ⟹ (∃y (Q(x,y) ∨ R(y))))",
    false
);

/* =========================================
   ADVANCED / ROBUST TABLEAU TESTS
   (APPEND AFTER EXISTING TEST SUITE)
   ========================================= */

/* =========================================
   MULTI-BRANCH INTERACTION
   ========================================= */

/*
   Tests that closure on one branch does NOT
   incorrectly close the entire tableau.
*/

tableauTest(
    "One branch closes, one survives (beta correctness)",
    "(P(x) ∨ Q(x)) ∧ ¬P(x)",
    false
);

tableauTest(
    "All beta branches close",
    "(P(x) ∨ Q(x)) ∧ ¬P(x) ∧ ¬Q(x)",
    true
);

/* =========================================
   DEEP BETA NESTING
   ========================================= */

tableauTest(
    "Nested disjunctions SAT",
    "(P(x) ∨ Q(x) ∨ R(x)) ∧ ¬P(x) ∧ ¬Q(x)",
    false
);

tableauTest(
    "Nested disjunctions UNSAT",
    "(P(x) ∨ Q(x) ∨ R(x)) ∧ ¬P(x) ∧ ¬Q(x) ∧ ¬R(x)",
    true
);

/* =========================================
   ALPHA–BETA INTERACTION
   ========================================= */

tableauTest(
    "Alpha produces beta later",
    "(P(x) ∧ (Q(x) ∨ R(x))) ∧ ¬Q(x)",
    false
);

tableauTest(
    "Alpha + beta all close",
    "(P(x) ∧ (Q(x) ∨ R(x))) ∧ ¬Q(x) ∧ ¬R(x)",
    true
);

/* =========================================
   VARIABLE SHARING ACROSS FORMULAS
   ========================================= */

/*
   Tests whether substitutions propagate
   consistently across the branch.
*/

tableauTest(
    "Shared variable closure",
    "P(x) ∧ Q(x) ∧ ¬P(A)",
    true
);

tableauTest(
    "Shared variable survives",
    "P(x) ∧ Q(x) ∧ ¬Q(A)",
    true
);

/* =========================================
   MULTIPLE UNIVERSALS
   ========================================= */

tableauTest(
    "Two universals contradiction",
    "∀x P(x) ∧ ∀y ¬P(y)",
    true
);

tableauTest(
    "Universal vs existential UNSAT",
    "∀x P(x) ∧ ∃y ¬P(y)",
    true
);

tableauTest(
    "Universal and existential compatible",
    "∀x (P(x) ∨ Q(x)) ∧ ∃y P(y)",
    false  // Expected: SAT
);

/* =========================================
   EXISTENTIAL + BETA INTERACTION
   ========================================= */

tableauTest(
    "Existential creates beta SAT",
    "∃x (P(x) ∨ Q(x)) ∧ ¬P(A)",
    false
);

tableauTest(
    "Existential beta UNSAT",
    "∃x (P(x) ∨ Q(x)) ∧ ¬P(x) ∧ ¬Q(x)",
    true
);

/* =========================================
   FUNCTION SYMBOL STRESS TESTS
   ========================================= */

tableauTest(
    "Unary function closure",
    "P(f(x)) ∧ ¬P(f(A))",
    true
);

tableauTest(
    "Nested function occurs-check safety",
    "P(x) ∧ ¬P(f(f(x)))",
    false
);

/* =========================================
   EQUALITY WITH FUNCTIONS
   ========================================= */

tableauTest(
    "Equality inside predicate",
    "x = A ∧ P(x) ∧ ¬P(A)",
    true
);

tableauTest(
    "Equality does not force closure",
    "x = A ∧ P(f(x)) ∧ ¬P(f(B))",
    false
);

/* =========================================
   GROUP THEORY – STRUCTURAL TESTS
   ========================================= */

tableauTest(
    "Left and right inverse contradiction",
    "∀x (*(x,inv(x)) = E ∧ *(inv(x),x) = E) ∧ ¬(*(A,inv(A)) = E)",
    true
);

tableauTest(
    "Inverse existence not uniqueness",
    "∀x ∃y (*(x,y) = E ∧ *(y,x) = E)",
    false
);

/* =========================================
   MIXED QUANTIFIER DEPENDENCY
   ========================================= */

tableauTest(
    "Dependent Skolem function closure",
    "∀x ∃y P(x,y) ∧ ¬P(A,sf0(A))",
    true
);

tableauTest(
    "Dependent Skolem function SAT",
    "∀x ∃y P(x,y) ∧ ¬P(A,B)",
    false
);

/* =========================================
   SATURATION DETECTION
   ========================================= */

/*
   Ensures the prover correctly detects
   an open saturated branch.
*/

tableauTest(
    "Open saturated branch SAT",
    "P(x) ∨ Q(x)",
    false
);

tableauTest(
    "Occurs check from chained substitutions",
    "(x = f(y)) ∧ (y = x)",
    true  // Expected: UNSAT
);

/* =========================================
   MULTIPLE PREMISES (CONJUNCTIVE GOAL)
   ========================================= */

tableauTest(
    "Multiple premises all required for closure",
    "P(x) ∧ Q(x) ∧ R(x) ∧ ¬P(A)",
    true
);

tableauTest(
    "Multiple premises one sufficient for SAT",
    "P(x) ∧ Q(x) ∧ R(x) ∧ ¬P(A) ∧ ¬Q(A) ∧ S(A)",
    true
);

/* =========================================
   COMPLEX MULTI-BRANCH SCENARIOS
   ========================================= */

tableauTest(
    "Three-way disjunction all close",
    "(P(x) ∨ Q(x) ∨ R(x)) ∧ ¬P(A) ∧ ¬Q(A) ∧ ¬R(A)",
    true
);

tableauTest(
    "Three-way disjunction one survives",
    "(P(x) ∨ Q(x) ∨ R(x)) ∧ ¬P(A) ∧ ¬Q(A)",
    false
);

tableauTest(
    "Nested disjunctions create exponential branches",
    "((P(x) ∨ Q(x)) ∧ (R(x) ∨ S(x))) ∧ ¬P(A) ∧ ¬Q(A) ∧ ¬R(A) ∧ ¬S(A)",
    true
);

tableauTest(
    "Nested disjunctions one path survives",
    "((P(x) ∨ Q(x)) ∧ (R(x) ∨ S(x))) ∧ ¬P(A) ∧ ¬R(A)",
    false
);

/* =========================================
   MULTIPLE UNIVERSALS + EXISTENTIALS
   ========================================= */

tableauTest(
    "Two universals instantiate to same constant",
    "∀x P(x) ∧ ∀y Q(y) ∧ ¬P(A) ∧ ¬Q(A)",
    true
);

tableauTest(
    "Two universals different instantiations SAT",
    "∀x P(x) ∧ ∀y Q(y) ∧ ¬P(A)",
    true
);

tableauTest(
    "Multiple existentials with universals",
    "∀x ∃y P(x,y) ∧ ∀u ∃v Q(u,v) ∧ ¬P(A,sf0(A)) ∧ ¬Q(B,sf1(B))",
    true
);

/* =========================================
   QUANTIFIER SCOPE + BRANCHING
   ========================================= */

tableauTest(
    "Existential inside disjunction branches",
    "(∃x P(x) ∨ ∃y Q(y)) ∧ ¬P(A) ∧ ¬Q(A)",
    false
);

tableauTest(
    "Universal inside disjunction all branches",
    "(∀x P(x) ∨ ∀x Q(x)) ∧ ¬P(A) ∧ ¬Q(A)",
    true
);

/* =========================================
   EQUALITY IN COMPLEX FORMULAS
   ========================================= */

tableauTest(
    "Equality chains create substitutions",
    "(x = A) ∧ (A = B) ∧ P(x) ∧ ¬P(B)",
    true
);

tableauTest(
    "Equality with functions complex",
    "(x = f(A)) ∧ (y = f(B)) ∧ P(x) ∧ ¬P(f(A))",
    true
);

tableauTest(
    "Multiple equality branches",
    "((x = A) ∨ (x = B)) ∧ P(x) ∧ ¬P(A) ∧ ¬P(B)",
    true
);

/* =========================================
   STRESS: DEEP NESTING + BRANCHING
   ========================================= */

tableauTest(
    "Deep formula nesting SAT",
    "((P(x) ∨ Q(x)) ∧ (R(x) ∨ S(x))) ∨ ((T(x) ∨ U(x)) ∧ (V(x) ∨ W(x)))",
    false
);

tableauTest(
    "Deep formula nesting UNSAT",
    "((P(x) ∨ Q(x)) ∧ (R(x) ∨ S(x))) ∧ ¬P(A) ∧ ¬Q(A) ∧ ¬R(A) ∧ ¬S(A)",
    true
);

/* =========================================
   MIXED: UNIVERSALS + EXISTENTIALS + BRANCHES
   ========================================= */

tableauTest(
    "Complex quantifier structure UNSAT",
    "∀x (P(x) ∨ ∃y Q(x,y)) ∧ ¬P(A) ∧ ¬Q(A,sf0(A))",
    true
);

tableauTest(
    "Complex quantifier structure SAT",
    "∀x (P(x) ∨ ∃y Q(x,y)) ∧ ¬P(A)",
    false
);

/* =========================================
   REAL-WORLD LOGIC PUZZLES
   ========================================= */

tableauTest(
    "Everyone loves someone (satisfiable)",
    "∀x ∃y Loves(x,y)",
    false
);

tableauTest(
    "Everyone loves someone + nobody loves John",
    "∀x ∃y Loves(x,y) ∧ ¬Loves(A,JOHN)",
    false  // Someone else loves John, or John loves himself
);

tableauTest(
    "All philosophers are mortal + Socrates is a philosopher + Socrates is not mortal",
    "∀x (Philosopher(x) ⟹ Mortal(x)) ∧ Philosopher(SOCRATES) ∧ ¬Mortal(SOCRATES)",
    true  // UNSAT: contradiction
);


//Group Theory

tableauTest(
    "Group identity uniqueness",
    "∀x ∀y ∀z (*(*(x,y),z) = *(x,*(y,z))) ∧ \
     ∀x (*(E1,x) = x ∧ *(x,E1) = x) ∧ \
     ∀x (*(inv(x),x) = E1 ∧ *(x,inv(x))) ∧ \
     ∀x (*(E2,x) = x) ∧ \
     ¬(E1 = E2)",
    true
);

let t = tableauTest(
    "Group inverse uniqueness",
    "∀x ∀y ∀z (*(*(x,y),z) = *(x,*(y,z))) ∧ \
     ∀x (*(E,x) = x) ∧ \
     ∀x (*(inv(x),x) = E) ∧ \
     *(x,y) = E ∧ \
     *(x,z) = E ∧ \
     ¬(y = z)",
    true
);
console.log(t.branches);

tableauTest(
    "Middle cancellation implies abelian",
    "∀x ∀y ∀z (*(*(x,y),z) = *(x,*(y,z))) ∧ \
     ∀x (*(E,x) = x) ∧ \
     ∀x (*(inv(x),x) = E) ∧ \
     ∀a ∀b ∀c ∀d ∀x ( *(*(a,x),b) = *(*(c,x),d) ⟹ *(a,b) = *(c,d) ) ∧ \
     ¬(∀x ∀y (*(x,y) = *(y,x)))",
    true
);


tableauTest(
    "Group axioms do not imply commutativity",
    "∀x ∀y ∀z (*(*(x,y),z) = *(x,*(y,z))) ∧ \
     ∀x (*(E,x) = x) ∧ \
     ∀x (*(inv(x),x) = E) ∧ \
     ¬(∀x ∀y (*(x,y) = *(y,x)))",
    false
);

tableauTest(
    "Group axioms do not imply middle cancellation",
    "∀x ∀y ∀z (*(*(x,y),z) = *(x,*(y,z))) ∧ \
     ∀x (*(E,x) = x) ∧ \
     ∀x (*(inv(x),x) = E) ∧ \
     ¬(∀a ∀b ∀c ∀d ∀x ( *(*(a,x),b) = *(*(c,x),d) ⟹ *(a,b) = *(c,d) ))",
    false   // SAT expected
);

tableauTest(
    "Group axioms + left cancellation do not imply commutativity",
    "∀x ∀y ∀z (*(*(x,y),z) = *(x,*(y,z))) ∧ \
   ∀x (*(E,x) = x) ∧ \
   ∀x (*(inv(x),x) = E) ∧ \
   ∀x ∀y ∀z (*(x,y) = *(x,z) ⟹ y = z) ∧ \
   ¬(∀x ∀y (*(x,y) = *(y,x)))",
    false
);



/* =========================================
   END OF EXTENDED TESTS
   ========================================= */
