const DEFAULTS = {
  baseUrl: "http://localhost:11434/v1",
  apiKey: "",
  model: "",
  defaultLang: "English",
  summaryLang: "Chinese"
};

const LOCALES = ["zh-TW", "zh-CN"];

// Chrome stops an idle service worker after ~30s. While a request is running we ping the page
// regularly (messages on the port keep the worker alive) so slow models are not cut off.
const HEARTBEAT_MS = 10000;

chrome.runtime.onMessage.addListener((m, _sender, sendResponse) => {
  if (m.type === "openOptions") chrome.runtime.openOptionsPage();
  if (m.type === "getLocale") {
    if (!LOCALES.includes(m.lang)) { sendResponse({ ok: false }); return; }
    fetch(chrome.runtime.getURL(`locales/${m.lang}.json`))
      .then((r) => r.json())
      .then((strings) => sendResponse({ ok: true, strings }))
      .catch(() => sendResponse({ ok: false }));
    return true; // keep the channel open for the async response
  }
});

const noTemperature = new Set();

chrome.action.onClicked.addListener(() => chrome.runtime.openOptionsPage());

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== "llm") return;
  let controller = null;
  let heartbeat = null;
  const stopHeartbeat = () => { if (heartbeat) clearInterval(heartbeat); heartbeat = null; };
  port.onDisconnect.addListener(() => { stopHeartbeat(); if (controller) controller.abort(); });
  port.onMessage.addListener(async (msg) => {
    if (msg.type === "abort") return controller && controller.abort();
    if (msg.type !== "chat") return;
    controller = new AbortController();
    heartbeat = setInterval(() => { try { port.postMessage({ type: "ping" }); } catch { stopHeartbeat(); } }, HEARTBEAT_MS);
    try {
      const cfg = { ...DEFAULTS, ...(await chrome.storage.sync.get(DEFAULTS)) };
      if (!cfg.model) { port.postMessage({ type: "error", code: "no-model", text: "No model set. Open the settings first." }); return; }
      const url = cfg.baseUrl.replace(/\/+$/, "") + "/chat/completions";
      const headers = { "Content-Type": "application/json" };
      if (cfg.apiKey) headers.Authorization = "Bearer " + cfg.apiKey;
      const post = (withTemperature) =>
        fetch(url, {
          method: "POST",
          headers,
          signal: controller.signal,
          body: JSON.stringify({
            model: cfg.model,
            messages: msg.messages,
            stream: true,
            ...(withTemperature ? { temperature: 0.3 } : {})
          })
        });
      // Some models (e.g. OpenAI's reasoning models) reject a custom temperature: retry once without it and remember.
      const key = `${url}|${cfg.model}`;
      let res = await post(!noTemperature.has(key));
      if (res.status === 400 && !noTemperature.has(key)) {
        const body = await res.text();
        if (!/temperature/i.test(body)) throw new Error(`HTTP 400 from ${url}\n${body.slice(0, 300)}`);
        noTemperature.add(key);
        res = await post(false);
      }
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`HTTP ${res.status} from ${url}\n${body.slice(0, 300)}`);
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      let lastThinking = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop();
        for (const line of lines) {
          const s = line.trim();
          if (!s.startsWith("data:")) continue;
          const data = s.slice(5).trim();
          if (data === "[DONE]") continue;
          try {
            const d = JSON.parse(data).choices?.[0]?.delta;
            if (d?.content) port.postMessage({ type: "delta", text: d.content });
            // Thinking models stream their reasoning separately: tell the page we are alive (at most once a second).
            else if ((d?.reasoning_content || d?.reasoning) && Date.now() - lastThinking > 1000) {
              lastThinking = Date.now();
              port.postMessage({ type: "thinking" });
            }
          } catch {}
        }
      }
      port.postMessage({ type: "done" });
    } catch (e) {
      if (e.name !== "AbortError") port.postMessage({ type: "error", text: String(e.message || e) });
    } finally {
      stopHeartbeat();
    }
  });
});
