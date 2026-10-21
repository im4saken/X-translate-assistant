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
    #fab { position: fixed; left: 0; top: 0; touch-action: none; user-select: none; width: 48px; height: 48px; border-radius: 50%;
      border: 1px solid #536471; background: #000; color: #fff; font-size: 20px; cursor: grab; z-index: 2147483647; }
    #fab.drag { cursor: grabbing; }
    #panel { position: fixed; left: 0; top: 0; width: 380px; max-height: 70vh; display: none; flex-direction: column;
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
    [hidden] { display: none !important; }
    .tools select { max-width: 150px; background: #000; color: #e7e9ea; border: 1px solid #536471; border-radius: 8px; padding: 4px 6px; font-size: 13px; }
    .tools input { width: 130px; background: #000; color: #e7e9ea; border: 1px solid #536471; border-radius: 8px; padding: 4px 8px; font-size: 13px; }
    .row { display: flex; gap: 6px; padding: 8px 14px 12px; border-top: 1px solid #2f3336; }
    textarea { flex: 1; resize: none; height: 56px; background: #000; color: #e7e9ea; border: 1px solid #536471; border-radius: 10px; padding: 8px; font-size: 14px; }
    .actions { margin-top: 6px; display: flex; gap: 6px; }
  </style>
  <button id="fab" title="X Translate Assistant">✦</button>
  <div id="panel">
    <header><span>X Translate Assistant</span><span><button id="clear" title="Clear all messages and start over" style="font-size:13px">Clear</button><button id="gear" title="Settings (Base URL, model, API key)">⚙</button><button id="close">✕</button></span></header>
    <div id="log"></div>
    <div class="tools">
      <button id="sum">Summarize this post</button>
      <button id="tr">Translate my reply →</button>
      <select id="lang" title="Target language for Translate"></select>
      <input id="langOther" hidden placeholder="Language, e.g. Swahili">
    </div>
    <div class="row">
      <textarea id="input" placeholder="Type your reply (any language) and press Translate, or ask a question about the post"></textarea>
      <button id="send">Ask</button>
    </div>
  </div>`;

  let port = null;
  let busy = false;
  let chatHistory = [];
  let historyPath = "";

  const $ = (id) => root.getElementById(id);
  const panel = $("panel"), log = $("log"), input = $("input"), lang = $("lang"), langOther = $("langOther");

  let getLang = () => lang.value;
  const initLang = (value) => {
    getLang = xllmLangControl(lang, langOther, value, () => {
      const v = getLang();
      if (v) chrome.storage.sync.set({ defaultLang: v });
    });
  };
  chrome.storage.sync.get({ defaultLang: "English" }).then((c) => initLang(c.defaultLang), () => initLang("English"));

  // Floating button: draggable, position remembered (stored as viewport fractions).
  const fab = $("fab"), FAB = 48, MARGIN = 8;
  let pos = { fx: null, fy: 0.5 };

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  function placeFab() {
    const x = pos.fx == null ? innerWidth - FAB - 20 : pos.fx * innerWidth;
    const y = pos.fy * innerHeight;
    fab.style.left = clamp(x, MARGIN, innerWidth - FAB - MARGIN) + "px";
    fab.style.top = clamp(y, MARGIN, innerHeight - FAB - MARGIN) + "px";
    placePanel();
  }

  function placePanel() {
    const r = fab.getBoundingClientRect();
    const w = panel.offsetWidth || 380, h = panel.offsetHeight || 0;
    const left = r.left + FAB / 2 < innerWidth / 2 ? r.right + 12 : r.left - 12 - w;
    panel.style.left = clamp(left, MARGIN, Math.max(MARGIN, innerWidth - w - MARGIN)) + "px";
    panel.style.top = clamp(r.top + FAB / 2 - h / 2, MARGIN, Math.max(MARGIN, innerHeight - h - MARGIN)) + "px";
  }

  chrome.storage.local.get({ fabPos: null }).then((c) => {
    if (c.fabPos) pos = c.fabPos;
    placeFab();
  });
  placeFab();
  addEventListener("resize", placeFab);

  let drag = null;
  fab.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    const r = fab.getBoundingClientRect();
    drag = { dx: e.clientX - r.left, dy: e.clientY - r.top, sx: e.clientX, sy: e.clientY, moved: false };
    fab.setPointerCapture(e.pointerId);
  });
  fab.addEventListener("pointermove", (e) => {
    if (!drag) return;
    if (!drag.moved && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 5) return;
    drag.moved = true;
    fab.classList.add("drag");
    const x = clamp(e.clientX - drag.dx, MARGIN, innerWidth - FAB - MARGIN);
    const y = clamp(e.clientY - drag.dy, MARGIN, innerHeight - FAB - MARGIN);
    fab.style.left = x + "px";
    fab.style.top = y + "px";
    pos = { fx: x / innerWidth, fy: y / innerHeight };
    placePanel();
  });
  fab.addEventListener("pointerup", () => {
    if (!drag) return;
    const moved = drag.moved;
    drag = null;
    fab.classList.remove("drag");
    if (moved) chrome.storage.local.set({ fabPos: pos });
    else { panel.classList.toggle("open"); placePanel(); }
  });
  $("close").onclick = () => panel.classList.remove("open");
  // Clear: stop any running request, empty the log and forget the conversation.
  $("clear").onclick = () => {
    if (port) finish();
    log.textContent = "";
    chatHistory = [];
    historyPath = "";
    placePanel();
  };
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
    placePanel();
    return d;
  }

  function insertIntoReplyBox(text) {
    const box = document.querySelector('[data-testid="tweetTextarea_0"]');
    if (!box) { add("err", "Reply box not found. Click Reply on the post first, then try again."); return; }
    box.focus();
    document.execCommand("selectAll", false, null);
    document.execCommand("insertText", false, text);
  }

  function run(messages, label, keep) {
    if (busy) return;
    busy = true;
    if (label) add("user", label);
    const out = add("", "…");
    let acc = "";
    port = chrome.runtime.connect({ name: "llm" });
    port.onMessage.addListener((m) => {
      if (m.type === "delta") { acc += m.text; if (!acc.trim()) return; acc = acc.replace(/^\s+/, ""); out.textContent = acc; log.scrollTop = log.scrollHeight; placePanel(); }
      if (m.type === "error") { out.className = "msg err"; out.textContent = m.text; finish(); }
      if (m.type === "done") {
        if (keep) { chatHistory = [...messages, { role: "assistant", content: acc }]; historyPath = location.pathname; }
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

  function articleInfo(a) {
    const author = a.querySelector('[data-testid="User-Name"]')?.innerText.replace(/\n/g, " ") || "";
    const text = [...a.querySelectorAll('[data-testid="tweetText"]')].map((t) => t.innerText).join("\n--- quoted post ---\n");
    return { author, text };
  }

  // On a /status page: the focal post plus the replies X has loaded below it.
  function getThread() {
    const m = location.pathname.match(/\/status\/(\d+)/);
    if (!m) return null;
    const arts = [...document.querySelectorAll('article[data-testid="tweet"]')];
    if (!arts.length) return null;
    const i = Math.max(0, arts.findIndex((a) => a.querySelector(`a[href$="/status/${m[1]}"]`)));
    const replies = arts.slice(i + 1).map(articleInfo).filter((r) => r.text);
    return { post: articleInfo(arts[i]), replies };
  }

  const MAX_REPLIES = 100, MAX_REPLY_CHARS = 500;
  const repliesWord = (n) => `${n} repl${n === 1 ? "y" : "ies"}`;

  // The original post plus the loaded replies, formatted for a prompt.
  function threadContext(thread) {
    const used = thread.replies.slice(0, MAX_REPLIES);
    const replyBlock = used
      .map((r, n) => `[${n + 1}] ${r.author}: ${r.text.length > MAX_REPLY_CHARS ? r.text.slice(0, MAX_REPLY_CHARS) + "…" : r.text}`)
      .join("\n\n");
    const note = thread.replies.length > MAX_REPLIES ? ` (first ${MAX_REPLIES} of ${thread.replies.length} loaded)` : "";
    const block = `=== ORIGINAL POST ===\n${thread.post.author}\n${thread.post.text}\n\n=== REPLIES ===\n${replyBlock || "(none loaded)"}`;
    return { block, count: used.length, note };
  }

  $("sum").onclick = async () => {
    const { summaryLang } = await chrome.storage.sync.get({ summaryLang: "Traditional Chinese" });
    const thread = getThread();

    if (!thread) {
      const post = getPostText();
      if (!post) return add("err", "No post found on this page.");
      return run([
        { role: "system", content: SYS },
        { role: "user", content: `Summarize this post in ${summaryLang} in 2-4 sentences. If it is not in ${summaryLang}, include a faithful translation first.\n\n${post}` }
      ], "Summarize this post", true);
    }

    if (!thread.post.text) return add("err", "Could not read the post text on this page.");
    const { block, count, note } = threadContext(thread);
    run([
      { role: "system", content: SYS },
      { role: "user", content:
        `Below is an X post and the replies currently loaded on the page: ${repliesWord(count)}${note}. X loads replies gradually, so there may be more that are not included.\n` +
        `Write in ${summaryLang} with exactly two sections, translating the headings into ${summaryLang}:\n` +
        `1. "Original post summary": 2-4 sentences. If the post is not in ${summaryLang}, give a faithful translation first.\n` +
        `2. "Replies summary": the main viewpoints grouped by theme, notable disagreements or questions, and the overall tone. Mention a reply's author only when it matters. ` +
        `If there are no replies, say that none were loaded.\n` +
        `Use only the content below; do not invent anything.\n\n` +
        block }
    ], `Summarize this post + ${repliesWord(count)}` + (count ? " (scroll down first to load more replies)" : ""), true);
  };

  $("tr").onclick = () => {
    const draft = input.value.trim();
    if (!draft) return add("err", "Type your reply in the box first.");
    const post = getPostText();
    const target = getLang();
    if (!target) return add("err", "Type the target language in the box next to the list.");
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
    // Continue the conversation only while we are still on the same page; otherwise rebuild the context.
    if (chatHistory.length && historyPath === location.pathname) {
      run([...chatHistory, { role: "user", content: q }], q, true);
    } else {
      const thread = getThread();
      let context = "";
      if (thread && thread.post.text) {
        const { block, count, note } = threadContext(thread);
        context = `Post I'm reading, with the replies currently loaded on the page (${repliesWord(count)}${note}; there may be more that are not loaded):\n${block}\n\n`;
      } else {
        const post = getPostText();
        if (post) context = `Post I'm reading:\n${post}\n\n`;
      }
      run([{ role: "system", content: SYS }, { role: "user", content: context + q }], q, true);
    }
    input.value = "";
  };

  // Keep X's keyboard shortcuts from firing while typing in the panel.
  host.addEventListener("keydown", (e) => e.stopPropagation(), true);
  host.addEventListener("keyup", (e) => e.stopPropagation(), true);
  host.addEventListener("keypress", (e) => e.stopPropagation(), true);
})();
