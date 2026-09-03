#!/usr/bin/env bun

import { Command } from "commander";
import { runWakeUp } from "./terminalUserInterface/wakeUp.ts";

const program = new Command();

program
    .name("agent-build")
    .description(" AUTONOMOUS ARTIFICIAL MOBILE INTELLIGENCE & RECONNAISSANCE")
    .version("0.0.1");

program
    .command("wakeup")
    .description("Show the banner and pick cli or telegram mode")
    .action(async () => {
        await runWakeUp()
    });

await program.parseAsync(process.argv);