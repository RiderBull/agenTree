# AgenTree 🌳

[![npm version](https://badge.fury.io/js/agentree.svg)](https://www.npmjs.com/package/agentree)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Hierarchical AI agents that summon other agents recursively, like a Tree**

AgenTree is a TypeScript library that enables AI agents to recursively break down complex tasks by creating specialized child agents. Each agent can dynamically define the role, context, and tools of its children, forming an intelligent task decomposition tree.

## Concept

An agent receives a complex task, analyzes what subtasks are needed, creates child agents with specific roles and tools, and coordinates their execution. Each child can create its own children up to a configurable depth, forming an execution tree.


```
📋 Task: "Research and write market analysis"
└── 📊 Market Research Agent
    ├── 🔍 Data Collection Agent  
    ├── 📈 Trend Analysis Agent
    └── 💰 Competitor Analysis Agent
└── ✍️ Writing Agent
    └── 📝 Report Generation Agent
```

## Installation

```bash
npm install agentree zod
```

## Basic Usage

```typescript
import { Agent, tool } from 'agentree';
import { z } from 'zod';

// Define tools using Zod schemas
const webSearchTool = tool({
  name: 'web_search',
  description: 'Search the web for information',
  parameters: z.object({
    query: z.string(),
    maxResults: z.number().default(5)
  }),
  async execute({ query, maxResults }) {
    // Your implementation
    return `Search results for: ${query}`;
  }
});

// Create and execute agent
const agent = new Agent({
  name: "researcher",
  task: "Research latest developments in quantum computing",
  tools: [webSearchTool],
  maxDepth: 3,
  model: "gpt-5",
  apiKey: process.env.OPENAI_API_KEY,
  outputFile: true
});

const result = await agent.execute();
```

→ [More examples in documentation](https://remenby31.github.io/agenTree/examples/)

## Architecture

### How it works (runtime lifecycle)

1) Construction
- Validates `apiKey` and `model`, creates a Task, resolves tools (objects or by name via `ToolRegistry`).
- Initializes the LLM client (`OpenAIClient`) and, if `outputFile` is true, a `StreamingOutputManager` to write logs/reports under `.agentree/`.
- Emits `agentCreated`.

2) Context → Prompts
- `Task.loadContext()` loads files/URLs/text via `Context.loadContext`.
- System prompt = default (or your `systemPrompt`) with an instruction to finalize via `stopAgent`.
- User prompt = task description + lists of context keys (file paths, URLs, text snippets).

3) Main loop
- Computes available tools (your tools + built-ins: `createAgent` if depth < `maxDepth`, and `stopAgent`).
- Emits `llmCall`, then calls the LLM once per step.
- Non‑streaming: `llmClient.chat(...)` returns `content` and optional `tool_calls`.
- Streaming: accumulates chunks; reconstructs fragmented tool calls (keeps index→id mapping, validates JSON args).
- Pushes the assistant message into the transcript and records it.
- If tool calls exist → executes them (see below). If not and there is content → stops with that content as the final result.

4) Tool calls
- Emits `toolCallStarted` and later `toolCallCompleted` per call (with `duration`, `toolOutput` or `toolError`).
- Built‑ins:
  - `createAgent(params)`: spawns a child Agent (inherits config/output settings), enforces `maxDepth`, forwards child events to the parent, waits for child completion, returns a summary string.
  - `stopAgent({ result, success? })`: marks the agent as completed.
- User tools: validated by Zod (via the `tool(...)` helper) and executed; results/errors are appended as `tool` messages so the LLM can continue.

5) Completion & errors
- On `stopAgent`, sets `isCompleted` and stores the `AgentResult` with `children` results.
- Emits `agentCompleted` and finalizes the Markdown/JSON outputs. Any thrown error emits `agentError` and is recorded.

6) Output & events
- Outputs (when enabled): `agent-report.md`, `conversation.md`, `execution-log.json`, `metadata.json`, plus child folders for child agents.
- Events you can subscribe to: `agentCreated/Started/Completed/Error`, `contextLoaded`, `llmCall`, `toolCallStarted/Completed`, `toolCalls` (batch, legacy), `streamChunk` (if streaming), `childCreated`.

Tips & pitfalls
- API key is required; model defaults exist but can be overridden.
- Passing tools by object auto‑registers them for children; passing by name requires prior registration.
- `writeFile` refuses to overwrite unless `overwrite=true`.
- Streaming tool calls only kept if arguments parse as valid JSON.
- `maxDepth` caps recursion; `createAgent` throws if exceeded.

Extend quickly
- Create tools with `tool({ name, description, parameters: z.object(...), execute })` and pass them in `tools: [myTool]` (or register and pass by name).
- Use `defaultTools` for file/search/bash utilities.
- Enable `streaming: true` to receive `streamChunk` updates; keep `outputFile: true` for reports.

### Built-in Tools

Every agent has access to:
- `createAgent`: Spawn child agents for subtasks
- `stopAgent`: Return final results

and there are optional built-in tools for common tasks:
- Default tools: `readFile`, `writeFile`, `listTree`, `searchTool`, `replaceFile`, `bash`

