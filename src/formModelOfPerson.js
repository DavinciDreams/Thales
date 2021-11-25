
import fs from "fs";
import { makeGPTRequest } from "./makeGPTRequest.js";
import { agentName } from "./constants.js";
import getFilesForSpeaker from "./getFilesForSpeaker.js";

export async function formModelOfPerson(speakerName){
    const { conversationTextFile, speakerModelFile } = getFilesForSpeaker(speakerName);

    // TODO: first we recall existing model of person
    const model = fs.readFileSync(speakerModelFile).toString();
    // Then we want the model with the current conversationast 10 lines or so)assign userID
    const currentConversation = fs.readFileSync(conversationTextFile).toString();
   const data = {
            "prompt": model + currentConversation + speakerName + ": ",
            "temperature": 0.85,
            "max_tokens": 100,
            "top_p": 1,
            "frequency_penalty": 0.1,
            "stop": ["\"\"\"", `${agentName}: `]
    };
    const { success, choice } = await makeGPTRequest(data, speakerName, agentName);
    if(success){
        fs.appendFileSync(speakerModelFile, `${speakerName}: ` + choice.text + "\n");
    }
}