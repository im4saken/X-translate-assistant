# Changelog / 更新日誌

All notable changes to this project are documented here. / 本專案的重要變更都記錄在此。
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow [SemVer](https://semver.org/).
格式參考 Keep a Changelog,版本號遵循 SemVer。

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
