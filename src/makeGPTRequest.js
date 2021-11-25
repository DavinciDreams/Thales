import axios from 'axios';
import {config} from "dotenv";
config();


const API_KEY = process.env.OPENAI_API_KEY;

const headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + API_KEY
};

export async function makeGPTRequest(data, speakerName, agentName, engine) {
        try {
                const gptEngine = engine ?? "davinci";
                const resp = await axios.post(
                        `https://api.openai.com/v1/engines/${gptEngine}/completions`,
                        data,
                        { headers: headers }
                );

                if (resp.data.choices && resp.data.choices.length > 0) {
                        let choice = resp.data.choices[0];
                        return { success: true, choice };
        
                }
        }
        catch (error) {
                console.log("Error is", error);
                return { success: false };
        }
}