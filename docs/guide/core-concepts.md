# Core Concepts

AgenTree enables building AI agents that solve complex problems by dividing them into subtasks, with each agent focused on a specific goal. Here are the key concepts with detailed explanatory diagrams.

## 1. Hierarchy: Agents as a Tree Structure

### Principle
The system starts with a root agent (Agent 0) that receives the main task. Each agent can create child agents for subtasks, forming a tree structure that enables clear delegation and specialization. Once a child is finished, it can return results to its parent.

### Diagram: Hierarchical Structure

```
                        ┌─────────────┐
                        │    USER     │
                        │             │
                        └──────┬──────┘
                               │ task
                               ▼
                    ┌─────────────────────┐
                    │      Agent 0        │
                    │   "Analyze tech     │
                    │      market"        │
                    └──────────┬──────────┘
                               │
                ┌──────────────┼──────────────┐
                │              │              │
                ▼              ▼              ▼
    ┌───────────────────┐ ┌─────────────┐ ┌──────────────────┐
    │      Agent 1      │ │   Agent 2   │ │     Agent 3      │
    │     "Research     │ │ "Analyze    │ │   "Synthesize    │
    │      trends"      │ │ competition"│ │    results"      │
    └─────────┬─────────┘ └──────┬──────┘ └────────┬─────────┘
              │                  │                 │
        ┌─────┴─────┐            │           ┌─────┴─────┐
        ▼           ▼            ▼           ▼           ▼
    ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
    │Agent 1.1│ │Agent 1.2│ │Agent 2.1│ │Agent 3.1│ │Agent 3.2│
    │"Gen AI" │ │"Crypto" │ │"Startups│ │"Charts" │ │"Report" │
    └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘
```

**Tree structure properties:**
- Each agent knows only its own task and children
- Sibling agents can work in parallel *(not implemented yet)*

---

## 2. Task Decomposition: Divide and Conquer

### Principle
AgenTree agents recursively break down complex tasks into smaller, manageable subtasks. Each subtask is assigned to a new agent, which can itself decompose further if needed.

### Diagram: Decomposition Process

```
┌─────────────────────────────────────────────────────────────────────┐
│                              MAIN TASK                              │
│                     "Build e-commerce application"                  │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
               ┌───────────────┼───────────────┐
               │               │               │
               ▼               ▼               ▼
       ┌───────────────┐ ┌────────────┐ ┌─────────────────┐
       │   SUBTASK 1   │ │ SUBTASK 2  │ │  SUBTASK 3      │
       │ "Backend API" │ │ "Frontend" │ │ "Deployment"    │
       └──┬────────────┘ └──────┬─────┘ └───────────────┬─┘
          │                     │                       │
     ┌────┴──────┐          ┌───┴───────┐           ┌───┴────────┐
     ▼           ▼          ▼           ▼           ▼            ▼
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌──────────┐
│Auth API │ │Shop API │ │React UI │ │Cart UI  │ │Docker   │ │AWS Config│
│(Agent A)│ │(Agent B)│ │(Agent C)│ │(Agent D)│ │(Agent E)│ │(Agent F) │
└─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └──────────┘
```

**Decomposition flow:**
```
1. Agent receives task → Analyzes complexity
                          ↓
2. If complex → Decomposes into subtasks
                          ↓
3. Creates child agents → Assigns subtasks
                          ↓
4. Each child → Repeats process if necessary
```

---

## 3. Tools: Capabilities Controlled by Parents

### Principle
Each agent can only use the tools (functions, MCPs, etc.) that its parent assigns. This ensures controlled access and appropriate specialization.

### Diagram: Tool Assignment

