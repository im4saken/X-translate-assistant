# Changelog / 更新日誌

All notable changes to this project are documented here. / 本專案的重要變更都記錄在此。
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow [SemVer](https://semver.org/).
格式參考 Keep a Changelog,版本號遵循 SemVer。

## [1.6.1] - 2026-10-22
### Fixed / 修正
- Slow models no longer leave the panel stuck on "…" forever. While a request runs, the background process now pings the page every 10 seconds so Chrome does not put it to sleep, and if the connection is lost anyway the panel shows a clear message (keeping any partial answer) and lets you ask again. The settings page's "Test connection" does the same. Found in an end-to-end test with a large thinking model.
  慢速模型不再讓視窗永遠停在「…」。請求進行時,背景程序每 10 秒向頁面發送一次心跳,避免被 Chrome 休眠;若連線仍中斷,視窗會顯示明確訊息(保留已收到的部分回答)並可重新提問。設定頁的「測試連線」也比照處理。此問題由大型思考型模型的端對端測試發現。

### Added / 新增
- "Thinking…" is shown while a thinking model is still reasoning, instead of a bare "…".
  思考型模型仍在推理時,視窗會顯示「思考中…」,而不是只有「…」。

### Docs / 文件
- Testing guide: note that Chrome's permission prompt needs a real click (relevant for automated testers).
  測試指南:註明 Chrome 的權限詢問需要真實點擊(對自動化測試者很重要)。

## [1.6.0] - 2026-10-21
### Added / 新增
- **Interface language** setting: English, Traditional Chinese (繁體中文), Simplified Chinese (简体中文), or "Follow browser language" (the default). It applies to the settings page and the ✦ panel, and changes take effect immediately.
  新增**介面語言**設定:English、繁體中文、简体中文,或「跟隨瀏覽器語言」(預設)。套用於設定頁與 ✦ 視窗,變更後立即生效。
- English is built in; Chinese lives in separate files (`locales/zh-TW.json`, `locales/zh-CN.json`) that are loaded only when needed, so adding a language is just adding one file (see README).
  英文內建;中文放在獨立檔案(`locales/zh-TW.json`、`locales/zh-CN.json`),只在需要時才載入,因此新增語言只需新增一個檔案(見 README)。

### Notes / 備註
- Text sent to the model (prompts) stays in English; only what you see is translated. The extension name shown in Chrome's extension list is not translated.
  傳給模型的提示詞維持英文,只翻譯你看到的介面。Chrome 擴充功能清單中的名稱不翻譯。

## [1.5.0] - 2026-10-21
### Added / 新增
- **Clear** button in the panel header: empties all messages, forgets the conversation so the next question starts fresh, and stops any answer that is still streaming.
  對話視窗標題列新增 **Clear** 按鈕:清除所有訊息、忘記對話內容(下一個問題會重新開始),並停止仍在串流的回答。

## [1.4.1] - 2026-10-21
### Fixed / 修正
- Models that reject a custom `temperature` (for example OpenAI's reasoning models, which answer HTTP 400 "unsupported ... temperature") now work: the request is retried once without it, and the choice is remembered for that server and model until the browser restarts the extension. Other errors are shown as before and are not retried.
  不接受自訂 `temperature` 的模型(例如 OpenAI 的推理型模型,會回應 HTTP 400「unsupported ... temperature」)現在可以正常使用:會自動不帶該參數重試一次,並在擴充功能重新啟動前記住該伺服器與模型的結果。其他錯誤仍照常顯示,不會重試。

## [1.4.0] - 2026-10-21
### Changed / 變更
- The model is now chosen from a drop-down filled from your server's `/models` list (OpenAI, Ollama, LM Studio, DeepSeek, etc.) via a **Load models** button, with a filter box for long lists. "Type manually…" remains for servers that do not provide a list. The list refreshes automatically when the settings page opens, once Chrome has permission for your server.
  模型改由下拉選單選擇,清單透過 **Load models** 按鈕從伺服器的 `/models` 取得(OpenAI、Ollama、LM Studio、DeepSeek 等),清單很長時可用篩選框。對於不提供清單的伺服器,仍可選「Type manually…」手動輸入。Chrome 取得你伺服器的權限後,開啟設定頁時會自動更新清單。
- Saving now requires a model to be chosen, with a clear message otherwise.
  儲存時必須選擇模型,否則會顯示清楚的提示。

## [1.3.0] - 2026-10-21
### Changed / 變更
- Renamed the extension to "X Translate Assistant" to match the repository (extension name, panel title, settings page, READMEs). The release zip is now named `X-translate-assistant-vX.Y.Z.zip` and unzips to an `X-translate-assistant` folder. Your saved settings are kept if you reload the extension from the same folder; a new folder path counts as a new install and the settings must be entered again.
  將擴充功能更名為「X Translate Assistant」,與儲存庫名稱一致(擴充功能名稱、視窗標題、設定頁、README)。發佈的 zip 改名為 `X-translate-assistant-vX.Y.Z.zip`,解壓縮後的資料夾為 `X-translate-assistant`。若從同一個資料夾重新載入,設定會保留;若資料夾路徑不同則視為新安裝,需重新輸入設定。

### Added / 新增
- Testing guide for testers and AI agents, in English and Traditional Chinese (`TESTING.md`, `TESTING.zh-TW.md`).
  新增給測試者與 AI 代理使用的測試指南,中英雙語(`TESTING.md`、`TESTING.zh-TW.md`)。

## [1.2.1] - 2026-10-21
### Fixed / 修正
- "Ask" now includes the replies loaded on the page, like "Summarize" does, so questions such as "how many replies?" or "what do the replies think?" can be answered. Found in a browser test.
  「提問」現在會像「摘要」一樣納入頁面已載入的回覆,因此能回答「有幾則回覆?」「大家的回覆怎麼看?」等問題。此問題由瀏覽器測試發現。
- Follow-up questions no longer carry over the previous post's context after you navigate to a different post; the conversation restarts with the new page.
  切換到另一則貼文後,追問不再沿用上一則貼文的內容,對話會以新頁面重新開始。
- Translating a reply no longer overwrites the conversation history used by follow-up questions.
  翻譯回覆不再覆蓋追問所使用的對話紀錄。
- Grammar: "1 reply" instead of "1 replies".
  文法修正:顯示「1 reply」而非「1 replies」。

## [1.2.0] - 2026-10-21
### Added / 新增
- "Summarize this post" now includes the replies: an original-post summary plus a replies summary (viewpoints grouped by theme, disagreements, overall tone). It covers the replies X has loaded on the page, up to 100; scroll down first to load more.
  「摘要這則貼文」現在會一併摘要回覆:先是原貼文摘要,再是回覆摘要(依主題整理觀點、分歧與整體語氣)。範圍為 X 已載入頁面的回覆(最多 100 則);請先往下捲動以載入更多。
- Target language for "Translate my reply" is a drop-down list of 20 common languages. Choose "Other…" to type any language in a text box. The last choice is remembered.
  「翻譯我的回覆」的目標語言改為下拉選單,內含 20 種常用語言;選「其他…」可在文字框輸入任何語言。會記住上次的選擇。
- The reply-language and summary-language settings use the same list.
  設定頁的回覆語言與摘要語言也使用相同的選單。

### Changed / 變更
- Default summary language is now Traditional Chinese (was "Chinese"). A previously saved custom value is kept under "Other…".
  預設摘要語言改為繁體中文(原為「Chinese」)。先前儲存的自訂值會保留在「其他…」中。

## [1.1.0] - 2026-10-21
### Added / 新增
- Floating button is draggable and its position is remembered (stored locally, per machine).
  浮動按鈕可拖曳,並記住位置(儲存於本機,不跨裝置同步)。
- Settings (⚙) button in the chat panel that opens the options page.
  對話視窗新增設定(⚙)按鈕,可開啟設定頁。
- Chat panel follows the button and stays on screen as its content grows.
  對話視窗會跟著按鈕移動,內容變長時仍保持在畫面內。

### Changed / 變更
- Default button position moved to the right-middle of the screen so it does not cover Grok's button.
  按鈕預設位置改到畫面右側中間,避免遮住 Grok 的按鈕。
- Leading blank lines are trimmed from model output (thinking models such as Qwen).
  移除模型輸出開頭的空白行(針對 Qwen 等思考型模型)。

### Fixed / 修正
- Summarize, Translate and Ask all failed silently on first click because `busy`, `port` and the chat history were never declared (`ReferenceError: busy is not defined`; `history` resolved to the browser's History object). Found in an independent browser test.
  「摘要」「翻譯」「提問」第一次點擊時全都無聲失敗,原因是 `busy`、`port` 與對話紀錄變數從未宣告(`ReferenceError: busy is not defined`;`history` 被解析成瀏覽器的 History 物件)。此問題由獨立的瀏覽器測試發現。

## [1.0.0] - 2026-10-21
### Added / 新增
- Initial release: summarize the post you are reading, translate your reply, and ask questions about a post, using any OpenAI-compatible endpoint (Ollama, LM Studio, oMLX, hosted APIs).
  首次發佈:摘要正在閱讀的貼文、翻譯你的回覆、針對貼文提問,可使用任何 OpenAI 相容端點(Ollama、LM Studio、oMLX、雲端 API)。
- Options page for base URL, API key, model, reply language and summary language, with a connection test.
  設定頁可設定 Base URL、API key、模型、回覆語言與摘要語言,並提供連線測試。
- Streaming responses; Copy and "Insert into reply box" actions.
  串流顯示回應;提供「複製」與「插入回覆框」。

> Note / 注意: 1.0.0 contains the bug fixed in 1.1.0 and is not usable. Use 1.1.0 or later.
> 1.0.0 含有 1.1.0 修正的錯誤,無法正常使用,請使用 1.1.0 或更新版本。
