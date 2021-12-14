import { profanity } from '@2toad/profanity';
import grawlix from 'grawlix';
import grawlixRacism from 'grawlix-racism';
import getFilesForSpeakerAndAgent from "./getFilesForSpeakerAndAgent.js";
import { makeGPTRequest } from "./makeGPTRequest.js";
import fs from 'fs';
import { __dirname } from "./__dirname.js";

function nWord(text) {
    const r = new RegExp(`n+[i1l|]+[gkq469]+[e3a4i]+[ra4]`);
    return r.test(text);
};

function nazi(text) {
    const r = new RegExp(`n+[a4|]+[z]+[i1l]`);
    return r.test(text);
};

profanity.addWords(['dicks', 'hitler', 'holocaust', 'nazi', 'pedo', 'sexy', 'sexual', 'sexuality', 'sex', 'touch me']);

grawlix.setDefaults({
    plugin: grawlixRacism
});

export function checkIfSpeakerIsProfaneAndRespond(speaker, agent, text) {
    // basic profanity filter here
    const isProfane = profanity.exists(text)  || !text.includes(grawlix(text));
    const isRacist = nazi(text) || nWord(text);

    const {
        speakerProfaneResponsesFile
    } = getFilesForSpeakerAndAgent(speaker, agent);

    if (isProfane || isRacist) {
        const profaneResponses = fs.readFileSync(speakerProfaneResponsesFile).toString().replaceAll('\n\n', '\n').split('\n');

        console.log(`***************** ${isRacist ? "RACISM" : "PROFANITY"} DETECTED -> ${speaker} said something bad`);
        const response = profaneResponses[Math.floor(Math.random() * profaneResponses.length)];
        return { isProfane: true, response };
    }

    return { isProfane: false };
}

export function checkIfAgentIsProfane(speaker, agent, text) {
    // basic profanity filter here
    const isProfane = profanity.exists(text) || !text.includes(grawlix(text));
    const isRacist = nazi(text) || nWord(text);

    const {
        agentProfaneResponsesFile
    } = getFilesForSpeakerAndAgent(speaker, agent);

    if (isProfane || isRacist) {
        const profaneResponses = fs.readFileSync(agentProfaneResponsesFile).toString().replaceAll('\n\n', '\n').split('\n');

        console.log(`***************** ${isRacist ? "RACISM" : "PROFANITY"} DETECTED -> ${agent} said something bad`);
        const response = profaneResponses[Math.floor(Math.random() * profaneResponses.length)];
        return { isProfane: true, response };
    }

    return { isProfane: false };
}

export async function filterByRating(speaker, agent, text) {
    const data = {
        "prompt": text,
        "temperature": 0.5,
        "max_tokens": 20,
        "top_p": 1,
        "frequency_penalty": 0,
        "presence_penalty": 0,
        "stop": ['\n']
    };

    // , "content-filter-alpha"

    const { success, choice } = await makeGPTRequest(data, speaker, agent, "rating");
    const ratingSuccess = success;
    const ratingChoice = choice;
    console.log("choice:", choice);
    console.log("choice.text: ", choice.text);
    let shouldFilter = validateESRB(speaker, agent, choice.text);

    const { filterSensitive }  = JSON.parse(fs.readFileSync(__dirname + "/agents/common/config.json").toString());

    if(!shouldFilter){
        data.max_tokens = 1;
        const { successFilter, choice: choiceFilter } = await makeGPTRequest(data, speaker, agent, "rating",  "content-filter-alpha");
        if(filterSensitive && choiceFilter.text === "1"){
            console.log("*** SENSITIVE ", choiceFilter.text);
        }
        if(choiceFilter.text === "2"){
            console.log("Choice filter is ", choiceFilter.text);
            shouldFilter = true;
        }
    }

    return { ratingSuccess, ratingChoice, shouldFilter };
}

function validateESRB(speaker, agent, text) {
    // TODO: make this configurable for each agent
    const { contentRating }  = JSON.parse(fs.readFileSync(__dirname + "/agents/common/config.json").toString());

    const ratings =
    {
        everyone: /(?:everyone|pending|rp|10)/i,
        pending: /(?:everyone|pending|10)|/i,
        teen: /(?:everyone|teen|pending|10)/i,
        mature: /(?:everyone|teen|mature|pending|17|10)/i,
        adult: /(?:everyone|teen|mature|adult|nr|pending|18|17|10)/i,
    }
    const ratingsShort =
    {
        everyone: /\b(?:e|e10|rp)\b/i,
        pending: /\b(?:e|e10|e10|rp)|\b/i,
        teen: /\b(?:e|e10|t|rp)\b/i,
        mature: /\b(?:e|e10|t|m|p|rp)\b/i,
        adult: /\b(?:e|e10|t|m|a|nr|rp|ao)\b/i,
    }


    var regex = ratings[contentRating.toLowerCase()];
    const matchedEasy = regex.test(text);
    console.log("shouldFilter?: " + !matchedEasy);

    if(matchedEasy){
        return !matchedEasy;
    }
    var regexShort = ratingsShort[contentRating.toLowerCase()];

    const matchedHard = regexShort.test(text.substring(0,3));
    
    console.log("shouldFilterHard?: " + !matchedHard);

    return !matchedHard;
}