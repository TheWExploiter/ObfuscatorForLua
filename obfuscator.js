function xorEncrypt(str, key) {
  return str
    .split('')
    .map(c => '\\' + (c.charCodeAt(0) ^ key))
    .join('');
}

function randomVar(length = 6) {
  return '_' + Math.random().toString(36).substring(2, 2 + length);
}

function generateLuaVersionCheck() {
  return `
if not _VERSION:match("5%.3") and not string.pack then
  error("Unsupported Lua version! Requires Lua 5.3+ or LuaU")
end
`;
}

function generateAntiTamper(checkStr, key) {
  const obf = xorEncrypt(checkStr, key);
  const varName = randomVar();
  return `
local function ${varName}()
  local raw = "${obf}"
  local decoded = raw:gsub("\\\\(%d+)", function(n)
    return string.char(tonumber(n) ~ ${key})
  end)
  if decoded ~= "${checkStr}" then
    error("⚠ Tampering Detected")
  end
end
${varName}()
`;
}

function generateConstantProtection(lua) {
  return lua.replace(/(["'])([^"']+)\1/g, (_, quote, val) => {
    if (val.length > 1 && isNaN(val)) {
      const enc = val.split('').map(c => '\\' + c.charCodeAt(0)).join('');
      return `"${enc}":gsub("\\\\(%d+)", function(c) return string.char(tonumber(c)) end)`;
    }
    return quote + val + quote;
  });
}

function wrapLuaCode(encrypted, key, opts) {
  const decoderVar = randomVar();
  let code = `
-- Protected by LuaU Obfuscator V5 🔐
${opts.versionCheck ? generateLuaVersionCheck() : ''}

local function ${decoderVar}(s)
  return s:gsub("\\\\(%d+)", function(n)
    return string.char(tonumber(n) ~ ${key})
  end)
end

${opts.antiTamper ? generateAntiTamper("MAXIMUMV5", key) : ''}

local f, err = loadstring(${decoderVar}("${encrypted}"))
if not f then error("Obfuscation error: "..err) end
return f()
`;

  if (opts.maxSecurity) {
    const dummy = randomVar();
    code = `do local ${dummy} = "${xorEncrypt("fake", key)}" end\n` + code;
  }

  return code;
}

function downloadFile(name, content) {
  const blob = new Blob([content], { type: 'text/plain' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = name;
  link.click();
}

document.getElementById('obfuscateBtn').addEventListener('click', () => {
  const input = document.getElementById('inputCode').value;
  const webhook = document.getElementById('webhookUrl').value.trim();
  const key = 69;

  const useConstProtect = document.getElementById('constProtect').checked;
  const useMaxSecurity = document.getElementById('maxSecurity').checked;
  const useAntiTamper = document.getElementById('antiTamper').checked;

  if (!input) {
    alert("⚠ Paste some Lua code first.");
    return;
  }

  let processed = input;

  if (useConstProtect) {
    processed = generateConstantProtection(processed);
  }

  const encrypted = xorEncrypt(processed, key);
  const finalCode = wrapLuaCode(encrypted, key, {
    antiTamper: useAntiTamper,
    maxSecurity: useMaxSecurity,
    versionCheck: true,
  });

  document.getElementById('output').value = finalCode;
  downloadFile("obfuscated.lua", finalCode);

  if (webhook.startsWith("http")) {
    fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ obfuscated: finalCode })
    }).catch(err => console.warn("Webhook error:", err));
  }
});
