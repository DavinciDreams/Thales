import fs from "fs";
import getFilesForSpeaker from "./getFilesForSpeaker.js";
import { __dirname } from "./__dirname.js";
const { updateInterval, agent } = JSON.parse(fs.readFileSync(__dirname + "/src/config.json").toString());

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

export function checkThatFilesExist(speaker){
    makeDirectory(__dirname + "/conversations");
    makeDirectory(__dirname + "/conversations/" + speaker);
    const { conversationTextFile, speakerModelFile, speakerFactsFile, speakerMetaFile } = getFilesForSpeaker(speaker);
    // If the file doesn't exist, write it
    if (!fs.existsSync(speakerFactsFile)) fs.writeFileSync(speakerFactsFile, "");
    if (!fs.existsSync(speakerModelFile)) fs.writeFileSync(speakerModelFile, "");
    if (!fs.existsSync(conversationTextFile)) fs.writeFileSync(conversationTextFile, "");
    if (!fs.existsSync(speakerMetaFile)) fs.writeFileSync(speakerMetaFile, JSON.stringify({ messages: 0 }));

}