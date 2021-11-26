
import fs from "fs";
import { makeGPTRequest } from "../utilities/makeGPTRequest.js";
import getFilesForSpeakerAndAgent from "../utilities/getFilesForSpeakerAndAgent.js";
import { replaceAll } from "../utilities/replaceAll.js";
import { __dirname } from "../utilities/__dirname.js";

export async function formModelOfPerson(speaker, agent) {
    const questions = fs.readFileSync(__dirname + '/agents/' + agent + '/questions.txt').toString().split("\n");
    function getQuestion() {
        // Select question at random from array
        const questionIndex = Math.floor(Math.random() * questions.length);
        // TODO: If we've already asked question (check for string) then ask another instead

        return questions[questionIndex];
    }

    const { conversation, speakerModelFile, speakerFactsFile } = getFilesForSpeakerAndAgent(speaker, agent);

    // TODO: first we recall existing model of person
    const model = fs.readFileSync(speakerModelFile).toString();
    const facts = fs.readFileSync(speakerFactsFile).toString();

    // Then we want the model with the current conversationast 10 lines or so)assign userID
    const currentConversation = fs.readFileSync(conversation).toString();

    const question = agent + ": " + getQuestion();

    console.log("************* question", question)

    const prompt = currentConversation + facts + model + "\n" + replaceAll(question + "\n" + speaker + ": ", "$speaker", speaker);
    const data = {
        "prompt": prompt,
        "temperature": 0.6,
        "max_tokens": 100,
        "top_p": 1,
        "frequency_penalty": 0.1,
        "stop": ["\"\"\"", `${agent}: `]
    };
    const { success, choice } = await makeGPTRequest(data, speaker, agent);
    if (success) {
        fs.appendFileSync(speakerModelFile, question + "\n" + speaker + ": " + choice.text + "\n");
    }
}