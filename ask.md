# Ask Mode

## Question

what is inside the /mode/agent explain me with example

## Answer

## What's Inside `/mode/agent`

The `/mode/agent` directory contains the core implementation of an **AI-powered agent** that operates within your workspace. Here's a breakdown of each component:

### 1. **`types.ts`** – Core Data Structures
Defines the shapes of everything the agent works with:

| Type | Description |
|------|-------------|
| `ActionType` | Possible actions: `file_create`, `file_modify`, `file_delete`, `folder_create`, `code_analysis`, `tool_execute` |
| `ActionStatus` | `pending` → `executed` → `approved` → `rejected` |
| `ActionLog` | Records every action with ID, timestamp, type, path, details, status, and whether it was approved |
| `AgentConfig` | Config for the agent: codebase path, max file size, excluded patterns (node_modules, .git, dist, etc.), and tool permissions |

### 2. **`agent-tools.ts`** – Available Tools (Operations)
These are the "functions" the agent can call:

- **`createFile`** – Stages a new file (content is saved temporarily, not applied yet)
- **`modifyFile`** – Replaces an entire file with new content (staged)
- **`deleteFile`** – Stages deletion of a file (staged)
- **`createFolder`** – Creates a directory tree (via `mkdir -p`)
- **`listFiles`** – Lists files recursively under a path
- **`searchFiles`** – Finds files by glob pattern (e.g., `*.ts`, `**/*.md`) or content substring
- **`analyzeCodebase`** – Summarizes project structure (file counts, sizes, extensions)
- **`executeShell`** – Queues arbitrary shell commands for execution
- **`readFile`**, **`readSkill`** – Read content from files or SKILL.md files

### 3. **`orchestrator.ts`** – Main Agent Loop
The brain that ties everything together:

1. Asks the user for a goal ("What would you like to accomplish?")
2. Sets up the agent with a language model and configuration
3. Runs a conversation where the user provides feedback
4. Executes staged actions through the tools
5. Handles the **approval flow** – human review before applying changes

### 4. **`actionTracker.ts`** – Activity Logging
Tracks every action with a complete audit trail (ID, timestamp, type, path, status, approval flag).

---

## Example Walkthrough

Imagine you're in this agent and say:

> **"Create a new file called `todo-list.md` with a simple todo list"**  

Here's what happens step-by-step:

1. **Goal received**: `"Create a new file called todo-list.md with a simple todo list"`
2. **Tool invoked**: `createFile` (staged)  
   - Action logged: `{ type: "file_create", path: "todo-list.md", details: { content: "..." }, status: "pending" }`
3. **Preview shown**: You see the proposed file content
4. **Waiting for approval** – You review the staged change
5. **If you approve**: The file is created permanently (`modifyFile` or `createFile` becomes `executed`)
6. **If you reject**: The staging is cleared and nothing changes

### Another Example

> **"Search for all TypeScript files in the src/ directory"**

- **Tool invoked**: `searchFiles` with `root="src/"` and `pattern="*.ts"`
- **Result**: Returns a list of matching files (e.g., `src/components/Button.ts`, `src/utils/helper.ts`)
- **Output**: You get a filtered list of files to work with

---

## Key Takeaway

The `/mode/agent` directory implements a **safe, human-in-the-loop development assistant**. All changes are **staged first** (created, modified, deleted) and require **explicit human approval** before being applied to the actual codebase. This prevents accidental damage while still giving you powerful automation capabilities.
