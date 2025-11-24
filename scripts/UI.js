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

function handleOperators(e) {
  e.target.value = e.target.value
    .replace(/~|&|\||<=>|=>|<= |\\in|\\all|\\exists/g, m => ({
      "~": "\u00AC",
      "&": "\u2227",
      "|": "\u2228",
      "<=>": "\u27FA",
      "=>": "\u27F9",
      "<= ": "\u27F8 ",
      "\\in": "\u2208",
      "\\all": "\u2200",
      "\\exists": "\u2203"
    }[m]));
}

// Verify Tab

let verifyPremisesText = document.getElementById("verifyPremises");
verifyPremisesText.addEventListener("input", handleOperators);

let verifyConclusionText = document.getElementById("verifyConclusion");
verifyConclusionText.addEventListener("input", handleOperators);

let proofInpText = document.getElementById("proofInp");
proofInpText.addEventListener("input", handleOperators);
proofInpText.addEventListener("input", updateLineNumbers);
proofInpText.addEventListener("scroll", () => {
  lineNumbers.scrollTop = proofInpText.scrollTop;
});
proofInpText.addEventListener("keydown", (e) => {
  if (e.key === 'Tab') {
    e.preventDefault();
    const start = proofInpText.selectionStart;
    const end = proofInpText.selectionEnd;
    proofInpText.value = proofInpText.value.substring(0, start) + '\t' + proofInpText.value.substring(end);
    proofInpText.selectionStart = proofInpText.selectionEnd = start + 1;
  }
});

let verifyButton = document.getElementById("verifyButton");
verifyButton.addEventListener("click", handleVerify);

const lineNumbers = document.getElementById("proofLineNumbers");

function handleVerify() {
  let premises = verifyPremisesText.value.trim().split('\n').filter(line => line.length > 0);
  let premisesAST = [];
  for (let premise of premises) {
    premisesAST.push(parse(tokenize(premise)));
  }
  let conclusionsAST = verifyConclusionText.value.trim() != '' ? parse(tokenize(verifyConclusionText.value)) : null;
  let proofInput = proofInpText.value.split('\n').filter(line => line.length > 0);
  let proofInputAST = [];
  for (let proofLine of proofInput) {
    let tabCount = [...proofLine.matchAll(/\t/g)].length;
    let isAssumption = false;
    if (proofLine.trim().slice(0, 6) == "assume"){
      isAssumption = true;
      proofLine = proofLine.trim().slice(6);
    }
    proofInputAST.push([parse(tokenize(proofLine)), isAssumption, tabCount]);
  }
  data.premisesAST = premisesAST;
  data.conclusionsAST = conclusionsAST;
  data.mode = "verify";
  data.proofInput = proofInputAST;

  document.getElementById("verifier").value = "";
  verify();
  displayVerify();
}

function updateLineNumbers() {
  const lines = proofInpText.value.split('\n');
  lineNumbers.value = lines.map((_, idx) => idx + 1).join('\n');
  lineNumbers.style.height = proofInpText.offsetHeight + "px";
  lineNumbers.scrollTop = proofInpText.scrollTop;
}

// Prove Tab

let premisesText = document.getElementById("premises");
premisesText.addEventListener("input", handleOperators);

let conclusionText = document.getElementById("conclusion");
conclusionText.addEventListener("input", handleOperators);

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
  data.mode = "prove";

  removeAllChildNodes(document.getElementById("proof"));
  prove();
  displayProof();
}

// Helper
function removeAllChildNodes(parent) {
  while (parent.firstChild) {
    parent.removeChild(parent.firstChild);
  }
}

