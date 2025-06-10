// Utils
function encodeBase64(str) {
  return btoa(str);
}

function generateRandomName(prefix = '_x') {
  return `${prefix}${Math.random().toString(36).substring(2, 8)}`;
}

function insertMiddle(original, insert) {
  const lines = original.split('\n');
  const mid = Math.floor(lines.length / 2);
  lines.splice(mid, 0, insert);
  return lines.join('\n');
}

// Rename functions
function renameFunctions(code) {
  const fnPattern = /function\s+(\w+)/g;
  const fnMap = {};
  let id = 0;

  return code.replace(fnPattern, (_, fnName) => {
    if (!fnMap[fnName]) {
      fnMap[fnName] = generateRandomName('_fn');
    }
    return `function ${fnMap[fnName]}`;
  });
}

// Rename locals
function renameLocals(code) {
  const varPattern = /(?<=local\s+)(\w+)/g;
  const varMap = {};
  let id = 0;

  return code.replace(varPattern, (match) => {
    if (!varMap[match]) {
      varMap[match] = generateRandomName('_v');
    }
    return varMap[match];
  });
}

// String obfuscation using Base64 with runtime decode
function obfuscateStrings(code) {
  return code.replace(/"(.*?)"/g, (_, str) => {
    const encoded = encodeBase64(str);
    return `${generateRandomName('_decode')}("${encoded}")`; // will be defined in inserted decoder
  });
}

// Insert stealthy decoder in the middle
function insertStealthDecoder(code) {
  const decoderFuncName = generateRandomName('_decode');
  const base64Var = generateRandomName('_b64chars');
  const decoderCode = `
-- stealth decoder injection
local ${base64Var}='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
function ${decoderFuncName}(data)
  data = string.gsub(data, '[^'..${base64Var}..'=]', '')
  return (data:gsub('.', function(x)
    if x == '=' then return '' end
    local r,f='',(${base64Var}:find(x)-1)
    for i=6,1,-1 do r=r..(f%2^i - f%2^(i-1) > 0 and '1' or '0') end
    return r
  end):gsub('%d%d%d%d%d%d%d%d', function(x)
    local c=0
    for i=1,8 do
      c=c + (x:sub(i,i)=='1' and 2^(8-i) or 0)
    end
    return string.char(c)
  end))
end
`;

  return {
    updatedCode: insertMiddle(code, decoderCode),
    decoderFuncName
  };
}

// Junk generator
function generateJunkCode(lines = 3) {
  let junk = '';
  for (let i = 0; i < lines; i++) {
    const a = generateRandomName('_j');
    const b = Math.floor(Math.random() * 100);
    junk += `local ${a} = ${b} * ${b}\n`;
  }
  return junk;
}

// OB main function
document.getElementById("obfuscateBtn").addEventListener("click", () => {
  const inputCode = document.getElementById("inputCode").value;
  const webhookUrl = document.getElementById("webhookUrl").value;
  const maxSecurity = document.getElementById("maxSecurity").checked;

  if (!inputCode.trim()) {
    alert("Please enter Lua code to obfuscate!");
    return; // Prevent obfuscation if no code is entered
  }

  let obfuscated = inputCode;

  obfuscated = renameFunctions(obfuscated);
  obfuscated = renameLocals(obfuscated);
  obfuscated = obfuscateStrings(obfuscated);

  const junkBefore = generateJunkCode(4);
  const junkAfter = generateJunkCode(4);

  const { updatedCode, decoderFuncName } = insertStealthDecoder(obfuscated);

  let finalCode = junkBefore + '\n' + updatedCode + '\n' + junkAfter;

  if (maxSecurity) {
    finalCode = finalCode.split('\n').map(line => {
      if (line.trim()) return `do ${line.trim()} end`;
      return '';
    }).join('\n');
  }

  // Hiding the main `print` function code by wrapping it in random junk
  finalCode = finalCode.replace(/print(.*?)/g, (match, code) => {
    const randomVar = generateRandomName('_printStealth');
    return `${randomVar}(${code})`;
  });

  document.getElementById("output").value = finalCode;

  // Download
  const blob = new Blob([finalCode], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const downloadLink = document.createElement("a");
  downloadLink.href = url;
  downloadLink.download = "obfuscated.lua";
  downloadLink.textContent = "Download obfuscated.lua";
  document.getElementById("downloads").innerHTML = '';
  document.getElementById("downloads").appendChild(downloadLink);

  // Webhook
  if (webhookUrl) {
    fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: finalCode })
    }).then(res => {
      if (res.ok) alert("Sent to webhook!");
      else alert("Webhook failed!");
    }).catch(() => alert("Webhook error!"));
  }
});
