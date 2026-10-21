# X LLM Assistant

A Grok-style helper for x.com that uses **your own** OpenAI-compatible LLM (Ollama, LM Studio, llama.cpp server, a hosted API, etc.).

- Floating ✦ button on x.com opens a small chat window
- **Summarize this post** (in a language you choose)
- **Translate my reply** into any language, then Copy or Insert into X's reply box
- Free-form questions about the post you're reading
- Responses stream in; your text goes only to the endpoint you configure

## Install
1. `chrome://extensions` → enable Developer mode → Load unpacked → select this folder.
2. Click the toolbar icon, set Base URL (e.g. `http://localhost:11434/v1`), model name and optional API key, then Test connection.

Ollama may reject extension requests with 403; start it with `OLLAMA_ORIGINS="chrome-extension://*"`.

Post detection relies on X's current page structure (`data-testid` attributes) and may need updates if X changes it.
