/* =====================================
   UNIFICATION — CORRECTNESS TESTS
   (Grammar-consistent version)
   ===================================== */

/*
 Helper: extract term safely from a formula
*/
function getTerm(formulaStr, which = "first") {
    const ast = parseFOL(tokenize(formulaStr));

    if (ast.type === "predicate") {
        return ast.terms[0];
    }

    if (ast.type === "equality") {
        return which === "left" ? ast.left : ast.right;
    }

    throw new Error("Cannot extract term from formula: " + formulaStr);
}

/*
 Compare two mappings structurally
*/
function mappingEquals(m1, m2) {
    const k1 = Object.keys(m1);
    const k2 = Object.keys(m2);
    if (k1.length !== k2.length) return false;

    for (let k of k1) {
        if (!(k in m2)) return false;
        if (!m1[k].equals(m2[k])) return false;
    }
    return true;
}

/*
 Unification test harness
*/
function unifyTest(name, lhsTerms, rhsTerms, expectedSuccess, expectedMapping = {}) {
    try {
        const mapping = {};

        const success = unify(lhsTerms, rhsTerms, mapping);

        if (success !== expectedSuccess) {
            console.error("❌ UNIFY FAILED:", name);
            console.error("  Expected success:", expectedSuccess);
            console.error("  Got success:     ", success);
            return;
        }

        if (success && !mappingEquals(mapping, expectedMapping)) {
            console.error("❌ WRONG SUBSTITUTION:", name);
            console.error("  Expected mapping:", expectedMapping);
            console.error("  Got mapping:     ", mapping);
            return;
        }

        console.log("✅ UNIFY OK:", name);
    } catch (e) {
        console.error("❌ ERROR IN UNIFY TEST:", name);
        console.error(e.message);
    }
}

/* =====================================
   CONSTANT / VARIABLE BASICS
   ===================================== */

unifyTest(
    "x ≐ A",
    [getTerm("P(x)")],
    [getTerm("P(A)")],
    true,
    { x: getTerm("P(A)") }
);

unifyTest(
    "A ≐ A",
    [getTerm("P(A)")],
    [getTerm("P(A)")],
    true,
    {}
);

unifyTest(
    "A ≐ E (fail)",
    [getTerm("P(A)")],
    [getTerm("P(E)")],
    false
);

/* =====================================
   VARIABLE–VARIABLE (ALWAYS OK)
   ===================================== */

unifyTest(
    "x ≐ y",
    [getTerm("P(x)")],
    [getTerm("P(y)")],
    true,
    { x: getTerm("P(y)") }
);

/* =====================================
   FUNCTION DECOMPOSITION
   ===================================== */

unifyTest(
    "f(x) ≐ f(A)",
    [getTerm("P(f(x))")],
    [getTerm("P(f(A))")],
    true,
    { x: getTerm("P(A)") }
);

unifyTest(
    "mul(x,y) ≐ mul(A,E)",
    [getTerm("P(mul(x,y))")],
    [getTerm("P(mul(A,E))")],
    true,
    {
        x: getTerm("P(A)"),
        y: getTerm("P(E)")
    }
);

unifyTest(
    "function symbol clash",
    [getTerm("P(f(x))")],
    [getTerm("P(inv(x))")],
    false
);

/* =====================================
   MULTI-ARGUMENT CONSISTENCY
   ===================================== */

unifyTest(
    "f(x,x) ≐ f(A,A)",
    [getTerm("P(f(x,x))")],
    [getTerm("P(f(A,A))")],
    true,
    { x: getTerm("P(A)") }
);

unifyTest(
    "f(x,x) ≐ f(A,E) (fail)",
    [getTerm("P(f(x,x))")],
    [getTerm("P(f(A,E))")],
    false
);

/* =====================================
   OCCURS CHECK
   ===================================== */

unifyTest(
    "x ≐ f(x) (occurs check)",
    [getTerm("P(x)")],
    [getTerm("P(f(x))")],
    false
);

unifyTest(
    "indirect occurs x ≐ y, y ≐ f(x)",
    [getTerm("P(x)")],
    [getTerm("P(y)")],
    true,
    { x: getTerm("P(y)") }
);

/* =====================================
   SYSTEM CONSTANTS
   ===================================== */

unifyTest(
    "x ≐ SC0",
    [getTerm("P(x)")],
    [getTerm("P(SC0)")],
    true,
    { x: getTerm("P(SC0)") }
);

/* =====================================
   NO MUTATION ON FAILURE
   ===================================== */

(function () {
    const mapping = {};
    const success = unify(
        [getTerm("P(x)")],
        [getTerm("P(f(x))")],
        mapping
    );

    if (success || Object.keys(mapping).length !== 0) {
        console.error("❌ MAPPING MUTATED ON FAILURE");
    } else {
        console.log("✅ NO MUTATION ON FAILURE");
    }
})();


// Hard tests
unifyTest(
    "deep propagation f(x,g(y)) ≐ f(g(z),g(A))",
    [getTerm("P(f(x,g(y)))")],
    [getTerm("P(f(g(z),g(A)))")],
    true,
    {
        x: getTerm("P(g(z))"),
        y: getTerm("P(A)")
    }
);

unifyTest(
    "indirect occurs through chain x ≐ y, y ≐ z, z ≐ f(x)",
    [getTerm("P(x)")],
    [getTerm("P(y)")],
    false
);

unifyTest(
    "f(x,g(x)) ≐ f(A,g(B)) (fail)",
    [getTerm("P(f(x,g(x)))")],
    [getTerm("P(f(A,g(B)))")],
    false
);

unifyTest(
    "f(x,f(y,x)) ≐ f(A,f(B,A))",
    [getTerm("P(f(x,f(y,x)))")],
    [getTerm("P(f(A,f(B,A)))")],
    true,
    {
        x: getTerm("P(A)"),
        y: getTerm("P(B)")
    }
);

// unifyTest(
//     "late failure f(x,x) ≐ f(A,B)",
//     [getTerm("P(f(x,x)))")],
//     [getTerm("P(f(A,B)))")],
//     false
// );

unifyTest(
    "constant vs function A ≐ f(x)",
    [getTerm("P(A)")],
    [getTerm("P(f(x))")],
    false
);

unifyTest(
    "multi-pair interaction",
    [
        getTerm("P(f(x,y))"),
        getTerm("P(g(y))")
    ],
    [
        getTerm("P(f(A,z))"),
        getTerm("P(g(B))")
    ],
    true,
    {
        x: getTerm("P(A)"),
        y: getTerm("P(B)"),
        z: getTerm("P(B)")
    }
);

unifyTest(
    "hidden occurs after substitution",
    [getTerm("P(y)"), getTerm("P(x)")],
    [getTerm("P(x)"), getTerm("P(f(y))")],
    false
);

unifyTest(
    "Skolem constant consistency",
    [getTerm("P(f(SC0,x))")],
    [getTerm("P(f(SC0,A))")],
    true,
    { x: getTerm("P(A)") }
);

unifyTest(
    "large nested term",
    [getTerm("P(f(g(h(x)),g(y)))")],
    [getTerm("P(f(g(h(A)),g(B)))")],
    true,
    {
        x: getTerm("P(A)"),
        y: getTerm("P(B)")
    }
);

unifyTest(
    "mutual variable consistency",
    [getTerm("P(f(x,y))")],
    [getTerm("P(f(y,x))")],
    true,
    { x: getTerm("P(y)") }
);

unifyTest(
    "deep failure late",
    [getTerm("P(f(x,g(y),x))")],
    [getTerm("P(f(A,g(B),C))")],
    false
);
