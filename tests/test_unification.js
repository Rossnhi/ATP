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
    "indirect occurs via x ≐ y, y ≐ f(x)",
    [
        getTerm("P(x)"),
        getTerm("P(y)")
    ],
    [
        getTerm("P(y)"),
        getTerm("P(f(x))")
    ],
    false
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
    "indirect occurs via dependency chain x ≐ y, y ≐ z, z ≐ f(x)",
    [
        getTerm("P(x)"),
        getTerm("P(y)"),
        getTerm("P(z)")
    ],
    [
        getTerm("P(y)"),
        getTerm("P(z)"),
        getTerm("P(f(x))")
    ],
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
    { y: getTerm("P(x)") }
);

unifyTest(
    "deep failure late",
    [getTerm("P(f(x,g(y),x))")],
    [getTerm("P(f(A,g(B),C))")],
    false
);

/* =====================================
   ADDITIONAL ROBUST TESTS — ROUND 2
   ===================================== */

/* --- Variable permutation consistency --- */

unifyTest(
    "variable permutation f(x,y,z) ≐ f(y,z,x)",
    [getTerm("P(f(x,y,z))")],
    [getTerm("P(f(y,z,x))")],
    true,
    {
        y: getTerm("P(x)"),
        z: getTerm("P(x)")
    }
);

/* --- Independent variable bindings --- */

unifyTest(
    "independent variable bindings",
    [
        getTerm("P(f(x,A))"),
        getTerm("P(g(y,B))")
    ],
    [
        getTerm("P(f(C,A))"),
        getTerm("P(g(D,B))")
    ],
    true,
    {
        x: getTerm("P(C)"),
        y: getTerm("P(D)")
    }
);

/* --- Same variable forced equal by structure --- */

unifyTest(
    "same variable forced equal",
    [getTerm("P(f(x,x))")],
    [getTerm("P(f(y,z))")],
    true,
    {
        x: getTerm("P(y)"),
        z: getTerm("P(y)")
    }
);

/* --- Forced equality then occurs --- */

unifyTest(
    "forced equality leads to occurs",
    [
        getTerm("P(f(x,x))"),
        getTerm("P(y)")
    ],
    [
        getTerm("P(f(y,f(y)))"),
        getTerm("P(x)")
    ],
    false
);

/* --- Variable appears only after deep propagation --- */

unifyTest(
    "deep propagation exposes occurs",
    [
        getTerm("P(x)"),
        getTerm("P(f(y))")
    ],
    [
        getTerm("P(f(y))"),
        getTerm("P(f(x))")
    ],
    false
);

/* --- Non-occurring self reference through constants --- */

unifyTest(
    "safe self reference via constants",
    [
        getTerm("P(f(x,A))")
    ],
    [
        getTerm("P(f(B,A))")
    ],
    true,
    {
        x: getTerm("P(B)")
    }
);

/* --- Multiple equations constrain one variable --- */

unifyTest(
    "multiple constraints on one variable",
    [
        getTerm("P(f(x,A))"),
        getTerm("P(g(x))")
    ],
    [
        getTerm("P(f(B,A))"),
        getTerm("P(g(B))")
    ],
    true,
    {
        x: getTerm("P(B)")
    }
);

/* --- Conflict introduced late --- */

unifyTest(
    "late conflict after successful bindings",
    [
        getTerm("P(f(x,y))"),
        getTerm("P(y)")
    ],
    [
        getTerm("P(f(A,B))"),
        getTerm("P(C)")
    ],
    false
);

/* --- Variable binding inside nested argument --- */

unifyTest(
    "nested argument variable binding",
    [
        getTerm("P(f(g(x),h(y)))")
    ],
    [
        getTerm("P(f(g(A),h(B)))")
    ],
    true,
    {
        x: getTerm("P(A)"),
        y: getTerm("P(B)")
    }
);

/* --- Repeated variable under nesting --- */

