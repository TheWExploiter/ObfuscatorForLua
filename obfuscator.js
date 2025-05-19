function xorEncrypt(str, key) {
  return str
    .split('')
    .map(c => '\\' + (c.charCodeAt(0) ^ key))
    .join('');
}

function randomVar(length = 6) {
  return '_' + Math.random().toString(36).substring(2, 2 + length);
}

function generateAntiTamper(checkString, key) {
  const obf = xorEncrypt(checkString, key);
  return `
local tamperCheck = function()
  local _k = (${key} ~ 0)
  local raw = "${obf}"
  local check = raw:gsub("\\\\(%d+)", function(c)
    return string.char(tonumber(c) ~ _k)
  end)
  if check ~= "${checkString}" then
    error("Tampering Detected 🛡️")
  end
end
tamperCheck()
`;
}

function generateConstantsProtection(code) {
  return code.replace(/(["'])([^"']+)\1/g, function (_, quote, value) {
    if (value.length > 1 && isNaN(value)) {
      const encoded = value.split('').map(c => '\\' + c.charCodeAt(0)).join('');
      return `"${encoded}":gsub("\\\\(%d+)",function(c)return string.char(tonumber(c))end)`;
    }
    return quote + value + quote;
  });
}

function wrapLuaStealth(obfStr, key, opts = {}) {
  const funcName = randomVar();
  const keyDisguised = `(({5*${key}}/5) ~ 0)`;
  let antiTamperBlock = opts.antiTamper ? generateAntiTamper("MAXIMUMV5", key) : "";

  let main = `
--[[ This File Was Obfuscated with Lua Obfuscator! ]]
local ${funcName} = function(str)
  return str:gsub("\\\\(%d+)", function(n)
    return string.char(tonumber(n) ~ ${keyDisguised})
  end)
end

${antiTamperBlock}

local f, e = loadstring(${funcName}("${obfStr}"))
if not f then error("Script corrupt: "..e) end
return f()
`;

  if (opts.maxSecurity) {
    main = `do local v="${xorEncrypt("dummy", key)}" end\n` + main.replace(/return f\(\)/, "f()");
  }

  return main;
}

function downloadFile(filename, content) {
  const blob = new Blob([content], { type: 'text/plain' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

document.getElementById('obfuscateBtn').addEventListener('click', () => {
  const input = document.getElementById('inputCode').value;
  const webhook = document.getElementById('webhookUrl').value.trim();
  const key = 69;

  const opt_constProtect = document.getElementById('constProtect').checked;
  const opt_maxSecurity = document.getElementById('maxSecurity').checked;
  const opt_antiTamper = document.getElementById('antiTamper').checked;

  if (!input) return alert("Please paste Lua code.");

  let processed = input;

  if (opt_constProtect) {
    processed = generateConstantsProtection(processed);
  }

  const encrypted = xorEncrypt(processed, key);
  const finalCode = wrapLuaStealth(encrypted, key, {
    antiTamper: opt_antiTamper,
    maxSecurity: opt_maxSecurity
  });

  document.getElementById('output').value = finalCode;
  downloadFile('obfuscated.lua', finalCode);

  if (webhook.startsWith("http")) {
    fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ obfuscated: finalCode })
    }).catch(err => console.warn("Webhook Error:", err.message));
  }
});
