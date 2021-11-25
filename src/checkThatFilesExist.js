import fs from "fs";
import getFilesForSpeaker from "./getFilesForSpeaker.js";

export function checkThatFilesExist(speakerName){
    const { conversationTextFile, speakerModelFile, speakerFactsFile, speakerMetaFile } = getFilesForSpeaker(speakerName);
    // If the file doesn't exist, write it
    if (!fs.existsSync(speakerFactsFile)) fs.writeFileSync(speakerFactsFile, "");
    if (!fs.existsSync(speakerModelFile)) fs.writeFileSync(speakerModelFile, "");
    if (!fs.existsSync(conversationTextFile)) fs.writeFileSync(conversationTextFile, "");
    if (!fs.existsSync(speakerMetaFile)) fs.writeFileSync(speakerMetaFile, JSON.stringify({ messages: 0 }));

}