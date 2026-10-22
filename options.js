const DEFAULTS = {
  baseUrl: "http://localhost:11434/v1",
  apiKey: "",
  model: "",
  defaultLang: "English",
  summaryLang: "Traditional Chinese",
  uiLang: "auto"
};
const ids = Object.keys(DEFAULTS);
const langIds = ["defaultLang", "summaryLang"];
const langGetters = {};
const $ = (id) => document.getElementById(id);
const status = (t) => ($("status").textContent = t);

// Interface language: "auto" follows the browser. Applied live; persisted on Save.
const UI_OPTIONS = [["auto", null], ["en", "English"], ["zh-TW", "繁體中文"], ["zh-CN", "简体中文"]];
function buildUiLang(current) {
  const sel = $("uiLang");
  sel.textContent = "";
  for (const [v, label] of UI_OPTIONS) {
    const o = document.createElement("option");
    o.value = v;
    o.textContent = label || xt("uiAuto");
    sel.appendChild(o);
  }
  sel.value = current;
}
function applyUi() {
  xllmApply(document);
  document.documentElement.lang = xllmLang;
  buildUiLang($("uiLang").value);
  renderModels();
  Object.values(langGetters).forEach((g) => g.relabel());
}
$("uiLang").addEventListener("change", async () => {
  await xllmSetLang($("uiLang").value);
  applyUi();
});

const modelSel = $("model"), modelOther = $("modelOther"), modelFilter = $("modelFilter");
let modelIds = [];

const getModel = () => (modelSel.value === "__other__" ? modelOther.value.trim() : modelSel.value);

// Rebuilds the model list. `selected` forces a choice; otherwise the current choice is kept.
function renderModels(selected) {
  const wasOther = selected === undefined && modelSel.value === "__other__";
  const cur = selected === undefined ? getModel() : selected;
  const q = modelFilter.value.trim().toLowerCase();
  modelSel.textContent = "";
  const add = (v, t) => {
    const o = document.createElement("option");
    o.value = v;
    o.textContent = t;
    modelSel.appendChild(o);
  };
  add("", modelIds.length ? xt("selectModel") : xt("clickLoad"));
  const shown = modelIds.filter((id) => !q || id.toLowerCase().includes(q));
  if (cur && !shown.includes(cur)) shown.unshift(cur); // never hide the current choice
  shown.forEach((id) => add(id, id));
  add("__other__", xt("typeManually"));
  modelSel.value = wasOther ? "__other__" : cur || "";
  modelOther.hidden = modelSel.value !== "__other__";
  modelFilter.hidden = modelIds.length <= 10;
}

modelSel.addEventListener("change", () => {
  modelOther.hidden = modelSel.value !== "__other__";
  if (!modelOther.hidden) modelOther.focus();
});
modelFilter.addEventListener("input", () => renderModels());

// GET {baseUrl}/models (OpenAI-compatible). interactive=true may prompt for host permission.
async function loadModels(interactive) {
  const baseUrl = $("baseUrl").value.trim();
  try {
    const origin = new URL(baseUrl).origin + "/*";
    const has = await chrome.permissions.contains({ origins: [origin] });
    if (!has) {
      if (!interactive) return;
      if (!(await chrome.permissions.request({ origins: [origin] }))) return status(xt("permDenied", { origin }));
    }
    status(xt("loadingModels"));
    const headers = {};
    const key = $("apiKey").value.trim();
    if (key) headers.Authorization = "Bearer " + key;
    const url = baseUrl.replace(/\/+$/, "") + "/models";
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
    const body = await res.json();
    const list = (body.data || body.models || []).map((m) => (typeof m === "string" ? m : m.id || m.name)).filter(Boolean);
    if (!list.length) throw new Error("the server returned no models");
    modelIds = [...new Set(list)].sort((a, b) => a.localeCompare(b));
    renderModels();
    status(xt("loadedModels", { n: modelIds.length }));
  } catch (e) {
    status(xt("loadFail", { err: e.message }));
  }
}
$("loadModels").onclick = () => loadModels(true);

chrome.storage.sync.get(DEFAULTS).then(async (cfg) => {
  await xllmSetLang(cfg.uiLang);
  buildUiLang(cfg.uiLang);
  xllmApply(document);
  document.documentElement.lang = xllmLang;
  ids.forEach((k) => {
    if (k === "uiLang") return;
    if (langIds.includes(k)) langGetters[k] = xllmLangControl($(k), $(k + "Other"), cfg[k]);
    else if (k === "model") renderModels(cfg.model);
    else $(k).value = cfg[k];
  });
  loadModels(false); // refresh the list silently if we already have permission
});

async function save() {
  const cfg = Object.fromEntries(ids.map((k) => [k, k === "model" ? getModel() : langGetters[k] ? langGetters[k]() : $(k).value.trim()]));
  const missing = langIds.find((k) => !cfg[k]);
  if (missing) { status(xt("typeLang", { field: $(missing + "Label").textContent })); return false; }
  if (!cfg.model) { status(xt("chooseModel")); return false; }
  const origin = new URL(cfg.baseUrl).origin + "/*";
  const granted = await chrome.permissions.request({ origins: [origin] });
  if (!granted) { status(xt("permDenied", { origin })); return false; }
  await chrome.storage.sync.set(cfg);
  status(xt("saved"));
  return true;
}

$("save").onclick = () => save().catch((e) => status(e.message));

$("test").onclick = async () => {
  if (!(await save().catch((e) => (status(e.message), false)))) return;
  const out = $("out");
  out.hidden = false;
  out.textContent = "";
  const port = chrome.runtime.connect({ name: "llm" });
  let finished = false;
  port.onDisconnect.addListener(() => { if (!finished) out.textContent = "ERROR: " + xt("errDisconnected"); });
  port.onMessage.addListener((m) => {
    if (m.type === "error" || m.type === "done") finished = true;
    if (m.type === "delta") out.textContent += m.text;
    if (m.type === "error") out.textContent = "ERROR: " + (m.code === "no-model" ? xt("errNoModel") : m.text);
    if (m.type === "done") status(xt("connOk"));
  });
  port.postMessage({ type: "chat", messages: [{ role: "user", content: "Reply with the single word: ok" }] });
};
