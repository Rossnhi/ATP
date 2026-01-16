/* ===============================
   BRANCH STRUCTURE CORRECTNESS TESTS
   =============================== */

function branchTest(name, fn) {
    try {
        fn();
        console.log("✅ BRANCH OK:", name);
    } catch (e) {
        console.error("❌ BRANCH FAILED:", name);
        console.error(e.message);
    }
}

/* ===============================
   BASIC BRANCH CREATION
   =============================== */

branchTest("empty branch initialization", () => {
    const b = new Branch(0, null);

    if (!b.open) throw new Error("branch should be open");
    if (b.formulasIndex.length !== 0) throw new Error("formulasIndex not empty");
    if (b.literals.length !== 0) throw new Error("literals not empty");
    if (Object.keys(b.subIndex).length !== 0) throw new Error("subIndex not empty");
});

/* ===============================
   ADDING NON-LITERAL FORMULA
   =============================== */

branchTest("add non-literal formula", () => {
    const b = new Branch(0, null);
    const f = parseFOL(tokenize("P(x) ∧ Q(x)"));

    b.add(f, "test");

    if (b.formulasIndex.length !== 1)
        throw new Error("formula not added");

    if (b.literals.length !== 0)
        throw new Error("non-literal added to literals");

    if (b.formulasIndex[0].expanded !== false)
        throw new Error("expanded flag should be false");
});

/* ===============================
   ADDING LITERAL FORMULA
   =============================== */

branchTest("add literal formula", () => {
    const b = new Branch(0, null);
    const f = parseFOL(tokenize("P(x)"));

    b.add(f, "test");

    if (b.formulasIndex.length !== 1)
        throw new Error("formula not added");

    if (b.literals.length !== 1)
        throw new Error("literal not recorded");

    if (!b.literals[0].literal.equals(f))
        throw new Error("stored literal mismatch");
});

/* ===============================
   isPresent() USES STRUCTURAL EQUALITY
   =============================== */

branchTest("isPresent uses .equals()", () => {
    const b = new Branch(0, null);
    const f1 = parseFOL(tokenize("P(x)"));
    const f2 = parseFOL(tokenize("P(x)"));

    b.add(f1, "test");

    if (!b.isPresent(f2))
        throw new Error("isPresent failed for structurally equal formula");
});

/* ===============================
   ITERATOR OVER FORMULAS
   =============================== */

branchTest("branch iterator yields all formulas", () => {
    const b = new Branch(0, null);
    const f1 = parseFOL(tokenize("P(x)"));
    const f2 = parseFOL(tokenize("Q(x)"));

    b.add(f1, "test");
    b.add(f2, "test");

    const collected = [];
    for (let mf of b) {
        collected.push(mf.formula);
    }

    if (collected.length !== 2)
        throw new Error("iterator did not yield all formulas");

    if (!collected[0].equals(f1) || !collected[1].equals(f2))
        throw new Error("iterator yielded wrong formulas");
});

/* ===============================
   CLONE CREATES INDEPENDENT COPY
   =============================== */

branchTest("clone creates independent branch", () => {
    const b1 = new Branch(0, null);
    const f = parseFOL(tokenize("P(x)"));

    b1.add(f, "test");
    b1.subIndex["x"] = "a";

    const b2 = b1.clone(1, b1);

    if (b2 === b1)
        throw new Error("clone is same object");

    if (b2.parent !== b1)
        throw new Error("parent not set correctly");

    if (!b2.formulasIndex[0].formula.equals(b1.formulasIndex[0].formula))
        throw new Error("formula not cloned correctly");

    // mutate clone and ensure original unchanged
    b2.subIndex["y"] = "b";

    if (b1.subIndex["y"] !== undefined)
        throw new Error("subIndex leaked across branches");
});

/* ===============================
   CLONE DOES NOT SHARE LITERALS
   =============================== */

branchTest("clone does not share literals array", () => {
    const b1 = new Branch(0, null);
    const f = parseFOL(tokenize("P(x)"));

    b1.add(f, "test");

    const b2 = b1.clone(1, b1);
    b2.literals.push({ literal: parseFOL(tokenize("Q(x)")), id: 1 });

    if (b1.literals.length !== 1)
        throw new Error("literals shared between branches");
});

/* ===============================
   EXPANSION INFO IS PRESENT
   =============================== */

