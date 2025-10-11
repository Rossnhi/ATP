let data = window.appData = {};

let verifyBarHead = document.getElementById("verifyBar");
let proveBarHead = document.getElementById("proveBar");
verifyBarHead.addEventListener("click", handleTabClick);
proveBarHead.addEventListener("click", handleTabClick);

function handleTabClick(e) {
  const clickedTab = e.srcElement;
  if (clickedTab == verifyBarHead) {
    clickedTab.className = "tabHead selectedTab";
    proveBarHead.className = "tabHead";
    document.getElementById("verifyTab").style.display = "block";
    document.getElementById("proveTab").style.display = "none";
  }
  else {
    clickedTab.className = "tabHead selectedTab";
    verifyBarHead.className = "tabHead";
    document.getElementById("verifyTab").style.display = "none";
    document.getElementById("proveTab").style.display = "block";
  }
}
// Verify Tab
let proofInpText = document.getElementById("proofInp");
proofInpText.addEventListener("input", handleOperators);


// Prove Tab

let premisesText = document.getElementById("premises");
premisesText.addEventListener("input", handleOperators);

let conclusionText = document.getElementById("conclusion");
conclusionText.addEventListener("input", handleOperators);

function handleOperators(e) {
  e.target.value = e.target.value
  .replace(/~|&|\||<=>|=>|<=|\\in|\\all|\\exists/g, m => ({
    "~": "\u00AC",
    "&": "\u2227",
    "|": "\u2228",
    "<=>": "\u27FA",
    "=>": "\u27F9",
    "<= ": "\u27F8 ",
    "\\in" : "\u2208",
    "\\all" : "\u2200",
    "\\exists" : "\u2203"
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

  prove();
  displayProof();
}