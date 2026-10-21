**English** | [繁體中文](README.zh-TW.md)

# X Translate Assistant

A Grok-style helper for x.com that uses **your own** OpenAI-compatible LLM (Ollama, LM Studio, oMLX, llama.cpp server, a hosted API, etc.), so it doesn't use up Grok credits.

## Features
- Draggable ✦ button on x.com opens a small chat window; its position is remembered
- **Summarize this post** in a language you choose, with a separate summary of the replies loaded on the page
- Language drop-down with 20 common languages, or "Other…" to type any language
- **Translate my reply** into any language, then Copy or Insert into X's reply box
- Free-form questions about the post you're reading
- Responses stream in; your text goes only to the endpoint you configure

## Install
Download the latest zip from the [Releases page](https://github.com/im4saken/X-translate-assistant/releases/latest), unzip it, then:

1. Open `chrome://extensions` → enable **Developer mode** → **Load unpacked** → select the unzipped folder.
2. Open settings (⚙ in the chat panel, or the toolbar icon). Set **Base URL** (e.g. `http://localhost:11434/v1`) and an optional **API key**, click **Load models** and pick your model from the list (or choose "Type manually…"), then click **Test connection**. Chrome will ask permission to reach that server.

## Notes
- Ollama may reject extension requests with 403; start it with `OLLAMA_ORIGINS="chrome-extension://*"`.
- If the model runs on another machine, use that machine's Tailscale/LAN address instead of `localhost`.
- Post detection relies on X's current page structure (`data-testid` attributes) and may need updates if X changes it.

Want to help test? See the [testing guide](TESTING.md). Version history: [CHANGELOG.md](CHANGELOG.md).
