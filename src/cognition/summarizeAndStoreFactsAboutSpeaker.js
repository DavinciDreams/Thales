import fs from "fs";
import { makeGPTRequest } from "../utilities/makeGPTRequest.js";
import getFilesForSpeakerAndAgent from "../utilities/getFilesForSpeakerAndAgent.js";

import { __dirname } from "../utilities/__dirname.js";

export async function summarizeAndStoreFactsAboutSpeaker(speaker, agent, input) {
    const { summarizationModel } = JSON.parse(fs.readFileSync(__dirname + "/agents/common/config.json").toString());

    const speakerFactSummarizationPrompt = fs.readFileSync(__dirname + '/agents/common/speaker_fact_summarization.txt').toString().replace("\n\n", "\n");
    const { speakerFactsFile } = getFilesForSpeakerAndAgent(speaker, agent);
    // Take the input and send out a summary request
    let prompt = speakerFactSummarizationPrompt.replaceAll( "$speaker", speaker).replaceAll( "$agent", agent).replaceAll( "$example", input);

    let data = {
        "prompt": prompt,
        "temperature": 0.3,
        "max_tokens": 20,
        "top_p": 1,
        "frequency_penalty": 0.0,
        "presence_penalty": 0.0,
        "stop": ["\"\"\"", "\n"]
    };

    let { success, choice } = await makeGPTRequest(data, speaker, agent, "speaker_facts", summarizationModel);
    if (success && choice.text != "" && !choice.text.includes("no facts")) {
        fs.appendFileSync(speakerFactsFile, (speaker + ": " + choice.text + "\n").replace("\n\n", "\n"));
    }
}

