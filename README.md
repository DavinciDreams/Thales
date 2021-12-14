# Thales
Thales is an open source autonomous agent you can customize entirely from text files -- no coding required. However, the framework is light, simple and modular, so you can extend the code as you like.

[Output sample](https://user-images.githubusercontent.com/18633264/143989030-e27f024a-06d2-4658-84d6-2fdb4fba1327.mp4)



## Getting Started
Clone the repo
```
git clone https://github.com/DaVinciDreams/Thales
```

Then, grab an API key from Open AI.
https://beta.openai.com/signup

Copy and paste the `.env.default` file, rename to `.env` and put your API key in it.

Now install dependencies and run the project
```
npm install
npm start // start with default agent
```

## Contibuting
Contributions welcome

### FOR PROGRAMMERS
Please look below to TODOs, and contribute what you're interested in. If you have other ideas for features, please give them a try and submit as a PR. Together we can make something really incredible!

### FOR NON PROGRAMMERS
You can create your own agent entirely by modifying the text prompts, without needing more than to change a few lines of configuration. First, copy the folder in `agents` directory. Then add a command in the package.json -- you can copy one of the existing commands, and change the AGENT environment variable to the name of your personality. Modify the text files -- you can do this while the agent is running -- and explore the responses and history to tune your agent.

Here's a great place to start on your prompt engineering journey: https://www.gwern.net/GPT-3

## TODO
- Add up the length of all of the txt files to make sure they aren't super long in debug mode, throw warning if too long or force smaller context / remove memory
- Relationship matrix (including gradients)
- Language rating system for incoming and outgoing
- Block repeated inappropriate use + build up enemy
- Identify if question is expert knowledge or not
- - If expert knowledge, respond with "good question", "let me think about that..." and do knowledge search
