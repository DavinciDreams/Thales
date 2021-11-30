# Thales
Thales is a highly customizable, open source autonomous agent.


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
- handle long user input, shorten if it's too long
- Add up the length of all of the txt files to make sure they aren't super long in debug mode, throw warning if too long

- Handle long spaces in time of conversation -- timestamp conversations
-- Add timestamps to conversations with []s
-- Regex replace all timestamps on read so they don't exist
-- Dump conversation more than a day old to the archive file

- Open AI semantic search of long-term memory (only if long term memory files have anything in them)
-- Facts, conversations

- Agent handles multiple people in the room
- Agent only responds when being talked to
-- If it's a non-sequitor, is it directed toward anyone that isn't the agent? Is it directed toward the agent?

- Search, fast and semantic

- Default facts

- Handle non-sequitors
-- Check if it's a non-sequitor and if it's a statement or question, if non-sequitor dump to new file
-- If it's a question, search long term memory (conversation + facts) for relevant information and save last search (clear on non-sequitor)
--if not non-sequitor, agent generates response for speaker naively, to compare agent's model to user's response (for baseline testing and fine-tuning) --(checks for context amd ranks?)

- Sentiment analysis, does agent agree with morality of speaker?

- Fine tuning

- Motivation, boredom

- Feelings, needs met?
