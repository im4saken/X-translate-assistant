const DEFAULTS = {
  baseUrl: "http://localhost:11434/v1",
  apiKey: "",
  model: "",
  defaultLang: "English",
  summaryLang: "Chinese"
};
const ids = Object.keys(DEFAULTS);
const $ = (id) => document.getElementById(id);
const status = (t) => ($("status").textContent = t);

chrome.storage.sync.get(DEFAULTS).then((cfg) => ids.forEach((k) => ($(k).value = cfg[k])));

async function save() {
  const cfg = Object.fromEntries(ids.map((k) => [k, $(k).value.trim()]));
  const origin = new URL(cfg.baseUrl).origin + "/*";
  const granted = await chrome.permissions.request({ origins: [origin] });
  if (!granted) { status("Permission to reach " + origin + " was denied."); return false; }
  await chrome.storage.sync.set(cfg);
  status("Saved.");
  return true;
}

$("save").onclick = () => save().catch((e) => status(e.message));

$("test").onclick = async () => {
  if (!(await save().catch((e) => (status(e.message), false)))) return;
  const out = $("out");
  out.hidden = false;
  out.textContent = "";
  const port = chrome.runtime.connect({ name: "llm" });
  port.onMessage.addListener((m) => {
    if (m.type === "delta") out.textContent += m.text;
    if (m.type === "error") out.textContent = "ERROR: " + m.text;
    if (m.type === "done") status("Connection OK.");
  });
  port.postMessage({ type: "chat", messages: [{ role: "user", content: "Reply with the single word: ok" }] });
};
