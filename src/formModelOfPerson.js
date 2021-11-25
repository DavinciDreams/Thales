
import fs from "fs";
import { makeGPTRequest } from "./makeGPTRequest.js";
import { agentName } from "./constants.js";
import getFilesForSpeaker from "./getFilesForSpeaker.js";
import { replaceAll } from "./replaceAll.js";

const questions =
[
    "Given the choice of anyone in the world, whom would you want as a dinner guest?",
    "Would you like to be famous? In what way?",
    "What would constitute a 'perfect' day for you?",
    "For what in your life do you feel most grateful?",
    "If you could change anything about the way you were raised, what would it be?",
    "If you could wake up tomorrow having gained any one quality or ability, what would it be?",
    "If a crystal ball could tell you the truth about yourself, your life, the future or anything else, what would you want to know?",
    "Is there something that you’ve dreamed of doing for a long time? Why haven’t you done it?",
    "What is the greatest accomplishment of your life?",
    "What do you value most in a friendship?",
    "What is your most treasured memory?",
    "What is your most terrible memory?",
    "If you knew that in one year you would die suddenly, would you change anything about the way you are now living? Why?",
    "What does friendship mean to you?",
    "What roles do love and affection play in your life?",
    "Alternate sharing something you consider a positive characteristic of your partner. Share a total of five items.",
    "How close and warm is your family? Do you feel your childhood was happier than most other people’s?",
    "How do you feel about your relationship with your mother?"
]

function getQuestion(){
    // Select question at random from array
    const questionIndex = Math.floor(Math.random() * questions.length);
    // TODO: If we've already asked question (check for string) then ask another instead

    return questions[questionIndex];
}


export async function formModelOfPerson(speakerName){
    const { conversationTextFile, speakerModelFile, speakerFactsFile } = getFilesForSpeaker(speakerName);

    // TODO: first we recall existing model of person
    const model = fs.readFileSync(speakerModelFile).toString();
    const facts = fs.readFileSync(speakerFactsFile).toString();

    // Then we want the model with the current conversationast 10 lines or so)assign userID
    const currentConversation = fs.readFileSync(conversationTextFile).toString();

    // Get the facts about speaker, if there are any
    // Add current conversation
    // Ask a question to the speaker
    // 

    const question = agentName + ": " + getQuestion();

    const prompt = currentConversation + facts + model + "\n" + replaceAll(question + "\n" + speakerName + ": ", "$speakerName", speakerName);
   const data = {
            "prompt": prompt,
            "temperature": 0.6,
            "max_tokens": 100,
            "top_p": 1,
            "frequency_penalty": 0.1,
            "stop": ["\"\"\"", `${agentName}: `]
    };
    const { success, choice } = await makeGPTRequest(data, speakerName, agentName);
    if(success){
        fs.appendFileSync(speakerModelFile, question + "\n" + speakerName + ": " + choice.text + "\n");
    }
}