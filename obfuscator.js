document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("inputCode");
  const output = document.getElementById("output");
  const obfuscateBtn = document.getElementById("obfuscateBtn");
  const webhookUrl = document.getElementById("webhookUrl");
  const downloads = document.getElementById("downloads");

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

  function obfuscateLua(code) {
    const watermark = "--[[ This File Has Been Protected Using Lua Obfuscator ]]\n\n";
    const encoded = b64EncodeUnicode(code);
    const loaderVar = randomVar();
    const decodeFunc = randomVar();
    const chunkFunc = randomVar();
    const dummyVar = randomVar();
    const dummyFunc = randomVar();

    const obfuscated = `${watermark}local ${loaderVar} = '${encoded}'

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
    for i=1,8 do c=c + (x:sub(i,i)=='1' and 2^(8-i) or 0) end
    return string.char(c)
  end))
end

local function ${dummyFunc}()
  local ${dummyVar} = 0
  for i = 1, 10 do
    ${dummyVar} = ${dummyVar} + i
  end
  return ${dummyVar}
end

local ${chunkFunc} = loadstring(${decodeFunc}(${loaderVar}))
${chunkFunc}()`;

    return obfuscated;
  }

  obfuscateBtn.addEventListener("click", () => {
    const code = input.value;
    if (!code.trim()) return alert("No Lua code provided");
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
