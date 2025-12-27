# Automated Theorem Prover (ATP) for Group Theory

**Live Demo:** [https://rossnhi.github.io/ATP/](https://rossnhi.github.io/ATP/)

## Overview
This project is an **Automated Theorem Prover (ATP)** developed from scratch, designed to bridge the gap between abstract mathematical logic and computational implementation. Built using **JavaScript**, it provides an accessible **web-based interface** to visualize and execute proof searches in real-time.

The primary objective is to develop a specialized engine capable of handling the axiomatic structures of **Group Theory**. The system transitions from foundational propositional logic to a full **First-Order Logic (FOL)** engine using the Tableaux method, with future plans to integrate algebraic heuristics.

---

## Features

### 1. Interactive Web Interface
* **Real-time Execution:** Run and visualize proof constructions directly in the browser.
* **Accessibility:** No local installation required, leveraging a serverless deployment on GitHub Pages.

### 2. Propositional Logic Prover & Verifier
* **Inference Method:** Implemented using **Natural Deduction**.
* **Verification:** Includes a dedicated verifier to check the logical consistency of proof strings.
* **Generation:** Automatically generates proofs for valid propositional formulas.

### 3. First-Order Logic (FOL) Engine (In Progress)
* **Core Algorithm:** Independent implementation of the **Tableaux Algorithm**.
* **Tree Expansion:** Developing rules for handling quantifiers ($\forall, \exists$) and standard logical connectives.
* **Visual Representation:** Visualizes the expansion of the tableaux tree during the search for a contradiction.



### 4. Group Theory Specialization (Roadmap)
* **Axiom Integration:** Encoding fundamental group axioms (Identity, Inverse, Associativity) directly into the search space.
* **Graph-Theoretic Axioms:** Incorporating graph axioms to represent and simplify group relations and structures.
* **Heuristic Optimization:** Designing specific pruning strategies to efficiently prove theorems within algebraic domains.

---

## Technical Stack
* **Language:** JavaScript (ES6+)
* **Visualization:** HTML5 Canvas, CSS3, and P5.js
* **Logic Framework:** Natural Deduction and Tableaux Method.

---

## Project Roadmap
1. [x] **Phase 1:** Natural Deduction system for Propositional Logic.
2. [x] **Phase 2:** Propositional Verifier and interactive Web Interface.
3. [ ] **Phase 3:** Completion of the First-Order Logic (FOL) engine.
4. [ ] **Phase 4:** Implementation of specialized modules for Group Theory axioms and Graph interpretation.
5. [ ] **Phase 5:** Optimization of proof search heuristics for complex algebraic theorems.
