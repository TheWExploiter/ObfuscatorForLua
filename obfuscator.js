const XOR_KEY = 69;

function xorEncrypt(str, key) {
  return str
    .split('')
    .map(c => '\\' + (c.charCodeAt(0) ^ key))
    .join('');
}

function wrapLua(obfStr, options = {}) {
  const { constProtect = false, maxSecurity = false, antiTamper = false } = options;

  const versionCheckCode = maxSecurity ? `
if not (_VERSION:match("5%.3") or string.pack) then
  return
end
` : '';

  const antiTamperCode = antiTamper ? `
local function silentAntiTamper()
  local raw = "\\8\\4\\29\\12\\8\\16\\8\\19\\112"
  local decoded = raw:gsub("\\\\(%d+)", function(n)
    return string.char(bit.bxor(tonumber(n), ${XOR_KEY}))
  end)
  if decoded ~= "MAXIMUMV5" then
    return
  end
  return true
end

if not silentAntiTamper() then
  return
end
` : '';

  const constProtectCode = constProtect ? `
local function constantProtection()
  local dummy = {}
  setmetatable(dummy, {
    __index = function() error("Constant modification detected") end,
    __newindex = function() error("Constant modification detected") end
  })
  _G.CONST = dummy
end
constantProtection()
` : '';

  return `do local _ = "\\35\\36\\46\\32" end

${versionCheckCode}

local bit = bit32 or require("bit")

local function decode(str)
  return str:gsub("\\\\(%d+)", function(n)
    return string.char(bit.bxor(tonumber(n), ${XOR_KEY}))
  end)
end

${antiTamperCode}

${constProtectCode}

local f, err = loadstring(decode("${obfStr}"))
if not f then
  return
end

return f()
`;
}

function downloadFile(filename, content) {
  const blob = new Blob([content], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

async function sendWebhook(webhookUrl, data) {
  if (!webhookUrl.startsWith('http')) return;
  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ obfuscated: data }),
    });
    if (!res.ok) throw new Error('Webhook send failed');
    console.log('Webhook sent successfully');
  } catch (e) {
    console.warn('Webhook error:', e.message);
  }
}

document.getElementById('obfuscateBtn').addEventListener('click', async () => {
  const inputCodeRaw = document.getElementById('inputCode').value;
  if (!inputCodeRaw.trim()) {
    alert("Paste some Lua code first.");
    return;
  }

  const webhookUrl = document.getElementById('webhookUrl').value.trim();
  const constProtect = document.getElementById('constProtect').checked;
  const maxSecurity = document.getElementById('maxSecurity').checked;
  const antiTamper = document.getElementById('antiTamper').checked;

  // Split the input into lines
  const lines = inputCodeRaw.split('\n');

  // Detect if first line is the special comment to keep intact
  let headerLine = '';
  let codeToObfuscate = inputCodeRaw;
  if (lines.length > 0 && lines[0].trim().startsWith('-- This File Was')) {
    headerLine = lines[0];
    codeToObfuscate = lines.slice(1).join('\n');
  }

  const encrypted = xorEncrypt(codeToObfuscate, XOR_KEY);
  const finalCodeBody = wrapLua(encrypted, { constProtect, maxSecurity, antiTamper });

  // Put header line back on top if it existed
  const finalCode = headerLine
    ? headerLine + '\n' + finalCodeBody
    : finalCodeBody;

  document.getElementById('output').value = finalCode;

  downloadFile('obfuscated.lua', finalCode);

  if (webhookUrl) {
    await sendWebhook(webhookUrl, finalCode);
  }
});
