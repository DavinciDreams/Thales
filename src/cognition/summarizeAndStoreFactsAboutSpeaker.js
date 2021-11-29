import fs from "fs";
import { makeGPTRequest } from "../utilities/makeGPTRequest.js";
import { replaceAll } from "../utilities/replaceAll.js";
import getFilesForSpeakerAndAgent from "../utilities/getFilesForSpeakerAndAgent.js";

import { __dirname } from "../utilities/__dirname.js";

export async function summarizeAndStoreFactsAboutSpeaker(speaker, agent, input) {
    const { summarizationModel } = JSON.parse(fs.readFileSync(__dirname + "/src/config.json").toString());

    const speakerFactSummarizationPrompt = fs.readFileSync(__dirname + '/agents/common/speaker_fact_summarization.txt').toString().split("\n");
    const { speakerFactsFile } = getFilesForSpeakerAndAgent(speaker, agent);

    // Take the input and send out a summary request
    let prompt = replaceAll(replaceAll(input + "\n" + speakerFactSummarizationPrompt, "$speaker", speaker), "$agent", agent);
    let data = {
        "prompt": prompt,
        "temperature": 0.3,
        "max_tokens": 32,
        "top_p": 1,
        "engine": "curie",
        "frequency_penalty": 0.5,
        "presence_penalty": 0.5,
        "stop": ["\"\"\"", "\n"]
    };

    let { success, choice } = await makeGPTRequest(data, speaker, agent, summarizationModel);

    if (success && choice.text != "") {
        fs.appendFileSync(speakerFactsFile, agent + ": " + choice.text + "\n");
    }
}

