import { config } from "dotenv";
config();
import cors from "cors";
import express, { json, urlencoded } from 'express';
import { handleInput } from "./handleInput.js";
import { initTerminal } from "./utilities/terminal.js";

const app = express();
const router = express.Router();
router.use(urlencoded({ extended: false }));
app.use(json())
app.use(cors());

const agent = process.env.AGENT?.replace('_', ' ');

app.get("/health", async function (req, res) {
        res.send(`Server is alive and running! ${new Date()}`);
});

app.post("/msg", async function (req, res) {
        const message = req.body.command
        const speaker = req.body.sender
        await handleInput(message, speaker, agent, res)
});


app.post("/execute", async function (req, res) {
        const message = req.body.command
        const speaker = req.body.sender
        await handleInput(message, speaker, agent, res)
});

app.listen(process.env.WEBSERVER_PORT, () => { console.log(`Server listening on http://localhost:${process.env.WEBSERVER_PORT}`); })

 if (process.env.TERMINAL) {
        initTerminal(agent);
}

if(process.env.BATTLEBOTS){
        const speaker = process.env.SPEAKER?.replace('_', ' ');
        const agent = process.env.AGENT?.replace('_', ' ');
        const message = "Hello, " + agent;
        console.log(speaker + " >>> " + message);
        let ignoreContentFilter = true;
        // Make a function that self-invokes with the opposites
        runBattleBot(speaker, agent, message, ignoreContentFilter);
}


async function runBattleBot(speaker, agent, message, ignoreContentFilter) {
        console.log(speaker, agent, message, ignoreContentFilter)
        const m = await handleInput(message, speaker, agent, null, ignoreContentFilter);
        setTimeout(() => runBattleBot(agent, speaker, m, ignoreContentFilter), 10000);
}