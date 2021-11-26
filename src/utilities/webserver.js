import { urlencoded, json } from 'express';
import  express  from 'express'
import { handleMessage } from '../index.js';

export let router
export let app
const verify_token = process.env.MESSENGER_VERIFY_TOKEN

export async function createWebServer() {
    router = express.Router();
    router.use(urlencoded({ extended: false }));
    app = express()
    app.use(json())
   
    app.route('/msg').post((req, res) => {
        const message = req.body.message
        const sender = req.body.sender
        console.log('request: ' + JSON.stringify(req.body))
        handleMessage(message, sender, res)
    });

    app.listen(process.env.WEBSERVER_PORT, () => { console.log(`Server listening on http://localhost:${process.env.WEBSERVER_PORT}`); })
}