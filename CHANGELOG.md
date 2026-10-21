# Changelog

All notable changes to this project are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow [SemVer](https://semver.org/).

## [1.1.0] - 2026-10-21
### Added
- Floating button is draggable and its position is remembered (stored locally, per machine).
- Settings (⚙) button in the chat panel that opens the options page.
- Chat panel follows the button and stays on screen as its content grows.

### Changed
- Default button position moved to the right-middle of the screen so it does not cover Grok's button.
- Leading blank lines are trimmed from model output (thinking models such as Qwen).

### Fixed
- Summarize, Translate and Ask all failed silently on first click because `busy`, `port` and the chat history were never declared (`ReferenceError: busy is not defined`; `history` resolved to the browser's History object). Found in an independent browser test.

## [1.0.0] - 2026-10-21
### Added
- Initial release: summarize the post you are reading, translate your reply, and ask questions about a post, using any OpenAI-compatible endpoint (Ollama, LM Studio, oMLX, hosted APIs).
- Options page for base URL, API key, model, reply language and summary language, with a connection test.
- Streaming responses; Copy and "Insert into reply box" actions.

> Note: 1.0.0 contains the bug fixed in 1.1.0 and is not usable. Use 1.1.0 or later.
