const utils = require('../Utilities');
const constant = require('../Constants')

let Wit = null;
let log = null;
try {
  // if running from repo
  Wit = require('../../').Wit;
  log = require('../../').log;
} catch (e) {
  Wit = require('node-wit').Wit;
  log = require('node-wit').log;
}

// Setting up our bot
const wit = new Wit({
    accessToken: constant.WIT_TOKEN,
    logger: new log.Logger(log.INFO)
  });
exports.messageHandler = function(req, res ) {
    
        const data = req.body;
      
        if (data.object === 'page') {
          data.entry.forEach(entry => {
            entry.messaging.forEach(event => {
              if (event.message && !event.message.is_echo) {
                const sender = event.sender.id;
                console.log("Sender ID:" + sender)
                const {text, attachments} = event.message;
      
                if (attachments) {
                    utils.fbMessage(sender, 'Sorry I can only process text messages for now.')
                  .catch(console.error);
                } else if (text) {
                  // We received a text message
                  console.log(text)
                  // Let's run /message on the text to extract some entities
                  wit.message(text).then(({entities}) => {
                    // You can customize your response to these entities
                   
                    var myJSONEntity = JSON.stringify(entities)
                    console.log(myJSONEntity);
                    var js = JSON.parse(myJSONEntity)
                    if(js.hasOwnProperty('general')){
                        utils.fbMessage(sender, `Hey`);
                        utils.fbMessage(sender, `I am chatbot, How can i help you ?`);
                    }
                    else if(js.hasOwnProperty('passenger')){
                        utils.fbMessage(sender, `Please wait`);
                        utils.fbMessage(sender, `Let me find ride for you`);
                    }
                    else {
                        utils.fbMessage(sender, `i am trained on limited information Sorry :( `);
                    }
                    
                    
                  })
                  .catch((err) => {
                    console.error('Oops! Got an error from Wit: ', err.stack || err);
                  })
                }
              } else {
                console.log('received event', JSON.stringify(event));
              }
            });
          });
        }
        res.sendStatus(200);
}