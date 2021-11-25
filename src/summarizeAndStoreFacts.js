import fs from "fs";
import { factSummarizationPrompt } from "./factSummarizationPrompt.js";
import { makeGPTRequest } from "./makeGPTRequest.js";
import { agentName } from "./constants.js";
import { replaceAll } from "./replaceAll.js";
import getFilesForSpeaker from "./getFilesForSpeaker.js";

export async function summarizeAndStoreFacts(speakerName, speakerInput) {
    const { speakerFactsFile } = getFilesForSpeaker(speakerName);

    // Take the input and send out a summary request
    const prompt = replaceAll(replaceAll(factSummarizationPrompt, "$speakerName", speakerName), "$agentName", agentName) + speakerInput + "\n" + "tl;dr:";
    
    const data = {
        
        "prompt": prompt,
        "temperature": 0.85,
        "max_tokens": 100,
        "top_p": 1,
        "frequency_penalty": 0.1,
        "stop": ["\"\"\"", `\n`]
    };

    const { success, choice } = await makeGPTRequest(data, speakerName, agentName);

    if(success) {  fs.appendFileSync(speakerFactsFile, choice.text + "\n");
    }
}