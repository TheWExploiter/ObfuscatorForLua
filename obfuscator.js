document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("inputCode");
  const output = document.getElementById("output");
  const obfuscateBtn = document.getElementById("obfuscateBtn");
  const webhookUrl = document.getElementById("webhookUrl");
  const downloads = document.getElementById("downloads");

  const watermark = "--[[ Obfuscated by Nugget & Maximum V5🔥🗿 ]]";

  function b64EncodeUnicode(str) {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode('0x' + p1)
    ));
  }

  function randomVar(length = 12) {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  function generateJunk(count = 3) {
    const junk = [];
    for (let i = 0; i < count; i++) {
      const varName = randomVar();
      const val = Math.floor(Math.random() * 9999);
      junk.push(`local ${varName} = ${val}`);
    }
    return junk.join("\n");
  }

  function generateFakeFunc() {
    const fname = randomVar();
    const v = randomVar();
    return `local function ${fname}()\n  local ${v} = 0\n  for i=1,10 do ${v} = ${v} + i end\n  return ${v}\nend`;
  }

  function obfuscateLua(code) {
    const encoded = b64EncodeUnicode(code);
    const lvar = randomVar();
    const decodeFunc = randomVar();
    const executeFunc = randomVar();
    const junkCode = generateJunk();
    const fakeFunc = generateFakeFunc();

    return `${watermark}

${junkCode}

${fakeFunc}

local ${lvar} = '${encoded}'

local function ${decodeFunc}(s)
  local b='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  s = string.gsub(s, '[^'..b..'=]', '')
  return (s:gsub('.', function(x)
    if (x == '=') then return '' end
    local r,f='',(b:find(x)-1)
    for i=6,1,-1 do r=r..(f%2^i - f%2^(i-1) > 0 and '1' or '0') end
    return r
  end):gsub('%d%d%d?%d?%d?%d?%d?%d?', function(x)
    if (#x ~= 8) then return '' end
    local c=0
    for i=1,8 do c = c + (x:sub(i,i)=='1' and 2^(8-i) or 0) end
    return string.char(c)
  end))
end

local function ${executeFunc}()
  local chunk = loadstring(${decodeFunc}(${lvar}))
  if chunk then
    chunk()
  else
    error("Execution failed. Are you trying to reverse this?")
  end
end

if math.random() > -1 then -- fake condition
  ${executeFunc}()
end
`;
  }

  obfuscateBtn.addEventListener("click", () => {
    const code = input.value.trim();
    if (!code) return alert("Paste some Lua code!");

    const obfuscated = obfuscateLua(code);
    output.value = obfuscated;

    const file = new Blob([obfuscated], { type: 'text/plain' });
    const url = URL.createObjectURL(file);
    downloads.innerHTML = `<a href="${url}" download="obfuscated.lua">Download Obfuscated File</a>`;

    const wh = webhookUrl.value.trim();
    if (wh) {
      fetch(wh, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "```lua\n" + obfuscated + "\n```" })
      });
    }
  });
});
