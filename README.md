# Automated Theorem Prover (ATP) for Group Theory

**Live Demo:** https://rossnhi.github.io/ATP/

## Overview
This project is an **Automated Theorem Prover (ATP)** developed from scratch, designed to bridge the gap between abstract mathematical logic and computational implementation. Built using **JavaScript**, it provides an accessible **web-based interface** to visualize and execute proof searches in real-time.

The primary objective is to develop a specialized engine capable of handling the axiomatic structures of **Group Theory**. The system transitions from foundational propositional logic to a full **First-Order Logic (FOL)** engine using the Tableaux method, with future plans to integrate algebraic heuristics.

---

## Features

### 1. Interactive Web Interface
- **Real-time Execution:** Run and visualize proof constructions directly in the browser.
- **Accessibility:** No local installation required, leveraging a serverless deployment on GitHub Pages.

### 2. Propositional Logic Prover & Verifier
- **Inference Method:** Implemented using **Natural Deduction**.
- **Verification:** Includes a dedicated verifier to check the logical consistency of proof strings.
- **Generation:** Automatically generates proofs for valid propositional formulas.

### 3. First-Order Logic (FOL) Engine (In Progress)
- **Core Algorithm:** Independent implementation of the **Tableaux Algorithm**.
- **Tree Expansion:** Developing rules for handling quantifiers (∀, ∃) and standard logical connectives.
- **Visual Representation:** Visualizes the expansion of the tableaux tree during the search for a contradiction.

### 4. Group Theory Specialization (Roadmap)
- **Axiom Integration:** Encoding fundamental group axioms (Identity, Inverse, Associativity).
- **Graph-Theoretic Axioms:** Representing and simplifying group relations.
- **Heuristic Optimization:** Domain-specific pruning strategies.

---

## Usage & Input Syntax

### Logical Connectives (Required)
- NOT: ~
- AND: &
- OR: |
- IMPLIES: =>
- IFF: <=>

Parentheses ( ) must be used to disambiguate expressions.

---

## PROOF GENERATION (Forward Reasoning)

Enter premises line by line.  
The prover derives the conclusion automatically.

Example 1  
Premises:
p  
p => q  
(p => q) => q => r  

Conclusion:  
r

---

Example 2  
Premises:
p & q  
p => r  
(p => r) => r => s  
s => q => t  

Conclusion:  
t

---

Example 3  
Premises:
p & q  
p => r  
q & r => t  

Conclusion:  
t

---

Example 4  
Premises:
p & q  
p => r  
(r => s) => s => t  
q => r => s  

Conclusion:  
t

---

Example 5  
Premises:
p & q  
p => r  
(r => s) => s => t  
q => r => s  
s & t => u  

Conclusion:  
u

---

Example 6 (Mathematical Reasoning)  
Premises:
n is even  
n is even => n^2 is even  
m is even  
m is even => m^2 is even  
(n^2 is even & m^2 is even) => n^2 + m^2 is even  

Conclusion:  
n^2 + m^2 is even

---

## PROOF VERIFICATION (Natural Deduction)

Proofs are written using explicit assumptions and indentation with tabs. 
Indentation is shown using tree-style structure.

---

### Verification Example 1

p => q => r  
assume p => q  
└─ assume p  
└──└─ q => r  
└──└─ q  
└──└─ r  
└─ p => r  
(p => q) => (p => r)

---

### Verification Example 2

(p & q) => r  
(p & s) => t  
assume p  
└─ assume q | s  
└──└─ assume q  
└──└──└─ p & q  
└──└──└─ r  
└──└──└─ r | t  
└──└─ q => (r | t)  
└──└─ assume s  
└──└──└─ p & s  
└──└──└─ t  
└──└──└─ r | t  
└──└─ s => (r | t)  
└──└─ r | t  
(q | s) => (r | t)  
p => ((q | s) => (r | t))

---

### Verification Example 3

assume p  
└─ assume q  
└──└─ assume r  
└──└──└─ assume s  
└──└──└──└─ p & s  
└──└──└─ s => (p & s)  
└──└─ r => (s => (p & s))  
└─ q => (r => (s => (p & s)))  
p => (q => (r => (s => (p & s))))



## Notes
- Variables are usually single letters (p, q, r), but descriptive atoms are supported.
- Proofs are indentation-sensitive, use tabs for indentation. The tree structure shown here is only for visual understanding.
- Each `assume` opens a subproof.
- The final line must match the claimed conclusion.

---

## Technical Stack
- **Language:** JavaScript (ES6+)
- **Visualization:** HTML5 Canvas, CSS3, P5.js
- **Logic Framework:** Natural Deduction and Tableaux Method

---

## Project Roadmap
1. [x] Phase 1: Natural Deduction for Propositional Logic
2. [x] Phase 2: Propositional Verifier and Web Interface
3. [ ] Phase 3: Complete FOL Engine
4. [ ] Phase 4: Group Theory Axiom Modules
5. [ ] Phase 5: Proof Search Optimization
