# Copilot Instructions for agenTree

Purpose: Help AI coding agents work effectively in this repo by understanding architecture, workflows, and conventions.

## Big picture
- Core runtime lives in `src/core/Agent.ts` with supporting classes:
  - `Task` and `Context` (context loading, prompt building)
  - `LLMClient` + `OpenAIClient` in `src/llm/` (chat and streaming)
  - Tool system: `src/tools/ToolHelper.ts` (Zod -> JSON Schema, validation), `ToolRegistry.ts`, defaults in `src/tools/defaults/`, built-ins in `src/tools/builtins/`
  - Output/monitoring: `src/output/StreamingOutputManager.ts` (markdown + json logs), events typed in `src/types/events.ts`
- Execution flow (Agent): system+user prompts → LLM call (tools exposed) → handle tool_calls → possibly spawn child agents (`createAgent`) → loop until `stopAgent`.
- Why: Encapsulate task decomposition via recursive agents while keeping a clean tool interface and auditable output.

## Key conventions
- Default LLM config (code): baseUrl `https://api.openai.com/v1`, model default `gpt-5`, streaming `false`, output files enabled to `.agentree/`.
- Tools are defined via `tool({ name, description, parameters: z.object(...), execute })` and must return a string (or JSON string).
- Child agents: `createAgent` requires a non-empty `tools` array. Tool names must be clean (strip any `functions.`/`tools.` prefix before providing).
- Depth limits: `maxDepth` enforced (1–10, default 5). `createAgent` throws if exceeded.
- Completion: LLM should call `stopAgent` when finished; the runtime also treats plain assistant content (no tool calls) as completion.

## Important files and patterns
- `src/core/Agent.ts`:
  - Maintains `messages: LLMMessage[]` transcript and `children: Agent[]`.
  - `execute()` sets up output, loads context, creates prompts, and loops calling `executionStep()`.
  - Streaming: `handleStreamingLLMCall` reconstructs fragmented `tool_calls` by index→id mapping and validates JSON args.
  - Emits typed events: `agentCreated/Started/Completed/Error`, `contextLoaded`, `llmCall`, `toolCallStarted/Completed`, `toolCalls` (legacy batch), `streamChunk`, `childCreated`.
- `src/llm/OpenAIClient.ts`:
  - Wraps OpenAI SDK; `chat()` for non-streaming, `chatStream()` yields chunks with deltas and partial tool_calls.
  - Adapts internal `LLMMessage` to OpenAI message params, preserving `tool_calls` and `tool_call_id`.
- `src/tools/`:
  - `ToolHelper.ts`: Zod→JSON Schema conversion and runtime arg validation (`strict` by default).
  - `ToolRegistry.ts`: global registry so children can use tools by name when parent passed tool objects.
  - Defaults: `readFile`, `writeFile`, `searchTool`, `replaceFile`, `bash`, `listTree`.
  - Built-ins: `createAgent` (spawns child) and `stopAgent` (marks completion) are always available (createAgent gated by depth).
- `src/output/StreamingOutputManager.ts`:
  - Writes `agent-report.md`, `conversation.md`, `execution-log.json`, and `metadata.json` under `.agentree/<agent-name>/[child…]`.
  - Tracks stats (messages, llmCalls, toolsUsed, childrenCreated) and updates a report summary.

## Developer workflows
- Build: `npm run build` (tsc). Dev watch: `npm run dev`.
- Examples:
  - Simple: `npm run example` (requires `OPENAI_API_KEY` env var; see `examples/simple.ts`).
  - Terminal UI: `npx tsx examples/terminal.ts "your task"`.
- Output viewers/cleanup (helpful during dev):
  - `npm run view list|show|summary|tree|logs|watch|export`
  - `npm run cleanup stats|old|failed|archive`
- Tests: `npm run test` (Jest is configured but tests may be sparse).

## Integration points
- LLM provider: Uses `openai` SDK; models are configured by `model` string and `baseUrl` (OpenAI/Azure/compatible APIs). Default model is `gpt-5` (override via Agent config or env).
- Environment variables commonly used in examples: `OPENAI_API_KEY`.

## When adding features
- New tools: Prefer `tool()` with Zod schemas; return concise strings; register or pass object so children can use them by name.
- New events: Add types to `src/types/events.ts` and emit in `Agent` where the action occurs; mirror in `StreamingOutputManager` if it should be recorded.
- Output changes: Update `StreamingOutputManager` and corresponding writers in `src/output/FileWriters.ts`.
- Child agent behavior: Ensure you pass `parentPath` so child outputs nest correctly; forward child events if you add new ones.

## Examples that demonstrate patterns
- `examples/simple.ts`: local custom tool (calculator), non-streaming execution.
- `examples/terminal.ts`: streaming with live hierarchy display and fine-grained event handling.
- `src/tools/defaults/listTree.ts`: good example of fs traversal, filtering, and formatted output.

## Gotchas
- If using tool names for children, ensure they’re registered in `ToolRegistry` (passing tool objects to the parent auto-registers them).
- `writeFile` will refuse overwrite unless `overwrite=true`.
- Streaming tool calls are only kept if arguments JSON parses; malformed chunks are discarded with a warning.
- `maxDepth` outside 1–10 throws; `createAgent` also enforces non-empty `tools`.
