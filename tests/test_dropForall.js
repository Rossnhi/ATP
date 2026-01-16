/* ===============================
   FORALL ELIMINATION EXACT AST TESTS
   =============================== */

function forallElimEqualsTest(input, expected) {
    try {
        const ast = parseFOL(tokenize(input));
        const nnf = toNNF(ast);
        const skol = skolemize(nnf);
        const dropped = dropForall(skol);

        const expectedAST = parseFOL(tokenize(expected));

        if (!dropped.equals(expectedAST)) {
            console.error("❌ FORALL ELIM FAILED");
            console.error("  Input:    ", input);
            console.error("  Expected: ", expected);
            console.error("  Got AST:  ", dropped);
            console.error("  Exp AST:  ", expectedAST);
        } else {
            console.log("✅ FORALL ELIM OK:", input);
        }
    } catch (e) {
        console.error("❌ ERROR");
        console.error("  Input:", input);
        console.error(e.message);
    }
}

/* ===============================
   BASIC FORALL ELIMINATION
   =============================== */

forallElimEqualsTest(
    "∀x P(x)",
    "P(x)"
);

forallElimEqualsTest(
    "∀x ∀y P(x,y)",
    "P(x,y)"
);

/* ===============================
   FORALL + CONNECTIVES
   =============================== */

forallElimEqualsTest(
    "∀x (P(x) ∧ Q(x))",
    "(P(x) ∧ Q(x))"
);

forallElimEqualsTest(
    "∀x (P(x) ∨ Q(x))",
    "(P(x) ∨ Q(x))"
);

forallElimEqualsTest(
    "∀x (P(x) ⟹ Q(x))",
    "(¬P(x) ∨ Q(x))"
);

/* ===============================
   NEGATED FORALL (EXISTENTIAL AFTER NNF)
   =============================== */

/*
   ¬∀x P(x)
   → ∃x ¬P(x)
   → ¬P(SC0)
*/

forallElimEqualsTest(
    "¬∀x P(x)",
    "¬P(SC0)"
);

/* ===============================
   MIXED ∀ / ∃ (SKOLEMIZED FIRST)
   =============================== */

/*
   ∀x ∃y P(x,y)
   → P(x, sf0(x))
*/

forallElimEqualsTest(
    "∀x ∃y P(x,y)",
    "P(x, sf0(x))"
);

/*
   ∃x ∀y P(x,y)
   → P(SC1, y)
*/

forallElimEqualsTest(
    "∃x ∀y P(x,y)",
    "P(SC1, y)"
);

/* ===============================
   NESTED FORALL
   =============================== */

forallElimEqualsTest(
    "∀x (∀y (P(x,y)))",
    "P(x,y)"
);

forallElimEqualsTest(
    "∀x (P(x) ∧ (∀y Q(x,y)))",
    "(P(x) ∧ Q(x,y))"
);

/* ===============================
   EQUALITY + FUNCTIONS
   =============================== */

forallElimEqualsTest(
    "∀x (f(x)=g(x))",
    "f(x)=g(x)"
);

forallElimEqualsTest(
    "∀x ∀y (f(x)=f(y) ⟹ x=y)",
    "(¬(f(x)=f(y)) ∨ x=y)"
);

/* ===============================
   GROUP THEORY AXIOMS
   =============================== */

forallElimEqualsTest(
    "∀x (*(e, x) = x)",
    "*(e, x) = x"
);

forallElimEqualsTest(
    "∀x ∀y ∀z (*(*(x,y),z) = *(x,*(y,z)))",
    "*(*(x,y),z) = *(x,*(y,z))"
);

/*
   ∀x ∃y (*(x,y)=e ∧ *(y,x)=e)
   → (*(x, sf1(x))=e ∧ *(sf1(x),x)=e)
*/

forallElimEqualsTest(
    "∀x ∃y (*(x,y) = e ∧ *(y,x) = e)",
    "(*(x, sf1(x)) = e ∧ *(sf1(x), x) = e)"
);

/* ===============================
   NO FORALL (UNCHANGED)
   =============================== */

forallElimEqualsTest(
    "P(x)",
    "P(x)"
);

forallElimEqualsTest(
    "P(x) ∧ Q(y)",
    "(P(x) ∧ Q(y))"
);
