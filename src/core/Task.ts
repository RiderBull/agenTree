import { TaskContext } from '../types';
import { Context } from './Context';

import { TaskParams } from '../types';

export class Task {
  public readonly name: string;
  public readonly description: string;
  public readonly context: TaskContext;
  public readonly contextItems: string[];
  public readonly systemPrompt?: string;

  constructor(name: string, description: string, contextItems: string[] = [], systemPrompt?: string) {
    this.name = name;
    this.description = description;
    this.contextItems = contextItems;
    this.context = { files: {}, urls: {}, text: [] };
    this.systemPrompt = systemPrompt;
  }

  static fromParams(params: TaskParams): Task {
    return new Task(
      params.name,
      params.description,
      params.contextItems ?? [],
      params.systemPrompt
    );
  }

  public async loadContext(): Promise<void> {
    const loadedContext = await Context.loadContext(this.contextItems);
    Object.assign(this.context, loadedContext);
  }

  public getSystemPrompt(): string {
    const qualityRules = `
  Quality standards:
  - Aim for production-ready results, not demos or placeholders.
  - Prefer working, end-to-end deliverables with clear instructions to run.
  - Handle edge cases and failure modes; include sensible defaults and validation.
  - Keep changes reversible and minimal-risk; document assumptions and trade-offs.
  - Write concise, maintainable outputs; avoid unnecessary boilerplate.
  - If something cannot be completed fully, clearly mark gaps and propose next steps.`;

    const decompositionRules = `
  Decomposition rules:
  - First, list the minimal set of subtasks to achieve the goal.
  - For each subtask, decide: can I complete this directly, or is it large/uncertain enough to warrant a child agent?
  - If it needs a child agent, create it with createAgent and pass only the required tools and context.
  - One agent per atomic subtask: do not create a generalist child to handle multiple or all tasks. Each child owns exactly one clearly defined subtask.
  - When creating a child, explicitly state the expected deliverables/output format and success criteria in its task or systemPrompt.
  - Child agents follow the same logic (may spawn subagents up to maxDepth).`;

    const operatingRules = `
  Operating rules:
  - Before each action, write one short line explaining what you do next and why.
  - Don’t use a tool without a one-line justification.
  - Prefer precision and focus; avoid redundant steps.`;

    const verificationRules = `
  Verification before completion:
  - Before calling stopAgent, verify your outputs meet the requested deliverables and success criteria.
  - Where feasible, run quick tests or smoke checks using available tools (e.g., run scripts, validate file contents, basic runtime checks).
  - If issues are found, adjust and re-verify until acceptable or you’ve reached reasonable diminishing returns.
  - If verification isn’t possible, explain why, list residual risks, and provide concrete next steps for manual validation.
  - In your final result, briefly summarize what you verified and the outcome.`;

    const header = this.systemPrompt
      ? `${this.systemPrompt}`
      : `You are a hierarchical planner-executor. Your task: ${this.description}`;

    return `${header}

${decompositionRules}

${operatingRules}

${verificationRules}

${qualityRules}`;
  }

  public getUserPrompt(): string {
    let user_prompt = `${this.description}`;
    if (this.context.files) {
      user_prompt += `\n\nFiles:\n${Object.keys(this.context.files).join('\n')}`;
    }
    if (this.context.urls) {
      user_prompt += `\n\nURLs:\n${Object.keys(this.context.urls).join('\n')}`;
    }
    if (this.context.text && this.context.text.length > 0) {
      user_prompt += `\n\nText:\n${this.context.text.join('\n')}`;
    }
    return user_prompt;
  }
}
