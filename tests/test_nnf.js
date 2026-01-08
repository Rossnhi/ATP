/* ===============================
   NNF EXACT AST EQUALITY TESTS
   =============================== */

function nnfEqualsTest(input, expected) {
    try {
        const ast = parseFOL(tokenize(input));
        const nnf = toNNF(ast);
        const expectedAST = parseFOL(tokenize(expected));

        if (!nnf.equals(expectedAST)) {
            console.error("❌ NNF MISMATCH");
            console.error("  Input:    ", input);
            console.error("  Expected: ", expected);
            console.error("  Got AST:  ", nnf);
            console.error("  Exp AST:  ", expectedAST);
        } else {
            console.log("✅ NNF OK:", input);
        }
    } catch (e) {
        console.error("❌ ERROR");
        console.error("  Input:", input);
        console.error(e.message);
    }
}

/* ===============================
   BASIC NEGATION
   =============================== */

nnfEqualsTest(
    "¬¬P(x)",
    "P(x)"
);

nnfEqualsTest(
    "¬(P(x) ∧ Q(x))",
    "¬P(x) ∨ ¬Q(x)"
);

nnfEqualsTest(
    "¬(P(x) ∨ Q(x))",
    "¬P(x) ∧ ¬Q(x)"
);

/* ===============================
   IMPLICATIONS
   =============================== */

nnfEqualsTest(
    "P(x) ⟹ Q(x)",
    "¬P(x) ∨ Q(x)"
);

nnfEqualsTest(
    "¬(P(x) ⟹ Q(x))",
    "P(x) ∧ ¬Q(x)"
);

nnfEqualsTest(
    "¬¬(P(x) ⟹ Q(x))",
    "¬P(x) ∨ Q(x)"
);

/* ===============================
   BICONDITIONAL
   =============================== */

nnfEqualsTest(
    "P(x) ⟺ Q(x)",
    "(¬P(x) ∨ Q(x)) ∧ (¬Q(x) ∨ P(x))"
);

nnfEqualsTest(
    "¬(P(x) ⟺ Q(x))",
    "(P(x) ∧ ¬Q(x)) ∨ (Q(x) ∧ ¬P(x))"
);

/* ===============================
   QUANTIFIERS
   =============================== */

nnfEqualsTest(
    "¬∀x P(x)",
    "∃x ¬P(x)"
);

nnfEqualsTest(
    "¬∃x P(x)",
    "∀x ¬P(x)"
);

nnfEqualsTest(
    "∀x ¬¬P(x)",
    "∀x P(x)"
);

/* ===============================
   MIXED STRUCTURE
   =============================== */

nnfEqualsTest(
    "∀x (P(x) ⟹ Q(x))",
    "∀x (¬P(x) ∨ Q(x))"
);

nnfEqualsTest(
    "¬∀x (P(x) ⟹ Q(x))",
    "∃x (P(x) ∧ ¬Q(x))"
);

nnfEqualsTest(
    "¬(∀x P(x) ∨ ∃y Q(y))",
    "(∃x ¬P(x)) ∧ (∀y ¬Q(y))"
);

/* ===============================
   EQUALITY ATOMS
   =============================== */

nnfEqualsTest(
    "¬(x = y)",
    "¬(x = y)"
);

nnfEqualsTest(
    "¬¬(x = y)",
    "x = y"
);

nnfEqualsTest(
    "(x = y) ⟹ P(x)",
    "¬(x = y) ∨ P(x)"
);

/* ===============================
   HARD STRESS CASES
   =============================== */

nnfEqualsTest(
    "¬∀x ∃y ¬∀z P(x,y,z)",
    "∃x ∀y ∀z P(x,y,z)"
);

nnfEqualsTest(
    "¬(P(x) ⟹ (Q(x) ⟹ R(x)))",
    "P(x) ∧ Q(x) ∧ ¬R(x)"
);

nnfEqualsTest(
    "¬∀x (P(x) ⟺ Q(x))",
    "∃x ((P(x) ∧ ¬Q(x)) ∨ (Q(x) ∧ ¬P(x)))"
);

nnfEqualsTest(
    "¬∀x (P(x) ⟹ ∃y Q(x,y))",
    "∃x (P(x) ∧ ∀y ¬Q(x,y))"
);
