(() => {
  if (window.top !== window || document.getElementById("xllm-host")) return;

  const host = document.createElement("div");
  host.id = "xllm-host";
  document.documentElement.appendChild(host);
  const root = host.attachShadow({ mode: "open" });

  root.innerHTML = `
  <style>
    :host { all: initial; }
    * { box-sizing: border-box; font-family: system-ui, -apple-system, sans-serif; }
    #fab { position: fixed; right: 20px; top: 50%; transform: translateY(-50%); width: 48px; height: 48px; border-radius: 50%;
      border: 1px solid #536471; background: #000; color: #fff; font-size: 20px; cursor: pointer; z-index: 2147483647; }
    #panel { position: fixed; right: 80px; top: 50%; transform: translateY(-50%); width: 380px; max-height: 70vh; display: none; flex-direction: column;
      background: #16181c; color: #e7e9ea; border: 1px solid #2f3336; border-radius: 16px; z-index: 2147483647;
      box-shadow: 0 8px 30px rgba(0,0,0,.5); overflow: hidden; }
    #panel.open { display: flex; }
    header { padding: 10px 14px; font-weight: 700; border-bottom: 1px solid #2f3336; display: flex; justify-content: space-between; }
    header button { background: none; border: 0; color: #71767b; cursor: pointer; font-size: 16px; }
    #log { flex: 1; overflow-y: auto; padding: 12px 14px; font-size: 14px; line-height: 1.45; white-space: pre-wrap; min-height: 120px; }
    .msg { margin-bottom: 10px; }
    .user { color: #8ecdf7; }
    .err { color: #f4212e; }
    .tools { padding: 0 14px 8px; display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
    .tools button, #send, .copy { border: 1px solid #536471; background: transparent; color: #e7e9ea; border-radius: 999px;
      padding: 5px 12px; cursor: pointer; font-size: 13px; }
    .tools button:hover, #send:hover, .copy:hover { background: #1d9bf0; border-color: #1d9bf0; }
    .tools input { width: 90px; background: #000; color: #e7e9ea; border: 1px solid #536471; border-radius: 8px; padding: 4px 8px; font-size: 13px; }
    .row { display: flex; gap: 6px; padding: 8px 14px 12px; border-top: 1px solid #2f3336; }
    textarea { flex: 1; resize: none; height: 56px; background: #000; color: #e7e9ea; border: 1px solid #536471; border-radius: 10px; padding: 8px; font-size: 14px; }
    .actions { margin-top: 6px; display: flex; gap: 6px; }
  </style>
  <button id="fab" title="X LLM Assistant">✦</button>
  <div id="panel">
    <header><span>X LLM Assistant</span><span><button id="gear" title="Settings (Base URL, model, API key)">⚙</button><button id="close">✕</button></span></header>
    <div id="log"></div>
    <div class="tools">
      <button id="sum">Summarize this post</button>
      <button id="tr">Translate my reply →</button>
      <input id="lang" title="Target language">
    </div>
    <div class="row">
      <textarea id="input" placeholder="Type your reply (any language) and press Translate, or ask a question about the post"></textarea>
      <button id="send">Ask</button>
    </div>
  </div>`;

  let port = null;
  let busy = false;
  let chatHistory = [];

  const $ = (id) => root.getElementById(id);
  const panel = $("panel"), log = $("log"), input = $("input"), lang = $("lang");

  chrome.storage.sync.get({ defaultLang: "English", summaryLang: "Chinese" }).then((c) => (lang.value = c.defaultLang));

  $("fab").onclick = () => panel.classList.toggle("open");
  $("close").onclick = () => panel.classList.remove("open");
  $("gear").onclick = () => chrome.runtime.sendMessage({ type: "openOptions" });

  // Pick the post being read: the main post on a /status page, else the one nearest the viewport centre.
  function getPostText() {
    const arts = [...document.querySelectorAll('article[data-testid="tweet"]')];
    if (!arts.length) return null;
    let art = arts[0];
    if (!/\/status\/\d+/.test(location.pathname)) {
      const mid = innerHeight / 2;
      art = arts.reduce((best, a) => {
        const r = a.getBoundingClientRect();
        const d = Math.abs((r.top + r.bottom) / 2 - mid);
        return d < best.d ? { a, d } : best;
      }, { a: arts[0], d: Infinity }).a;
    }
    const author = art.querySelector('[data-testid="User-Name"]')?.innerText.replace(/\n/g, " ") || "";
    const texts = [...art.querySelectorAll('[data-testid="tweetText"]')].map((t) => t.innerText).join("\n--- quoted post ---\n");
    return texts ? `Author: ${author}\n${texts}` : null;
  }

  function add(cls, text) {
    const d = document.createElement("div");
    d.className = "msg " + cls;
    d.textContent = text;
    log.appendChild(d);
    log.scrollTop = log.scrollHeight;
    return d;
  }

  function insertIntoReplyBox(text) {
    const box = document.querySelector('[data-testid="tweetTextarea_0"]');
    if (!box) { add("err", "Reply box not found. Click Reply on the post first, then try again."); return; }
    box.focus();
    document.execCommand("selectAll", false, null);
    document.execCommand("insertText", false, text);
  }

  function run(messages, label) {
    if (busy) return;
    busy = true;
    if (label) add("user", label);
    const out = add("", "…");
    let acc = "";
    port = chrome.runtime.connect({ name: "llm" });
    port.onMessage.addListener((m) => {
      if (m.type === "delta") { acc += m.text; if (!acc.trim()) return; acc = acc.replace(/^\s+/, ""); out.textContent = acc; log.scrollTop = log.scrollHeight; }
      if (m.type === "error") { out.className = "msg err"; out.textContent = m.text; finish(); }
      if (m.type === "done") {
        chatHistory = [...messages, { role: "assistant", content: acc }];
        const a = document.createElement("div");
        a.className = "actions";
        const copy = document.createElement("button");
        copy.className = "copy"; copy.textContent = "Copy";
        copy.onclick = () => navigator.clipboard.writeText(acc);
        const ins = document.createElement("button");
        ins.className = "copy"; ins.textContent = "Insert into reply box";
        ins.onclick = () => insertIntoReplyBox(acc);
        a.append(copy, ins);
        out.appendChild(a);
        finish();
      }
    });
    port.postMessage({ type: "chat", messages });
  }
  function finish() { busy = false; if (port) { try { port.disconnect(); } catch {} port = null; } }

  const SYS = "You are an assistant embedded in the X (Twitter) web interface. Be concise and accurate. Never invent facts that are not in the post.";

  $("sum").onclick = async () => {
    const post = getPostText();
    if (!post) return add("err", "No post found on this page.");
    const { summaryLang } = await chrome.storage.sync.get({ summaryLang: "Chinese" });
    run([
      { role: "system", content: SYS },
      { role: "user", content: `Summarize this post in ${summaryLang} in 2-4 sentences. If it is not in ${summaryLang}, include a faithful translation first.\n\n${post}` }
    ], "Summarize this post");
  };

  $("tr").onclick = () => {
    const draft = input.value.trim();
    if (!draft) return add("err", "Type your reply in the box first.");
    const post = getPostText();
    const target = lang.value.trim() || "English";
    run([
      { role: "system", content: SYS },
      { role: "user", content:
        `Translate my draft reply into ${target}. Keep my tone, meaning and any @mentions, hashtags, URLs and emoji. ` +
        `Output ONLY the translated text, nothing else.` +
        (post ? `\n\nFor context, I am replying to this post:\n${post}` : "") +
        `\n\nMy draft:\n${draft}` }
    ], `Translate to ${target}: ${draft}`);
    input.value = "";
  };

  $("send").onclick = () => {
    const q = input.value.trim();
    if (!q) return;
    const post = getPostText();
    const msgs = chatHistory.length
      ? [...chatHistory, { role: "user", content: q }]
      : [{ role: "system", content: SYS }, { role: "user", content: (post ? `Post I'm reading:\n${post}\n\n` : "") + q }];
    run(msgs, q);
    input.value = "";
  };

  // Keep X's keyboard shortcuts from firing while typing in the panel.
  host.addEventListener("keydown", (e) => e.stopPropagation(), true);
  host.addEventListener("keyup", (e) => e.stopPropagation(), true);
  host.addEventListener("keypress", (e) => e.stopPropagation(), true);
})();
