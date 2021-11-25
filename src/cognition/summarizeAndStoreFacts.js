import fs from "fs";
import { makeGPTRequest } from "../utilities/makeGPTRequest.js";
import { replaceAll } from "../utilities/replaceAll.js";
import getFilesForSpeaker from "../utilities/getFilesForSpeaker.js";

import { __dirname } from "../utilities/__dirname.js";

export async function summarizeAndStoreFacts(speaker, agent, input) {
    const factSummarizationPrompt = fs.readFileSync(__dirname + '/prompts/' + agent + '/fact_summarization.txt').toString().split("\n");
    const { speakerFactsFile } = getFilesForSpeaker(speaker);
    // Take the input and send out a summary request
    const prompt = replaceAll(replaceAll(input + factSummarizationPrompt, "$speaker", speaker), "$agent", agent);
    const data = {
        "prompt": prompt,
        "temperature": 0.2,
        "max_tokens": 150,
        "top_p": 1,
        "frequency_penalty": 0.0,
        "stop": ["\"\"\"", "\n"]
    };

    const { success, choice } = await makeGPTRequest(data, speaker, agent, "davinci-instruct-beta-v3");
    if(success && choice.text != "") {  
        fs.appendFileSync(speakerFactsFile, speaker + " " + choice.text + "\n");
    }
}