→ [Built-in tools reference](https://remenby31.github.io/agenTree/api/built-in-tools)

### Custom Tool Creation

```typescript
const dbQueryTool = tool({
  name: 'query_database',
  description: 'Execute SQL queries',
  parameters: z.object({
    query: z.string(),
    params: z.array(z.any()).optional()
  }),
  async execute({ query, params = [] }) {
    return await database.query(query, params);
  }
});
```

→ [Custom tools guide](https://remenby31.github.io/agenTree/guide/custom-tools)

### Event System

Monitor agent execution with typed events:

#### Basic Monitoring

```typescript
// Simple progress tracking
agent.on('agentCompleted', (data) => {
  console.log(`✅ ${data.name} finished in ${data.executionTime}ms`);
});

agent.on('childCreated', (data) => {
  console.log(`👶 Created child: ${data.childName}`);
});

agent.on('agentError', (data) => {
  console.error(`❌ Error in ${data.name}: ${data.error}`);
});
```

#### Tool Performance Tracking

```typescript
const toolMetrics = new Map();

agent.on('toolCallStarted', (data) => {
  toolMetrics.set(data.toolCallId, Date.now());
});

agent.on('toolCallCompleted', (data) => {
  console.log(`🔧 ${data.toolName}: ${data.duration}ms`);
  if (data.toolError) {
    console.error(`   Error: ${data.toolError}`);
  }
});
```

#### Real-time Streaming

```typescript
agent.on('streamChunk', (data) => {
  if (data.chunk.content) {
    process.stdout.write(data.chunk.content);
  }
});
```

#### Complete Event Reference

| Event | Description | Key Data Properties |
|-------|-------------|-------------------|
| `agentCreated` | Agent instance created | `id`, `name`, `task`, `depth`, `parentId?` |
| `agentStarted` | Agent execution started | `id`, `name`, `depth` |
| `agentCompleted` | Agent execution finished | `id`, `name`, `result`, `executionTime`, `success` |
| `agentError` | Error occurred in agent | `id`, `name`, `error`, `stack?` |
| `contextLoaded` | Context files/URLs loaded | `id`, `name`, `context: {fileCount, urlCount, textCount}` |
| `llmCall` | LLM API call initiated | `id`, `name`, `messageCount`, `availableTools[]` |
| `toolCalls` | Tool execution batch (legacy) | `id`, `name`, `toolCalls[]`, `toolDetails?` |
| `toolCallStarted` | Individual tool started | `id`, `name`, `toolName`, `toolInput`, `toolCallId` |
| `toolCallCompleted` | Individual tool finished | `id`, `name`, `toolName`, `toolOutput?`, `toolError?`, `duration` |
| `streamChunk` | Streaming response chunk | `id`, `name`, `chunk: {content?, done}`, `accumulatedContent` |
| `childCreated` | Child agent created | `parentId`, `parentName`, `childId`, `childName`, `childTask` |

**Common properties**: All events include `id`, `name`, `timestamp`, `depth`, `parentId?`

→ [Complete event system guide](https://remenby31.github.io/agenTree/guide/event-system)

## Configuration

Configure agent behavior directly in the constructor:

```typescript
const agent = new Agent({
  // Required
  name: "agent-name",
  task: "Task description",
  
  // Optional agent configuration
  tools: [myTool1, myTool2],        // Custom tools
  context: ["./file1.txt"],         // Context files/URLs
  maxDepth: 5,                      // Max hierarchy depth (default: 5)
  systemPrompt: "Custom prompt",    // Override system prompt
  
  // Optional LLM configuration
  baseUrl: "https://api.openai.com/v1",  // LLM endpoint (default)
  model: "gpt-5",                   // Model name (default: gpt-5)
  apiKey: process.env.OPENAI_API_KEY,    // API key (required)
  outputFile: true,                 // Generate reports (default: true)
  outputFolder: ".agentree",        // Output directory (default)
  streaming: false                  // Enable streaming (default: false)
});
```



## Output Structure

Each execution generates structured reports:

```
.agentree/
└── researcher-2025-07-02-14-30/
    ├── agent-report.md          # Main report
    ├── conversation.md          # LLM conversation log
    ├── execution-log.json       # Event stream
    ├── metadata.json           # Agent metadata
    └── data-collector/         # Child agent folder
        ├── agent-report.md
        └── conversation.md
```

→ [Output management guide](https://remenby31.github.io/agenTree/guide/output-management)

## Default Tools

```typescript
import { defaultTools, readFileTool, writeFileTool } from 'agentree';

// Individual import
const agent = new Agent({
  tools: [readFileTool, writeFileTool]
});

// All default tools
const agent = new Agent({
  tools: defaultTools
});
```

Available: `readFile`, `writeFile`, `searchTool`, `replaceFile`, `bash`

→ [Default tools documentation](https://remenby31.github.io/agenTree/api/built-in-tools)

## Documentation

Complete documentation: [https://remenby31.github.io/agenTree/](https://remenby31.github.io/agenTree/)

- [Getting Started](https://remenby31.github.io/agenTree/guide/getting-started)
- [API Reference](https://remenby31.github.io/agenTree/api/agent)
- [Examples](https://remenby31.github.io/agenTree/examples/)

## Development

```bash
# Build
npm run build

# Development
npm run dev

# Examples
npm run example

# Cleanup
npm run cleanup old --keep 10
```

→ [Development guide](https://remenby31.github.io/agenTree/development/contributing)

### Project Structure

```
src/
├── core/           # Agent, Task, Config
├── llm/            # LLM clients
├── tools/          # Tool system
├── output/         # File generation
├── monitoring/     # Event system
└── types/          # TypeScript definitions
```

## License

MIT
