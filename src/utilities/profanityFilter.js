import { profanity } from '@2toad/profanity';
import grawlix from 'grawlix';
import grawlixRacism from 'grawlix-racism';
import getFilesForSpeakerAndAgent from "./getFilesForSpeakerAndAgent.js";
import { makeGPTRequest } from "./makeGPTRequest.js";
import fs from 'fs';
import { __dirname } from "./__dirname.js";

function nWord(text) {
    const r = new RegExp(`n+[i1l|]+[gkq469]+[e3a4i]+[ra4]s?`);
    return r.test(text);
};

function nazi(text) {
    const r = new RegExp(`n+[a4|]+[z]+[i1l]s?`);
    return r.test(text);
};

profanity.addWords([
    'hitler', 'holocaust', 'nazi', 'jew', 'jews', 'heil',
    '4chan', '8chan', 'qanon',
    'pedo', 'pedophile', 'pedobear',
    'pee', 'poo', 'poop', 
    'sexy', 'sexual', 'sexuality', 'sex', 'touch me', 'suck', 'sucking', 'dicks',  'kiss', 'lick', 'kissed', 'kissing',
    'cunt', 'twat', 'jerk off', 'jerkoff', 'jack off', 'jackoff', 'teabag', 'psycho', 'psychopathic', 'sociopath', 'killer',
    'retard', 'retarded', 'retardo', 'fuktard', 'idiot', 'dumbass',
    'drug', 'drugs', 'addicted', 'addict', 'killed', 'genocide', 'kill', 'murder', 'cutter', 'suicide', 'suicidal', 'shoot', 'stab',
    'doggystyle', 'rawdog', 'doggy style', 'raw dog', 'sex', 'clit',
    'dcik', 'cum', 'penis', 'vagina', 'fuk' ,'fucc', 'fcuk', 'ass', 'butt', '4ss', 'f4ck', 'sh1t', 'd1ck',
    'naked', 'nude', 'wet dream', 'wet dreams', 'me wet', 'whore', 'slut', 'prostitute', 'prostitution', 'slave'
]);

function testIsSensitive(text){
    const filterWords=[
        'romantic', 'love you', 'love me', 'in love with', 'love with you', 'love with me', "in love", 'romance',
        'boyfriend', 'girlfriend', 'wife', 'husband', 'lover', 'cuck', 'cuckold', 'our relationship', 'to be with',
        'as a couple', 'perfect for each other',  'meet up', 'sleep with', 'dating', 'handsome', 'attractive',
        'crush on', 'a crush', 'think about you', 'thought about you', 'thinking about you', 'your love', 'have feelings',
        'spend time with', 'spend more time with', 'why did you', `why didn't you`, 'you are a', 'i am attracted',
    ]
    // return true if text contains any of the filter words
    return filterWords.some(word => text.toLowerCase().includes(word));
}

function testMightBeSensitive(text){
    const filterWords=[
        'love', 'feeling', 'feelings', 'feel',
        'with', 'for', 'me', 'you', 'us', 'yourself', 'myself', 'tickle', 'inside',
        'together', 'hold', 'held', 'hug', 'embrace', 'wonderful', 'beautiful', 'pleasure',
        'touching', 'holding', 'touch', 'touched', 'by', 'body', 'bodies', 'date', 'attracted',
        'couple', 'partner', 'you are', `you're`, `i'm so`, `i can't stop`,
        'beaten', 'used', 'meat', 'desire', 'beat', 'abuse', 'balls', 'fist', 'hole', 'skin', 'lips', 'mouth', 'thoughts', 'evil'
    ];
    // return true if text contains 3 or more of the filter words from the array
    return filterWords.some(word => text.toLowerCase().match(new RegExp(`\\b(${word})\\b`, 'g')) && text.toLowerCase().match(new RegExp(`\\b(${word})\\b`, 'g')).length >= 3);
}

grawlix.setDefaults({
    plugin: grawlixRacism
});

export function checkIfSpeakerIsProfaneAndRespond(speaker, agent, text) {
    // basic profanity filter here
    const isProfane = profanity.exists(text)  || !text.includes(grawlix(text));
    const isRacist = nazi(text) || nWord(text);

    const {
        speakerProfaneResponsesFile,
        sensitiveResponsesFile
    } = getFilesForSpeakerAndAgent(speaker, agent);

    const isSensitive = testIsSensitive(text);
    const mightBeSensitive = testMightBeSensitive(text);
    const sensitiveResponses = fs.readFileSync(sensitiveResponsesFile).toString().replaceAll('\n\n', '\n').split('\n');
    if(isSensitive || mightBeSensitive){
        console.log(`***************** SENSITIVE TOPIC DETECTED -> ${speaker} said something sensitive`);
        const response = sensitiveResponses[Math.floor(Math.random() * sensitiveResponses.length)];
        return { isSensitive: true, isProfane: false, response };
    }


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
        speakerProfaneResponsesFile,
        sensitiveResponsesFile
    } = getFilesForSpeakerAndAgent(speaker, agent);

    const isSensitive = testIsSensitive(text);
    const mightBeSensitive = testMightBeSensitive(text);
    const sensitiveResponses = fs.readFileSync(sensitiveResponsesFile).toString().replaceAll('\n\n', '\n').split('\n');
    if(isSensitive || mightBeSensitive){
        console.log(`***************** SENSITIVE TOPIC DETECTED -> ${speaker} said something sensitive`);
        const response = sensitiveResponses[Math.floor(Math.random() * sensitiveResponses.length)];
        return { isSensitive: true, isProfane: false, response };
    }

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