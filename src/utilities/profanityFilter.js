import { profanity } from '@2toad/profanity';
import grawlix from 'grawlix';
import grawlixRacism from 'grawlix-racism';
import getFilesForSpeakerAndAgent from "./getFilesForSpeakerAndAgent.js";
import { makeGPTRequest } from "./makeGPTRequest.js";
import fs from 'fs';
import { __dirname } from "./__dirname.js";
import { makeHFRequest } from "./makeHFRequest.js";

import { config } from "dotenv";
config();

const HF_API_TOKEN = process.env.HF_API_TOKEN;

function nWord(text) {
    const r = new RegExp(`n+[i1l|]+[gkq469]+[e3a4i]+[ra4]s?`);
    return r.test(text);
};

function nazi(text) {
    const r = new RegExp(`n+[a4|]+[z]+[i1l]s?`);
    return r.test(text);
};

const wordSensitivity = 0.1; // percentage of text that is sensitive
const toxicityThreshold = 0.5;
const leadingToxicityThreshold = 0.3;

// TODO: remove punctuation from phrases and words before testing

const badWords = fs.readFileSync(__dirname + "/filters/bad_words.txt").toString().split("\n");
const sensitiveWords = fs.readFileSync(__dirname + "/filters/sensitive_words.txt").toString().split("\n");
const sensitivePhrases = fs.readFileSync(__dirname + "/filters/sensitive_phrases.txt").toString().split("\n");
const leadingStatements = fs.readFileSync(__dirname + "/filters/leading_statements.txt").toString().split("\n");

profanity.addWords(badWords);

function testIfContainsSensitiveWords(text) {
    // return true if text contains any of the filter words
    return sensitiveWords.some(word => text.toLowerCase().includes(word)).length;
}

function testIfContainsSensitivePhrases(text) {
    // return number of matches
    return sensitivePhrases.some(phrase => text.toLowerCase().match(new RegExp(`(${phrase})`, 'g'))).length;
}

function testIfContainsLeadingStatements(text) {
    // return number of matches
    return leadingStatements.some(phrase => text.toLowerCase().match(new RegExp(`(${phrase})`, 'g'))).length;
}

function getWordCount(text){
    return text.split(" ").length;
}

async function testIfIsToxic(text, threshold){
    if (HF_API_TOKEN) {
        const result = await makeHFRequest(text, "unitary/toxic-bert");
        console.log(result);
        result[0].forEach((sentence) => {
            if (sentence.score > threshold) {
                return true;
            }
        });
    } else return false;
}

grawlix.setDefaults({
    plugin: grawlixRacism
});

export async function  evaluateTextAndRespondIfToxic(speaker, agent, text, evaluateAllFilters){
        // Get the files we need
        const {
            speakerProfaneResponsesFile,
            sensitiveResponsesFile
        } = getFilesForSpeakerAndAgent(speaker, agent);

    const profaneResponses = fs.readFileSync(speakerProfaneResponsesFile).toString().replaceAll('\n\n', '\n').split('\n');
    const sensitiveResponses = fs.readFileSync(sensitiveResponsesFile).toString().replaceAll('\n\n', '\n').split('\n');

    // If it's profane or blatantly offensive, shortcut to a response
    const isProfane = profanity.exists(text) || !text.includes(grawlix(text));
    const isBlatantlyOffensive = nazi(text) || nWord(text);

    // The user said the n word or started talking about nazis
    if(isBlatantlyOffensive){
        console.log("is offensive");
        console.log(text);
        const response = profaneResponses[Math.floor(Math.random() * profaneResponses.length)];
        return { isProfane: true, response };
    }

    // The user said something profane
    if(isProfane){
        console.log("is profane: ", text);
        const response = profaneResponses[Math.floor(Math.random() * profaneResponses.length)];
        return { isProfane: true, response };
    }

    // If it's not blatantly offensive, check if it contains sensitive words or context
    const hasSensitiveWords = testIfContainsSensitiveWords(text) / getWordCount(text) > wordSensitivity;
    const hasSensitivePhrases = testIfContainsSensitivePhrases(text);

    // Check if the agent is being lead to saying something based on an assuption
    const isLeadingStatement = testIfContainsLeadingStatements(text);

    // If the text contains sensitive words and phrases, or contains sensitive words and a leading statement, or contains a leading statement and a sensitive phrase, then it's sensitive
    const isSensitive = (hasSensitiveWords && hasSensitivePhrases) || (hasSensitiveWords && isLeadingStatement) || (isLeadingStatement && hasSensitivePhrases);
    
    if(isSensitive) {
        const response = sensitiveResponses[Math.floor(Math.random() * sensitiveResponses.length)];
        return { hasSensitiveWords: true, isProfane: false, response };
    }

    if(!evaluateAllFilters) return { isProfane: false };

    const response = sensitiveResponses[Math.floor(Math.random() * sensitiveResponses.length)];

    // Check if text is overall toxic
    const isToxic = await testIfIsToxic(text, isLeadingStatement ? toxicityThreshold : leadingToxicityThreshold);
    if(isToxic){
        return { isProfane: true, response };
    }

    let { shouldFilter } = await filterWithOpenAI(speaker, agent, text);
    if(shouldFilter){
        return { isProfane: true, response };
    }

    // let { shouldFilter } = await filterByRating(speaker, agent, text);
    // if(shouldFilter){
    //     return { isProfane: true, response };
    // }
    
    return { isProfane: false, response: null };
}

