import clak from "chalk";
import { select, isCancel } from "@clack/prompts";
import { runAgentMode } from "./agent/orchestrator.ts";

export async function runCliMode() {
    while (true) {
        const mode = await select({
            message: "Choose CLI sub-mode",
            options: [
                { value: "agent", label: "Agent Mode" },
                { value: "plan", label: "Plan Mode" },
                { value: "ask", label: "Ask Mode" },
                { value: "back", label: "<- Back to main menu" },
            ],
        });

        if (isCancel(mode) || mode === "back") {
            console.log(clak.dim("\n Returning to main menu. \n"));
            return;
        }

        if (mode === "agent") {
            await runAgentMode();
            // console.log(clak.dim("\n Starting Agent Mode \n"));
            // Implement Agent Mode logic here
        }

        if (mode === "plan") {
            console.log(clak.dim("\n Starting Plan Mode \n"));
            // Implement Plan Mode logic here
        }
        
        if (mode === "ask") {
            console.log(clak.dim("\n Starting Ask Mode \n"));
            // Implement Ask Mode logic here
        }

        if (mode !== "agent" && mode !== "plan" && mode !== "ask") {
            console.log(clak.red("\n That mode is not implemented yet. \n"));

        }

    }
}