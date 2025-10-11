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

function subAxiomSchema(schema, mapping) {
    if (schema.type === "metavar") {
        // Substitute with the mapped formula, or leave as is if not found
        return mapping[schema.name].clone();
    }
    if (schema.type === "not") {
        return new Not(subAxiomSchema(schema.expr, mapping));
    }
    if (schema.type === "and") {
        return new And(
            subAxiomSchema(schema.left, mapping),
            subAxiomSchema(schema.right, mapping)
        );
    }
    if (schema.type === "or") {
        return new Or(
            subAxiomSchema(schema.left, mapping),
            subAxiomSchema(schema.right, mapping)
        );
    }
    if (schema.type === "implies") {
        return new Implies(
            subAxiomSchema(schema.left, mapping),
            subAxiomSchema(schema.right, mapping)
        );
    }
    if (schema.type === "iff") {
        return new Iff(
            subAxiomSchema(schema.left, mapping),
            subAxiomSchema(schema.right, mapping)
        );
    }
    // If schema type is not recognized, return as is
    return schema;
}

// TEST



// Example axiom schema AST:
const axiom1 = new Implies(
    new MetaVar("A"),
    new Implies(
        new MetaVar("B"),
        new MetaVar("A")
    )
);


// Test - Match Axiom Schema
// const ast = parse(tokenize("(p ⟹ q) ⟹ q ⟹ p ⟹ q"));
// const mapping = {};
// const isAxiom = matchAxiomSchema(axiom1, ast, mapping);
// console.log(isAxiom); // true
// isAxiom && console.log(mapping); // { A: Var('p'), B: Var('q') }

// Text - Sub Axiom Schema
//console.log(subAxiomSchema(axiom1, {A : new Implies( new Var("p"), new Var("q")), B : new Var("q")}));