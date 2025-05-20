document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("inputCode");
  const output = document.getElementById("output");
  const obfuscateBtn = document.getElementById("obfuscateBtn");
  const webhookUrl = document.getElementById("webhookUrl");
  const downloads = document.getElementById("downloads");

  const watermark = "--[[ Obfuscated by Nugget & Maximum V5🔥🗿 ]]";

  function b64EncodeUnicode(str) {
    return btoa(unescape(encodeURIComponent(str)));
  }

  function randomVar(length = 12) {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  function generateJunk(count = 7) {
    const junk = [];
    for (let i = 0; i < count; i++) {
      const a = randomVar();
      const b = Math.floor(Math.random() * 99999);
      junk.push(`local ${a} = ${b}`);
    }
    return junk.join("\n");
  }

  function generateFakeFunc() {
    const fn = randomVar();
    const vn = randomVar();
    return `local function ${fn}()\n  local ${vn} = 1\n  for i=1,9 do ${vn} = ${vn} * i end\n  return ${vn}\nend`;
  }

  function obfuscateLua(code) {
    const firstEncode = b64EncodeUnicode(code);
    const doubleEncode = b64EncodeUnicode(firstEncode);
    const strVar = randomVar();
    const decodeFunc = randomVar();
    const runFunc = randomVar();
    const junk = generateJunk();
    const fake = generateFakeFunc();

    return `${watermark}

${junk}

${fake}

local ${strVar} = '${doubleEncode}'

local function ${decodeFunc}(s)
  local d='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  s = string.gsub(s, '[^'..d..'=]', '')
  return (s:gsub('.', function(c)
    if (c == '=') then return '' end
    local f = (d:find(c)-1)
    local r = ''
    for i=6,1,-1 do r=r..(f%2^i - f%2^(i-1) > 0 and '1' or '0') end
    return r
  end):gsub('%d%d%d?%d?%d?%d?%d?%d?', function(b)
    if #b ~= 8 then return '' end
    local c=0
    for i=1,8 do c = c + (b:sub(i,i)=='1' and 2^(8-i) or 0) end
    return string.char(c)
  end))
end

local function ${runFunc}()
  local l = loadstring(${decodeFunc}(${decodeFunc}(${strVar})))
  if l then l() else while true do end end
end

if tostring(os.time()):len() > 1 then
  ${runFunc}()
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
