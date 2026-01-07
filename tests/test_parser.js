/* ===============================
   FOL PARSER TEST SUITE
   =============================== */

function test(input, shouldFail = false) {
    try {
        const tokens = tokenize(input);
        const ast = parseFOL(tokens);
        if (shouldFail) {
            console.error("❌ SHOULD HAVE FAILED:", input);
        } else {
            console.log("✅ OK:", input);
            console.log(ast);
        }
    } catch (e) {
        if (shouldFail) {
            console.log("✅ CORRECTLY FAILED:", input);
        } else {
            console.error("❌ UNEXPECTED FAILURE:", input);
            console.error(e.message);
        }
    }
}

/* ===============================
   BASIC TERMS
   =============================== */

test("x", true);                 // term alone (should fail unless propositional atoms allowed)
test("a", true);                 // constant
test("f(x)");
test("f(x,y)");
test("f(g(x),h(y,z))");

/* ===============================
   BASIC ATOMIC FORMULAS
   =============================== */

test("P(x)");
test("P(f(x))");
test("Q(x,y,z)");
test("f(x)=g(y)");
test("x=y");
test("f(x)=y");

/* ===============================
   LOGICAL CONNECTIVES
   =============================== */

test("P(x) ∧ Q(y)");
test("P(x) ∨ Q(y)");
test("¬P(x)");
test("¬(P(x) ∧ Q(x))");
test("P(x) ⟹ Q(x)");
test("P(x) ⟺ Q(x)");

/* ===============================
   PRECEDENCE TESTS
   =============================== */

test("¬P(x) ∧ Q(x)");        // should parse as (¬P(x)) ∧ Q(x)
test("¬(P(x) ∧ Q(x))");
test("P(x) ∧ Q(x) ∨ R(x)");  // (P ∧ Q) ∨ R
test("P(x) ⟹ Q(x) ∧ R(x)");  // P ⟹ (Q ∧ R)

/* ===============================
   QUANTIFIERS
   =============================== */

test("∀x P(x)");
test("∃x P(x)");
test("∀x ∃y P(x,y)");
test("∃x ∀y P(x,y)");
test("∀x (P(x) ⟹ Q(x))");
test("¬∀x P(x)");
test("∀x P(x) ∧ Q(x)");      // (∀x P(x)) ∧ Q(x)
test("∀x (P(x) ∧ Q(x))");

/* ===============================
   MIXED TERM / FORMULA STRUCTURE
   =============================== */

test("∀x (f(x)=g(x))");
test("∃x (P(f(x)) ∧ Q(x))");
test("∀x ∃y (f(x)=g(y) ⟹ R(x,y))");

/* ===============================
   ERROR CASES (MUST FAIL)
   =============================== */

test("P", true);             // bare predicate symbol
test("∀ P(x)", true);        // missing bound variable
test("∀x", true);            // quantifier without body
test("x P(x)", true);        // junk syntax
test("P(x", true);           // missing )
test("f(x,", true);          // malformed argument list
test("f(x y)", true);        // missing comma
test("∀x, P(x)", true);      // commas after quantifiers disallowed
test("P(x) =", true);        // incomplete equality
test("= P(x)", true);        // invalid equality

/* ===============================
   OPTIONAL (ONLY IF YOU ALLOW PROPOSITIONAL ATOMS)
   =============================== */

// Uncomment ONLY if bare atoms are allowed
// test("p");
// test("p ∧ ∀x P(x)");
