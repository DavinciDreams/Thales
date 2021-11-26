import path from "path";
import { __dirname } from "./__dirname.js";

export default function getFilesForSpeakerAndAgent(speaker, agent){
    return {
        conversation: __dirname + "/conversations/" + agent + "/" + speaker + "/conversation.txt",
        conversationArchive: __dirname + "/conversations/" + agent + "/" + speaker + "/conversation_archive.txt",
        speakerModelFile: __dirname + "/conversations/" + agent + "/" + speaker + "/model.txt",
        speakerFactsArchive: __dirname + "/conversations/" + agent + "/" + speaker + "/facts_archive.txt",
        speakerFactsFile: __dirname + "/conversations/" + agent + "/" + speaker + "/facts.txt",
        speakerModelArchive: __dirname + "/conversations/" + agent + "/" + speaker + "/model_archive.txt",
        speakerMeta: __dirname + "/conversations/" + agent + "/" + speaker + "/meta.json"
    }
}