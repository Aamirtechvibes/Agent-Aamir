import { isCancel, text } from "@clack/prompts"
import chalk from "chalk";
import { defaultAgentConfig } from "./types";
import { ActionTracker } from "./actionTracker";
import { ToolExecutor } from "./tool-executor.ts";
import { createAgentTools } from "./agent-tools.ts";
import { stepCountIs, ToolLoopAgent } from "ai";
import { getAgentModel } from "../../ai";
import { renderTerminalMarkdown } from "../../terminalUserInterface/terminal-md.ts";
import { runApprovalFlow } from "./approval.ts";

export async function runAgentMode() {
    console.log(chalk.bold("\n🤖 Agent Mode\n"));

    const goal = await text({
        message: "What would you like to accomplish?",
        placeholder: "I want to build a todo web app",
    });

    if (isCancel(goal) || !goal.trim()) {
        console.log(chalk.red("✖ Operation cancelled"));
        return;
    }

    const config = defaultAgentConfig();
    const tracker = new ActionTracker();
    const executor = new ToolExecutor(tracker, config);
    const tools = createAgentTools(executor);

    const agent = new ToolLoopAgent({
        model: getAgentModel(),
        stopWhen: stepCountIs(40),
        instructions: [
            `Workspace root: ${config.codebasePath}`,
            "All mutations are staged until approval.",
        ].join("\n"),
        tools,
    });

    const result = await agent.generate({
        prompt: goal.trim(),
        onStepFinish: ({ toolCalls }) => {
            for (const tc of toolCalls) {
                const preview = JSON.stringify(tc.input).slice(0, 160);
                console.log(
                    chalk.green("  ✓"),
                    chalk.bold(String(tc.toolName)),
                    chalk.dim(preview + (preview.length >= 160 ? "..." : "")),
                );
            }
        },
    });

     //if (result.text?.trim()) console.log(result.text);
    if (result.text?.trim()) console.log(renderTerminalMarkdown(result.text));

    const ok = await runApprovalFlow(tracker);
    if (!ok) return executor.clearStaging();

    const { errors } = executor.applyApprovedFromTracker();

    if (errors.length) {
        console.log(chalk.red("\nSome operations reported errors:\n"));
        for (const e of errors) console.log(chalk.red(`  • ${e}`));
    }
    else {
        console.log(chalk.green('\n✓ Applied.\n'));
    }

    executor.clearStaging()
}