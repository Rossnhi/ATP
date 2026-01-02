// Test FOL Parser and Unification with actual prover
// Run: node test_fol.js

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

console.log("=== FOL Parser Tests ===\n");

// Test parsing various FOL formulas
const testCases = [
  { input: "P(x)", expected: "P(x)" },
  { input: "x = y", expected: "x = y" },
  { input: "op(x, y) = z", expected: "op(x, y) = z" },
  { input: "∀x P(x)", expected: "∀x P(x)" },
  { input: "∀x ∃y op(x, y) = e", expected: "∀x ∃y op(x, y) = e" },
  { input: "∀x ∀y ∀z op(op(x, y), z) = op(x, op(y, z))", expected: "∀x ∀y ∀z op(op(x, y), z) = op(x, op(y, z))" }
];

let passCount = 0;
for (let i = 0; i < testCases.length; i++) {
  try {
    const tokens = context.tokenizeFOL(testCases[i].input);
    const result = context.parseFOL(tokens);
    const str = context.formulaToStr(result);
    if (str === testCases[i].expected) {
      console.log(`✓ Test ${i+1}: ${testCases[i].input}`);
      passCount++;
    } else {
      console.log(`✗ Test ${i+1}: Got "${str}", expected "${testCases[i].expected}"`);
    }
  } catch(e) {
    console.log(`✗ Test ${i+1}: ${e.message}`);
  }
}

console.log(`\nParsing Tests: ${passCount}/${testCases.length} passed\n`);

// Test unification
console.log("=== Unification Tests ===\n");

const unifTestCases = [
  { 
    name: "Variable with constant",
    t1: "x",
    t2: "a",
    shouldUnify: true
  },
  {
    name: "Constant with itself",
    t1: "a",
    t2: "a",
    shouldUnify: true
  },
  {
    name: "Different constants",
    t1: "a",
    t2: "b",
    shouldUnify: false
  },
  {
    name: "Function applications",
    t1: "op(x, y)",
    t2: "op(a, b)",
    shouldUnify: true
  },
  {
    name: "Nested functions",
    t1: "op(op(x, y), z)",
    t2: "op(op(a, b), c)",
    shouldUnify: true
  }
];

let unifPass = 0;
for (let i = 0; i < unifTestCases.length; i++) {
  try {
    const t1 = context.parseTerm(context.tokenizeFOL(unifTestCases[i].t1));
    const t2 = context.parseTerm(context.tokenizeFOL(unifTestCases[i].t2));
    const subst = {};
    const result = context.unify(t1, t2, subst);
    
    const unified = (result !== null);
    if (unified === unifTestCases[i].shouldUnify) {
      console.log(`✓ Test ${i+1}: ${unifTestCases[i].name}`);
      if (unified) {
        console.log(`    ${unifTestCases[i].t1} ~ ${unifTestCases[i].t2}`);
      }
      unifPass++;
    } else {
      console.log(`✗ Test ${i+1}: ${unifTestCases[i].name} - expected ${unifTestCases[i].shouldUnify}, got ${unified}`);
    }
  } catch(e) {
    console.log(`✗ Test ${i+1}: ${e.message}`);
  }
}

console.log(`\nUnification Tests: ${unifPass}/${unifTestCases.length} passed\n`);

// Now test actual proofs using the group theory KB
console.log("=== Group Theory Proof Tests ===\n");

function parseList(strs) {
  return strs.map(s => {
    const tokens = context.tokenizeFOL(s);
    return context.parseFOL(tokens);
  });
}

try {
  const kb = context.setupGroupTheoryKB();
  
  // Test proving group properties
  const proofTests = [
    {
      name: "Reflexivity of equality",
      premises: [],
      goal: "a = a"
    },
    {
      name: "Left identity with constant",
      premises: [],
      goal: "∀x op(e, x) = x"
    },
    {
      name: "Identity uniqueness (simple)",
      premises: ["∀x op(e1, x) = x", "∀x op(x, e2) = x"],
      goal: "e1 = e2"
    }
  ];

  let provePass = 0;
  for (let i = 0; i < proofTests.length; i++) {
    try {
      const premisesAST = parseList(proofTests[i].premises);
      const goalAST = context.parseFOL(context.tokenizeFOL(proofTests[i].goal));
      
      const result = context.proveGroupTheory(kb, premisesAST, goalAST);
      
      if (result.success) {
        console.log(`✓ Test ${i+1}: ${proofTests[i].name}`);
        provePass++;
      } else {
        console.log(`✗ Test ${i+1}: ${proofTests[i].name} - not proven`);
      }
    } catch(e) {
      console.log(`✗ Test ${i+1}: ${e.message}`);
    }
  }
  
  console.log(`\nProof Tests: ${provePass}/${proofTests.length} passed\n`);
} catch(e) {
  console.log("Error setting up KB:", e.message);
}

console.log("=== All Tests Complete ===");

