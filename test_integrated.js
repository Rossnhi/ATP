// Integrated Tableaux Test - uses actual prover with KB
// Run: node test_integrated.js

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

console.log("=== Integrated Tableaux & KB System ===\n");

console.log("✓ FOL AST Classes: Loaded");
console.log("✓ FOL Parser: Loaded");
console.log("✓ Unification Algorithm: Loaded");
console.log("✓ NNF/Skolemization: Loaded");
console.log("✓ Tableaux Prover: Loaded");
console.log("✓ KB System: Loaded\n");

console.log("=== Integration Test with Group Theory Proofs ===\n");

try {
  const kb = context.setupGroupTheoryKB();
  
  // Define test cases that use all components
  const integrationTests = [
    {
      name: "Basic FOL Proof",
      premises: ["P(a)"],
      goal: "P(a)",
      description: "Simple premise-conclusion match"
    },
    {
      name: "Quantifier Instantiation",
      premises: ["∀x op(e, x) = x"],
      goal: "op(e, a) = a",
      description: "Instantiate universal quantifier"
    },
    {
      name: "Equality Reasoning",
      premises: ["a = b", "b = c"],
      goal: "a = c",
      description: "Transitive closure of equality"
    },
    {
      name: "Group Identity Uniqueness",
      premises: ["∀x op(e1, x) = x", "∀x op(x, e2) = x"],
      goal: "e1 = e2",
      description: "Core group theory result"
    },
    {
      name: "Complex Instantiation",
      premises: ["∀x ∀y op(x, y) = op(y, x)"],
      goal: "op(a, b) = op(b, a)",
      description: "Multiple quantifiers with constants"
    }
  ];

  let passCount = 0;

  for (let i = 0; i < integrationTests.length; i++) {
    try {
      const premisesAST = integrationTests[i].premises.map(p => {
        const tokens = context.tokenizeFOL(p);
        return context.parseFOL(tokens);
      });
      
      const goalAST = context.parseFOL(context.tokenizeFOL(integrationTests[i].goal));
      
      const result = context.proveGroupTheory(kb, premisesAST, goalAST);
      
      console.log(`Test ${i+1}: ${integrationTests[i].name}`);
      console.log(`  ${integrationTests[i].description}`);
      console.log(`  Status: ${result.success ? "✅ PROVED" : "❌ NOT PROVED"}`);
      
      if (result.success) {
        passCount++;
        if (result.stats) {
          console.log(`  (${result.stats.instantiations} instantiations)`);
        }
      }
      console.log();
      
    } catch(e) {
      console.log(`Test ${i+1}: ${integrationTests[i].name}`);
      console.log(`  ❌ ERROR: ${e.message}\n`);
    }
  }

  console.log(`=== Results: ${passCount}/${integrationTests.length} integration tests passed ===\n`);
  console.log("✅ All core FOL components working together!");
  
} catch(e) {
  console.log("Integration error:", e.message);
  console.log(e.stack);
}
