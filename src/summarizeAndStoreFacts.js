import fs from "fs";
import { makeGPTRequest } from "./makeGPTRequest.js";
import { agentName } from "./constants.js";
import { replaceAll } from "./replaceAll.js";
import getFilesForSpeaker from "./getFilesForSpeaker.js";

const factSummarizationPrompt = `
Summarize the facts about $speakerName from the conversation above:
$speakerName 
`

export async function summarizeAndStoreFacts(speakerName, speakerInput) {
    const { speakerFactsFile } = getFilesForSpeaker(speakerName);

    // Take the input and send out a summary request
    const prompt = replaceAll(replaceAll(speakerInput + factSummarizationPrompt, "$speakerName", speakerName), "$agentName", agentName);
    console.log("prompt input is")
    console.log(prompt);
    const data = {
        "prompt": prompt,
        "temperature": 0.2,
        "max_tokens": 150,
        "top_p": 1,
        "frequency_penalty": 0.0,
        "stop": ["\"\"\"", "\n"]
    };

    const { success, choice } = await makeGPTRequest(data, speakerName, agentName, "davinci-instruct-beta-v3");
    if(success && choice.text != "") {  
        fs.appendFileSync(speakerFactsFile, speakerName + " " + choice.text + "\n");
    }
}