unifyTest(
    "repeated variable under nesting",
    [
        getTerm("P(f(x,g(x)))")
    ],
    [
        getTerm("P(f(A,g(A)))")
    ],
    true,
    {
        x: getTerm("P(A)")
    }
);

/* --- Repeated variable mismatch under nesting --- */

unifyTest(
    "repeated variable mismatch under nesting",
    [
        getTerm("P(f(x,g(x)))")
    ],
    [
        getTerm("P(f(A,g(B)))")
    ],
    false
);

/* --- Variable-only cyclic system --- */

unifyTest(
    "pure variable cycle x ≐ y, y ≐ x",
    [
        getTerm("P(x)"),
        getTerm("P(y)")
    ],
    [
        getTerm("P(y)"),
        getTerm("P(x)")
    ],
    true,
    {
        y: getTerm("P(x)")
    }
);

/* --- Variable cycle with structure --- */

unifyTest(
    "variable cycle with structure",
    [
        getTerm("P(x)"),
        getTerm("P(y)")
    ],
    [
        getTerm("P(f(y))"),
        getTerm("P(x)")
    ],
    false
);

/* --- Disjoint function symbols deep --- */

unifyTest(
    "deep function symbol mismatch",
    [
        getTerm("P(f(g(x)))")
    ],
    [
        getTerm("P(f(h(x)))")
    ],
    false
);

/* --- Large arity consistency --- */

unifyTest(
    "large arity consistency",
    [
        getTerm("P(f(x,y,z,u))")
    ],
    [
        getTerm("P(f(A,B,C,D))")
    ],
    true,
    {
        x: getTerm("P(A)"),
        y: getTerm("P(B)"),
        z: getTerm("P(C)"),
        u: getTerm("P(D)")
    }
);

/* --- Large arity mismatch --- */

unifyTest(
    "large arity mismatch",
    [
        getTerm("P(f(x,y,z,u))")
    ],
    [
        getTerm("P(f(A,B,C))")
    ],
    false
);

unifyTest(
    "idempotence: chained variable bindings normalize",
    [
        getTerm("P(x)"),
        getTerm("P(y)")
    ],
    [
        getTerm("P(y)"),
        getTerm("P(A)")
    ],
    true,
    {
        x: getTerm("P(A)"),
        y: getTerm("P(A)")
    }
);

unifyTest(
    "idempotence under deep propagation",
    [
        getTerm("P(x)"),
        getTerm("P(y)"),
        getTerm("P(z)")
    ],
    [
        getTerm("P(y)"),
        getTerm("P(z)"),
        getTerm("P(A)")
    ],
    true,
    {
        x: getTerm("P(A)"),
        y: getTerm("P(A)"),
        z: getTerm("P(A)")
    }
);

unifyTest(
    "complex indirect occurs: length-5 dependency cycle with arity-3 functions",
    [
        getTerm("P(x1)"),
        getTerm("P(x2)"),
        getTerm("P(x3)"),
        getTerm("P(x4)"),
        getTerm("P(x5)")
    ],
    [
        getTerm("P(f(x2, A, B))"),
        getTerm("P(f(x3, C, D))"),
        getTerm("P(f(x4, E, F))"),
        getTerm("P(f(x5, G, H))"),
        getTerm("P(f(x1, I, J))")
    ],
    false
);

unifyTest(
    "extreme indirect occurs: deep hidden cycle with arity-3 and cross-links",
    [
        getTerm("P(x1)"),
        getTerm("P(x2)"),
        getTerm("P(x3)"),
        getTerm("P(x4)"),
        getTerm("P(x5)"),
        getTerm("P(x6)")
    ],
    [
        getTerm("P(f(x2, g(x3), A))"),
        getTerm("P(f(x3, g(x4), B))"),
        getTerm("P(f(x4, g(x5), C))"),
        getTerm("P(f(x5, g(x6), D))"),
        getTerm("P(f(x6, g(x1), E))"),
        getTerm("P(f(x1, g(x2), F))")
    ],
    false
);



