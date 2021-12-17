import axios from 'axios';
import fs from 'fs';
import { __dirname } from "./__dirname.js";

export async function makeGPTRequest(data, speaker, agent, type, engine) {
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
                        const dir = __dirname + "/conversations/" + agent + "/" + speaker;
                        fs.writeFileSync(dir + "/history/" + Date.now() + "_" + type + ".txt", data.prompt + choice.text);
                        
                        return { success: true, choice };
        
                }
        }
        catch (error) {
                console.log("Error is", error);
                return { success: false };
        }
}