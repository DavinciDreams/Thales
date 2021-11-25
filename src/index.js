import fs from 'fs';
import { states, agentName, personality, exampleDialog } from "./constants.js";
import { checkThatFilesExist } from "./checkThatFilesExist.js";
import { prompt, namePrompt, questions } from "./prompt.js";
import getFilesForSpeaker from "./getFilesForSpeaker.js";
import { makeGPTRequest } from "./makeGPTRequest.js";
import { summarizeAndStoreFacts } from "./summarizeAndStoreFacts.js";
import { formModelOfPerson } from "./formModelOfPerson.js";

import { replaceAll } from "./replaceAll.js";

const updateModulo = 1; // Update the memory every X conversations

let currentState = states.READY;

prompt(namePrompt).then((text) => {
        const speakerName = text.Name;

        // Start prompt loop
        setInterval(() => {
                // Are we thinking? return
                // Are we waiting for input? return
                if(currentState != states.READY) return;
        
                prompt(questions).then(async (text) => {
                        checkThatFilesExist(speakerName);
                        text = text.Input;
                        currentState = states.THINKING;
                        const userInput = speakerName + ": " + text + "\n";
                        const { conversationTextFile, speakerFactsFile, speakerMetaFile } = getFilesForSpeaker(speakerName);

                        const meta = JSON.parse(fs.readFileSync(speakerMetaFile).toString());
                        meta.messages = meta.messages + 1;

                        fs.appendFileSync(conversationTextFile, userInput);
                        const existingFacts = fs.readFileSync(speakerFactsFile).toString().trim();
                        // If no facts, don't inject
                        const facts = existingFacts == "" ? "\n" : `${agentName} knows the following information about ${speakerName}: ` + existingFacts + "\n";

                        const conversation = fs.readFileSync(conversationTextFile).toString();

                        const context = personality + replaceAll(replaceAll(exampleDialog, "$agentName", agentName), "$speakerName", speakerName) + 
                        conversation + `${agentName}: `;

                                const data = {
                                        "prompt": context,
                                        "temperature": 0.5,
                                        "max_tokens": 200,
                                        "top_p": 1,
                                        "frequency_penalty": 0.1,
                                        "stop": ["\"\"\"", `${speakerName}:`]
                                };

                        const response = await makeGPTRequest(data, speakerName, agentName);
                        const {success, choice } = response;

                        if(success) {
                                fs.appendFileSync(conversationTextFile, `${agentName}: ${choice.text}`);
                                console.log(`${agentName}: ${choice.text}`)
                                if(meta.messages % updateModulo == 0){
                                        summarizeAndStoreFacts(speakerName, conversation);
                                        formModelOfPerson(speakerName);
                                }
                                        fs.writeFileSync(speakerMetaFile, JSON.stringify(meta));

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
