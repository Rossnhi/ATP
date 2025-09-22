class MetaVar {
    constructor(name) {
        this.name = name;
        this.type = "metavar";
    }
}

function matchAxiomSchema(schema, ast, mapping = {}) {
    if (schema.type === "metavar") {
        // If this metavariable is already mapped, check for consistency
        if (mapping[schema.name]) {
            return mapping[schema.name].equals(ast);
        } else {
            mapping[schema.name] = ast;
            return true;
        }
    }
    if (schema.type !== ast.type) return false;
    switch (schema.type) {
        case "var":
            return schema.name === ast.name;
        case "not":
            return matchAxiomSchema(schema.expr, ast.expr, mapping);
        case "and":
        case "or":
        case "implies":
        case "iff":
            return (
                matchAxiomSchema(schema.left, ast.left, mapping) &&
                matchAxiomSchema(schema.right, ast.right, mapping)
            );
        default:
            return false;
    }
}


// TEST

const ast = parse(tokenize("(p ⟹ q) ⟹ q ⟹ p ⟹ q"));

// Example axiom schema AST:
const axiom1 = new Implies(
    new MetaVar("A"),
    new Implies(
        new MetaVar("B"),
        new MetaVar("A")
    )
);

const mapping = {};
const isAxiom = matchAxiomSchema(axiom1, ast, mapping);
console.log(isAxiom); // true
isAxiom && console.log(mapping); // { A: Var('p'), B: Var('q') }