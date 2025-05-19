function xorEncrypt(str, key) {
  return str
    .split('')
    .map(c => '\\' + (c.charCodeAt(0) ^ key))
    .join('');
}

function wrapLuaXor(obfStr, key) {
  return `-- This File Was Protected Using LuaU Obfuscator!
local xor_key = ${key}

(function(str)
  local dec = str:gsub("\\\\(%d+)", function(c)
    return string.char(tonumber(c) ~ xor_key)
  end)
  local f, err = loadstring(dec)
  if not f then error("Failed to decode: "..err) end
  return f()
end)("${obfStr}")
`;
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

  if (!input) {
    alert("Please paste some Lua code first.");
    return;
  }

  const encrypted = xorEncrypt(input, key);
  const finalCode = wrapLuaXor(encrypted, key);

  // Show result
  document.getElementById('output').value = finalCode;

  // Download file
  downloadFile('obfuscated.lua', finalCode);

  // Validate Lua code
  try {
    const simulated = input
      .split('')
      .map(c => String.fromCharCode(c.charCodeAt(0) ^ key))
      .join('');
    // Simulation: if input decodes to itself, success.
    if (!simulated.includes("print") && simulated.length < 5) {
      throw new Error("Decoded script looks suspiciously empty.");
    }
  } catch (err) {
    alert("⚠ Obfuscation may have failed to produce runnable code.");
  }

  // Optional webhook send
  if (webhook.startsWith("http")) {
    fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ obfuscated: finalCode })
    }).then(res => {
      if (!res.ok) throw new Error("Webhook send failed");
    }).catch(err => console.warn("Webhook Error:", err.message));
  }
});
