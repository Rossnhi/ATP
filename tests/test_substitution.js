/* ===============================
   SUBSTITUTION EXACT AST TESTS
   =============================== */

function substitutionEqualsTest(desc, actual, expected) {
    try {
        if (!actual.equals(expected)) {
            console.error("❌ SUBSTITUTION FAILED");
            console.error("  Test:     ", desc);
            console.error("  Got AST:  ", actual);
            console.error("  Exp AST:  ", expected);
        } else {
            console.log("✅ SUBSTITUTION OK:", desc);
        }
    } catch (e) {
        console.error("❌ ERROR");
        console.error("  Test:", desc);
        console.error(e.message);
    }
}

/* ===============================
   TERM SUBSTITUTION
   =============================== */

substitutionEqualsTest(
    "variable replaced",
    substituteTerm(
        "x",
        new Constant("a"),
        new Variable("x")
    ),
    new Constant("a")
);

substitutionEqualsTest(
    "variable not replaced",
    substituteTerm(
        "x",
        new Constant("a"),
        new Variable("y")
    ),
    new Variable("y")
);

substitutionEqualsTest(
    "function recursion",
    substituteTerm(
        "x",
        new Constant("a"),
        new Func("f", [
            new Variable("x"),
            new Constant("b")
        ])
    ),
    new Func("f", [
        new Constant("a"),
        new Constant("b")
    ])
);

substitutionEqualsTest(
    "nested function substitution",
    substituteTerm(
        "x",
        new Constant("a"),
        new Func("f", [
            new Func("g", [new Variable("x")]),
            new Func("h", [new Variable("y")])
        ])
    ),
    new Func("f", [
        new Func("g", [new Constant("a")]),
        new Func("h", [new Variable("y")])
    ])
);

/* ===============================
   FORMULA SUBSTITUTION
   =============================== */

substitutionEqualsTest(
    "predicate substitution",
    substituteFormula(
        "x",
        new Constant("a"),
        new Predicate("P", [new Variable("x")])
    ),
    new Predicate("P", [new Constant("a")])
);

substitutionEqualsTest(
    "equality substitution",
    substituteFormula(
        "x",
        new Constant("a"),
        new Equality(
            new Variable("x"),
            new Variable("y")
        )
    ),
    new Equality(
        new Constant("a"),
        new Variable("y")
    )
);

substitutionEqualsTest(
    "negation substitution",
    substituteFormula(
        "x",
        new Constant("a"),
        new Not(
            new Predicate("P", [new Variable("x")])
        )
    ),
    new Not(
        new Predicate("P", [new Constant("a")])
    )
);

substitutionEqualsTest(
    "conjunction substitution",
    substituteFormula(
        "x",
        new Constant("a"),
        new And(
            new Predicate("P", [new Variable("x")]),
            new Predicate("Q", [])
        )
    ),
    new And(
        new Predicate("P", [new Constant("a")]),
        new Predicate("Q", [])
    )
);

/* ===============================
   QUANTIFIER BLOCKING
   =============================== */

substitutionEqualsTest(
    "forall blocks substitution",
    substituteFormula(
        "x",
        new Constant("a"),
        new Forall(
            new Variable("x"),
            new Predicate("P", [new Variable("x")])
        )
    ),
    new Forall(
        new Variable("x"),
        new Predicate("P", [new Variable("x")])
    )
);

substitutionEqualsTest(
    "forall does not block other variable",
    substituteFormula(
        "x",
        new Constant("a"),
        new Forall(
            new Variable("y"),
            new Predicate("P", [new Variable("x")])
        )
    ),
    new Forall(
        new Variable("y"),
        new Predicate("P", [new Constant("a")])
    )
);

substitutionEqualsTest(
    "shadowing test",
    substituteFormula(
        "x",
        new Constant("a"),
        new Forall(
            new Variable("x"),
            new Or(
                new Predicate("P", [new Variable("x")]),
                new Exists(
                    new Variable("x"),
                    new Predicate("Q", [new Variable("x")])
                )
            )
        )
    ),
    new Forall(
        new Variable("x"),
        new Or(
            new Predicate("P", [new Variable("x")]),
            new Exists(
                new Variable("x"),
                new Predicate("Q", [new Variable("x")])
            )
        )
    )
);
