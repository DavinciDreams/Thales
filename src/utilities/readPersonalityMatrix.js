import fs from "fs";
import { __dirname } from "./__dirname.js";

export default function readPersonalityMatrix(speaker, agent){
    // Check if we have an opinion yet
    // If not, form one and save the file
    // Read personality
    const personalityMatrixLines = fs.readFileSync(__dirname + `/agents/${agent}/personality_matrix.txt`).toString().split("\n");

    // Making a 3x2 array
    const personalityMatrix = [];
    // For each line in personalityMatrixLines
    for (const line of personalityMatrixLines){
        const values = line.split(" ");
        const row = [];;
        row[0] = values[0];
        row[1] = values[1];

        personalityMatrix.push(row);
    }

    // 0 0 # Alignment - Enemy - Friend
    // 0 1 # Authority - Student teacher
    // 0 0 # Affinity - Repulsed intrigued
    // 0 1 # Limit Alignment
    // 1 1 # Limit Authority
    // 0 0 # Limit Affinity

    const formattedPersonalityMatrix = {
            Enemy: personalityMatrix[0][0],
            Friend: personalityMatrix[0][1],
            Student: personalityMatrix[1][0],
            Teacher: personalityMatrix[1][1],
            Repulsed: personalityMatrix[2][0],
            Attracted: personalityMatrix[2][1],

            EnemyLimit: personalityMatrix[3][0],
            FriendLimit: personalityMatrix[3][1],
            StudentLimit: personalityMatrix[4][0],
            TeacherLimit: personalityMatrix[4][1],
            RepulsedLimit: personalityMatrix[5][0],
            AttractedLimit: personalityMatrix[5][1]
    }

    return formattedPersonalityMatrix;
}