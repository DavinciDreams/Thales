import { __dirname } from "./__dirname.js";
import fetch from "node-fetch";
import { config } from "dotenv";
config();

const HF_API_TOKEN = process.env.HF_API_TOKEN;
console.log("****** HF_API_TOKEN is", HF_API_TOKEN);

export async function makeHFRequest(inputs, model) {
        try {
                const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
                        headers: { "Authorization": `Bearer ${HF_API_TOKEN}` },
                        method: "POST", data: JSON.stringify( { inputs, options: { function_to_apply: 'sigmoid', return_all_scores: true }
                    })
                }
                );
                return await response.json()
        }
        catch (error) {
                console.log("Error is", error);
                return { success: false };
        }
}