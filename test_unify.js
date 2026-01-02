// Unification Tests using actual prover
// Run: node test_unify.js

const fs = require('fs');
const vm = require('vm');

// Load modules
const astCode = fs.readFileSync('scripts/AST.js', 'utf8');
const folCode = fs.readFileSync('scripts/FOL.js', 'utf8');
const kbCode = fs.readFileSync('scripts/KB.js', 'utf8');

let context = { console, require };
vm.createContext(context);

vm.runInContext(astCode, context);
vm.runInContext(folCode, context);
vm.runInContext(kbCode, context);

console.log("=== Unification Algorithm Tests ===\n");

const tests = [
  {
    name: "Simple variable-constant",
    formula1: "x = a",
    formula2: "a = a",
    expectProve: true
  },
  {
    name: "Function application matching",
    formula1: "op(a, b) = op(a, b)",
    formula2: "op(a, b) = op(a, b)",
    expectProve: true
  },
  {
    name: "Commutativity check",
    premises: ["a = b"],
    goal: "b = a",
    expectProve: true
  },
  {
    name: "Nested function matching",
    formula1: "op(op(a, b), c) = op(op(a, b), c)",
    formula2: "op(op(a, b), c) = op(op(a, b), c)",
    expectProve: true
  },
  {
    name: "Complex expression with identity",
    premises: ["∀x op(e, x) = x"],
    goal: "op(e, a) = a",
    expectProve: true
  },
  {
    name: "Transitive equality",
    premises: ["a = b", "b = c"],
    goal: "a = c",
    expectProve: true
  }
];

let passCount = 0;

const kb = context.setupGroupTheoryKB();

for (let i = 0; i < tests.length; i++) {
  try {
    let premisesAST, goalAST;
    
    if (tests[i].premises) {
      // Test with explicit premises and goal
      premisesAST = tests[i].premises.map(p => {
        const tokens = context.tokenizeFOL(p);
        return context.parseFOL(tokens);
      });
      goalAST = context.parseFOL(context.tokenizeFOL(tests[i].goal));
    } else {
      // Simple equality formula test
      premisesAST = [context.parseFOL(context.tokenizeFOL(tests[i].formula1))];
      goalAST = context.parseFOL(context.tokenizeFOL(tests[i].formula2));
    }
    
    const result = context.proveGroupTheory(kb, premisesAST, goalAST);
    
    if (result.success === tests[i].expectProve) {
      console.log(`✓ Test ${i+1}: ${tests[i].name}`);
      if (tests[i].premises) {
        console.log(`  Premises: ${tests[i].premises.join(", ")}`);
        console.log(`  Goal: ${tests[i].goal}`);
      } else {
        console.log(`  ${tests[i].formula1}`);
      }
      console.log(`  Status: ${result.success ? "PROVED" : "NOT PROVEN"}`);
      passCount++;
    } else {
      console.log(`✗ Test ${i+1}: ${tests[i].name}`);
      console.log(`  Expected: ${tests[i].expectProve}, Got: ${result.success}`);
    }
    console.log();
    
  } catch(e) {
    console.log(`✗ Test ${i+1}: ${tests[i].name} - ERROR: ${e.message}\n`);
  }
}

console.log(`=== Unification Results: ${passCount}/${tests.length} passed ===\n`);
