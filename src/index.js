import { config } from "dotenv";
config();
import http from "http";
import cors from "cors";
import express, { json, urlencoded } from 'express';
import { handleInput } from "./handleInput.js";
import { initTerminal } from "./utilities/terminal.js";
import { createAgent } from "./utilities/createAgent.js";
import Discord, { Intents } from 'discord.js';

export const client = new Discord.Client({partials: ['MESSAGE', 'USER', 'REACTION'], intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_PRESENCES, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGES]})//{ intents: [ Intents.GUILDS, Intents.GUILD_MEMBERS, Intents.GUILD_VOICE_STATES, Intents.GUILD_PRESENCES, Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.DIRECT_MESSAGES] });

client.once("ready", () => {
  console.log("ChatBot online!");
});

let currentAgents = {
        guilds: []
}
client.on("message", async message => {
if (!currentAgents[message.guildId]) {
        currentAgents[message.guildId] = {
                [message.channelId]: defaultAgent
        }
        // Otherwise, if channel ID is null, default it
} else if (!currentAgents[message.guildId][message.channelId]) {
        currentAgents[message.guildId][message.channelId] = defaultAgent
}

let content = message.content;
// if discord message author is this user, ignore
if (message.author.id === client.user.id) return;

if (!content) return;

if (message.content.includes("/become")) {
        // make a constant that isthe value of message.content without the first word and space
        // capitalize the first letter of each word in the agent name
        let agentName = message.content.substring(message.content.split(" ")[0].length + 1)
                .split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
        console.log("agentName: ", agentName);
        currentAgents[message.guildId][message.channelId] = agentName;
        await createAgent(message.author, currentAgents[message.guildId][message.channelId], "", "");
        currentAgents[message.guildId][message.channelId] = agentName; // out.displayTitle ?? out.title ?? agentName;
        await message.channel.send("I am now " + currentAgents[message.guildId][message.channelId]);
        return;
}

const reply = await handleInput(message.content, message.author, currentAgents[message.guildId][message.channelId], null, false);
await message.channel.send(reply);
writeAgents();
});

if(process.env.DISCORD_API_TOKEN){
        client.login(process.env.DISCORD_API_TOKEN);
} else {
        console.log("Warning: no Discord API token was provided. Skipping...")
}

const app = express();
const router = express.Router();

const server = http.createServer(app);
import { Server } from "socket.io";
const io = new Server(server);

server.listen(process.env.SOCKETIO_PORT, () => {
        console.log()
})

io.on("connection", (socket) => {
        console.log("Connected", socket.id);
        socket.emit("message", `hello ${socket.id}`);
})

app.use(json())

app.use(function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
      });

      const allowedOrigins = ['http://localhost:3000', 'https://supermind-client.vercel.app', 'https://superreality.com', 'http://localhost:65535']
      const corsOptions = {
        origin: function (origin, callback) {
                console.log("Origin is", origin);
          if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true)
          } else {
            callback(new Error('Not allowed by CORS'))
          }
        }
      }
      
      app.use(cors(corsOptions));
      router.use(urlencoded({ extended: false }));


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
        const agent = req.body.agent
        console.log("executing for ", req.body)
        if (message.includes("/become")) {
                const out = await createAgent("Speaker", agent, "", "");
                return res.send(out);
        }
        await handleInput(message, speaker, agent, res)
});

app.listen(process.env.PORT, () => { console.log(`Server listening on http://localhost:${process.env.PORT}`); })

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