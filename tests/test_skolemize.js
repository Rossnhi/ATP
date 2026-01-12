/* ===============================
   SKOLEMIZATION EXACT AST TESTS
   =============================== */

function skolemEqualsTest(input, expected) {
    try {
        const ast = parseFOL(tokenize(input));
        const nnf = toNNF(ast);
        const skol = skolemize(nnf);
        const expectedAST = parseFOL(tokenize(expected));

        if (!skol.equals(expectedAST)) {
            console.error("❌ SKOLEMIZATION FAILED");
            console.error("  Input:    ", input);
            console.error("  Expected: ", expected);
            console.error("  Got AST:  ", skol);
            console.error("  Exp AST:  ", expectedAST);
        } else {
            console.log("✅ SKOLEM OK:", input);
        }
    } catch (e) {
        console.error("❌ ERROR");
        console.error("  Input:", input);
        console.error(e.message);
    }
}

/* ===============================
   BASIC SKOLEMIZATION
   =============================== */

skolemEqualsTest(
    "∃x P(x)",
    "P(SC0)"
);

skolemEqualsTest(
    "∀x ∃y P(x, y)",
    "∀x P(x, sf0(x))"
);

/* ===============================
   NESTED STRUCTURE
   =============================== */

skolemEqualsTest(
    "∀x (¬P(x) ∨ ∃y Q(x, y))",
    "∀x (¬P(x) ∨ Q(x, sf1(x)))"
);

/* ===============================
   MULTIPLE EXISTENTIALS
   =============================== */

skolemEqualsTest(
    "∃x ∃y R(x, y)",
    "R(SC1, SC2)"
);

/* ===============================
   SHADOWING TEST
   =============================== */

skolemEqualsTest(
    "∀x (P(x) ∨ ∃x Q(x))",
    "∀x (P(x) ∨ Q(SC3))"
);

/* ===============================
   MULTIPLE UNIVERSALS
   =============================== */

skolemEqualsTest(
    "∀x ∀z ∃y R(x, y, z)",
    "∀x ∀z R(x, sf2(x, z), z)"
);
