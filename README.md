# Thales
This repo is code for an experimental AGI agent.

## Getting Started
First, grab an API key from Open AI.
Then copy and paste the .env.default to .env and put your API key in it.

```
npm install
npm start // start with default agent
```

## TODO NOW
- Dump old conversation into another file (append and clear) when no longer necessary
- Handle non-sequitors
- Handle long spaces in time of conversation -- timestamp conversations
-- Either because it's max X characters / lines or because it's older than a certain time or non-sequitor
-- Sentiment analysis

## TODO LATER

- Agent only responds when being talked to
-- If it's a non-sequitor, is it directed toward anyone that isn't the agent? Is it directed toward the agent?
- Agent handles multiple people in the room
--audio i/o
--(checks for context amd ranks)

