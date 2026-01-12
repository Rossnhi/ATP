// parse → NNF → Skolemization → ∀-retention (for now)

/* ============================================
   INTEGRATION TESTS (END-TO-END PREPROCESSING)
   ============================================ */

function integrationTest(input, expected) {
    try {
        const ast = parseFOL(tokenize(input));
        const nnf = toNNF(ast);
        const skol = skolemize(nnf);
        const expectedAST = parseFOL(tokenize(expected));

        if (!skol.equals(expectedAST)) {
            console.error("❌ INTEGRATION TEST FAILED");
            console.error("  Input:    ", input);
            console.error("  Expected: ", expected);
            console.error("  Got AST:  ", skol);
            console.error("  Exp AST:  ", expectedAST);
        } else {
            console.log("✅ INTEGRATION OK:", input);
        }
    } catch (e) {
        console.error("❌ ERROR");
        console.error("  Input:", input);
        console.error(e.message);
    }
}

/* ============================================
   BASIC QUANTIFIERS
   ============================================ */

integrationTest(
    "∃x P(x)",
    "P(SC0)"
);

integrationTest(
    "∀x ∃y P(x, y)",
    "∀x P(x, sf0(x))"
);

/* ============================================
   SHADOWING
   ============================================ */

integrationTest(
    "∀x (P(x) ∨ ∃x Q(x))",
    "∀x (P(x) ∨ Q(SC1))"
);

/* ============================================
   NESTED STRUCTURE
   ============================================ */

integrationTest(
    "∀x (¬P(x) ∨ ∃y Q(x, y))",
    "∀x (¬P(x) ∨ Q(x, sf1(x)))"
);

/* ============================================
   MULTIPLE EXISTENTIALS
   ============================================ */

integrationTest(
    "∃x ∃y R(x, y)",
    "R(SC2, SC3)"
);

/* ============================================
   COMPLEX MIX
   ============================================ */

integrationTest(
    "∀x ∀z (P(x) ∧ ∃y (Q(y) ∨ R(x, y, z)))",
    "∀x ∀z (P(x) ∧ (Q(sf2(x, z)) ∨ R(x, sf2(x, z), z)))"
);