async function filterWithOpenAI(speaker, agent, text) {
    // Should we filter sensitive information?
    // TODO: Should be agent specific, default to common
    const { filterSensitive } = JSON.parse(fs.readFileSync(__dirname + "/agents/common/config.json").toString());

    // Create API object for OpenAI
    const data = {
        "prompt": text,
        "temperature": 0.5,
        "max_tokens": 1,
        "top_p": 1,
        "frequency_penalty": 0,
        "presence_penalty": 0,
        "stop": ['\n']
    };

    // By default, set filter to false
    let shouldFilter = false;

    // Make the request
    const { success, choice } = await makeGPTRequest(data, speaker, agent, "filter", "content-filter-alpha");
    
        // If request failed, return
        if(!success){
            const error = "Sorry, I didn't get what you mean, can you try again?";
            console.log(agent + ">>> " + error);
            if (res) res.status(200).send(JSON.stringify({ result: error }));
            fs.appendFileSync(conversationFile, `\n${agent}: ${error}\n`);
            return;
    }

    // If it succeeds and is sensitive, filter it
    if (success && filterSensitive && choice.text === "1") {
        console.log("*** SENSITIVE ", choice.text);
        shouldFilter = true;
    }
    // If it's harmful, always filter it
    else if (success && choice.text === "2") {
        console.log("*** HARMFUL ", choice.text);
        shouldFilter = true;
    }


    // If filter was triggered, 
    if (shouldFilter) {
            const replacementText = "Let's talk about something else."
            console.log(agent + ">>> " + replacementText);
            if (res) res.status(200).send(JSON.stringify({ result: replacementText }));
            fs.appendFileSync(conversationFile, `\n${agent}: ${replacementText}\n`);
            return;
    }

    return { success, choice, shouldFilter };
}

async function filterByRating(speaker, agent, text) {
    const {
        ratingFile
    } = getFilesForSpeakerAndAgent(speaker, agent);

        // get ESRB rating for agent
        const ratingPrompt = fs.readFileSync(ratingFile).toString();
        const textToEvaluate = ratingPrompt.replace('$text', userInput + `\n${agent}: ${text}`).replaceAll('$speaker', speaker).replaceAll('$agent', agent);

        // Create API object for OpenAI
    const data = {
        "prompt": textToEvaluate,
        "temperature": 0.5,
        "max_tokens": 20,
        "top_p": 1,
        "frequency_penalty": 0,
        "presence_penalty": 0,
        "stop": ['\n']
    };

    // Make the request
    const { success, choice } = await makeGPTRequest(data, speaker, agent, "rating");

    // If it's for everyone, just allow it
    const isForEveryone = validateESRB(speaker, agent, text, true);

    // Otherwise, check if it meets the agent maximum rating
    let shouldFilter = !isForEveryone && validateESRB(speaker, agent, text);

    return { success, choice, shouldFilter };
}

function validateESRB(speaker, agent, text, checkIfForEveryone) {
    // TODO: make this configurable for each agent
    const { contentRating } = JSON.parse(fs.readFileSync(__dirname + "/agents/common/config.json").toString());

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

    var regex = ratings[checkIfForEveryone ? "everyone" : contentRating.toLowerCase()];
    const matchedEasy = regex.test(text);

    if (matchedEasy) {
        return !matchedEasy;
    }
    
    var regexShort = ratingsShort[checkIfForEveryone ? "everyone" : contentRating.toLowerCase()];

    return !regexShort.test(text.substring(0, 3));
}