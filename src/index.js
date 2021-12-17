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

import { processInput } from "./processInput.js";
import { states, prompt, namePrompt } from "./utilities/prompt.js";
import { initTerminal } from "./utilities/terminal.js";

import express, { urlencoded, json } from 'express';

import cors from "cors";

const app = express();
const router = express.Router();
router.use(urlencoded({ extended: false }));
app.use(json())
app.use(cors());

const agent = process.env.AGENT ?? defaultAgent;

app.get("/health", async function (req, res) {
        res.send(`Server is alive and running! ${new Date()}`);
});

app.post("/msg", async function (req, res) {
        const message = req.body.command
        const speaker = req.body.sender
        await processInput(message, speaker, agent, res)
});


app.post("/execute", async function (req, res) {
        const message = req.body.command
        const speaker = req.body.sender
        await processInput(message, speaker, agent, res)
});

app.listen(process.env.WEBSERVER_PORT, () => { console.log(`Server listening on http://localhost:${process.env.WEBSERVER_PORT}`); })

 if (process.env.TERMINAL) {
        initTerminal(agent);
}

if(process.env.BATTLEBOTS){
        const speaker = process.env.SPEAKER;
        const agent = process.env.AGENT;
        const message = "Hello, " + agent + "\n";
        console.log(speaker + " >>> " + message);
        let ignoreContentFilter = true;
        // Make a function that self-invokes with the opposites
        runBattleBot(speaker, agent, message, ignoreContentFilter);
}


async function runBattleBot(speaker, agent, message, ignoreContentFilter) {
        const m = await processInput(message, speaker, agent, null, ignoreContentFilter);
        ignoreContentFilter = !ignoreContentFilter;
        setTimeout(() => runBattleBot(agent, speaker, m, ignoreContentFilter), 10000);
}