```
┌────────────────────────────────────────────────────┐
│                    PARENT AGENT                    │
│                  "Data analyzer"                   │
│                                                    │
│  Available tools:                                  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│  │ readFile    │ │ writeFile   │ │ sqlQuery    │   │
│  │ httpRequest │ │ bashCommand │ │ pythonCode  │   │
│  └─────────────┘ └─────────────┘ └─────────────┘   │
└───────────────────────┬────────────────────────────┘
                        │ SELECTIVELY DELEGATES
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
┌─────────────────┐ ┌─────────────┐ ┌─────────────────┐
│   CHILD AGENT   │ │ CHILD AGENT │ │  CHILD AGENT    │
│  "Read data"    │ │"Process SQL"│ │"Generate report"│
│                 │ │             │ │                 │
│ Assigned tools: │ │ Assigned:   │ │ Assigned tools: │
│ ┌─────────────┐ │ │┌──────────┐ │ │ ┌─────────────┐ │
│ │ readFile    │ │ ││sqlQuery  │ │ │ │ writeFile   │ │
│ │ httpRequest │ │ ││pythonCode│ │ │ │ pythonCode  │ │
│ └─────────────┘ │ │└──────────┘ │ │ └─────────────┘ │
└─────────────────┘ └─────────────┘ └─────────────────┘
```

**Tool Control Matrix:**
```
Tool           │ Parent  │ Child 1  │ Child 2  │ Child 3
─────────────────────────────────────────────────────────
readFile       │   ✅   │    ✅    │    ❌    │    ❌
writeFile      │   ✅   │    ❌    │    ❌    │    ✅
sqlQuery       │   ✅   │    ❌    │    ✅    │    ❌
httpRequest    │   ✅   │    ✅    │    ❌    │    ❌
pythonCode     │   ✅   │    ❌    │    ✅    │    ✅
bashCommand    │   ✅   │    ❌    │    ❌    │    ❌
```

---

## 4. System Prompt & Instructions: Context from Parents

### Principle
Each agent receives a system prompt and instructions from its parent, defining its role and approach. This mechanism ensures specialization and alignment with the overall strategy.

### Diagram: Context Transmission

```
┌────────────────────────────────────────────────────────────┐
│                    PARENT AGENT                            │
│              "AI Project Manager"                          │
│                                                            │
│ Global configuration:                                      │
│ • Objective: Develop chatbot                               │
│ • Budget: $50k                                             │
│ • Timeline: 3 months                                       │
│ • Stack: Python + FastAPI                                  │
└─────────────────────┬──────────────────────────────────────┘
                      │ TRANSMITS SPECIALIZED CONTEXT
      ┌───────────────┼───────────────┐
      │               │               │
      ▼               ▼               ▼
┌────────────────────────────────────────────────────────────┐
│                 CHILD AGENT 1                              │
│              "Backend Developer"                           │
│                                                            │
│ Received system prompt:                                    │
│ "You are a backend developer expert in Python.             │
│ Your mission: create REST API for the chatbot.             │
│ Allocated budget: $20k. Timeline: 6 weeks.                 │
│ Use FastAPI, PostgreSQL, and Docker."                      │
│                                                            │
│ Specific instructions:                                     │
│ • Implement JWT authentication                             │
│ • Create message endpoints                                 │
│ • Integrate with AI model                                  │
│ • Document with OpenAPI                                    │
└────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                 CHILD AGENT 2                              │
│              "UX/UI Designer"                              │
│                                                             │
│ Received system prompt:                                     │
│ "You are a UX/UI designer specialized in conversational    │
│ interfaces. Your mission: create the chatbot interface.    │
│ Budget: $15k. Timeline: 4 weeks."                          │
│                                                             │
│ Specific instructions:                                      │
│ • Create wireframes and mockups                            │
│ • Follow WCAG 2.1 accessibility                            │
│ • Responsive design (mobile-first)                         │
│ • Prototype interactions with Figma                        │
└─────────────────────────────────────────────────────────────┘
```

### Quality Standards

All agents and subagents are instructed to produce production-grade outputs:
- Build working, end-to-end deliverables (not demos or placeholders)
- Handle edge cases and include minimal validation and sensible defaults
- Keep outputs maintainable and documented with short usage notes
- Clearly mark any remaining gaps and propose concrete next steps

