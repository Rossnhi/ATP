// Test Tableaux Prover with actual KB proofs
// Run: node test_tableaux.js

const fs = require('fs');
const vm = require('vm');

// Load modules
const astCode = fs.readFileSync('scripts/AST.js', 'utf8');
const axSchemaCode = fs.readFileSync('scripts/AxiomSchema.js', 'utf8');
const folCode = fs.readFileSync('scripts/FOL.js', 'utf8');
const kbCode = fs.readFileSync('scripts/KB.js', 'utf8');

let context = { console, require };
vm.createContext(context);

vm.runInContext(astCode, context);
vm.runInContext(axSchemaCode, context);
vm.runInContext(folCode, context);
vm.runInContext(kbCode, context);

console.log("=== Tableaux Prover Tests ===\n");

function parseList(strs) {
  return strs.map(s => {
    const tokens = context.tokenizeFOL(s);
    return context.parseFOL(tokens);
  });
}

const tests = [
  {
    name: "Reflexivity",
    premises: [],
    goal: "a = a",
    description: "Every term equals itself"
  },
  {
    name: "Symmetry of Equality",
    premises: ["a = b"],
    goal: "b = a",
    description: "If a=b then b=a"
  },
  {
    name: "Left Identity Axiom",
    premises: [],
    goal: "∀x op(e, x) = x",
    description: "Identity property from KB"
  },
  {
    name: "Right Identity Axiom",
    premises: [],
    goal: "∀x op(x, e) = x",
    description: "Right identity from KB"
  },
  {
    name: "Identity Uniqueness",
    premises: ["∀x op(e1, x) = x", "∀x op(x, e2) = x"],
    goal: "e1 = e2",
    description: "If e1 and e2 are both identities, they're equal"
  },
  {
    name: "Associativity",
    premises: [],
    goal: "∀x ∀y ∀z op(op(x, y), z) = op(x, op(y, z))",
    description: "Associativity axiom from KB"
  }
];

try {
  const kb = context.setupGroupTheoryKB();
  let passCount = 0;

  for (let i = 0; i < tests.length; i++) {
    try {
      const premisesAST = parseList(tests[i].premises);
      const goalAST = context.parseFOL(context.tokenizeFOL(tests[i].goal));
      
      const result = context.proveGroupTheory(kb, premisesAST, goalAST);
      
      console.log(`Test ${i+1}: ${tests[i].name}`);
      console.log(`  ${tests[i].description}`);
      if (tests[i].premises.length > 0) {
        console.log(`  Premises: ${tests[i].premises.join(", ")}`);
      }
      console.log(`  Goal: ${tests[i].goal}`);
      
      if (result.success) {
        console.log(`  ✅ PROVED`);
        if (result.stats) {
          console.log(`  Stats: ${result.stats.instantiations} instantiations`);
        }
        passCount++;
      } else {
        console.log(`  ❌ NOT PROVED`);
        if (result.stats) {
          console.log(`  Stats: ${result.stats.instantiations} instantiations attempted`);
        }
      }
      console.log();
      
    } catch(e) {
      console.log(`Test ${i+1}: ${tests[i].name}`);
      console.log(`  ❌ ERROR: ${e.message}\n`);
    }
  }

  console.log(`=== Results: ${passCount}/${tests.length} proofs succeeded ===\n`);
  
} catch(e) {
  console.log("Error setting up KB:", e.message);
  console.log(e.stack);
}
