import { __dirname } from "./__dirname.js";

import fs from 'fs';
export default function getFilesForSpeakerAndAgent(speaker, agent){
    return {
        conversationDirectory: __dirname + "/conversations/" + agent,
        conversationFile: __dirname + "/conversations/" + agent + "/" + speaker + "/conversation.txt",
        conversationArchiveFile: __dirname + "/conversations/" + agent + "/" + speaker + "/conversation_archive.txt",
        speakerModelFile: __dirname + "/conversations/" + agent + "/" + speaker + "/model.txt",
        speakerFactsArchiveFile: __dirname + "/conversations/" + agent + "/" + speaker + "/speaker_facts_archive.txt",
        speakerFactsFile: __dirname + "/conversations/" + agent + "/" + speaker + "/speaker_facts.txt",
        agentFactsArchiveFile: __dirname + "/conversations/" + agent + "/agent_facts_archive.txt",
        agentFactsFile: __dirname + "/conversations/" + agent + "/agent_facts.txt",
        speakerModelArchive: __dirname + "/conversations/" + agent + "/" + speaker + "/model_archive.txt",
        speakerMetaFile: __dirname + "/conversations/" + agent + "/" + speaker + "/meta.json",
        relationshipMatrix: __dirname + "/agents/" + agent + "/relationship_matrix.txt",
        personalityQuestions:  __dirname + "/agents/common/personality_questions.json",
        speakerProfaneResponsesFile: fs.existsSync(__dirname + "/agents/" + agent + "/speaker_profane_responses.txt") ?
            __dirname + "/agents/" + agent + "/speaker_profane_responses.txt" : __dirname + "/agents/common/speaker_profane_responses.txt",
        sensitiveResponsesFile: fs.existsSync(__dirname + "/agents/" + agent + "/sensitive_responses.txt") ?
        __dirname + "/agents/" + agent + "/sensitive_responses.txt" : __dirname + "/agents/common/sensitive_responses.txt",
        agentProfaneResponsesFile: fs.existsSync(__dirname + "/agents/" + agent + "/agent_profane_responses.txt") ?
            __dirname + "/agents/" + agent + "/agent_profane_responses.txt" : __dirname + "/agents/common/agent_profane_responses.txt",
        ratingFile: fs.existsSync(__dirname + "/agents/" + agent + "/rating.txt") ?
            __dirname + "/agents/" + agent + "/rating.txt" : __dirname + "/agents/common/rating.txt"
    }
}