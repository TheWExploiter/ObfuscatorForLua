// Watermark for all obfuscated files
const watermark = `--[[This File Has Been Obfuscated By Z-Obfuscator]]--\n`;

// Lua Base64 decode function
const luaBase64Decoder = `
local b='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
function base64_decode(data)
  data = string.gsub(data, '[^'..b..'=]', '')
  return (data:gsub('.', function(x)
    if x == '=' then return '' end
    local r,f='',(b:find(x)-1)
    for i=6,1,-1 do r=r..(f%2^i - f%2^(i-1) > 0 and '1' or '0') end
    return r
  end):gsub('%d%d%d%d%d%d%d%d', function(x)
    local c=0
    for i=1,8 do c=c + (x:sub(i,i)=='1' and 2^(8-i) or 0) end
    return string.char(c)
  end))
end
`;

// Randomly encode string either Base64 or ASCII escape sequence
function encodeString(str) {
  if (Math.random() < 0.5) {
    // Base64 encode with runtime decode call
    return `base64_decode("${btoa(str)}")`;
  } else {
    // ASCII escape encoding like \65\66\67...
    const ascii = str.split('')
      .map(c => '\\\\' + c.charCodeAt(0))
      .join('');
    return `"${ascii}"`;
  }
}

function renameFunctions(code) {
  const functionPattern = /function\\s+(\\w+)/g;
  const functionMap = {};
  let funcCount = 0;

  return code.replace(functionPattern, (match, functionName) => {
    if (!functionMap[functionName]) {
      functionMap[functionName] = `_f${funcCount++}${Math.random().toString(36).substring(2, 6)}`;
    }
    return `function ${functionMap[functionName]}`;
  });
}

document.getElementById("obfuscateBtn").addEventListener("click", () => {
  const inputCode = document.getElementById("inputCode").value;
  const maxSecurity = document.getElementById("maxSecurity").checked;
  const webhookUrl = document.getElementById("webhookUrl").value;

  let obfuscated = inputCode;

  // Rename functions
  obfuscated = renameFunctions(obfuscated);

  // Rename variables
  const varPattern = /(?<=local\\s+)(\\w+)/g;
  const varMap = {};
  let varCount = 0;
  obfuscated = obfuscated.replace(varPattern, (match) => {
    if (!varMap[match]) {
      varMap[match] = `_v${varCount++}${Math.random().toString(36).substring(2, 6)}`;
    }
    return varMap[match];
  });

  // Encode strings (random Base64 or ASCII)
  obfuscated = obfuscated.replace(/"(.*?)"/g, (_, str) => encodeString(str));

  // Add watermark + base64 decoder + junk code on maxSecurity
  if (maxSecurity) {
    const junk = `
--[[ Anti-Tamper ]]
do
  local _a = 0
  for i=1,5 do _a = _a + i end
end
`;
    obfuscated = watermark + luaBase64Decoder + junk + obfuscated
      .split('\\n')
      .map(line => line.trim() ? `do ${line} end` : line)
      .join('\\n');
  } else {
    obfuscated = watermark + luaBase64Decoder + obfuscated;
  }

  // Output to textarea
  document.getElementById("output").value = obfuscated;

  // Create download link
  const blob = new Blob([obfuscated], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const downloadLink = document.createElement("a");
  downloadLink.href = url;
  downloadLink.download = "obfuscated.lua";
  downloadLink.textContent = "Download obfuscated.lua";
  const downloadsDiv = document.getElementById("downloads");
  downloadsDiv.innerHTML = '';
  downloadsDiv.appendChild(downloadLink);

  // Send to webhook if set
  if (webhookUrl) {
    fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: obfuscated })
    }).then(res => {
      if (res.ok) alert("Sent to webhook!");
      else alert("Webhook failed!");
    }).catch(() => alert("Webhook error!"));
  }
});
