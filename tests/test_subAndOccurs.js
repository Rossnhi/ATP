/* =====================================
   SUBSTITUTION & OCCURS — CORRECT TESTS
   ===================================== */

/*
 Helper: extract a term from a well-formed formula.
 We NEVER parse bare terms.
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

/* =====================================
   SUBSTITUTION TEST HARNESS
   ===================================== */

function substTest(name, termFormula, mappingFormulas, expectedFormula) {
    try {
        const term = getTerm(termFormula);

        const mapping = {};
        for (let v in mappingFormulas) {
            mapping[v] = getTerm(mappingFormulas[v]);
        }

        const result = substituteMapping(term, mapping);
        const expected = getTerm(expectedFormula);

        if (!result.equals(expected)) {
            console.error("❌ SUBSTITUTION FAILED:", name);
            console.error("  Term:     ", termFormula);
            console.error("  Mapping:  ", mappingFormulas);
            console.error("  Expected: ", expectedFormula);
            console.error("  Got:      ", result);
        } else {
            console.log("✅ SUBSTITUTION OK:", name);
        }
    } catch (e) {
        console.error("❌ ERROR IN SUBSTITUTION TEST:", name);
        console.error(e.message);
    }
}

/* =====================================
   OCCURS CHECK TEST HARNESS
   ===================================== */

function occursTest(name, variableFormula, termFormula, mappingFormulas, expected) {
    try {
        const variable = getTerm(variableFormula);

        const term = getTerm(termFormula);

        const mapping = {};
        for (let v in mappingFormulas) {
            mapping[v] = getTerm(mappingFormulas[v]);
        }

        const applied = substituteMapping(term, mapping);
        const result = occursCheck(variable, applied);

        if (result !== expected) {
            console.error("❌ OCCURS CHECK FAILED:", name);
            console.error("  Variable:", variableFormula);
            console.error("  Term:    ", termFormula);
            console.error("  Mapping: ", mappingFormulas);
            console.error("  Expected:", expected);
            console.error("  Got:     ", result);
        } else {
            console.log("✅ OCCURS CHECK OK:", name);
        }
    } catch (e) {
        console.error("❌ ERROR IN OCCURS TEST:", name);
        console.error(e.message);
    }
}

/* =====================================
   BASIC SUBSTITUTION
   ===================================== */

substTest(
    "single variable substitution",
    "P(x)",
    { x: "P(a)" },
    "P(a)"
);

substTest(
    "no substitution",
    "P(x)",
    {},
    "P(x)"
);

/* =====================================
   CHAIN SUBSTITUTION
   ===================================== */

substTest(
    "x → y → a",
    "P(x)",
    {
        x: "P(y)",
        y: "P(a)"
    },
    "P(a)"
);

substTest(
    "x → f(y), y → a",
    "P(x)",
    {
        x: "P(f(y))",
        y: "P(a)"
    },
    "P(f(a))"
);

/* =====================================
   FUNCTION SUBSTITUTION
   ===================================== */

substTest(
    "substitute inside function",
    "P(f(x,y))",
    {
        x: "P(a)",
        y: "P(b)"
    },
    "P(f(a,b))"
);

substTest(
    "partial substitution",
    "P(f(x,y))",
    {
        x: "P(a)"
    },
    "P(f(a,y))"
);

/* =====================================
   OCCURS CHECK — DIRECT
   ===================================== */

occursTest(
    "x occurs in x",
    "P(x)",
    "P(x)",
    {},
    true
);

occursTest(
    "x does not occur in f(y)",
    "P(x)",
    "P(f(y))",
    {},
    false
);

/* =====================================
   OCCURS CHECK — NESTED
   ===================================== */

occursTest(
    "x occurs in f(g(x))",
    "P(x)",
    "P(f(g(x)))",
    {},
    true
);

occursTest(
    "x does not occur in f(g(y))",
    "P(x)",
    "P(f(g(y)))",
    {},
    false
);

/* =====================================
   OCCURS CHECK — INDIRECT (CRITICAL)
   ===================================== */

occursTest(
    "indirect occurs via y → f(x)",
    "P(x)",
    "P(y)",
    {
        y: "P(f(x))"
    },
    true
);

occursTest(
    "no indirect occurs via y → f(a)",
    "P(x)",
    "P(y)",
    {
        y: "P(f(a))"
    },
    false
);

/* =====================================
   OCCURS CHECK — DEEP CHAIN
   ===================================== */

occursTest(
    "deep indirect occurs z → y → f(x)",
    "P(x)",
    "P(z)",
    {
        z: "P(y)",
        y: "P(f(x))"
    },
    true
);

occursTest(
    "deep chain no occurs",
    "P(x)",
    "P(z)",
    {
        z: "P(y)",
        y: "P(f(a))"
    },
    false
);
