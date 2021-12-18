import { handleInput } from "../handleInput.js";
import { states, prompt, namePrompt } from "./prompt.js";

let currentState = states.READY;

export function initTerminal(agent) {
        function startloop(speaker) {
                // Start prompt loop
                setInterval(() => {
                        // Are we thinking? return
                        // Are we waiting for input? return
                        if (currentState != states.READY) return;
                        const questions = [
                                {
                                        type: 'input',
                                        name: "Input",
                                        message: `${speaker} >>>`
                                }
                        ];
                        prompt(questions).then(async (text) => {
                                await handleInput(text.Input, speaker, agent);
                                currentState = states.READY;
                        });
                        currentState = states.WAITING;
                }, 50);
        }

        setTimeout(() => {
                // If speaker was provided, start the request loop
                if (process.env.SPEAKER) {
                        startloop(process.env.SPEAKER);
                }
                // If no speaker was provided, prompt the user
                else {
                        prompt(namePrompt).then((text) => {
                                // Check for OpenAI key, this will help people who clone it to get started
                                if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes("XXXXX")) {
                                        return console.error("Please create a .env file in root of this directory and add your OpenAI API key to it");
                                }

                                startloop(text.Name);
                        });
                }
        }, 100)
}