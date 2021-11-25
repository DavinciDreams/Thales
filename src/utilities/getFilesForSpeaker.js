import path from "path";
import { __dirname } from "./__dirname.js";

export default function getFilesForSpeaker(speaker){
    // TODO: Check if folders exist
    // TODO: Put all in folder for each user
    const conversationTextFile = __dirname + "/conversations/" + speaker + "/conversation.txt";
    const speakerModelFile = __dirname + "/conversations/" + speaker + "/model.txt";
    const speakerFactsFile= __dirname + "/conversations/" + speaker + "/facts.txt";
    const speakerMetaFile = __dirname + "/conversations/" + speaker + "/meta.json";

    return {
        conversationTextFile,
        speakerModelFile,
        speakerFactsFile,
        speakerMetaFile
    }
}