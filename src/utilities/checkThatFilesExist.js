import fs from "fs";
import getFilesForSpeakerAndAgent from "./getFilesForSpeakerAndAgent.js";
import { __dirname } from "./__dirname.js";

function makeDirectory(dir){
    // create new directory
    try {
        // first check if directory already exists
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
    } catch (err) {
        console.log(err);
    }
}

export function checkThatFilesExist(speaker, agent){
    makeDirectory(__dirname + "/conversations");
    makeDirectory(__dirname + "/conversations/" + agent);
    makeDirectory(__dirname + "/conversations/" + agent + "/" + speaker);
    makeDirectory(__dirname + "/conversations/" + agent + "/" + speaker + "/history");

    const { conversation, speakerModelFile, speakerFactsFile, conversationArchive, speakerModelArchive, speakerFactsArchive, speakerMeta }
        = getFilesForSpeakerAndAgent(speaker, agent);
    // If the file doesn't exist, write it
    if (!fs.existsSync(speakerFactsFile)) fs.writeFileSync(speakerFactsFile, "");
    if (!fs.existsSync(speakerFactsArchive)) fs.writeFileSync(speakerFactsArchive, "");
    if (!fs.existsSync(speakerModelFile)) fs.writeFileSync(speakerModelFile, "");
    if (!fs.existsSync(speakerModelArchive)) fs.writeFileSync(speakerModelArchive, "");
    if (!fs.existsSync(conversation)) fs.writeFileSync(conversation, "");
    if (!fs.existsSync(conversationArchive)) fs.writeFileSync(conversationArchive, "");
    if (!fs.existsSync(speakerMeta)) fs.writeFileSync(speakerMeta, JSON.stringify({ messages: 0 }));
}