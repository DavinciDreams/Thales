import { config } from "dotenv";
config();

import fs from 'fs';
import { checkThatFilesExist } from "./utilities/checkThatFilesExist.js";
import getFilesForSpeakerAndAgent from "./utilities/getFilesForSpeakerAndAgent.js";
import { makeGPTRequest } from "./utilities//makeGPTRequest.js";
import { replaceAll } from "./utilities/replaceAll.js";
import { __dirname } from "./utilities/__dirname.js";

import { summarizeAndStoreFacts } from "./cognition/summarizeAndStoreFacts.js";
import { formModelOfPerson } from "./cognition/formModelOfPerson.js";

import inquirer from 'inquirer';
var prompt = inquirer.createPromptModule();

const namePrompt = [
        {
          type: 'input',
          name: "Name",
          message: "What is your name?",
        }
];

const states = {
        READY: "READY",
        WAITING: "WAITING",
        THINKING: "THINKING"
}

let currentState = states.READY;

// If speaker was provided, start the request loop
if(process.env.SPEAKER){
        startloop(process.env.SPEAKER);
}
// If no speaker was provided, prompt the user
else {
        prompt(namePrompt).then((text) => {
                // Check for OpenAI key, this will help people who clone it to get started
                if(!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes("XXXXX")){
                        return console.error("Please create a .env file in root of this directory and add your OpenAI API key to it");
                }
                
                startloop(text.Name);
        });
}

function startloop(speaker){
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
                                const { updateInterval, defaultAgent, conversationWindowSize } = JSON.parse(fs.readFileSync(__dirname + "/src/config.json").toString());
                                const agent = process.env.AGENT ?? defaultAgent;
                                const personality = replaceAll(fs.readFileSync(__dirname + '/agents/' + agent + '/personality.txt').toString(), "$agent", agent) + "\n";
                                const needsAndMotivations = replaceAll(fs.readFileSync(__dirname + '/agents/' + agent + '/needs_and_motivations.txt').toString(), "$agent", agent) + "\n";
                                const exampleDialog = replaceAll(replaceAll(fs.readFileSync(__dirname + '/agents/' + agent + '/dialog.txt').toString(), "$agent", agent), "$speaker", speaker) + "\n";
                                const monologue = replaceAll(fs.readFileSync(__dirname + '/agents/' + agent + '/monologue.txt').toString(), "$agent", agent) + "\n";
                                const room = replaceAll(replaceAll(fs.readFileSync(__dirname + '/agents/' + agent + '/room.txt').toString(), "$agent", agent), "$speaker", speaker) + "\n";
                                const actions = replaceAll(fs.readFileSync(__dirname + '/agents/' + agent + '/actions.txt').toString(), "$agent", agent) + "\n";
                                const factRecall = replaceAll(replaceAll(fs.readFileSync(__dirname + '/agents/common/fact_recall.txt').toString(), "$agent", agent), "$speaker", speaker) + "\n";
        
                                checkThatFilesExist(speaker, agent);
                                text = text.Input;
                                currentState = states.THINKING;
                                const userInput = speaker + ": " + text + "\n";
                                const { conversation: conversationText, conversationArchive, speakerFactsFile, speakerMeta } = getFilesForSpeakerAndAgent(speaker, agent);
        
                                const meta = JSON.parse(fs.readFileSync(speakerMeta).toString());
                                meta.messages = meta.messages + 1;
        
                                fs.appendFileSync(conversationText, userInput);
                                const existingFacts = fs.readFileSync(speakerFactsFile).toString().trim() + "\n";
                                // If no facts, don't inject
                                const facts = existingFacts == "" ? "" : factRecall + existingFacts + "\n";
        
                                const conversation = fs.readFileSync(conversationText).toString() + "\n";
         
                                const conversationLines = conversation.split('\n');
                                if(conversationLines.length > conversationWindowSize){
                                        const oldConversationLines = conversationLines.slice(0, -conversationWindowSize);
                                        const newConversationLines = conversationLines.slice(conversationWindowSize);
                                        fs.appendFileSync(conversationArchive, oldConversationLines.join("\n"));
                                        fs.writeFileSync(conversationText, newConversationLines.join("\n"));
        
                                        
                                }
        
                                const context =
                                        room +
                                        personality +
                                        needsAndMotivations +
                                        actions +
                                        facts +
                                        monologue +
                                        replaceAll(replaceAll(exampleDialog, "$agent", agent), "$speaker", speaker) +
                                        conversation + `${agent}: `;
        
                                if (process.env.DEBUG) {
                                        console.log("*********************** CONTEXT");
                                        console.log(context);
                                        console.log("***********************");
        
                                }
        
                                const data = {
                                        "prompt": context,
                                        "temperature": 0.7,
                                        "max_tokens": 200,
                                        "top_p": 1,
                                        "frequency_penalty": 0.2,
                                        "stop": ["\"\"\"", `${speaker}:`, `\n`]
                                };
        
                                const response = await makeGPTRequest(data, speaker, agent);
                                const { success, choice } = response;
        
                                if (success) {
                                        fs.appendFileSync(conversationText, `${agent}: ${choice.text}\n`);
                                        console.log(`${agent}: ${choice.text}`)
                                        if (meta.messages % updateInterval == 0) {
                                                summarizeAndStoreFacts(speaker, agent, conversation);
                                                formModelOfPerson(speaker, agent);
                                        }
                                        fs.writeFileSync(speakerMeta, JSON.stringify(meta));
        
                                        currentState = states.READY;
                                } else {
                                        console.log("Error")
                                }
                        })
                                .catch((error) => {
                                        if (error.isTtyError) {
                                                console.log("Error with your current TTY environment");
                                                console.log(error);
                                        } else {
                                                console.log(error);
                                        }
                                });
                        currentState = states.WAITING;
                }, 50);
}
