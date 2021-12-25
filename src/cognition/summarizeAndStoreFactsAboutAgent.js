import fs from "fs";
import { makeGPTRequest } from "../utilities/makeGPTRequest.js";
import getFilesForSpeakerAndAgent from "../utilities/getFilesForSpeakerAndAgent.js";
import { __dirname } from "../utilities/__dirname.js";

export async function summarizeAndStoreFactsAboutAgent(speaker, agent, input) {
    const agentFactSummarizationPrompt = fs.readFileSync(__dirname + '/agents/common/agent_fact_summarization.txt').toString().split("\n");
    const { agentFactsFile } = getFilesForSpeakerAndAgent(speaker, agent);

    // Take the input and send out a summary request
    const prompt = agentFactSummarizationPrompt.join('\n').replaceAll( "$speaker", speaker).replaceAll( "$agent", agent).replaceAll( "$example", input);

    const data = {
        "prompt": prompt,
        "temperature": 0.0,
        "max_tokens": 20,
        "top_p": 1,
        "frequency_penalty": 0.8,
        "presence_penalty": 0.3,
        "stop": ["\"\"\""]
    };

    const { summarizationModel } = JSON.parse(fs.readFileSync(__dirname + "/agents/common/config.json").toString());

    const { success, choice } = await makeGPTRequest(data, speaker, agent, "agent_facts", summarizationModel);
    if (success && choice.text != "" && !choice.text.includes("no facts")) {
        fs.appendFileSync(agentFactsFile, (agent + ": " + choice.text + "\n").replace("\n\n", "\n"));
    }
}