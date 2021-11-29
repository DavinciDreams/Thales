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
        if(message == "/reset"){
                if(res) res.status(200).send(JSON.stringify({ result: agent + " has been reset" }));
                fs.rmdirSync(getFilesForSpeakerAndAgent("", agent).conversationDirectory, { recursive: true });
                return;
        }
        else if(message == "GET_AGENT_NAME"){
                if(res) res.status(200).send(JSON.stringify({ result: agent }));
                return;
        }
        console.log("Message is", message);
        const sender = req.body.sender
        handleMessage(message, sender, res)
});

app.listen(process.env.WEBSERVER_PORT, () => { console.log(`Server listening on http://localhost:${process.env.WEBSERVER_PORT}`); })

if(process.env.TERMINAL){
        setTimeout(() => {
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
        }, 100)
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
                                handleMessage(text.Input, speaker);
                        });
                        currentState = states.WAITING;
                }, 50);
}

const senders = {}
async function handleMessage(message, speaker, res) {
                if (senders[speaker] === undefined) senders[speaker] = states.READY;
                while (senders[speaker] != states.READY) {console.log('state: ' + senders[speaker]);}

                const { factsUpdateInterval, modelUpdateInterval, defaultAgent, conversationWindowSize, activeConversationSize, speakerFactsWindowSize, agentFactsWindowSize, modelWindowSize } = JSON.parse(fs.readFileSync(__dirname + "/src/config.json").toString());
                const morals = replaceAll(replaceAll(fs.readFileSync(__dirname + '/agents/common/morals.txt').toString(), "$agent", agent), "$speaker", speaker);
                const ethics = replaceAll(replaceAll(fs.readFileSync(__dirname + '/agents/' + agent + '/ethics.txt').toString(), "$agent", agent), "$speaker", speaker);
                const personality = replaceAll(fs.readFileSync(__dirname + '/agents/' + agent + '/personality.txt').toString(), "$agent", agent);
                const needsAndMotivations = replaceAll(fs.readFileSync(__dirname + '/agents/' + agent + '/needs_and_motivations.txt').toString(), "$agent", agent);
                const exampleDialog = replaceAll(replaceAll(fs.readFileSync(__dirname + '/agents/' + agent + '/dialog.txt').toString(), "$agent", agent), "$speaker", speaker);
                const monologue = replaceAll(fs.readFileSync(__dirname + '/agents/' + agent + '/monologue.txt').toString(), "$agent", agent);
                const room = replaceAll(replaceAll(fs.readFileSync(__dirname + '/agents/' + agent + '/room.txt').toString(), "$agent", agent), "$speaker", speaker);
                const facts = replaceAll(replaceAll(fs.readFileSync(__dirname + '/agents/' + agent + '/facts.txt').toString(), "$agent", agent), "$speaker", speaker);
                const actions = replaceAll(fs.readFileSync(__dirname + '/agents/' + agent + '/actions.txt').toString(), "$agent", agent);

                checkThatFilesExist(speaker, agent);
                const text = message
                currentState = states.THINKING;
                const userInput = speaker + ": " + text;
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

                const conversation = replaceAll(fs.readFileSync(conversationText).toString(), '\n\n', '\n');

                // Slice the conversation and store any more than the window size in the archive
                const conversationLines = conversation.split('\n');
                if(conversationLines.length > conversationWindowSize){
                        const oldConversationLines = conversationLines.slice(0, Math.max(0, conversationLines.length - conversationWindowSize));
                        const newConversationLines = conversationLines.slice(Math.min(conversationLines.length - conversationWindowSize));
                        fs.appendFileSync(conversationArchive, "\n" +oldConversationLines.join("\n"));
                        fs.writeFileSync(conversationText, newConversationLines.join("\n"));   
                }
                const existingSpeakerFacts = replaceAll(fs.readFileSync(speakerFactsFile).toString().trim(), '\n\n', '\n');
                const speakerFacts = existingSpeakerFacts == "" ? "" : existingSpeakerFacts; // If no facts, don't inject
                const speakerFactsLines = speakerFacts.split('\n');  // Slice the facts and store any more than the window size in the archive
                if(speakerFactsLines.length > speakerFactsWindowSize){
                        fs.appendFileSync(speakerFactsArchive, speakerFactsLines.slice(0, speakerFactsLines.length - speakerFactsWindowSize).join("\n"));
                        fs.writeFileSync(speakerFactsFile, speakerFactsLines.slice(speakerFactsLines.length - speakerFactsWindowSize).join("\n"));      
                }
                const existingAgentFacts = fs.readFileSync(agentFactsFile).toString().trim();
                const agentFacts = existingAgentFacts == "" ? "" : existingAgentFacts + "\n"; // If no facts, don't inject
                const agentFactsLines = agentFacts.split('\n'); // Slice the facts and store any more than the window size in the archive
                if(agentFactsLines.length > agentFactsWindowSize){
                        fs.appendFileSync(agentFactsArchive, agentFactsLines.slice(0, agentFactsLines.length - agentFactsWindowSize).join("\n"));
                        fs.writeFileSync(agentFactsFile, agentFactsLines.slice(Math.max(0, agentFactsLines.length - agentFactsWindowSize)).join("\n"));      
                }

                // Slice the model and store any more than the window size in the archive
                const model = fs.readFileSync(speakerModelFile).toString().trim() + "\n";
                const modelLines = model.split('\n');
                const oldModelLines = modelLines.slice(0, Math.max(0, modelLines.length - modelWindowSize));
                const newModelLines = modelLines.slice(Math.max(0, modelLines.length - modelWindowSize));
                fs.appendFileSync(speakerModelArchive, oldModelLines.join("\n"));
                fs.writeFileSync(speakerModelFile, newModelLines.join("\n"));      

                let context =
                        room +
                        actions +
                        "The following is a description of " + agent + ":\n" +
                        personality + "\n" +
                        `${agent} knows the following about themselves:\n${agent}` +
                        agentFacts +
                        `${agent} knows the following about ${speaker}:\n${speaker} ` +
                        speakerFacts +
                        facts +
                        needsAndMotivations +
                        morals +
                        ethics +
                        "The following is a monologue by " + agent + ":\n" +
                        monologue +
                        `The following is a pretend dialog between ${agent} and ${speaker}, played out in ${agent}'s mind:\n` +
                        model +
                        `The following is a an example conversation between ${agent} and ${speaker}:\n` +
                        replaceAll(replaceAll(exampleDialog, "$agent", agent), "$speaker", speaker) +
                        `\nThe following is a real dialog between ${agent} and ${speaker}:\n` +
                        conversation + '\n' + `${agent}: `;

                if (process.env.DEBUG == "TRUE") {
                        console.log("*********************** CONTEXT");
                        console.log(context);
                        console.log("***********************");

                }

                const data = {
                        "prompt": context,
                        "temperature": 0.8,
                        "max_tokens": 100,
                        "top_p": 1,
                        "frequency_penalty": 0.2,
                        "presence_penalty": 0.6,
                        "stop": ["\"\"\"", `${speaker}:`, '\n']
                };

                const speakerConversationLines = conversationLines.filter(line => line != "" && line != "\n").slice(Math.min(conversationLines.length, factsUpdateInterval * 2 - 1)).join("\n");
                const agentConversationLines = conversationLines.filter(line => line != "" && line != "\n").slice(Math.min(conversationLines.length, factsUpdateInterval * 2)).join("\n");

                const { success, choice } = await makeGPTRequest(data, speaker, agent);

                if (success) {
                        fs.appendFileSync(conversationText, `\n${agent}: ${choice.text}\n`);
                        respondWithMessage(res, choice.text);
                        console.log(agent + ">>> " + choice.text);
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

                senders[speaker] = states.READY;
}

function respondWithMessage (res, text) {
        if(res) res.status(200).send(JSON.stringify({ result: text }));
}