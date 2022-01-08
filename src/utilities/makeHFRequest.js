import { __dirname } from "./__dirname.js";
import fetch from "node-fetch";
import { config } from "dotenv";
config();

const HF_API_TOKEN = process.env.HF_API_TOKEN;

export async function makeHFRequest(inputs, model, parameters = {}, options = {use_cache: false, wait_for_model: true}) {
        try {
                const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
                        headers: { "Authorization": `Bearer ${HF_API_TOKEN}` },
                        method: "POST",
                        body: JSON.stringify({ inputs, parameters, options })
                });
                return await response.json()
        }
        catch (error) {
                console.log("Error is", error);
                return { success: false };
        }
}