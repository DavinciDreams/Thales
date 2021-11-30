import fs from "fs";
import { makeGPTRequest } from "../utilities/makeGPTRequest.js";
import { replaceAll } from "../utilities/replaceAll.js";
import getFilesForSpeakerAndAgent from "../utilities/getFilesForSpeakerAndAgent.js";
import { __dirname } from "../utilities/__dirname.js";

export async function summarizeAndStoreFactsAboutAgent(speaker, agent, input) {
    const agentFactSummarizationPrompt = fs.readFileSync(__dirname + '/agents/common/agent_fact_summarization.txt').toString().split("\n");
    const { agentFactsFile } = getFilesForSpeakerAndAgent(speaker, agent);

    // Take the input and send out a summary request
    const prompt = replaceAll(replaceAll(replaceAll(agentFactSummarizationPrompt.join('\n'), "$speaker", speaker), "$agent", agent), "$example", input);

    const data = {
        "prompt": prompt,
        "temperature": 0.1,
        "max_tokens": 20,
        "top_p": 1,
        "frequency_penalty": 0.1,
        "presence_penalty": 0.0,
        "stop": ["\"\"\"", "\n\n"]
    };

    const { summarizationModel } = JSON.parse(fs.readFileSync(__dirname + "/src/config.json").toString());

    const { success, choice } = await makeGPTRequest(data, speaker, agent, summarizationModel);
    if (success && choice.text != "" && !choice.text.includes("no facts")) {
        fs.appendFileSync(agentFactsFile, choice.text.replace("\n", "") + " ");

    }
}