# Thales
This repo is code for an experimental AGI agent.

## Getting Started
First, grab an API key from Open AI.
Then copy and paste the .env.default to .env and put your API key in it.

```
npm install
npm start // start with default agent
```

1. Dump all except last 10 exchanges of conversation
2. Dump all except last 10 facts
3. Dump all except last 3 exchanges from model
4. Add timestamps to conversations with []s
5. Regex replace all timestamps on read so they don't exist
6. Dump conversation more than a day old to a new file
7. Check if it's a non-sequitor and if it's a statement or question, if non-sequitor dump to new file
8. If it's a question, search long term memory (conversation + facts) for relevant information and save last search (clear on non-sequitor)
9. Place relevant information into context
11. Separate facts from global

;' facts about the world

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
--agent pregenerates= speakerModel + expected response
    compare expected response to speaker response 
        rank and update speakerModel 


