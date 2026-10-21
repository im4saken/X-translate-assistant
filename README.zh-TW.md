[English](README.md) | **繁體中文**

# X Translate Assistant

類似 Grok 的 x.com 輔助工具,改用**你自己的** OpenAI 相容 LLM(Ollama、LM Studio、oMLX、llama.cpp server 或雲端 API 等),不會消耗 Grok 額度。

## 功能
- x.com 上可拖曳的 ✦ 按鈕,點擊後開啟小型對話視窗,並會記住按鈕位置
- **摘要這則貼文**,可自選摘要語言,並另外摘要頁面上已載入的回覆
- 語言下拉選單含 20 種常用語言,或選「Other…」自行輸入任何語言
- **翻譯我的回覆**:把你寫的回覆翻成任何語言,再用「複製」或「插入回覆框」送進 X 的回覆輸入框
- 針對正在閱讀的貼文自由提問
- 回應以串流方式即時顯示;你的文字只會送到你設定的端點

## 安裝
從 [Releases 頁面](https://github.com/im4saken/X-translate-assistant/releases/latest)下載最新的 zip 檔並解壓縮,接著:

1. 開啟 `chrome://extensions` → 開啟**開發人員模式** → 按**載入未封裝項目** → 選擇解壓縮後的資料夾。
2. 開啟設定(對話視窗中的 ⚙,或工具列圖示)。填入 **Base URL**(例如 `http://localhost:11434/v1`)與選填的 **API key**,按 **Load models** 從清單選擇模型(或選「Type manually…」手動輸入),再按 **Test connection** 測試連線。Chrome 會詢問是否允許連線到該伺服器。

## 注意事項
- Ollama 可能會以 403 拒絕擴充功能的請求;請用 `OLLAMA_ORIGINS="chrome-extension://*"` 啟動。
- 若模型跑在另一台機器上,請使用該機器的 Tailscale 或區域網路位址,不要用 `localhost`。
- 貼文偵測依賴 X 目前的頁面結構(`data-testid` 屬性),X 改版後可能需要更新。

想幫忙測試?請見[測試指南](TESTING.zh-TW.md)。版本歷史請見 [CHANGELOG.md](CHANGELOG.md)。
