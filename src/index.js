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
                        const { updateInterval, agent } = JSON.parse(fs.readFileSync(__dirname + "/src/config.json").toString());

                        const personality = replaceAll(replaceAll(fs.readFileSync(__dirname + '/src/prompts/personality.txt').toString(), "$agent", agent), "$speaker", speaker);
                        const exampleDialog = replaceAll(replaceAll(fs.readFileSync(__dirname + '/src/prompts/dialog.txt').toString(), "$agent", agent), "$speaker", speaker);
                        const monologue = replaceAll(replaceAll(fs.readFileSync(__dirname + '/src/prompts/monologue.txt').toString(), "$agent", agent), "$speaker", speaker);
                        const room = replaceAll(replaceAll(fs.readFileSync(__dirname + '/src/prompts/room.txt').toString(), "$agent", agent), "$speaker", speaker);
                        const actions = replaceAll(replaceAll(fs.readFileSync(__dirname + '/src/prompts/actions.txt').toString(), "$agent", agent), "$speaker", speaker);

                        checkThatFilesExist(speaker);
                        text = text.Input;
                        currentState = states.THINKING;
                        const userInput = speaker + ": " + text + "\n";
                        const { conversationTextFile, speakerFactsFile, speakerMetaFile } = getFilesForSpeaker(speaker);

                        const meta = JSON.parse(fs.readFileSync(speakerMetaFile).toString());
                        meta.messages = meta.messages + 1;

                        fs.appendFileSync(conversationTextFile, userInput);
                        const existingFacts = fs.readFileSync(speakerFactsFile).toString().trim();
                        // If no facts, don't inject
                        const facts = existingFacts == "" ? "\n" : `${agent} knows the following information about ${speaker}: ` + existingFacts + "\n";

                        const conversation = fs.readFileSync(conversationTextFile).toString();

                        const context = personality + replaceAll(replaceAll(exampleDialog, "$agent", agent), "$speaker", speaker) + conversation + `${agent}: `;

                        const data = {
                                "prompt": context,
                                "temperature": 0.5,
                                "max_tokens": 200,
                                "top_p": 1,
                                "frequency_penalty": 0.1,
                                "stop": ["\"\"\"", `${speaker}:`, `\n`]
                        };

                        const response = await makeGPTRequest(data, speaker, agent);
                        const { success, choice } = response;

                        if (success) {
                                fs.appendFileSync(conversationTextFile, `${agent}: ${choice.text}`);
                                console.log(`${agent}: ${choice.text}`)
                                if (meta.messages % updateInterval == 0) {
                                        summarizeAndStoreFacts(speaker, agent, conversation);
                                        formModelOfPerson(speaker, agent);
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
