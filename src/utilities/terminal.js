import { handleInput } from "../handleInput.js";
import { states, prompt, namePrompt } from "./prompt.js";
import { searchWikipedia } from "./searchWikipedia.js";
import { __dirname } from "./__dirname.js";
import { makeGPTRequest } from "./makeGPTRequest.js";
import fs from "fs";

let currentState = states.READY;

export async function createAgent(speaker, name, personality, facts){

        const out = await searchWikipedia(name);
        if(out.extract =="" || out.extract == null) {
                return console.log("Error, couldn't find anything on wikiedia about " + name);
        }
        const dir = __dirname + "/agents/" + name;

        const factSourcePrompt = `The follow are facts about ${name}\n`;
        const factPrompt = factSourcePrompt + out.extract + "\n" + facts;

        const personalitySourcePrompt = `Based on the above facts, the following is a description of the personality of an anthropomorphosized ${name}:`;
       
        let data = {
                "prompt": factPrompt + "\n" + personalitySourcePrompt,
                "temperature": 0.9,
                "max_tokens": 300,
                "top_p": 1,
                "frequency_penalty": 0.0,
                "presence_penalty":  0.0,
                "stop": ["\"\"\"", `${speaker}:`, '\n']
        };

        let res = await makeGPTRequest(data, speaker, name, "personality_generation", "davinci", false);

        if(!res.success) {
                return console.log("Error: Failed to generate personality, check GPT3 keys");
        }

        console.log("res.choice.text")
        console.log(res);

        fs.mkdirSync(dir, { recursive: true });

        fs.writeFileSync(__dirname + "/agents/" + name + "/personality.txt", personalitySourcePrompt + "\n" + personality + "\n" + res.choice.text);
        
        const dialogPrompt = `The following is a conversation with ${name}. ${name} is helpful, knowledgeable and very friendly\n${speaker}: Hi there, ${name}! Can you tell me a little bit about yourself?\n${name}:`;
        
        data = {
                "prompt": factPrompt + "\n" + personalitySourcePrompt + "\n" + res + "\n" + dialogPrompt,
                "temperature": 0.9,
                "max_tokens": 300,
                "top_p": 1,
                "frequency_penalty": 0.0,
                "presence_penalty":  0.0,
                "stop": ["\"\"\"", `${speaker}:`, '\n']
        };

        res = await makeGPTRequest(data, speaker, name, "dialog_generation",  "davinci", false);
        console.log("res.choice.text (2)")
        console.log(res);

        fs.writeFileSync(__dirname + "/agents/" + name + "/dialog.txt", dialogPrompt + res.choice.text);

        fs.writeFileSync(__dirname + "/agents/" + name + "/facts.txt", factPrompt);

        fs.writeFileSync(__dirname + "/agents/" + name + "/actions.txt", "");
        fs.copyFileSync(__dirname + "/agents/Template/ethics.txt", __dirname + "/agents/" + name + "/ethics.txt");
        fs.copyFileSync(__dirname + "/agents/Template/needs_and_motivations.txt", __dirname + "/agents/" + name + "/needs_and_motivations.txt");

        fs.writeFileSync(__dirname + "/agents/" + name + "/monologue.txt", "");
        fs.writeFileSync(__dirname + "/agents/" + name + "/room.txt", "");
        fs.copyFileSync(__dirname + "/agents/Template/relationship_matrix.txt", __dirname + "/agents/" + name + "/relationship_matrix.txt");
        return;
}

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