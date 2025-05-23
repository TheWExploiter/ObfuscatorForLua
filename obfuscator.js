document.getElementById("obfuscateBtn").addEventListener("click", () => {
  const inputCode = document.getElementById("inputCode").value;
  const maxSecurity = document.getElementById("maxSecurity").checked;
  const webhookUrl = document.getElementById("webhookUrl").value;
  const outputBox = document.getElementById("output");
  const downloads = document.getElementById("downloads");

  if (!inputCode.trim()) return alert("Paste some Lua code first!");

  let obfuscated = obfuscateLua(inputCode, maxSecurity);
  outputBox.value = obfuscated;

  // Send to webhook
  if (webhookUrl.trim().startsWith("http")) {
    fetch(webhookUrl.trim(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: obfuscated })
    }).catch(() => alert("Webhook failed."));
  }

  // Auto download if large
  if (obfuscated.length > 4000) {
    const blob = new Blob([obfuscated], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    downloads.innerHTML = `<a href="${url}" download="obfuscated_${Date.now()}.lua">Download Obfuscated File</a>`;
  } else {
    downloads.innerHTML = "";
  }
});

function obfuscateLua(code, maxSecurity) {
  let varMap = {}, varIndex = 0;
  const fakeJunkNames = ["_init", "_safe", "_core", "_loop", "_request", "_fire", "_hash", "_crypto", "_link"];
  const getRand = () => Math.random().toString(36).substring(2, 7);

  // Local var renaming
  code = code.replace(/local\s+([a-zA-Z_][a-zA-Z0-9_]*)/g, (match, varName) => {
    const newName = "_v" + (++varIndex) + getRand();
    varMap[varName] = newName;
    return `local ${newName}`;
  });
  for (const [k, v] of Object.entries(varMap)) {
    const regex = new RegExp(`\\b${k}\\b`, "g");
    code = code.replace(regex, v);
  }

  // String encoding
  code = code.replace(/"([^"]*)"/g, (_, str) => {
    const encoded = str.split("").map(c => "\\" + c.charCodeAt(0)).join("");
    return `"${encoded}"`;
  });

  // Add hidden junk
  let junkBlock = "";
  for (let i = 0; i < 5; i++) {
    const name = fakeJunkNames[Math.floor(Math.random() * fakeJunkNames.length)] + getRand();
    const val = Math.floor(Math.random() * 99999);
    junkBlock += `local ${name}="${val + Math.random().toFixed(5)}".."";`;
  }

  // Trap vars (never used but confuse analysis)
  junkBlock += `if not pcall(function() error("Fail "..math.random()) end) then end;`;

  // Fake API
  if (maxSecurity) {
    junkBlock += `pcall(function() game:GetService("${getRand().toUpperCase()}") end);`;
  }

  // Strip whitespace
  code = code.replace(/\s{2,}/g, " ").replace(/\n+/g, "");

  // Final wrap
  const wrapped = `--[[ This File Has Been Protected Using Lua Obfuscator ]]\n` +
    (maxSecurity ? `(function()${junkBlock}${code}end)()` : junkBlock + code);

  return wrapped;
}
