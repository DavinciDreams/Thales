import { config } from "dotenv";
config();

import fs from 'fs';
import path from "path";

import { checkThatFilesExist } from "./utilities/checkThatFilesExist.js";
import { prompt, namePrompt, questions } from "./utilities/prompt.js";
import getFilesForSpeaker from "./utilities/getFilesForSpeaker.js";
import { makeGPTRequest } from "./utilities//makeGPTRequest.js";
import { replaceAll } from "./utilities/replaceAll.js";
import { __dirname } from "./utilities/__dirname.js";

import { summarizeAndStoreFacts } from "./cognition/summarizeAndStoreFacts.js";
import { formModelOfPerson } from "./cognition/formModelOfPerson.js";

import countLinesInFile from 'count-lines-in-file';


const states = {
        READY: "READY",
        WAITING: "WAITING",
        THINKING: "THINKING"
}

let currentState = states.READY;

prompt(namePrompt).then((text) => {
        const speaker = text.Name;

        // Start prompt loop
        setInterval(() => {
                // Are we thinking? return
                // Are we waiting for input? return
                if (currentState != states.READY) return;
                prompt(questions).then(async (text) => {
                        const { updateInterval, defaultAgent, conversationWindowSize } = JSON.parse(fs.readFileSync(__dirname + "/src/config.json").toString());
                        const agent = process.env.AGENT ?? defaultAgent;
                        const personality = replaceAll(fs.readFileSync(__dirname + '/agents/' + agent + '/personality.txt').toString(), "$agent", agent);
                        const needsAndMotivations = replaceAll(fs.readFileSync(__dirname + '/agents/' + agent + '/needs_and_motivations.txt').toString(), "$agent", agent);
                        const exampleDialog = replaceAll(replaceAll(fs.readFileSync(__dirname + '/agents/' + agent + '/dialog.txt').toString(), "$agent", agent), "$speaker", speaker);
                        const monologue = replaceAll(fs.readFileSync(__dirname + '/agents/' + agent + '/monologue.txt').toString(), "$agent", agent);
                        const room = replaceAll(fs.readFileSync(__dirname + '/agents/' + agent + '/room.txt').toString(), "$agent", agent);
                        const actions = replaceAll(fs.readFileSync(__dirname + '/agents/' + agent + '/actions.txt').toString(), "$agent", agent);
                        const factRecall = replaceAll(replaceAll(fs.readFileSync(__dirname + '/agents/common/fact_recall.txt').toString(), "$agent", agent), "$speaker", speaker);

                        checkThatFilesExist(speaker);
                        text = text.Input;
                        currentState = states.THINKING;
                        const userInput = speaker + ": " + text + "\n";
                        const { conversation: conversationText, conversationArchive, speakerFactsFile, speakerMeta } = getFilesForSpeaker(speaker);

                        const meta = JSON.parse(fs.readFileSync(speakerMeta).toString());
                        meta.messages = meta.messages + 1;

                        fs.appendFileSync(conversationText, userInput);
                        const existingFacts = fs.readFileSync(speakerFactsFile).toString().trim();
                        // If no facts, don't inject
                        const facts = existingFacts == "" ? "" : factRecall + existingFacts + "\n";

                        const conversation = fs.readFileSync(conversationText).toString();
 
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
});
