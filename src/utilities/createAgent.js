import { handleInput } from "../handleInput.js";
import { states, prompt, namePrompt } from "./prompt.js";
import { searchWikipedia } from "./searchWikipedia.js";
import { __dirname } from "./__dirname.js";
import { makeGPTRequest } from "./makeGPTRequest.js";
import fs from "fs";

export async function createAgent(speaker, name, personality, facts) {
try {
        const out = await searchWikipedia(name);
        // create a constant called name which uses the value of nameRaw but removes all punctuation
        // const name = nameRaw.replace(/[^\w\s]/gi, '');
        console.log("out is ", out);
        if (out.result.extract == "" || out.result.extract == null) {
                return console.log("Error, couldn't find anything on wikiedia about " + name);
        }
        const dir = __dirname + "/agents/" + name;

        const factSourcePrompt = `The follow are facts about ${name}\n`;
        const factPrompt = factSourcePrompt + out.result.extract + "\n" + facts;

        const personalitySourcePrompt = `Based on the above facts, the following is a description of the personality of an anthropomorphosized ${name}:`;
        try {
                fs.mkdirSync(dir, { recursive: true });
        } catch (err) {
                console.log("Agent folder already exists");
        }
        fs.writeFileSync(__dirname + "/agents/" + name + "/actions.txt", "");
        fs.copyFileSync(__dirname + "/agents/Template/ethics.txt", __dirname + "/agents/" + name + "/ethics.txt");
        fs.copyFileSync(__dirname + "/agents/Template/needs_and_motivations.txt", __dirname + "/agents/" + name + "/needs_and_motivations.txt");

        fs.writeFileSync(__dirname + "/agents/" + name + "/monologue.txt", "");
        fs.writeFileSync(__dirname + "/agents/" + name + "/room.txt", "");
        fs.copyFileSync(__dirname + "/agents/Template/relationship_matrix.txt", __dirname + "/agents/" + name + "/relationship_matrix.txt");

        let data = {
                "prompt": factPrompt + "\n" + personalitySourcePrompt,
                "temperature": 0.9,
                "max_tokens": 300,
                "top_p": 1,
                "frequency_penalty": 0.0,
                "presence_penalty": 0.0,
                "stop": ["\"\"\"", `${speaker}:`, '\n']
        };

        let res = await makeGPTRequest(data, speaker, name, "personality_generation", "davinci", false);

        if (!res.success) {
                return console.log("Error: Failed to generate personality, check GPT3 keys");
        }

        console.log("res.choice.text")
        console.log(res);

        fs.writeFileSync(__dirname + "/agents/" + name + "/personality.txt", personalitySourcePrompt + "\n" + personality + "\n" + res.choice.text);

        const dialogPrompt = `The following is a conversation with ${name}. ${name} is helpful, knowledgeable and very friendly\n${speaker}: Hi there, ${name}! Can you tell me a little bit about yourself?\n${name}:`;

        data = {
                "prompt": factPrompt + "\n" + personalitySourcePrompt + "\n" + res + "\n" + dialogPrompt,
                "temperature": 0.9,
                "max_tokens": 300,
                "top_p": 1,
                "frequency_penalty": 0.0,
                "presence_penalty": 0.0,
                "stop": ["\"\"\"", `${speaker}:`, '\n']
        };

        res = await makeGPTRequest(data, speaker, name, "dialog_generation", "davinci", false);
        console.log("res.choice.text (2)")
        console.log(res);

        fs.writeFileSync(__dirname + "/agents/" + name + "/dialog.txt", dialogPrompt + res.choice.text);

        fs.writeFileSync(__dirname + "/agents/" + name + "/facts.txt", factPrompt);


        // if(out.filePath){
        //         out.image = fs.readFileSync(out.filePath);
        // }
        return out;
} catch (error) {
        console.log("Error: ", error);
}
        return {}

}