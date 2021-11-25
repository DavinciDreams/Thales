import path from "path";
import { __dirname } from "./__dirname.js";

export default function getDirectoryForSpeaker(speaker){
    return __dirname + "/conversations/" + speaker
}

