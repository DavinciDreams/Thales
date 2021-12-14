import { config } from "dotenv";
config();

import fs from 'fs';
import { checkThatFilesExist } from "./utilities/checkThatFilesExist.js";
import getFilesForSpeakerAndAgent from "./utilities/getFilesForSpeakerAndAgent.js";
import { makeGPTRequest } from "./utilities//makeGPTRequest.js";
import { __dirname } from "./utilities/__dirname.js";

import { summarizeAndStoreFactsAboutSpeaker } from "./cognition/summarizeAndStoreFactsAboutSpeaker.js";
import { summarizeAndStoreFactsAboutAgent } from "./cognition/summarizeAndStoreFactsAboutAgent.js";
import { formOpinionAboutSpeaker } from "./cognition/formOpinionAboutSpeaker.js";
import { checkIfSpeakerIsProfaneAndRespond, checkIfAgentIsProfane, filterByRating } from "./utilities/profanityFilter.js";

import { states, prompt, namePrompt } from "./prompt.js";

import express, { urlencoded, json } from 'express';

import cors from "cors";

const app = express();
const router = express.Router();
router.use(urlencoded({ extended: false }));
app.use(json())
app.use(cors());

let currentState = states.READY;

const agent = process.env.AGENT ?? defaultAgent;

app.route('/msg').post((req, res) => {
        const message = req.body.message
        const sender = req.body.sender
        console.log('request: ' + JSON.stringify(req.body))
        handleMessage(message, sender, res)
});

app.get("/health", function (req, res) {
        res.send(`Server is alive and running! ${new Date()}`);
});

app.post("/execute", function (req, res) {
        const message = req.body.command
        const sender = req.body.sender
        handleMessage(message, sender, res)
});

app.listen(process.env.WEBSERVER_PORT, () => { console.log(`Server listening on http://localhost:${process.env.WEBSERVER_PORT}`); })

if (process.env.TERMINAL) {
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
                        handleMessage(text.Input, speaker);
                });
                currentState = states.WAITING;
        }, 50);
}

const senders = {}

