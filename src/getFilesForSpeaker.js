import path from "path";

const __dirname = path.resolve(path.dirname(''));

export default function getFilesForSpeaker(speakerName){
    // TODO: Check if folders exist
    // TODO: Put all in folder for each user
    const conversationTextFile = __dirname + "/conversations/" + speakerName + "_conversation.txt";
    const speakerModelFile = __dirname + "/conversations/" + speakerName + "_model.txt";
    const speakerFactsFile= __dirname + "/conversations/" + speakerName + "_facts.txt";
    const speakerMetaFile = __dirname + "/conversations/" + speakerName + "_meta.json";

    return {
        conversationTextFile,
        speakerModelFile,
        speakerFactsFile,
        speakerMetaFile
    }
}