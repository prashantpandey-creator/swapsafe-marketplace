---
description: How to deploy multiple agents for parallel task execution
---

# Multi-Agent Task Deployment

Use this workflow to break down complex issues into separate tasks that can be executed by multiple agent sessions in parallel.

## When to Use
- Complex bugs affecting multiple files/systems
- Multiple independent features to implement
- Tasks that don't have cross-dependencies

## How It Works

### 1. Create Task Specs
For each sub-task, create a standalone task file in `.agent/tasks/`:

```
.agent/tasks/
├── task-001-quicksell-flow.md
├── task-002-ai-enhance.md
└── task-003-3d-studio.md
```

### 2. Task File Structure
Each task file should contain:
```markdown
# [TASK-ID] Task Name

## Objective
Clear, single-sentence goal

## Context
- Files to modify: [list]
- Dependencies: [other tasks, if any]
- DO NOT MODIFY: [files being edited by other agents]

## Detailed Steps
1. Step 1
2. Step 2

## Verification
How to confirm the task is complete

## Agent Instructions
Copy this entire file content and paste into a new agent conversation.
```

### 3. Deploy to Separate Windows
1. Open multiple browser tabs/windows
2. Start a new conversation in each
3. Paste the task file content as the first message
4. Let each agent work independently

### 4. Merge Results
After all agents complete:
- Pull changes if using git
- Run build to verify no conflicts
- Test integrated functionality

## File Lock Convention
To prevent conflicts, each task spec should include:
- `MODIFY:` - Files this agent will edit
- `READ-ONLY:` - Files to reference but not change
- `AVOID:` - Files being edited by other agents

// turbo-all
