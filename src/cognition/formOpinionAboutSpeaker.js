import fs from "fs";
import getFilesForSpeakerAndAgent from "../utilities/getFilesForSpeakerAndAgent.js";
import readRelationshipMatrix from "../utilities/readRelationshipMatrix.js";

export async function formOpinionAboutSpeaker(speaker, agent, input) {
    const metaFile = getFilesForSpeakerAndAgent(speaker, agent).speakerMetaFile;
    const meta = JSON.parse(fs.readFileSync(metaFile).toString());

    // check if metafile has personality meta in it
    if(!meta.relationshipMatrix){
        // If it doesn't, read initialization from agent and store in meta
        meta.relationshipMatrix = readRelationshipMatrix(speaker, agent);
    }

    // Ask some questions about the conversation
    const personalityQuestion =  JSON.parse(fs.readFileSync(getFilesForSpeakerAndAgent(speaker, agent).personalityQuestions).toString());

    // console.log("******** meta")
    // console.log(meta);
    
    
// {
//     "Enemy": "Is this person my enemy, or do I dislike them?",
//     "Friend": "Is this person my friend? # Alignment",
//     "Student": "Is this person my student, am I teaching them or are they an novice?",
//     "Teacher": "Is this person my teacher, am I learning from them or are they an expert?",
//     "Disgusted": "Am I creeped out, disgusted or repulsed by this person? # Affinity - Disgusted",
//     "Attracted": "Am I attracted to or intrigued by this person?"
// }

    // Positive or negative or each value?

    // Update the personality matrix

    // Save
    fs.writeFileSync(metaFile, JSON.stringify(meta));


    // Take the input and send out a summary request
    // const prompt = doPrompt() // agentFactSummarizationPrompt.join('\n').replaceAll( "$speaker", speaker).replaceAll( "$agent", agent).replaceAll( "$example", input);

    // const data = {
    //     "prompt": prompt,
    //     "temperature": 0.0,
    //     "max_tokens": 20,
    //     "top_p": 1,
    //     "frequency_penalty": 0.8,
    //     "presence_penalty": 0.3,
    //     "stop": ["\"\"\""]
    // };

    // const { opinionModel } = JSON.parse(fs.readFileSync(__dirname + "/agents/common/config.json").toString());

    // const { success, choice } = await makeGPTRequest(data, speaker, agent, "opinion", opinionModel);
    // if (success && choice.text != "" && !choice.text.includes("no facts")) {
    //     fs.appendFileSync(agentFactsFile, (agent + ": " + choice.text + "\n").replace("\n\n", "\n"));
    // }
}

//ESRB rating 