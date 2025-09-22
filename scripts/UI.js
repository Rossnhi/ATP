let data = window.appData = {};

let premisesText = document.getElementById("premises");
premisesText.addEventListener("input", handleOperators);

let conclusionText = document.getElementById("conclusion");
conclusionText.addEventListener("input", handleOperators);

function handleOperators(e) {
  e.target.value = e.target.value
  .replace(/~|&|\||<=>|=>|<= /g, m => ({
    "~": "\u00AC",
    "&": "\u2227",
    "|": "\u2228",
    "<=>": "\u27FA",
    "=>": "\u27F9",
    "<= ": "\u27F8 "
  }[m]));
}

let proveButton = document.getElementById("proveButton");
proveButton.addEventListener("click", handleProve);

function handleProve() {
  let premises = premisesText.value.trim().split('\n').filter(line => line.length > 0);
  let premisesAST = [];
  for (let premise of premises) {
    premisesAST.push(parse(tokenize(premise)));
  }
  let conclusionsAST = conclusionText.value.trim() != '' ?  parse(tokenize(conclusionText.value)) : null;
  data.premisesAST = premisesAST;
  data.conclusionsAST = conclusionsAST;
}