branchTest("expansionInfo stored on formula entry", () => {
    const b = new Branch(0, null);
    const f = parseFOL(tokenize("P(x) ∧ Q(x)"));

    b.add(f, "test");

    const entry = b.formulasIndex[0];

    if (!entry.expansionInfo)
        throw new Error("expansionInfo missing");

    if (entry.expansionInfo.kind !== "alpha")
        throw new Error("incorrect expansionInfo kind");
});

/* ===============================
   DEEP CLONE: FORMULA OBJECTS
   =============================== */

branchTest("clone deep-copies formula ASTs", () => {
    const b1 = new Branch(0, null);
    const f = parseFOL(tokenize("P(x) ∧ Q(x)"));

    b1.add(f, "test");
    const b2 = b1.clone(1, b1);

    // mutate clone's formula AST
    b2.formulasIndex[0].formula.left = parseFOL(tokenize("R(x)"));

    // original must be unchanged
    const originalLeft = b1.formulasIndex[0].formula.left;
    if (!originalLeft.equals(parseFOL(tokenize("P(x)")))) {
        throw new Error("formula AST shared between branches");
    }
});

/* ===============================
   DEEP CLONE: LITERALS
   =============================== */

branchTest("clone deep-copies literals", () => {
    const b1 = new Branch(0, null);
    const f = parseFOL(tokenize("P(x)"));

    b1.add(f, "test");
    const b2 = b1.clone(1, b1);

    // mutate clone's literal
    b2.literals[0].literal = parseFOL(tokenize("Q(x)"));

    if (!b1.literals[0].literal.equals(parseFOL(tokenize("P(x)")))) {
        throw new Error("literal shared between branches");
    }
});

/* ===============================
   DEEP CLONE: SUBSTITUTION ENVIRONMENT
   =============================== */

branchTest("clone deep-copies substitution environment", () => {
    const b1 = new Branch(0, null);
    b1.subIndex["x"] = "a";

    const b2 = b1.clone(1, b1);

    b2.subIndex["y"] = "b";
    delete b2.subIndex["x"];

    if (b1.subIndex["y"] !== undefined) {
        throw new Error("subIndex mutation leaked to original");
    }

    if (b1.subIndex["x"] !== "a") {
        throw new Error("subIndex deletion leaked to original");
    }
});

/* ===============================
   DEEP CLONE: EXPANDED FLAGS
   =============================== */

branchTest("clone deep-copies expanded flags", () => {
    const b1 = new Branch(0, null);
    const f = parseFOL(tokenize("P(x) ∧ Q(x)"));

    b1.add(f, "test");
    b1.formulasIndex[0].expanded = true;

    const b2 = b1.clone(1, b1);

    b2.formulasIndex[0].expanded = false;

    if (b1.formulasIndex[0].expanded !== true) {
        throw new Error("expanded flag shared between branches");
    }
});

/* ===============================
   DEEP CLONE: FORMULAS ARRAY STRUCTURE
   =============================== */

branchTest("clone does not share formulasIndex array", () => {
    const b1 = new Branch(0, null);
    b1.add(parseFOL(tokenize("P(x)")), "test");

    const b2 = b1.clone(1, b1);
    b2.formulasIndex.push({
        formula: parseFOL(tokenize("Q(x)")),
        id: 1,
        justification: "test",
        expanded: false,
        expansionInfo: classify(parseFOL(tokenize("Q(x)")))
    });

    if (b1.formulasIndex.length !== 1) {
        throw new Error("formulasIndex array shared between branches");
    }
});

/* ===============================
   DEEP CLONE: formulasIndex FORMULAS
   =============================== */

branchTest("clone deep-copies formulasIndex formula ASTs", () => {
    const b1 = new Branch(0, null);
    const f = parseFOL(tokenize("P(x) ∧ Q(x)"));

    b1.add(f, "test");
    const b2 = b1.clone(1, b1);

    // Mutate deep inside clone's AST
    b2.formulasIndex[0].formula.left = parseFOL(tokenize("R(x)"));

    // Original must remain unchanged
    const original = b1.formulasIndex[0].formula.left;
    if (!original.equals(parseFOL(tokenize("P(x)")))) {
        throw new Error("formulasIndex formula AST shared between branches");
    }
});

/* ===============================
   DEEP CLONE: LITERALS ARRAY STRUCTURE
   =============================== */

branchTest("clone does not share literals array", () => {
    const b1 = new Branch(0, null);
    b1.add(parseFOL(tokenize("P(x)")), "test");

    const b2 = b1.clone(1, b1);
    b2.literals.push({ literal: parseFOL(tokenize("Q(x)")), id: 1 });

    if (b1.literals.length !== 1) {
        throw new Error("literals array shared between branches");
    }
});