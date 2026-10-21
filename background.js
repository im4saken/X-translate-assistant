const DEFAULTS = {
  baseUrl: "http://localhost:11434/v1",
  apiKey: "",
  model: "",
  defaultLang: "English",
  summaryLang: "Chinese"
};

chrome.runtime.onMessage.addListener((m) => { if (m.type === "openOptions") chrome.runtime.openOptionsPage(); });

chrome.action.onClicked.addListener(() => chrome.runtime.openOptionsPage());

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== "llm") return;
  let controller = null;
  port.onDisconnect.addListener(() => controller && controller.abort());
  port.onMessage.addListener(async (msg) => {
    if (msg.type === "abort") return controller && controller.abort();
    if (msg.type !== "chat") return;
    controller = new AbortController();
    try {
      const cfg = { ...DEFAULTS, ...(await chrome.storage.sync.get(DEFAULTS)) };
      if (!cfg.model) throw new Error("No model set. Open the extension settings first.");
      const url = cfg.baseUrl.replace(/\/+$/, "") + "/chat/completions";
      const headers = { "Content-Type": "application/json" };
      if (cfg.apiKey) headers.Authorization = "Bearer " + cfg.apiKey;
      const res = await fetch(url, {
        method: "POST",
        headers,
        signal: controller.signal,
        body: JSON.stringify({ model: cfg.model, messages: msg.messages, stream: true, temperature: 0.3 })
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`HTTP ${res.status} from ${url}\n${body.slice(0, 300)}`);
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
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
            const delta = JSON.parse(data).choices?.[0]?.delta?.content;
            if (delta) port.postMessage({ type: "delta", text: delta });
          } catch {}
        }
      }
      port.postMessage({ type: "done" });
    } catch (e) {
      if (e.name !== "AbortError") port.postMessage({ type: "error", text: String(e.message || e) });
    }
  });
});
