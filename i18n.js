// Interface strings. English is built in and is the fallback; other languages are loaded on demand
// from locales/<code>.json (see xllmSetLang). Prompts sent to the LLM are not translated.
const XLLM_I18N = {
  en: {
    clear: "Clear",
    clearTip: "Clear all messages and start over",
    settingsTip: "Settings (Base URL, model, API key)",
    summarize: "Summarize this post",
    translateBtn: "Translate my reply →",
    langTip: "Target language for Translate",
    langOtherPh: "Language, e.g. Swahili",
    inputPh: "Type your reply (any language) and press Translate, or ask a question about the post",
    ask: "Ask",
    other: "Other…",
    errNoPost: "No post found on this page.",
    errNoPostText: "Could not read the post text on this page.",
    errNoDraft: "Type your reply in the box first.",
    errNoLang: "Type the target language in the box next to the list.",
    errNoReplyBox: "Reply box not found. Click Reply on the post first, then try again.",
    errNoModel: "No model set. Open the settings first.",
    thinking: "Thinking…",
    focusHint: "X's reply window is open and keeps the keyboard focus, so typing here may land in it. Type your draft here first, then open the reply window and click Insert.",
    errDisconnected: "The connection to the extension's background process was lost (the browser may have put it to sleep). Please try again.",
    sumLabelReplies: "Summarize this post + {replies}",
    scrollHint: " (scroll down first to load more replies)",
    translateLabel: "Translate to {lang}: {draft}",
    reply1: "1 reply",
    replyN: "{n} replies",
    copy: "Copy",
    insert: "Insert into reply box",

    optTitle: "X Translate Assistant settings",
    baseUrl: "Base URL",
    baseUrlHint: "(OpenAI-compatible, ending in /v1)",
    apiKey: "API key",
    apiKeyHint: "(leave empty if your server doesn't need one)",
    model: "Model",
    modelHint: "(click “Load models” to fetch the list from your server)",
    modelOtherPh: "Model name, e.g. qwen2.5:27b",
    modelFilterPh: "Filter models…",
    loadModels: "Load models",
    defaultLang: "Default reply language",
    defaultLangHint: "(what “Translate my reply” targets)",
    summaryLang: "Summary language",
    uiLang: "Interface language",
    uiAuto: "Follow browser language",
    save: "Save",
    test: "Test connection",
    saved: "Saved.",
    connOk: "Connection OK.",
    permDenied: "Permission to reach {origin} was denied.",
    loadingModels: "Loading models…",
    loadedModels: "Loaded {n} models.",
    loadFail: "Could not load models: {err}. You can choose “Type manually…” instead.",
    chooseModel: "Choose a model first (use Load models, or Type manually…).",
    typeLang: "Type a language in the box next to “{field}”.",
    selectModel: "Select a model…",
    clickLoad: "Click “Load models”",
    typeManually: "Type manually…"
  }
};

// Languages that have a locales/<code>.json file next to English.
const XLLM_LOCALES = ["zh-TW", "zh-CN"];

let xllmLang = "en";

// setting: "auto" (follow the browser), "en", "zh-TW" or "zh-CN".
function xllmResolveLang(setting) {
  if (setting === "en" || XLLM_LOCALES.includes(setting)) return setting;
  let nav = "en";
  try {
    nav = (chrome.i18n.getUILanguage() || navigator.language || "en").toLowerCase();
  } catch {
    nav = (navigator.language || "en").toLowerCase();
  }
  if (nav.startsWith("zh")) return /tw|hk|mo|hant/.test(nav) ? "zh-TW" : "zh-CN";
  return "en";
}

// The background script reads the file (content scripts cannot fetch extension files
// without exposing them to web pages). Returns null if it cannot be loaded.
function xllmFetchLocale(lang) {
  return new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage({ type: "getLocale", lang }, (res) => {
        void chrome.runtime.lastError;
        resolve(res && res.ok ? res.strings : null);
      });
    } catch {
      resolve(null);
    }
  });
}

// Picks the language and loads its file if needed (once). Falls back to English on failure.
async function xllmSetLang(setting) {
  const lang = xllmResolveLang(setting);
  if (lang !== "en" && !XLLM_I18N[lang]) {
    const strings = await xllmFetchLocale(lang);
    if (strings) XLLM_I18N[lang] = strings;
  }
  xllmLang = XLLM_I18N[lang] ? lang : "en";
  return xllmLang;
}

// Look up a string; {name} placeholders are filled from vars. Falls back to English.
function xt(key, vars) {
  const s = (XLLM_I18N[xllmLang] || {})[key] ?? XLLM_I18N.en[key] ?? key;
  return vars ? s.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? vars[k] : "{" + k + "}")) : s;
}

function xtReplies(n) {
  return n === 1 ? xt("reply1") : xt("replyN", { n });
}

// Fill every [data-i18n], [data-i18n-ph] and [data-i18n-title] element under root.
function xllmApply(root) {
  root.querySelectorAll("[data-i18n]").forEach((e) => (e.textContent = xt(e.dataset.i18n)));
  root.querySelectorAll("[data-i18n-ph]").forEach((e) => (e.placeholder = xt(e.dataset.i18nPh)));
  root.querySelectorAll("[data-i18n-title]").forEach((e) => (e.title = xt(e.dataset.i18nTitle)));
}
