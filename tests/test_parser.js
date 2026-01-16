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
   GROUP THEORY EXAMPLES
   =============================== */

test("∀x (*(x, inv(x)) = e)");                     // x * inv(x) = e
test("∀x ∀y ∀z (*(*(x,y),z) = *(x,*(y,z)))");    // (x*y)*z = x*(y*z)
test("∀x (*(e, x) = x)");                          // e * x = x
test("∀x ∃y (*(x,y) = e ∧ *(y,x) = e)");         // inverse exists

/* ===============================
   FUNCTION SYMBOLS
   =============================== */

test("inv(x)");                     // unary function (inverse)
test("inv(inv(x))");                // nested unary function
test("*(x,y)");                     // binary function (multiplication)
test("*(*(x,y),z)");                // nested multiplication

/* ===============================
   DEEPLY NESTED / COMPLEX
   =============================== */

test("P(f(g(h(x))))");              // deeply nested function
test("∀x∀y∀z P(x,y,z)");            // chained quantifiers (no spaces)
test("(∀x P(x))");                  // parenthesized quantified formula
test("((P(x) ∧ Q(y)))");            // extra parentheses
test("∀x (∀y (P(x,y)))");           // nested quantifiers with parens
test("∀x (P(x) ⟹ (∃y (Q(x,y) ∧ R(y))))");  // complex nesting
test("∃x ∀y (f(x)=f(y) ⟹ x=y)");    // function application in equality
test("∀x ∃y (f(y)=x ∧ ∀z (f(z)=x ⟹ z=y))");  // surjectivity-like formula

/* ===============================
   ADDITIONAL ERROR CASES
   =============================== */

test("∀x, P(x)", true);             // comma after quantifier variable
test("∃∃x P(x)", true);             // double quantifier
test("P(x) Q(x)", true);            // two predicates without connective
test("∀x P(x) ∀y Q(y)", true);      // adjacent quantifiers without nesting
test("f(x) P(x)", true);            // function followed by predicate with no connective
test("·(x,y)", true);               // dot not allowed (only * as special function symbol)
test("+(x,y)", true);               // plus not allowed (only * as special function symbol)

/* ===============================
   PARSER EXACT AST TESTS
   =============================== */

function parseEqualsTest(input, expected) {
   try {
      const ast = parseFOL(tokenize(input));
      const expectedAST = parseFOL(tokenize(expected));

      if (!ast.equals(expectedAST)) {
         console.error("❌ PARSER AST MISMATCH");
         console.error("  Input:    ", input);
         console.error("  Expected: ", expected);
         console.error("  Got AST:  ", ast);
         console.error("  Exp AST:  ", expectedAST);
      } else {
         console.log("✅ PARSER OK:", input);
      }
   } catch (e) {
      console.error("❌ PARSER ERROR");
      console.error("  Input:", input);
      console.error(e.message);
   }
}

/* ===============================
   ATOMIC FORMULAS
   =============================== */

parseEqualsTest(
   "P(x)",
   "P(x)"
);

parseEqualsTest(
   "f(x)=g(y)",
   "f(x)=g(y)"
);

parseEqualsTest(
   "x=y",
   "x=y"
);

/* ===============================
   FUNCTION NESTING
   =============================== */

parseEqualsTest(
   "f(g(x),h(y,z))",
   "f(g(x),h(y,z))"
);

parseEqualsTest(
   "*(*(x,y),z)",
   "*(*(x,y),z)"
);

/* ===============================
   CONNECTIVE STRUCTURE
   =============================== */

parseEqualsTest(
   "P(x) ∧ Q(y)",
   "(P(x) ∧ Q(y))"
);

parseEqualsTest(
   "P(x) ∨ Q(y)",
   "(P(x) ∨ Q(y))"
);

parseEqualsTest(
   "¬P(x)",
   "¬P(x)"
);

parseEqualsTest(
   "¬(P(x) ∧ Q(x))",
   "¬(P(x) ∧ Q(x))"
);

/* ===============================
   PRECEDENCE CORRECTNESS
   =============================== */

parseEqualsTest(
   "¬P(x) ∧ Q(x)",
   "(¬P(x) ∧ Q(x))"
);

parseEqualsTest(
   "P(x) ∧ Q(x) ∨ R(x)",
   "((P(x) ∧ Q(x)) ∨ R(x))"
);

parseEqualsTest(
   "P(x) ⟹ Q(x) ∧ R(x)",
   "(P(x) ⟹ (Q(x) ∧ R(x)))"
);

/* ===============================
   QUANTIFIER SCOPE
   =============================== */

parseEqualsTest(
   "∀x P(x)",
   "∀x P(x)"
);

parseEqualsTest(
   "∀x (P(x) ∧ Q(x))",
   "∀x (P(x) ∧ Q(x))"
);

parseEqualsTest(
   "∀x P(x) ∧ Q(x)",
   "((∀x P(x)) ∧ Q(x))"
);

parseEqualsTest(
   "∀x ∃y P(x,y)",
   "∀x ∃y P(x,y)"
);

/* ===============================
   NESTED QUANTIFIERS
   =============================== */

parseEqualsTest(
   "∀x (∀y P(x,y))",
   "∀x ∀y P(x,y)"
);

parseEqualsTest(
   "∃x ∀y (f(x)=f(y) ⟹ x=y)",
   "∃x ∀y (f(x)=f(y) ⟹ x=y)"
);

/* ===============================
   GROUP THEORY STRUCTURE
   =============================== */

parseEqualsTest(
   "∀x (*(e,x)=x)",
   "∀x (*(e,x)=x)"
);

parseEqualsTest(
   "∀x ∀y ∀z (*(*(x,y),z)=*(x,*(y,z)))",
   "∀x ∀y ∀z (*(*(x,y),z)=*(x,*(y,z)))"
);

parseEqualsTest(
   "∀x ∃y (*(x,y)=e ∧ *(y,x)=e)",
   "∀x ∃y (*(x,y)=e ∧ *(y,x)=e)"
);

/* ===============================
   PARENTHESIS NORMALIZATION
   =============================== */

parseEqualsTest(
   "(P(x))",
   "P(x)"
);

parseEqualsTest(
   "((P(x) ∧ Q(x)))",
   "(P(x) ∧ Q(x))"
);
