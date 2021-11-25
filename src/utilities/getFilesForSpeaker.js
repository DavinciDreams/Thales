import path from "path";
import { __dirname } from "./__dirname.js";

export default function getFilesForSpeaker(speaker){
    return {
        conversation: __dirname + "/conversations/" + speaker + "/conversation.txt",
        conversationArchive: __dirname + "/conversations/" + speaker + "/conversation_archive.json",
        speakerModelFile: __dirname + "/conversations/" + speaker + "/model.txt",
        speakerFactsArchive: __dirname + "/conversations/" + speaker + "/facts_archive.json",
        speakerFactsFile: __dirname + "/conversations/" + speaker + "/facts.txt",
        speakerModelArchive: __dirname + "/conversations/" + speaker + "/model_archive.json",
        speakerMeta: __dirname + "/conversations/" + speaker + "/meta.json"
    }
}