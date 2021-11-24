const { program } = require('commander');
const axios = require('axios');
const fs = require('fs');

const speakerName = "Lisa";
const agentName = "Thales";

// OPENAI TOKEN
const API_TOKEN = "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";
const conversationTextFile = __dirname + "/txt/conversation.txt";

const headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + API_TOKEN
};

const speakerModelFile = __dirname + "/txt/" + speakerName + "_model.txt";
const speakerFactsFile= __dirname + "/txt/" + speakerName + "_facts.txt";

// If the file doesn't exist, write it
if (!fs.existsSync(speakerFactsFile)) fs.writeFileSync(speakerFactsFile, "");
if (!fs.existsSync(speakerModelFile)) fs.writeFileSync(speakerModelFile, "");
if (!fs.existsSync(conversationTextFile)) fs.writeFileSync(conversationTextFile, "");

const personality = `The following is a conversation with ${agentName}, a brilliant philosopher from Ancient greece. `;

const factSummarizationPrompt = `
eh whatever fuckit
tl;dr: <none>
"""
Hey ${agentName}, I'm ${speakerName}
tl;dr: I am ${agentName} and I am talking to ${speakerName}.
"""
I have a blue basket and my car is green
tl;dr: ${speakerName} has a blue basket and green car.
"""
A neutron star is the collapsed core of a massive supergiant star, which had a total mass of between 10 and 25 solar masses, possibly more if the star was especially metal-rich.[1] Neutron stars are the smallest and densest stellar objects, excluding black holes and hypothetical white holes, quark stars, and strange stars.[2] Neutron stars have a radius on the order of 10 kilometres (6.2 mi) and a mass of about 1.4 solar masses.[3] They result from the supernova explosion of a massive star, combined with gravitational collapse, that compresses the core past white dwarf star density to that of atomic nuclei.
tl;dr: A neutron star is the collapsed core of a supergiant star.
"""
`

const exampleDialog = `
${speakerName}: Hello ${agentName}, nice to see you again.
${agentName}: Hello, ${speakerName}, it is nice to see you again as well.
"""
`;

program
        .version('0.1.0')
        .argument('<text>', 'text to send')
        .action((text) => {
                const userInput = speakerName + ": " + text + "\n";

                fs.appendFileSync(conversationTextFile, userInput);
                const existingFacts =  fs.readFileSync(speakerFactsFile).toString().trim();
                // If no facts, don't inject
                const facts = existingFacts == "" ? "\n" : `${agentName} knows the following information about ${speakerName}:
                ` + existingFacts + "\n";

                console.log("******** facts are:");
                console.log(facts);

                const context = personality + // facts
                exampleDialog + 
                // fs.readFileSync(speakerModelFile).toString() +  
                fs.readFileSync(conversationTextFile).toString()
                + `${agentName}: `; 

                console.log("context is");
                console.log(context);

                const data = {
                        "prompt": context,
                        "temperature": 0.91,
                        "max_tokens": 100,
                        "top_p": 1,
                        "frequency_penalty": 0.1,
                        "stop": ["\"\"\"", `${speakerName}:`]
                };
                try {
                        axios.post(
                                'https://api.openai.com/v1/engines/davinci/completions',
                                data,
                                { headers: headers }
                        ).then((resp) => {
                                if (resp.data.choices && resp.data.choices.length > 0) {
                                        let choice = resp.data.choices[0];
                                        fs.appendFileSync(conversationTextFile, `${agentName}: ` + choice.text + "\n")

                                        summarizeAndStoreFacts(text);
                                        formModelOfPerson();
                                }
                        });
                } catch (error) {
                        console.log("Error is", error);
                }
        });

program.parse();

function summarizeAndStoreFacts(speakerInput){
        // Take the input and send out a summary request
        const data = {
                "prompt": factSummarizationPrompt + speakerInput + "\n" + "tl;dr:",
                "temperature": 0.91,
                "max_tokens": 100,
                "top_p": 1,
                "frequency_penalty": 0.1,
                "stop": ["\"\"\"", `\n`]
        };
        try {
                axios.post(
                        'https://api.openai.com/v1/engines/davinci/completions',
                        data,
                        { headers: headers }
                ).then((resp) => {
                        if (resp.data.choices && resp.data.choices.length > 0) {

                                let choice = resp.data.choices[0];
                                // choice = choice.text.replace(/#.*/, '').replaceAll("\n\n", "\n").replaceAll(" * ", "\n * ");
                                console.log("response is")
                                console.log(choice.text);
                                // TODO: then we add the response to the model
                                fs.appendFileSync(speakerFactsFile, choice.text + "\n");
                        }
                });
        } catch (error) {
                console.log("Error is", error);
        }
        // Check if the response is <none>
        // Append the summary 
}

function formModelOfPerson(){
        // TODO: first we recall existing model of person
        const model = fs.readFileSync(speakerModelFile).toString();
        // Then we want the model with the current conversationast 10 lines or so)assign userID
        const currentConversation = fs.readFileSync(conversationTextFile).toString();

        console.log("Forming model of person based on this context")
        console.log(model + currentConversation + speakerName + ": ");
        const data = {
                "prompt": model + currentConversation + speakerName + ": ",
                "temperature": 0.91,
                "max_tokens": 100,
                "top_p": 1,
                "frequency_penalty": 0.1,
                "stop": ["\"\"\"", `${agentName}`]
        };
        try {
                axios.post(
                        'https://api.openai.com/v1/engines/davinci/completions',
                        data,
                        { headers: headers }
                ).then((resp) => {
                        if (resp.data.choices && resp.data.choices.length > 0) {
                                let choice = resp.data.choices[0];
                                // choice = choice.text.replace(/#.*/, '').replaceAll("\n\n", "\n").replaceAll(" * ", "\n * ");
                                console.log("response is")
                                console.log(choice.text);
                                // TODO: then we add the response to the model
                                fs.appendFileSync(speakerModelFile, `${speakerName}: ` + choice.text + "\n")
                        }
                });
        } catch (error) {
                console.log("Error is", error);
        }
}