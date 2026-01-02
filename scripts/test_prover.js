const fs = require('fs');
const vm = require('vm');

const astCode = fs.readFileSync('scripts/AST.js', 'utf8');
const axSchemaCode = fs.readFileSync('scripts/AxiomSchema.js', 'utf8');
const folCode = fs.readFileSync('scripts/FOL.js', 'utf8');
const kbCode = fs.readFileSync('scripts/KB.js', 'utf8');

let context = { console, require, setTimeout };
vm.createContext(context);

// Load AST, axiom schema, FOL and KB into the context
vm.runInContext(astCode, context);
vm.runInContext(axSchemaCode, context);
vm.runInContext(folCode, context);
vm.runInContext(kbCode, context);

function parseList(strs) {
  return strs.map(s => {
    const tokens = context.tokenizeFOL(s);
    return context.parseFOL(tokens);
  });
}

function runIdentityTest() {
  const premises = [
    '∀x op(e1, x) = x',
    '∀x op(x, e2) = x'
  ];
  const goal = 'e1 = e2';

  const premisesAST = parseList(premises);
  const goalAST = context.parseFOL(context.tokenizeFOL(goal));

  const kb = context.setupGroupTheoryKB();
  const res = context.proveGroupTheory(kb, premisesAST, goalAST);
  return { test: 'uniqueness_of_identity', result: res };
}

function runInverseTest() {
  const goal = '∀x ∀y ∀z ((op(x, y) = e ∧ op(x, z) = e) ⟹ y = z)';
  const goalAST = context.parseFOL(context.tokenizeFOL(goal));
  const kb = context.setupGroupTheoryKB();
  const res = context.proveGroupTheory(kb, [], goalAST);
  return { test: 'uniqueness_of_inverse', result: res };
}

(async () => {
  console.log('Running prover tests...');
  const idResult = runIdentityTest();
  console.log('\n=== Identity Test ===');
  console.log(JSON.stringify(idResult, null, 2));

  const invResult = runInverseTest();
  console.log('\n=== Inverse Test ===');
  console.log(JSON.stringify(invResult, null, 2));

  // Exit with non-zero if any test failed
  const allOk = idResult.result.success && invResult.result.success;
  process.exit(allOk ? 0 : 2);
})();