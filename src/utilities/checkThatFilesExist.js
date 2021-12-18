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

export function makeDirectories(speaker, agent){
    makeDirectory(__dirname + "/conversations");
    makeDirectory(__dirname + "/conversations/" + agent);
    makeDirectory(__dirname + "/conversations/" + agent + "/" + speaker);
    makeDirectory(__dirname + "/conversations/" + agent + "/" + speaker + "/history");
}

export function checkThatFilesExist(speaker, agent){
    makeDirectories(speaker, agent);
    const { conversationFile, speakerModelFile, speakerFactsFile, agentFactsFile, agentFactsArchiveFile, conversationArchiveFile, speakerModelArchive, speakerFactsArchiveFile, speakerMetaFile }
        = getFilesForSpeakerAndAgent(speaker, agent);
    // If the file doesn't exist, write it
    if (!fs.existsSync(speakerFactsFile)) fs.writeFileSync(speakerFactsFile, "");
    if (!fs.existsSync(speakerFactsArchiveFile)) fs.writeFileSync(speakerFactsArchiveFile, "");
    if (!fs.existsSync(agentFactsFile)) fs.writeFileSync(agentFactsFile, "");
    if (!fs.existsSync(agentFactsArchiveFile)) fs.writeFileSync(agentFactsArchiveFile, "");
    if (!fs.existsSync(speakerModelFile)) fs.writeFileSync(speakerModelFile, "");
    if (!fs.existsSync(speakerModelArchive)) fs.writeFileSync(speakerModelArchive, "");
    if (!fs.existsSync(conversationFile)) fs.writeFileSync(conversationFile, "");
    if (!fs.existsSync(conversationArchiveFile)) fs.writeFileSync(conversationArchiveFile, "");
    if (!fs.existsSync(speakerMetaFile)) fs.writeFileSync(speakerMetaFile, JSON.stringify({ messages: 0 }));
}