**English** | [繁體中文](TESTING.zh-TW.md)

# Testing guide / prompt

Give this to a human tester, or paste it to an AI agent that can drive a browser.

````
You are testing "X Translate Assistant", a Chrome extension that adds a Grok-style
helper to x.com using the tester's OWN OpenAI-compatible LLM.
Repo: https://github.com/im4saken/X-translate-assistant
Latest release zip: https://github.com/im4saken/X-translate-assistant/releases/latest

SETUP
1. Download the zip from Releases and unzip it.
2. Chrome → chrome://extensions → turn on Developer mode → Load unpacked →
   select the unzipped folder.
3. Click the ⚙ in the chat panel (or the toolbar icon). Set:
   - Base URL (OpenAI-compatible, ending in /v1; e.g. http://localhost:11434/v1 for Ollama)
   - API key (optional)
   - Click "Load models" and pick a model from the list (or "Type manually…")
   Click "Test connection". Expect "Connection OK." and Chrome's permission prompt.
   Ollama users: start it with OLLAMA_ORIGINS="chrome-extension://*" if you get a 403.
4. Log in to x.com. Refresh the tab.

TEST CASES (mark PASS / FAIL / N/A for each)
T1  A round ✦ button appears on x.com. It does not cover Grok's button.
T2  Drag the ✦ button elsewhere; a plain click (no drag) still opens/closes the panel.
    Reload the page: the button stays where you put it. Resize the window: it stays on screen.
T3  Open any single post (a /status/ page) that has several replies. Click
    "Summarize this post". Expect TWO sections: original-post summary and replies
    summary, in the summary language. The panel says how many replies were included.
    Check the content matches the real post and replies; nothing invented.
T4  Scroll down to load more replies, run Summarize again: more replies are included.
T5  On the home timeline (not a /status/ page), click Summarize: it summarizes the
    post nearest the middle of the screen.
T6  Type a reply in your own language in the text box, pick a target language from
    the drop-down, click "Translate my reply →". Expect ONLY the translation
    (keeps @mentions, hashtags, URLs, emoji). Try 3 different languages.
T7  Pick "Other…" in the drop-down: a text box appears. Type a language not in the
    list (e.g. Swahili) and translate. Leave it empty and translate: expect a clear
    message, not a crash.
T8  Open the reply box on a post, run a translation, click "Insert into reply box":
    the text appears once, in the box, and you can still post it normally.
    Also test "Copy".
T9  On a post with replies, ask "How many replies are there?" and "What do the replies
    think?": answers should be based on the loaded replies. Ask a follow-up: it
    remembers the previous answer. Then open a DIFFERENT post and ask again: the answer
    must be about the new post, not the old one.
T9b Click "Clear" in the panel header: all messages disappear and the next question starts a
    fresh conversation. Click Clear while an answer is still streaming: it stops.
T13 Interface language: in Settings choose English, 繁體中文, 简体中文 and "Follow browser language".
    The settings page and the ✦ panel (reload x.com once) switch language; labels, buttons, placeholders
    and error messages are all translated, with no leftover English in a Chinese interface.
T10 Settings page: "Load models" fills the drop-down from your server (try a wrong key or
    URL: readable error, "Type manually…" still works). Change reply/summary language, Save, reload the extension:
    values persist. Use a wrong Base URL: expect a readable error, not a silent failure.
T11 Use a "thinking" model if you have one: output should not start with blank lines.
T12 Open the browser console (F12) while doing T1–T10: report any red errors from the extension.

REPORT (one block per failure)
- Test ID:
- Expected:
- Actual (copy exact error text):
- Steps to reproduce:
- Page URL type (home timeline / post page / profile):
- Chrome version, OS, extension version (from chrome://extensions):
- LLM server (Ollama / LM Studio / oMLX / hosted) and model:
- Screenshot or console output:
Finish with an overall summary: how many PASS/FAIL/N/A, and your top 3 problems.

NOTE FOR AUTOMATED TESTERS: Chrome only shows the "allow access to your server" prompt in response to a
real user click (Save, Test connection, Load models). A script-triggered click will fail with "This function must
be called during a user gesture". Click these buttons for real, or pre-grant the host permission.

RULES: Do not enter secrets in test posts. Do not post anything publicly unless you
want to. Do not paste your API key into the report.
````
