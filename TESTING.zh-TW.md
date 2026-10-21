[English](TESTING.md) | **繁體中文**

# 測試指南 / 提示詞

可交給人工測試者,或貼給能操作瀏覽器的 AI 代理。

````
你要測試「X Translate Assistant」,這是一個 Chrome 擴充功能,在 x.com 上提供類似 Grok 的
輔助功能,但使用測試者「自己」的 OpenAI 相容 LLM。
Repo: https://github.com/im4saken/X-translate-assistant
最新版 zip: https://github.com/im4saken/X-translate-assistant/releases/latest

設定
1. 從 Releases 下載 zip 並解壓縮。
2. Chrome → chrome://extensions → 開啟「開發人員模式」→「載入未封裝項目」→ 選擇解壓縮後的資料夾。
3. 點對話視窗中的 ⚙(或工具列圖示)。填入:
   - Base URL(OpenAI 相容,結尾為 /v1;例如 Ollama 用 http://localhost:11434/v1)
   - API key(選填)
   - 按「Load models」並從清單選擇模型(或選「Type manually…」手動輸入)
   按「Test connection」。應顯示「Connection OK.」並跳出 Chrome 權限詢問。
   Ollama 使用者:若出現 403,請用 OLLAMA_ORIGINS="chrome-extension://*" 啟動。
4. 登入 x.com 並重新整理分頁。

測試項目(每項標記 通過 / 失敗 / 不適用)
T1  x.com 上出現圓形 ✦ 按鈕,且沒有遮住 Grok 的按鈕。
T2  把 ✦ 按鈕拖到別處;單純點擊(不拖曳)仍可開關視窗。重新整理後按鈕維持原位;
    縮放視窗時按鈕仍在畫面內。
T3  開啟一則有多則回覆的貼文頁面(/status/),點「Summarize this post」。應出現兩個段落:
    原貼文摘要與回覆摘要(使用摘要語言),視窗會顯示納入了幾則回覆。
    檢查內容是否與實際貼文與回覆相符,沒有捏造。
T4  往下捲動載入更多回覆後再摘要一次:應納入更多回覆。
T5  在首頁時間軸(非 /status/ 頁面)點摘要:應摘要最接近畫面中間的那則貼文。
T6  在輸入框用你自己的語言寫一則回覆,從下拉選單選目標語言,按「Translate my reply →」。
    應「只」輸出譯文(保留 @提及、#標籤、網址、表情符號)。請試 3 種不同語言。
T7  下拉選單選「Other…」:會出現文字框。輸入清單以外的語言(例如 Swahili)後翻譯。
    若留空就翻譯:應顯示清楚的提示,而不是壞掉。
T8  在貼文打開回覆框,執行翻譯後按「Insert into reply box」:文字應只出現一次且在回覆框內,
    仍可正常發文。也請測試「Copy」。
T9  在有回覆的貼文上問「有幾則回覆?」與「大家的回覆怎麼看?」:答案應根據已載入的回覆。
    再追問一次,應記得前一個回答。接著開啟「另一則」貼文再問:答案必須針對新貼文,而非舊的。
T10 設定頁:「Load models」會從你的伺服器載入模型下拉清單(故意用錯的 key 或網址:應顯示可讀的錯誤,
    且「Type manually…」仍可用)。修改回覆/摘要語言並儲存,重新載入擴充功能後數值應保留。
    故意填錯 Base URL:應顯示可讀的錯誤訊息,而不是無聲失敗。
T11 若有「思考型」模型請測試:輸出開頭不應有空白行。
T12 進行 T1–T10 時開啟瀏覽器主控台(F12):回報擴充功能產生的任何紅色錯誤。

回報格式(每個失敗一份)
- 測試編號:
- 預期結果:
- 實際結果(請複製完整錯誤文字):
- 重現步驟:
- 頁面類型(首頁時間軸 / 貼文頁 / 個人檔案):
- Chrome 版本、作業系統、擴充功能版本(見 chrome://extensions):
- LLM 伺服器(Ollama / LM Studio / oMLX / 雲端)與模型:
- 截圖或主控台輸出:
最後附上總結:通過/失敗/不適用的數量,以及最嚴重的 3 個問題。

規則:不要在測試貼文中輸入機密資訊;除非你想要,否則不要公開發文;回報中不要貼上你的 API key。
````
