// Test KB with Group Theory Axioms

const fs = require('fs');
let codeAST = fs.readFileSync('./scripts/AST.js', 'utf8');
let codeFOL = fs.readFileSync('./scripts/FOL.js', 'utf8');
let codeKB = fs.readFileSync('./scripts/KB.js', 'utf8');

eval(codeAST);

function getPrecedence(type) {
    switch (type) {
        case "iff": return 1;
        case "implies": return 2;
        case "or": return 3;
        case "and": return 4;
        case "not": return 5;
        case "var": return 6;
        case "predicate": return 6;
        case "equality": return 6;
        case "forall": return 0;
        case "exists": return 0;
        default: return 0;
    }
}

eval(codeFOL);
eval(codeKB);

console.log("=== Knowledge Base & Group Theory Setup ===\n");

// Create group theory KB
try {
    let kb = setupGroupTheoryKB();
    
    console.log("✓ Knowledge Base created");
    console.log("\nAxioms loaded:");
    for (let axiomName of kb.listAxioms()) {
        console.log(`  • ${axiomName}`);
    }
    
    console.log("\n✓ Group Theory Axioms Summary:");
    console.log("  • Associativity: ∀x,y,z: op(op(x,y),z) = op(x,op(y,z))");
    console.log("  • Left Identity: ∀x: op(e,x) = x");
    console.log("  • Right Identity: ∀x: op(x,e) = x");
    console.log("  • Left Inverse: ∀x ∃y: op(y,x) = e");
    console.log("  • Right Inverse: ∀x ∃y: op(x,y) = e");
    console.log("  • Equality axioms (reflexive, symmetric, transitive, congruence)");
    
    console.log("\n✓ Group Theory KB ready for proving!");
} catch(e) {
    console.log("✗ Error:", e.message);
    console.log(e.stack);
}
