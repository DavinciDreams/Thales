import inquirer from 'inquirer';

export var prompt = inquirer.createPromptModule();

export const namePrompt = [
        {
                type: 'input',
                name: "Name",
                message: "What is your name?",
        }
];

export const states = {
        READY: "READY",
        WAITING: "WAITING",
        THINKING: "THINKING"
};
