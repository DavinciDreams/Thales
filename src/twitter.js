const { Autohook } = require('twitter-autohook');
const http = require('http');
const url = require('url');
import { handleInput } from "./handleInput";

const currentAgent = process.env.AGENT ?? "Shawbot";

const {
  twitterConsumerKey,
  twitterConsumerSecret,
  twitterAccessToken,
  twitterAccessTokenSecret,
  twitterId,
  twitterWebhookPort,
  ngrokToken,
  serverPort
} = {
  twitterConsumerSecret: process.env.twitterConsumerSecret,
  twitterConsumerSecret: process.env.twitterConsumerSecret,
  twitterAccessToken: process.env.twitterAccessToken,
  twitterAccessTokenSecret: process.env.twitterAccessTokenSecret,
  twitterId: process.env.twitterId,
  twitterWebhookPort: process.env.twitterWebhookPort,
  ngrokToken: process.env.ngrokToken,
  serverPort: process.env.serverPort
}

const twitterConfigInvalid =
  twitterConsumerKey === undefined ||
  twitterConsumerSecret === undefined ||
  twitterAccessToken === undefined ||
  twitterAccessTokenSecret === undefined ||
  twitterId === undefined ||
  twitterWebhookPort === undefined ||
  twitterConsumerKey === null ||
  twitterConsumerSecret === null ||
  twitterAccessToken === null ||
  twitterAccessTokenSecret === null ||
  twitterId === null ||
  twitterWebhookPort === null

let TwitClient;

const SendMessage = (id, twitterUserId, messageType, text) => {
  if (messageType === 'DM') {
    TwitClient.post('direct_messages/events/new', {
      "event": {
        "type": "message_create",
        "message_create": {
          "target": {
            "recipient_id": id
          },
          "message_data": {
            "text": text,
          }
        }
      }
    }, (error, data, response) => { if (error) console.log(error) });
  } else {
    TwitClient.post('statuses/update', { status: '@' + twitterUserId + ' ' + text, id, in_reply_to_status_id: id }, function (err, data, response) {
      console.log("Posted ", '@' + twitterUserId + ' ' + text)
    })
  }
}

const HandleResponse = async (id, name, receivedMessage, messageType, event) => {
  const reply = await handleInput(receivedMessage, name, currentAgent, null, false);
  SendMessage(id, name, messageType, reply);
}

const validateWebhook = (token, auth) => {
  const responseToken = crypto.createHmac('sha256', auth).update(token).digest('base64');
  return { response_token: `sha256=${responseToken}` };
}

export const createTwitterClient = async (twitterId = process.env.twitterId) => {
  if (twitterConfigInvalid)
    return console.warn("*** No bot config found for Twitter client, skipping initialization")
  TwitClient = new require('twit')({
    consumer_key: process.env.twitterConsumerKey,
    consumer_secret:process.env. twitterConsumerSecret,
    access_token: process.env.twitterAccessToken,
    access_token_secret: process.env.twitterAccessTokenSecret
  });

  const webhook = new Autohook({
    token: process.env.twitterAccessToken,
    token_secret: process.env.twitterAccessTokenSecret,
    consumer_key: process.env.twitterConsumerKey,
    consumer_secret: process.env.twitterConsumerSecret,
    ngrok_secret: process.env.ngrokToken,
    env: 'dev',
    port: process.env.twitterWebhookPort
  });
  await webhook.removeWebhooks();
  webhook.on('event', event => {
    if (typeof (event.tweet_create_events) !== 'undefined' &&
      event.tweet_create_events[0].user.screen_name !== twitterId) {
      console.log("************************** EVENT tweet_create_events")
      const id = event.tweet_create_events[0].user.id
      const screenName = event.tweet_create_events[0].user.screen_name
      const ReceivedMessage = event.tweet_create_events[0].text;
      const message = ReceivedMessage.replace("@" + twitterId + " ", "")
      HandleResponse(id, screenName, message, 'Tweet', event)
    }

    if (typeof (event.direct_message_events) !== 'undefined') {
      if (event.users[event.direct_message_events[0].message_create.sender_id].screen_name !== twitterId) {
        console.log("************************** EVENT direct_message_events")
        console.log(event.direct_message_events[0])

        const id = event.direct_message_events[0].message_create.sender_id;
        const name = event.users[event.direct_message_events[0].message_create.sender_id].screen_name;
        const ReceivedMessage = event.direct_message_events[0].message_create.message_data.text;

        HandleResponse(id, name, ReceivedMessage, 'DM', event)
      }
    }
  });
  await webhook.start();
  await webhook.subscribe({ oauth_token: process.env.twitterAccessToken, oauth_token_secret: process.env.twitterAccessTokenSecret, screen_name: twitterId });

  // handle this
  http.createServer((req, res) => {
    const route = url.parse(req.url, true);

    if (!route.pathname) {
      return;
    }

    if (route.query.crc_token) {
      console.log("Validating webhook")
      console.log(route.query.crc_token)
      const crc = validateWebhook(route.query.crc_token, process.env.twitterConsumerSecret);
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify(crc));
    }
  }).listen(process.env.serverPort);
}