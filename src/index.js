import { config } from "dotenv";
config();

import fs from 'fs';
import { checkThatFilesExist } from "./utilities/checkThatFilesExist.js";
import getFilesForSpeakerAndAgent from "./utilities/getFilesForSpeakerAndAgent.js";
import { makeGPTRequest } from "./utilities//makeGPTRequest.js";
import { replaceAll } from "./utilities/replaceAll.js";
import { __dirname } from "./utilities/__dirname.js";

import { summarizeAndStoreFactsAboutSpeaker } from "./cognition/summarizeAndStoreFactsAboutSpeaker.js";
import { summarizeAndStoreFactsAboutAgent } from "./cognition/summarizeAndStoreFactsAboutAgent.js";

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
                                const { factsUpdateInterval, modelUpdateInterval, defaultAgent, conversationWindowSize, speakerFactsWindowSize, agentFactsWindowSize, modelWindowSize } = JSON.parse(fs.readFileSync(__dirname + "/src/config.json").toString());
                                const agent = process.env.AGENT ?? defaultAgent;
                                const morals = replaceAll(replaceAll(fs.readFileSync(__dirname + '/agents/common/morals.txt').toString(), "$agent", agent), "$speaker", speaker)  + "\n";
                                const ethics = replaceAll(replaceAll(fs.readFileSync(__dirname + '/agents/' + agent + '/ethics.txt').toString(), "$agent", agent), "$speaker", speaker)  + "\n";
                                const personality = replaceAll(fs.readFileSync(__dirname + '/agents/' + agent + '/personality.txt').toString(), "$agent", agent) + "\n";
                                const needsAndMotivations = replaceAll(fs.readFileSync(__dirname + '/agents/' + agent + '/needs_and_motivations.txt').toString(), "$agent", agent) + "\n";
                                const exampleDialog = replaceAll(replaceAll(fs.readFileSync(__dirname + '/agents/' + agent + '/dialog.txt').toString(), "$agent", agent), "$speaker", speaker) + "\n";
                                const monologue = replaceAll(fs.readFileSync(__dirname + '/agents/' + agent + '/monologue.txt').toString(), "$agent", agent) + "\n";
                                const room = replaceAll(replaceAll(fs.readFileSync(__dirname + '/agents/' + agent + '/room.txt').toString(), "$agent", agent), "$speaker", speaker) + "\n";
                                const actions = replaceAll(fs.readFileSync(__dirname + '/agents/' + agent + '/actions.txt').toString(), "$agent", agent) + "\n";
        
                                checkThatFilesExist(speaker, agent);
                                text = text.Input;
                                currentState = states.THINKING;
                                const userInput = speaker + ": " + text + "\n";
                                const {
                                        conversation: conversationText,
                                        conversationArchive,
                                        speakerFactsFile,
                                        speakerFactsArchive,
                                        speakerModelFile,
                                        speakerModelArchive,
                                        agentFactsFile,
                                        agentFactsArchive,
                                        speakerMeta
                                } = getFilesForSpeakerAndAgent(speaker, agent);
        
                                const meta = JSON.parse(fs.readFileSync(speakerMeta).toString());
                                meta.messages = meta.messages + 1;
        
                                fs.appendFileSync(conversationText, userInput);
        
                                const conversation = fs.readFileSync(conversationText).toString() + "\n";
         
                                // Slice the conversation and store any more than the window size in the archive
                                const conversationLines = conversation.split('\n');
                                if(conversationLines.length > conversationWindowSize){
                                        const oldConversationLines = conversationLines.slice(0, -conversationWindowSize);
                                        const newConversationLines = conversationLines.slice(conversationWindowSize);
                                        fs.appendFileSync(conversationArchive, oldConversationLines.join("\n"));
                                        fs.writeFileSync(conversationText, newConversationLines.join("\n"));      
                                }

                                const existingSpeakerFacts = fs.readFileSync(speakerFactsFile).toString().trim();
                                const speakerFacts = existingSpeakerFacts == "" ? "" : existingSpeakerFacts + "\n"; // If no facts, don't inject
                                const speakerFactsLines = speakerFacts.split('\n');  // Slice the facts and store any more than the window size in the archive

                                if(speakerFactsLines.length > speakerFactsWindowSize){
                                        fs.appendFileSync(speakerFactsArchive, speakerFactsLines.slice(0, -speakerFactsWindowSize).join("\n"));
                                        fs.writeFileSync(speakerFactsFile, speakerFactsLines.slice(speakerFactsWindowSize).join("\n"));      
                                }

                                const existingAgentFacts = fs.readFileSync(agentFactsFile).toString().trim();
                                const agentFacts = existingAgentFacts == "" ? "" : existingAgentFacts + "\n"; // If no facts, don't inject
                                const agentFactsLines = agentFacts.split('\n'); // Slice the facts and store any more than the window size in the archive

                                if(agentFactsLines.length > agentFactsWindowSize){
                                        fs.appendFileSync(agentFactsArchive, agentFactsLines.slice(0, -agentFactsWindowSize).join("\n"));
                                        fs.writeFileSync(agentFactsFile, agentFactsLines.slice(agentFactsWindowSize).join("\n"));      
                                }

                                // Slice the model and store any more than the window size in the archive
                                const model = fs.readFileSync(speakerModelFile).toString().trim() + "\n";
                                const modelLines = model.split('\n');
                                if(modelLines.length > modelWindowSize){
                                        const oldModelLines = modelLines.slice(0, -modelWindowSize);
                                        const newModelLines = modelLines.slice(modelWindowSize);
                                        fs.appendFileSync(speakerModelArchive, oldModelLines.join("\n"));
                                        fs.writeFileSync(speakerModelFile, newModelLines.join("\n"));      
                                }

                                const context =
                                        room +
                                        actions +
                                        personality +
                                        needsAndMotivations +
                                        morals +
                                        ethics +
                                        speakerFacts +
                                        agentFacts +
                                        monologue +
                                        model +
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
        
                                // TODO: Grab last line of the conversation and put it in
                                // For speaker facts - Get last lines (2 * factsupdateinterval) - 1
                                // For agent facts - Get last lines (2 * factsupdateinterval)
                                // Add these facts summarizer
                                const speakerConversationLines = conversationLines.filter(line => line != "" && line != "\n").slice(Math.min(conversationLines.length, factsUpdateInterval * 2 - 1)).join("\n");
                                const agentConversationLines = conversationLines.filter(line => line != "" && line != "\n").slice(Math.min(conversationLines.length, factsUpdateInterval * 2)).join("\n");

                                const { success, choice } = await makeGPTRequest(data, speaker, agent);

        
                                if (success) {
                                        fs.appendFileSync(conversationText, `${agent}: ${choice.text}\n`);
                                        console.log(`${agent}: ${choice.text}`)
                                        if (meta.messages % factsUpdateInterval == 0) {
                                                summarizeAndStoreFactsAboutSpeaker(speaker, agent, speakerConversationLines + conversation);
                                                summarizeAndStoreFactsAboutAgent(speaker, agent, agentConversationLines + choice.text);

                                        }
                                        if (meta.messages % modelUpdateInterval == 0) {
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
