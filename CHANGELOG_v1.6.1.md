# Changelog - Version 1.6.1

**Release Date:** 2026-02-11
**Update:** Provider Cleanup, Bug Fixes & Comprehensive Documentation

---

## Removed

### o7 API Provider (Complete Removal)

**o7 API provider has been completely removed from the project.**

Removed from 10 files:

- **`ai/adapters/o7.js`** - Adapter file deleted
- **`ai/adapters/index.js`** - O7Adapter import and factory case removed
- **`manifest.json`** - `https://api.o7.team/*` removed from host_permissions
- **`popup/popup.html`** - `<option value="o7">` removed from provider select
- **`popup/popup.js`** - o7 removed from:
  - PROVIDERS object (9 model definitions)
  - MODEL_OPTIMAL_SETTINGS comment
  - `testApiKey()` function case
- **`background/background.js`** - handleO7Stream import, `o7Stream` port, and switch case removed
- **`background/api-handlers.js`** - `handleO7Stream()` function removed (~330 lines)
- **`content/content.js`** - o7 port mapping and supportsFunctionCalling entry removed
- **`background/workflow-builder-handler.js`** - o7 model mapping block and adapter type verification checks removed
- **`lib/workflow-builder/config/llm-config.js`** - 6 o7 model configs removed (o7-opus-4.5, o7-sonnet-4.5, o7-haiku-4.5, o7-opus-4.1, o7-opus-4, o7-sonnet-4)

---

## Bug Fixes

### Hugging Face Function Calling Support
- **`content/content.js`** - `huggingface` was missing from `supportsFunctionCalling` array
- AI function calling (tool use) now works correctly with Hugging Face models
- FunctionGemma, Qwen 3, and other HF models can now execute workflow functions

### Workflow Builder Handler Cleanup
- Removed dead code paths for o7 adapter type verification
- Removed unreachable o7-specific fallback logic in provider adapter creation
- Cleaner error handling in model adapter fallback flow

---

## Documentation

### README.md - Complete Rewrite

**Version badge updated:** 1.6.0 -> 1.6.1

**Errors fixed:**
- Removed Cohere from active provider list (deprecated since v1.6.0)
- Added Hugging Face as supported provider
- Removed duplicate v1.5.0 section
- Fixed installation instructions: "select the `extension` folder" -> "select the project root folder"

**New sections added:**

#### Multi-Agent Workflow Builder
- 5-agent orchestration system documentation (Supervisor, Discovery, Builder, Configurator, Responder)
- Architecture diagram with agent routing flow
- Per-stage LLM adapter support
- Persistent state and streaming events

#### Complete Chat Settings Documentation
- Custom System Instructions
- Save UI Position
- Message Fade Delay
- All 22 tool toggles documented:
  - Workflow Access, Node Library Access, Node Creation, Node Editing, Node Removal
  - Affiliate Recommendations, Node Cloning, Advanced Connection Management
  - Bulk Operations, Auto Layout, Workflow Validation, Workflow Execution
  - Advanced Import/Export, Execution History & Analytics, Workflow Templates
  - Workflow Optimization, Workflow Versioning, Advanced Debugging
  - Testing Framework, CI/CD Integration, Custom Node Development, Documentation Generation

#### Available Functions Reference (60+)
- Phase 1: Core Operations (21 functions)
- Phase 2: Advanced Features (9 functions)
- Phase 3: Enterprise Features (9 functions)
- Phase 4: AI & Integrations (28 functions)
- Full function name and description table

#### Model Auto-Optimization
- Automatic temperature/topP/maxTokens per model (90+ models)
- Custom model input support
- Thinking mode for reasoning models
- Google Search grounding for Gemini

#### Enhanced Debug Mode Documentation
- Server URL configuration
- Auto-connect on startup
- Console logging toggle
- PII masking
- Quick actions (Open Dashboard, Clear Logs, Test Connection)

#### Security Features
- Rate limiting
- Input validation
- XSS sanitization
- Port whitelist
- Origin verification
- CSP headers

#### Updated Provider List
- OpenAI: GPT-5.2, GPT-4o, o3, o4-mini, and more
- Anthropic: Claude 4.5/4.1/4/3.5 series with exact model names
- Google Gemini: 2.5 Pro/Flash/Flash Lite, 1.5 Pro/Flash
- DeepSeek: Chat V3.2, Reasoner V3.2
- OpenRouter: GLM-4.7, Gemini 3, Llama 4, Devstral, 100+ more
- Groq: Llama 3.3/3.1, Groq Tool-Use, Mistral, Mixtral
- Hugging Face: FunctionGemma, Qwen 3, Llama, NovaSky

#### Updated Architecture Section
- All key components listed with descriptions
- lib/workflow-builder/ directory structure documented
- ai/adapters/, ai/schemas/ documented
- content/functions/ documented

#### Deprecated Provider Notice
- Cohere and Local LLM marked as deprecated
- Auto-migration to Google Gemini documented

---

## Technical Details

### Files Changed
| File | Change |
|------|--------|
| `ai/adapters/o7.js` | Deleted |
| `ai/adapters/index.js` | o7 import and case removed |
| `manifest.json` | o7 host permission removed |
| `popup/popup.html` | o7 option removed |
| `popup/popup.js` | o7 from PROVIDERS, settings, testApiKey |
| `background/background.js` | o7 import, port, case removed |
| `background/api-handlers.js` | handleO7Stream removed (~330 lines) |
| `content/content.js` | o7 port mapping removed, huggingface added to function calling |
| `background/workflow-builder-handler.js` | o7 model mapping and adapter checks removed |
| `lib/workflow-builder/config/llm-config.js` | 6 o7 model configs removed |
| `README.md` | Complete rewrite |
| `CHANGELOG_v1.6.1.md` | New file |

### Lines Removed
- ~330 lines from api-handlers.js (handleO7Stream)
- ~102 lines from o7.js (entire file)
- ~40 lines from llm-config.js (o7 model configs)
- ~18 lines from popup.js (PROVIDERS o7 entry)
- ~17 lines from popup.js (testApiKey o7 case)
- ~32 lines from workflow-builder-handler.js (o7 model mapping)
- Various single-line removals across other files
- **Total: ~550+ lines of o7 code removed**

### Lines Added
- ~1 line in content.js (huggingface to supportsFunctionCalling)
- ~765 lines in README.md (comprehensive rewrite)

---

## Migration Notes

### Automatic Migration
- Existing o7 API configurations will no longer work
- Users should switch to Anthropic provider (same Claude models, direct API)
- No data loss - settings are preserved in Chrome storage

### Breaking Changes
- **o7 API provider removed** - Users must switch to Anthropic or another provider
- o7 API keys will remain in storage but won't be used

### Deprecated Features (from v1.6.0)
- **Cohere** - Auto-migrated to Google Gemini
- **Local LLM** - Auto-migrated to Google Gemini

---

## Support

- **GitHub Issues**: [Issues](https://github.com/eros1sh/n8n-workflow-agent/issues)
- **Email**: root@eros.sh
- **Telegram**: @eros_sh

---

**Version:** 1.6.1
**Release Date:** 2026-02-11
**Status:** Production Ready
