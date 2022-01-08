import { handleInput } from "../handleInput.js";
import { states, prompt, namePrompt } from "./prompt.js";
import { searchWikipedia } from "./searchWikipedia.js";
import { __dirname } from "./__dirname.js";
import { makeGPTRequest } from "./makeGPTRequest.js";
import fs from "fs";
import { createAgent } from "./createAgent.js";

let currentState = states.READY;

export function initTerminal(agent) {
        let currentAgent = agent;

        function startloop(speaker) {
                // Start prompt loop
                setInterval(() => {

                        // Are we thinking? return
                        // Are we waiting for input? return
                        if (currentState != states.READY) return;

                        if(!currentAgent){
                                const questions = [
                                        {
                                                type: 'input',
                                                name: "Input",
                                                message: `No agent found. You can generate one by typing in a person, place or thing >>> `
                                        }
                                ];
                                const creationQuestions = [
                                        {
                                                type: 'personality',
                                                name: "Personality",
                                                message: `If you'd like to add some custom personality notes, you can >>> `
                                        },
                                        {
                                                type: 'facts',
                                                name: "Facts",
                                                message: `Add any facts about the agent, if you'd like >>> `
                                        }
                                ]
                                prompt(questions).then(async (text) => {
                                        const newAgent = text.Input.trim();

                                        //check if agent exists
                                        if(fs.existsSync(__dirname + "/agents/" + text.Input)){
                                                // if they do, set current agent
                                                currentAgent =newAgent;
                                                currentState = states.READY;
                                                return;
                                        }

                                        prompt(creationQuestions).then(async (text) => {
                                                //if not, create it
                                                await createAgent(speaker, newAgent, text.Personality, text.Facts);
                                                currentAgent = newAgent
                                                currentState = states.READY;
                                        });
                                });
                        } else {
                                const questions = [
                                        {
                                                type: 'input',
                                                name: "Input",
                                                message: `${speaker} >>>`
                                        }
                                ];
                                prompt(questions).then(async (text) => {
                                        await handleInput(text.Input, speaker, currentAgent);
                                        currentState = states.READY;
                                });
                        }

                        currentState = states.WAITING;
                }, 50);
        }

        setTimeout(() => {
                // If speaker was provided, start the request loop
                if (process.env.SPEAKER?.replace('_', ' ')) {
                        startloop(process.env.SPEAKER?.replace('_', ' '));
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