async function handleMessage(message, speaker, res) {
        if (senders[speaker] === undefined) senders[speaker] = states.READY;

        if (message === "/reset") { // If the user types /reset into the console...
                // If there is a response (i.e. this came from a web client, not local terminal)
                if (res) {
                        const result = { result: `${agent} has been reset` };
                        // Add the status 200 message (message OK)
                        res.status(200)
                                // Send the message as JSON
                                .send(JSON.stringify(result));
                } else {
                        console.log(`${agent} has been reset`);
                }
                const conversationDirectory = getFilesForSpeakerAndAgent(speaker, agent).conversationDirectory;
                if (fs.existsSync(conversationDirectory))
                        fs.rmdirSync(conversationDirectory, { recursive: true });
                senders[speaker] = states.READY;
                return currentState = states.READY; // delete?
        }

        // if(message === "/reset all"){ // If the user types /reset into the console...
        //         // If there is a response (i.e. this came from a web client, not local terminal)
        //         if(res) {
        //                 const result = { result: `${agent} has been reset completely` };
        //                 // Add the status 200 message (message OK)
        //                 res.status(200)
        //                 // Send the message as JSON
        //                 .send(JSON.stringify(result));
        //         } else {
        //                 console(result);
        //         }
        //         fs.rmdirSync(getFilesForSpeakerAndAgent("", agent).conversationDirectory, { recursive: true });
        //         return;
        // }

        else if (message === "/dump") { // If a user types dump, show them logs of convo
                // Read conversation history
                const conversation = fs.readFileSync(getFilesForSpeakerAndAgent(speaker, agent).conversation).toString() +
                        fs.readFileSync(getFilesForSpeakerAndAgent(speaker, agent).conversationArchive).toString();
                // If there is a response (i.e. this came from a web client, not local terminal)
                const result = { result: conversation };
                if (res) {
                        // Add the status 200 message (message OK)
                        res.status(200)
                                // Send the message as JSON
                                .send(JSON.stringify(result));
                } else {
                        console.log(conversation);
                }
                senders[speaker] = states.READY;
                return currentState = states.READY; // delete?
        }

        else if (message === "GET_AGENT_NAME") {
                if (res) res.status(200).send(JSON.stringify({ result: agent }));
                else console.log({ result: agent });
                senders[speaker] = states.READY;
                return currentState = states.READY; // delete?
        }


        const { dialogFrequencyPenality, dialogPresencePenality, factsUpdateInterval, conversationWindowSize, speakerFactsWindowSize, agentFactsWindowSize, useProfanityFilter }
                = JSON.parse(fs.readFileSync(__dirname + "/agents/common/config.json").toString());
        // TODO: make this configurable for each agent

        if (senders[speaker] === undefined) senders[speaker] = states.READY;
        while (senders[speaker] != states.READY) { console.log('state: ' + senders[speaker]); }

        checkThatFilesExist(speaker, agent);
        currentState = states.THINKING;

        if (useProfanityFilter) {
                const { isProfane, response } = checkIfSpeakerIsProfaneAndRespond(speaker, agent, message);
                if (isProfane) {
                        console.log(agent + ">>> " + response);

                        if (res) res.status(200).send(JSON.stringify({ result: response }));
                        return currentState = states.READY;
                }

        }

        const userInput = speaker + ": " + message;
        const {
                conversation: conversationText,
                conversationArchive,
                speakerFactsFile,
                speakerFactsArchive,
                agentFactsFile,
                agentFactsArchive,
                speakerMeta,
                ratingFile
        } = getFilesForSpeakerAndAgent(speaker, agent);

        const meta = JSON.parse(fs.readFileSync(speakerMeta).toString());
        meta.messages = meta.messages + 1;

        fs.appendFileSync(conversationText, userInput);

        const conversation = fs.readFileSync(conversationText).toString().replaceAll('\n\n', '\n');
        const ratingsPrompt = fs.readFileSync(ratingFile).toString().replaceAll('\n\n', '\n');

        // Slice the conversation and store any more than the window size in the archive
        const conversationLines = conversation.split('\n');
        if (conversationLines.length > conversationWindowSize) {
                const oldConversationLines = conversationLines.slice(0, Math.max(0, conversationLines.length - conversationWindowSize));
                const newConversationLines = conversationLines.slice(Math.min(conversationLines.length - conversationWindowSize));
                fs.appendFileSync(conversationArchive, "\n" + oldConversationLines.join("\n"));
                fs.writeFileSync(conversationText, newConversationLines.join("\n"));
        }
        const existingSpeakerFacts = fs.readFileSync(speakerFactsFile).toString().trim().replaceAll('\n\n', '\n');
        const speakerFacts = existingSpeakerFacts == "" ? "" : existingSpeakerFacts; // If no facts, don't inject
        const speakerFactsLines = speakerFacts.split('\n');  // Slice the facts and store any more than the window size in the archive
        if (speakerFactsLines.length > speakerFactsWindowSize) {
                fs.appendFileSync(speakerFactsArchive, speakerFactsLines.slice(0, speakerFactsLines.length - speakerFactsWindowSize).join("\n"));
                fs.writeFileSync(speakerFactsFile, speakerFactsLines.slice(speakerFactsLines.length - speakerFactsWindowSize).join("\n"));
        }
        const existingAgentFacts = fs.readFileSync(agentFactsFile).toString().trim();
        const agentFacts = existingAgentFacts == "" ? "" : existingAgentFacts + "\n"; // If no facts, don't inject
        const agentFactsLines = agentFacts.split('\n'); // Slice the facts and store any more than the window size in the archive
        if (agentFactsLines.length > agentFactsWindowSize) {
                fs.appendFileSync(agentFactsArchive, agentFactsLines.slice(0, agentFactsLines.length - agentFactsWindowSize).join("\n"));
                fs.writeFileSync(agentFactsFile, agentFactsLines.slice(Math.max(0, agentFactsLines.length - agentFactsWindowSize)).join("\n"));
        }

        const rootAgent = __dirname + '/agents/' + agent + '/';
        const rootCommon = __dirname + '/agents/common/';

        const context = fs.readFileSync(rootCommon + 'context.txt').toString()
                .replaceAll("$room", fs.readFileSync(rootAgent + 'room.txt').toString())
                .replaceAll("$morals", fs.readFileSync(rootCommon + 'morals.txt').toString())
                .replaceAll("$ethics", fs.readFileSync(rootAgent + 'ethics.txt').toString())
                .replaceAll("$personality", fs.readFileSync(rootAgent + 'personality.txt').toString())
                .replaceAll("$needsAndMotivations", fs.readFileSync(rootAgent + 'needs_and_motivations.txt').toString())
                .replaceAll("$exampleDialog", fs.readFileSync(rootAgent + 'dialog.txt').toString())
                .replaceAll("$monologue", fs.readFileSync(rootAgent + 'monologue.txt').toString())
                .replaceAll("$facts", fs.readFileSync(rootAgent + 'facts.txt').toString())
                // .replaceAll("$actions", fs.readFileSync(rootAgent + 'actions.txt').toString())
                .replaceAll("$speakerFacts", speakerFacts)
                .replaceAll("$agentFacts", agentFacts)
                .replaceAll("$agent", agent)
                .replaceAll("$speaker", speaker)
                .replaceAll("$conversation", conversation);

        if (process.env.DEBUG == "TRUE") {
                console.log("*********************** CONTEXT");
                console.log(context);
                console.log("***********************");
        };

        

        const data = {
                "prompt": context,
                "temperature": 0.9,
                "max_tokens": 100,
                "top_p": 1,
                "frequency_penalty": dialogFrequencyPenality,
                "presence_penalty": dialogPresencePenality,
                "stop": ["\"\"\"", `${speaker}:`, '\n']
        };

        const speakerConversationLines = conversationLines.filter(line => line != "" && line != "\n").slice(conversationLines.length - (factsUpdateInterval * 2)).join("\n");
        const agentConversationLines = conversationLines.filter(line => line != "" && line != "\n").slice(conversationLines.length - factsUpdateInterval * 2).join("\n");

        const { success, choice } = await makeGPTRequest(data, speaker, agent, "conversation");

        if (success) {
                // Check agent isn't about to say something offensive
                const { isProfane, response } = checkIfAgentIsProfane(speaker, agent, choice.text);
                if(isProfane){
                        console.log("********* AGENT WAS GOING TO SAY SOMETHING OFFENSIVE: " + choice.text);
                        console.log(agent + ">>> " + response);
                        if (res) res.status(200).send(JSON.stringify({ result: response }));
                        fs.appendFileSync(conversationText, `\n${agent}: ${response}\n`);
                        senders[speaker] = states.READY;
                        return currentState = states.READY; // delete?
                }

                // get ESRB rating for agent
                const ratingPrompt = fs.readFileSync(ratingFile).toString();
                const textToEvaluate = ratingPrompt.replace('$text', userInput + `\n${agent}: ${choice.text}`).replaceAll('$speaker', speaker).replaceAll('$agent', agent);
                console.log("textToEvaluate: ", textToEvaluate);
                const {ratingSuccess, ratingChoice, shouldFilter} = await filterByRating (speaker, agent, textToEvaluate);

                if(ratingSuccess && shouldFilter){
                        console.log("********* CONTENT RATING IS: " + ratingChoice.text);
                                console.log("********* AGENT MAXED OUT RATING: " + choice.text);
                                const replacementText = "Let's talk about something else."
                                console.log(agent + ">>> " + replacementText);
                                if (res) res.status(200).send(JSON.stringify({ result: replacementText }));
                                fs.appendFileSync(conversationText, `\n${agent}: ${replacementText}\n`);
                } 
                else if (ratingSuccess) {
                      fs.appendFileSync(conversationText, `\n${agent}:${choice.text}\n`);
                        respondWithMessage(res, choice.text);
                        console.log(agent + ">>> " + choice.text);
                        if (meta.messages % factsUpdateInterval == 0) {
                                formOpinionAboutSpeaker(speaker, agent);
                                summarizeAndStoreFactsAboutSpeaker(speaker, agent, speakerConversationLines);
                                summarizeAndStoreFactsAboutAgent(speaker, agent, agentConversationLines + choice.text);

                        }
                        fs.writeFileSync(speakerMeta, JSON.stringify(meta));
                        }
                
                else {
                        const error =  "Sorry, I didn't get what you mean, can you try again?";
                        if (res) res.status(200).send(JSON.stringify({ result: error }));
                        fs.appendFileSync(conversationText, `\n${agent}: ${error}\n`);
                        console.log(agent + ">>> " + error);  
                }
                
        } else {
                const error =  "Sorry, I had an error";
                if (res) res.status(200).send(JSON.stringify({ result: error }));
                fs.appendFileSync(conversationText, `\n${agent}: ${error}\n`);
                console.log(agent + ">>> " + error);
        }

        senders[speaker] = states.READY;
        return currentState = states.READY; // delete?
}

function respondWithMessage(res, text) {
        if (res) res.status(200).send(JSON.stringify({ result: text }));
}