This expectation is embedded directly in the system prompt so children inherit it automatically, even when a role-specific systemPrompt is provided.

---

## 5. Events & Monitoring: Transparent Execution
# Events & Monitoring: Transparent Execution

## Principle
Events are emitted step by step as agents and their children work. This enables real-time monitoring and debugging capabilities.

```
Main Agent (0)
    │
    ├─ agentCreated
    ├─ taskStarted
    │
    ├─ childCreated → Agent 1
    │                    │
    │                    ├─ agentCreated
    │                    ├─ toolCallStarted (searchAPI)
    │                    ├─ toolCallCompleted (200 results)
    │                    └─ agentCompleted ✅
    │
    ├─ childCreated → Agent 2
    │                    │
    │                    ├─ agentCreated  
    │                    ├─ toolCallStarted (webScraping)
    │                    ├─ toolCallError (403 Forbidden) ❌
    │                    ├─ toolCallStarted (retry with headers)
    │                    ├─ toolCallCompleted (data retrieved) ✅
    │                    └─ agentCompleted ✅
    │
    └─ agentCompleted ✅ (full success)

```

## Timeline View

```
Time    Agent 0         Agent 1         Agent 2
----    -------         -------         -------
T0      agentCreated    
T1      taskStarted     
T2      childCreated    
T3                      agentCreated    
T4      childCreated                    
T5                      toolCallStarted 
T6                                      agentCreated
T7                      toolCallCompleted
T8                                      toolCallStarted
T9                      agentCompleted  
T10                                     toolCallError
T11                                     toolCallStarted (retry)
T12                                     toolCallCompleted
T13                                     agentCompleted
T14     agentCompleted  
```

## 6. Output: Structured Results

### Principle
All results, logs, and reports are saved in a folder tree structure that mirrors the agent hierarchy, making it easy to review and analyze what happened at each level.

### Diagram: Output File Structure

```
.agentree/
├── 📁 main-agent/                           ← Root agent (Agent 0)
│   ├── 📄 agent-report.md                   ← Main report
│   ├── 📄 execution-log.json                ← Detailed log
│   ├── 📄 task-summary.md                   ← Task summary
│   ├── 📁 tools-output/                     ← Tool outputs
│   │   ├── 📄 search-results.json
│   │   └── 📄 api-responses.json
│   │
│   ├── 📁 research-agent/                   ← Child agent 1
│   │   ├── 📄 agent-report.md
│   │   ├── 📄 execution-log.json
│   │   ├── 📁 ai-trends-agent/              ← Grandchild agent 1.1
│   │   │   ├── 📄 agent-report.md
│   │   │   ├── 📄 trends-data.csv
│   │   │   └── 📄 analysis-charts.png
│   │   │
│   │   └── 📁 crypto-trends-agent/          ← Grandchild agent 1.2
│   │       ├── 📄 agent-report.md
│   │       └── 📄 crypto-analysis.json
│   │
│   ├── 📁 competitor-agent/                 ← Child agent 2
│   │   ├── 📄 agent-report.md
│   │   ├── 📄 execution-log.json
│   │   ├── 📄 error-log.txt                 ← Encountered errors
│   │   └── 📁 startup-analysis-agent/       ← Grandchild agent 2.1
│   │       ├── 📄 agent-report.md
│   │       └── 📄 startup-data.json
│   │
│   └── 📁 synthesis-agent/                  ← Child agent 3
│       ├── 📄 agent-report.md
│       ├── 📄 execution-log.json
│       ├── 📁 chart-generator-agent/        ← Grandchild agent 3.1
│       │   ├── 📄 agent-report.md
│       │   └── 📄 market-charts.html
│       │
│       └── 📁 report-writer-agent/          ← Grandchild agent 3.2
│           ├── 📄 agent-report.md
│           └── 📄 final-market-report.pdf   ← Final deliverable
```