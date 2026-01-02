// Direct Group Theory KB Test with actual prover
// Run: node test_kb_simple.js

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

console.log("=== Group Theory KB System ===\n");

try {
    let kb = context.setupGroupTheoryKB();
    
    console.log("✓ Knowledge Base created\n");
    console.log("Group Theory Axioms:");
    
    const axiomNames = kb.listAxioms();
    for (let axiomName of axiomNames) {
        console.log(`  • ${axiomName}`);
    }
    
    console.log("\n✅ Group Theory KB Ready for proving!\n");
    
    // Now test some simple proofs
    console.log("=== Testing Simple Proofs ===\n");
    
    function parseList(strs) {
      return strs.map(s => {
        const tokens = context.tokenizeFOL(s);
        return context.parseFOL(tokens);
      });
    }
    
    // Test 1: Reflexivity
    try {
      const goal = context.parseFOL(context.tokenizeFOL("a = a"));
      const result = context.proveGroupTheory(kb, [], goal);
      console.log("Test 1 - Reflexivity (a = a):");
      console.log(result.success ? "  ✅ PROVED" : "  ❌ NOT PROVED");
    } catch(e) {
      console.log("Test 1 - ERROR:", e.message);
    }
    
    // Test 2: Identity property
    try {
      const goal = context.parseFOL(context.tokenizeFOL("∀x op(e, x) = x"));
      const result = context.proveGroupTheory(kb, [], goal);
      console.log("\nTest 2 - Identity Property (∀x op(e, x) = x):");
      console.log(result.success ? "  ✅ PROVED" : "  ❌ NOT PROVED");
    } catch(e) {
      console.log("Test 2 - ERROR:", e.message);
    }
    
    // Test 3: Uniqueness of identity
    try {
      const premises = parseList(["∀x op(e1, x) = x", "∀x op(x, e2) = x"]);
      const goal = context.parseFOL(context.tokenizeFOL("e1 = e2"));
      const result = context.proveGroupTheory(kb, premises, goal);
      console.log("\nTest 3 - Uniqueness of Identity:");
      console.log("  Premises: e1 is left identity, e2 is right identity");
      console.log("  Goal: e1 = e2");
      console.log(result.success ? "  ✅ PROVED" : "  ❌ NOT PROVED");
    } catch(e) {
      console.log("Test 3 - ERROR:", e.message);
    }
    
} catch(e) {
    console.log("✗ Error:", e.message);
    console.log(e.stack);
}
