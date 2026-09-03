# agent-aamir

An AI-powered development agent built with TypeScript and Bun, designed to automate codebase tasks including file operations, code analysis, shell execution, and project management. This agent leverages modern tooling to provide intelligent assistance for software development workflows.

## Features

- **File Management**: Create, read, modify, and delete files with staged changes
- **Code Analysis**: Search, analyze, and understand codebase structure
- **Shell Integration**: Execute commands safely with approval workflows
- **Project Scaffolding**: Generate folders and boilerplate structures
- **Skill System**: Extensible capabilities via skill definitions

## Tech Stack

- **Runtime**: Bun v1.3.14 (fast JavaScript/TypeScript runtime)
- **Language**: TypeScript with strict type checking
- **Architecture**: Modular tool-based design for extensibility

## Quick Start

```bash
# Install dependencies
bun install

# Run the agent
bun run index.ts
```

## Project Structure

```
agent-aamir/
├── index.ts          # Entry point
├── tools/            # Core tool implementations
├── skills/           # Extensible skill definitions
└── readme.md         # This file
```

Built with ❤️ using [Bun](https://bun.sh) — the fast all-in-one JavaScript runtime.