// Shared by the content script and the options page.
// [value sent to the model, label shown in the list]
const XLLM_LANGS = [
  ["English", "English"],
  ["Traditional Chinese", "繁體中文 (Traditional Chinese)"],
  ["Simplified Chinese", "简体中文 (Simplified Chinese)"],
  ["Japanese", "日本語 (Japanese)"],
  ["Korean", "한국어 (Korean)"],
  ["Spanish", "Español (Spanish)"],
  ["French", "Français (French)"],
  ["German", "Deutsch (German)"],
  ["Portuguese", "Português (Portuguese)"],
  ["Italian", "Italiano (Italian)"],
  ["Russian", "Русский (Russian)"],
  ["Arabic", "العربية (Arabic)"],
  ["Hindi", "हिन्दी (Hindi)"],
  ["Indonesian", "Bahasa Indonesia (Indonesian)"],
  ["Thai", "ไทย (Thai)"],
  ["Vietnamese", "Tiếng Việt (Vietnamese)"],
  ["Turkish", "Türkçe (Turkish)"],
  ["Dutch", "Nederlands (Dutch)"],
  ["Polish", "Polski (Polish)"],
  ["Ukrainian", "Українська (Ukrainian)"]
];

// Fills a <select> with the common languages plus "Other…". Choosing "Other…" reveals
// the text input. Returns a getter for the chosen language ("" if Other is left empty).
function xllmLangControl(select, other, value, onChange) {
  select.textContent = "";
  for (const [v, label] of XLLM_LANGS) {
    const o = document.createElement("option");
    o.value = v;
    o.textContent = label;
    select.appendChild(o);
  }
  const o = document.createElement("option");
  o.value = "__other__";
  o.textContent = "Other… / 其他…";
  select.appendChild(o);

  const known = XLLM_LANGS.some(([v]) => v === value);
  select.value = known ? value : "__other__";
  other.value = known ? "" : value || "";
  const sync = () => { other.hidden = select.value !== "__other__"; };
  sync();

  select.addEventListener("change", () => {
    sync();
    if (!other.hidden) other.focus();
    if (onChange) onChange();
  });
  other.addEventListener("input", () => onChange && onChange());
  return () => (select.value === "__other__" ? other.value.trim() : select.value);
}
