import { config } from "dotenv";
config();
import { Autohook } from 'twitter-autohook';
import http from 'http';
import url from 'url';
import { handleInput } from "./handleInput.js";
import TwitterClient from 'twit';

const currentAgent = process.env.AGENT ?? "Shawbot";

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
  let reply = await handleInput(receivedMessage, name, currentAgent, null, false);

  // if prompt is more than 280 characters, remove the last sentence
  while (reply.length > 280) {
    reply = reply.substring(0, reply.lastIndexOf(".")) + ".";
  }

  TwitClient.post('statuses/update', { status: reply }, function (err, data, response) {
    if (err) console.log(err);
  })


  SendMessage(id, name, messageType, reply);
}

const validateWebhook = (token, auth) => {
  const responseToken = crypto.createHmac('sha256', auth).update(token).digest('base64');
  return { response_token: `sha256=${responseToken}` };
}

export const createTwitterClient = async (twitterId = process.env.twitterId) => {
  TwitClient = new TwitterClient({
    consumer_key: process.env.twitterConsumerKey,
    consumer_secret: process.env.twitterConsumerSecret,
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
      if(!screenName.toLowerCase().includes(twitterId.toLowerCase())){
        HandleResponse(id, screenName, message, 'Tweet', event);
      }
    }

    if (typeof (event.direct_message_events) !== 'undefined') {
      if (event.users[event.direct_message_events[0].message_create.sender_id].screen_name !== twitterId) {
        console.log("************************** EVENT direct_message_events")
        console.log(event.direct_message_events[0])

        const id = event.direct_message_events[0].message_create.sender_id;
        const name = event.users[event.direct_message_events[0].message_create.sender_id].screen_name;
        const ReceivedMessage = event.direct_message_events[0].message_create.message_data.text;
        if(screenName.includes(twitterId))
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
  }).listen(process.env.PORT);
  

  setInterval(async () => {
    let prompt = "Could you please write a short, optimistic tweet on web 3.0 culture, the metaverse, internet technology or the state of the world? Must be in less than three sentences.\n" + currentAgent + ":";
  
    let reply = await handleInput(prompt, "Friend", currentAgent, null, false);

        // if prompt is more than 280 characters, remove the last sentence
        while (reply.length > 280) {
          reply = reply.substring(0, reply.lastIndexOf(".")) + ".";
        }
    TwitClient.post('statuses/update', { status: reply }, function (err, data, response) {
      if (err) console.log(err);
    })
  
  }, (1000 * 60 * 60));

}

createTwitterClient();
