function xor(str, key = 69) {
  return str.split("")
    .map(c => "\\" + (c.charCodeAt(0) ^ key))
    .join("");
}

function luaXorDecryptor(key = 69) {
  return `
(function(...)return select(1,...)(({[true]=function(...)return select(1,...)(("\${lua_code}"):gsub(".",function(c)return string.char(c:byte() ~ ${key})end))end})[true],loadstring)end)(function(f)f()end)`;
}

function junkNoise(length = 8) {
  let noise = '';
  for (let i = 0; i < length; i++) {
    noise += `local _${Math.random().toString(36).substr(2, 5)} = "${Math.random().toString(36).substr(2)}"\n`;
  }
  return noise;
}

function fullObfuscateLua(luaCode, key = 69) {
  const xorEncrypted = xor(luaCode, key);
  const decryptor = luaXorDecryptor(key).replace("${lua_code}", xorEncrypted);
  const noise = junkNoise(5 + Math.floor(Math.random() * 10));
  return `-- Obfuscator++++++ V 1biö\n${noise}${decryptor}`;
}

function downloadFile(filename, content) {
  const blob = new Blob([content], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

document.getElementById('obfuscateBtn').onclick = () => {
  const input = document.getElementById('inputCode');
  const output = document.getElementById('output');
  const webhook = document.getElementById('webhookUrl').value;

  if (!input || !output) return alert('Missing input/output fields.');
  if (!input.value.trim()) return alert('Paste some Lua code first.');

  const luaCode = input.value.trim();
  const finalCode = fullObfuscateLua(luaCode);
  output.value = finalCode;
  downloadFile('obfuscated.lua', finalCode);

  if (webhook) {
    fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: 'Obfuscator++++++ V 1biö executed.',
        embeds: [{
          title: 'Original',
          description: '```lua\n' + luaCode.slice(0, 1900) + '\n```'
        }, {
          title: 'Obfuscated',
          description: '```lua\n' + finalCode.slice(0, 1900) + '\n```'
        }]
      })
    }).catch(console.error);
  }
};
