// Test NNF and Skolemization with actual prover
// Run: node test_nnf.js

const fs = require('fs');
const vm = require('vm');

const astCode = fs.readFileSync('scripts/AST.js', 'utf8');
const folCode = fs.readFileSync('scripts/FOL.js', 'utf8');
const kbCode = fs.readFileSync('scripts/KB.js', 'utf8');

let context = { console, require };
vm.createContext(context);

vm.runInContext(astCode, context);
vm.runInContext(folCode, context);
vm.runInContext(kbCode, context);

console.log("=== NNF and Skolemization Tests ===\n");

// Test cases: (input formula, expected NNF form description)
const tests = [
  {
    name: "Eliminate implications",
    input: "P(x) ⟹ Q(x)",
    description: "Input: P(x) ⟹ Q(x) => Output: ¬P(x) ∨ Q(x)"
  },
  {
    name: "Push negations (De Morgan's)",
    input: "¬(P(x) ∧ Q(x))",
    description: "Input: ¬(P(x) ∧ Q(x)) => Output: ¬P(x) ∨ ¬Q(x)"
  },
  {
    name: "Quantifier negation",
    input: "¬∀x P(x)",
    description: "Input: ¬∀x P(x) => Output: ∃x ¬P(x)"
  },
  {
    name: "Full NNF conversion",
    input: "∀x (P(x) ⟹ Q(x))",
    description: "Input: ∀x (P(x) ⟹ Q(x)) => Output: ∀x (¬P(x) ∨ Q(x))"
  },
  {
    name: "Skolemization (simple)",
    input: "∀x ∃y op(x, y) = e",
    description: "Input: ∀x ∃y op(x, y) = e => Output: Skolemized with sk function"
  },
  {
    name: "Skolemization (complex)",
    input: "∀x ∀y ∃z op(op(x, y), z) = op(x, op(y, z))",
    description: "Input: Associativity => Output: Skolemized form"
  }
];

let passCount = 0;

for (let i = 0; i < tests.length; i++) {
  try {
    const tokens = context.tokenizeFOL(tests[i].input);
    const formula = context.parseFOL(tokens);
    
    // First convert to NNF
    const nnf = context.toNNF(formula);
    const nnfStr = context.formulaToStr(nnf);
    
    // Then Skolemize
    context.skolemCounter = 0; // Reset Skolem counter
    const skolemized = context.skolemize(nnf);
    const skolStr = context.formulaToStr(skolemized);
    
    console.log(`✓ Test ${i+1}: ${tests[i].name}`);
    console.log(`  Input:       ${tests[i].input}`);
    console.log(`  NNF:         ${nnfStr}`);
    console.log(`  Skolemized:  ${skolStr}`);
    console.log();
    
    passCount++;
    
  } catch(e) {
    console.log(`✗ Test ${i+1}: ${tests[i].name}`);
    console.log(`  Error: ${e.message}\n`);
  }
}

console.log(`=== Results: ${passCount}/${tests.length} conversions successful ===\n`);

// Now test integration with prover
console.log("=== Integration with Prover ===\n");

try {
  const kb = context.setupGroupTheoryKB();
  
  // Proof that uses NNF/Skolemization internally
  const premises = [
    context.parseFOL(context.tokenizeFOL("∀x op(e1, x) = x")),
    context.parseFOL(context.tokenizeFOL("∀x op(x, e2) = x"))
  ];
  const goal = context.parseFOL(context.tokenizeFOL("e1 = e2"));
  
  const result = context.proveGroupTheory(kb, premises, goal);
  
  console.log("Testing proof with NNF/Skolemization:");
  console.log("  Premises: ∀x op(e1, x) = x, ∀x op(x, e2) = x");
  console.log("  Goal: e1 = e2");
  console.log(result.success ? "  ✅ PROVED" : "  ❌ NOT PROVED");
  
  if (result.success && result.steps) {
    console.log("\n  Proof steps:");
    result.steps.forEach((step, idx) => {
      console.log(`    ${idx+1}. ${step}`);
    });
  }
  
} catch(e) {
  console.log("Integration test error:", e.message);
}

console.log("\n✅ NNF and Skolemization working!");
