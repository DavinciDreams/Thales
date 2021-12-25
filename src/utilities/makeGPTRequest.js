import axios from 'axios';
import fs from 'fs';
import { __dirname } from "./__dirname.js";
import { config } from "dotenv";
import { makeHFRequest } from "./makeHFRequest.js";
import getFilesForSpeakerAndAgent from "./getFilesForSpeakerAndAgent.js";
import { checkThatFilesExist } from "./checkThatFilesExist.js";
config();

const useGPTJ = process.env.USE_GPTJ == "true";

export async function makeGPTRequest(data, speaker, agent, type, engine, log = true) {
        if (agent && speaker) checkThatFilesExist(speaker, agent);
        if (useGPTJ) {
                const params = {
                        temperature: 0.8,
                        repetition_penalty: 0.5,
                        max_length: 500,
                        return_full_text: false,
                        max_new_tokens: 150
                }
                const options = {
                        wait_for_model: true
                }
                const response = await makeHFRequest(data.prompt, "EleutherAI/gpt-j-6B", params, options);

                if (log && speaker && agent) {
                        const conversationDirectory = getFilesForSpeakerAndAgent(speaker, agent).conversationDirectory;
                        // fs.writeFileSync(conversationDirectory + "/history/" + Date.now() + "_" + type + ".txt", data.prompt + response[0].generated_text);
                }
                const responseModified = { success: true, choice: { text: response[0].generated_text.split('\n')[0] } };
                return responseModified;
        } else {
                return await makeOpenAIGPT3Request(data, speaker, agent, type, engine);
        }
}

async function makeOpenAIGPT3Request(data, speaker, agent, type, engine, log = true) {
        const API_KEY = process.env.OPENAI_API_KEY;
        const headers = {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + API_KEY
        };
        try {
                const gptEngine = engine ?? JSON.parse(fs.readFileSync(__dirname + "/agents/common/config.json").toString()).summarizationModel;
                const resp = await axios.post(
                        `https://api.openai.com/v1/engines/${gptEngine}/completions`,
                        data,
                        { headers: headers }
                );

                if (resp.data.choices && resp.data.choices.length > 0) {
                        let choice = resp.data.choices[0];
                        if (log && speaker && agent) {
                                const conversationDirectory = getFilesForSpeakerAndAgent(speaker, agent).conversationDirectory;
                                // fs.writeFileSync(conversationDirectory + "/history/" + Date.now() + "_" + type + ".txt", data.prompt + choice.text);
                        }
                        return { success: true, choice };

                }
        }
        catch (error) {
                console.log("Error is", error);
                return { success: false };
        }
}