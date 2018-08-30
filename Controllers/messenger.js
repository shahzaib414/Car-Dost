const utils = require('../Utilities');
const constant = require('../Constants')
var request = require('request');
require('request-to-curl');
var HashMap = require('hashmap');
var firebase = require('../firebaseConfig')
var randomstring = require("randomstring");
var NodeGeocoder = require('node-geocoder');
const moment = require('moment')
var geodist = require('geodist')

let Wit = null;
let log = null;
var timeStamp = null
try {
  // if running from repo
  Wit = require('../../').Wit;
  log = require('../../').log;
} catch (e) {
  Wit = require('node-wit').Wit;
  log = require('node-wit').log;
}

var options = {
  provider: 'google',


  httpAdapter: 'https',
  apiKey: 'AIzaSyDs191b0pSBP8W0RBFhG9PD7uaRTdndhvY', // for Mapquest, OpenCage, Google Premier
  formatter: null         // 'gpx', 'string', ...
};

var geocoder = NodeGeocoder(options);

// Setting up our bot
const wit = new Wit({
  accessToken: constant.WIT_TOKEN,
  logger: new log.Logger(log.INFO)
});
const sessions = {};

const findOrCreateSession = (fbid) => {
  let sessionId;
  // Let's see if we already have a session for the user fbid
  Object.keys(sessions).forEach(k => {
    if (sessions[k].fbid === fbid) {
      console.log("Session ID exist")
      sessionId = k;
    }
  });
  if (!sessionId) {
    console.log("creating new SessionID")
    sessionId = randomstring.generate(7);
    sessions[sessionId] = { fbid: fbid, context: {} };
  }
  return sessionId;
};
exports.messageHandler = function (req, res) {

  const data = req.body;

  if (data.object === 'page') {
    var userName;
    var email;
    data.entry.forEach(entry => {
      entry.messaging.forEach(event => {
        if (event.message && !event.message.is_echo) {
          const sender = event.sender.id;
          console.log("==================================================")
          const sessionId = findOrCreateSession(sender);

          console.log("Retrived SessionID: " + sessionId)
          var getPromiseData = getUserProfile(sender)
          getPromiseData.then(function (result) {
            var js = JSON.parse(result)
            userName = js.first_name +' '+ js.last_name
          }, function (err) {
            console.log('Error while getting User Name' + err)
          })

          console.log("Sender ID:" + sender)
          const { text, attachments } = event.message;

          if (attachments) {
            var validresponse = JSON.stringify(attachments)
            if (JSON.parse(validresponse)[0].type === 'location') {
              // Check whether location is of passenger or of Rider 
              utils.checkSessionType(firebase.firebaseDatabase.ref('/sessions/' + sessionId))
                .then(function (result, rej) {
                  console.log(`_userType ${result}`)
                  if (result) {
                    switch (result) {
                      case "passenger":
                        var nearByCarOwnerList = []
                        utils.fbMessage(sender, `Please wait`);
                        utils.fbMessage(sender, `Let me find ride for you`);
                        utils.retriveData(firebase.firebaseDatabase.ref('/car_owner/'))
                          .then(function (res, rej) {
                            if (rej) {
                              console.log(rej)
                            }
                            else {
                              var validJsonResponse = JSON.parse(JSON.stringify(res))
                              if (validJsonResponse.length > 0) {
                                var passengerLocation = {
                                  lat: JSON.parse(validresponse)[0].payload.coordinates.lat,
                                  lon: JSON.parse(validresponse)[0].payload.coordinates.long
                                }
                                for (var i = 0; i < validJsonResponse.length; i++) {
                                  var CarOwnerLocation = {
                                    lat: validJsonResponse[i].location.lat,
                                    lon: validJsonResponse[i].location.long
                                  }
                                  var distance = geodist(passengerLocation, CarOwnerLocation, { exact: true, unit: 'km' })
                                  console.log(distance)
                                  if ( distance < 7) {
                                    //get profile
                                    var fullName = validJsonResponse[i].name
                                    var address  = validJsonResponse[i].stringAddress
                                    var time = validJsonResponse[i].time
                                    utils.getFacebookUrl(firebase.firebaseDatabase.ref('users/' + fullName))
                                    .then(function(result) {
                                    
                                      var profile = JSON.parse(JSON.stringify(result))
                                      utils.fbMessage(sender, `\n${fullName}\n${address}\n${distance}km away\nwill leave at ${time}\nProfile :${profile.profileURL}`);
                                    })
                                    
                                  }
                                }
                              }
                              else {
                                utils.fbMessage(sender, `Sorry , No ride available at moment`);
                              }
                            }
                          })

                        break;

                      case "car_owner":
                        geocoder.reverse({ lat: JSON.parse(validresponse)[0].payload.coordinates.lat, lon: JSON.parse(validresponse)[0].payload.coordinates.long })
                          .then(function (res, rej) {
                            if (rej) {
                              console.log(res)
                            }
                            else {
                              timeStamp = moment().format('MMMM Do YYYY, h:mm:ss a');
                              console.log(JSON.stringify(res));
                              utils.writeDataToFirebase(firebase.firebaseDatabase.ref('/car_owner/' + timeStamp + '/'),
                                {
                                  location: {
                                    lat: JSON.parse(validresponse)[0].payload.coordinates.lat,
                                    long: JSON.parse(validresponse)[0].payload.coordinates.long
                                  },
                                  stringAddress: res[0].formattedAddress,
                                  name: userName,
                                  time: "-"
                                }
                              )
                            }
                          })
                          .catch(function (err) {
                            console.log(err);
                          });
                        utils.fbMessage(sender, `What will be your departure time?`);

                        break;
                    }
                  }
                });

            }
            else {
              utils.fbMessage(sender, `Please share your location`);
            }
            // Check Session History whether its passenger or 

          } else if (text) {
            wit.message(text).then(({ entities }) => {


              var myJSONEntity = JSON.stringify(entities)
              console.log(myJSONEntity);

              var js = JSON.parse(myJSONEntity)
              var sorted_EC = checkEntityConfidence(js)

              if (sorted_EC!=null) {
                if (sorted_EC.has('greetings')) {
                  //utils.fbMessage(sender, `Hey ${userName} \nhow can i help you?`);
                  utils.fbMessageWelcomeTemplate(sender,userName)
                }
  
                else if (sorted_EC.has('passenger')) {
                  utils.writeDataToFirebase(firebase.firebaseDatabase.ref('/sessions/' + sessionId), {
                    userType: "passenger"
                  })
                  utils.fbMessage(sender, `Okay \nCan you please share your location pin from messenger App`);
  
                }
                else if (sorted_EC.has('car_owner')) {
                  utils.writeDataToFirebase(firebase.firebaseDatabase.ref('/sessions/' + sessionId), {
                    userType: "car_owner"
                  })
                  utils.validateCarOwnerInfor(firebase.firebaseDatabase.ref('users/' + userName))
                  .then(function(status) {
                    if (status) {
                      utils.fbMessage(sender, `Okay \nCan you please share your Location pin from messenger App`);
                    }
                    else {
                      utils.fbMessage(sender, `Please register at \nhttps://car-dost.firebaseapp.com/?#/registration to use this service and let me know`);
                      
                    }
                  })
                  
                }
                else if (sorted_EC.has('departureTime')) {
                  utils.updateDataToFirebase(firebase.firebaseDatabase.ref('/car_owner/' + timeStamp + '/'),
                    {
                      time: text
                    }
                  )
                  utils.fbMessage(sender, `Thank you ${userName} we will notify users near by you`);
                }
                else if (sorted_EC.has("registeration_complete")){
                  utils.fbMessage(sender, `Okay \nCan you please share your location pin from messenger App`);
                }
                else if (sorted_EC.has('irrelevant')) {
  
                utils.fbMessageUntrainedTemplate(sender);
                }
                else if (sorted_EC.has('sentiment')) {
                  switch (sorted_EC.get('value')) {
                    case "neutral":
                      utils.fbMessage(sender, `${userName} Thanks for your review`);
                      break;
                    case "negative":
                      utils.fbMessage(sender, `${userName} i appologies on behalf of our Team, its really bad thing that you are unhappy with our services.`);
                      break;
                    case "positive":
                      utils.fbMessage(sender, `That's really nice ${userName}. Thanks for your appreciation`);
                      break;
                  }
                }
                else {
                  utils.fbMessageUntrainedTemplate(sender);
                }
              }
              else {
                utils.fbMessageUntrainedTemplate(sender);
              }



            })
              .catch((err) => {
                console.error('Oops! Got an error from Wit: ', err.stack || err);
              })
          }
        } else {
          console.log('received event', JSON.stringify(event));
          if (event.postback ){
            if (event.postback.payload=="Looking for Car"){
              utils.writeDataToFirebase(firebase.firebaseDatabase.ref('/sessions/' + findOrCreateSession(event.sender.id)), {
                userType: "passenger"
              })
              utils.fbMessage(event.sender.id, `Okay \nCan you please share your location pin from messenger App`);
            }else if (event.postback.payload=="Offering Ride"){
              utils.writeDataToFirebase(firebase.firebaseDatabase.ref('/sessions/' + findOrCreateSession(event.sender.id)), {
                userType: "car_owner"
              })
              utils.validateCarOwnerInfor(firebase.firebaseDatabase.ref('users/' + userName))
              .then(function(status) {
                if (status) {
                  utils.fbMessage(event.sender.id, `Okay \nCan you please share your Location pin from messenger App`);
                }
                else {
                  utils.fbMessage(event.sender.id, `Please register at \nhttps://car-dost.firebaseapp.com/?#/registration to use this service`);
                }
              })
            }
          } 
        }
      });
    });
  }
  res.sendStatus(200);
}

getUserProfile = (PUID) => {
  return new Promise(function (resolve, reject) {
    request(`https://graph.facebook.com/v2.6/${PUID}?fields=first_name,last_name&access_token=${constant.FB_PAGE_TOKEN}`, function (error, response, body) {

      if (error != null) {
        console.log("Error:   " + error)
        reject(error)
      }
      else {
        console.log("Body:   " + body)
        resolve(body)
      }
    });
  });
}

checkEntityConfidence = (entitiesList) => {
  var sortedConfidence = new HashMap()
  var mapKey = []
  var confidence = []
  var sentimentValue = null
  for (entityObject in entitiesList) {

    console.log("Entity: " + entityObject)
    console.log("Confidence: " + entitiesList[entityObject][0].confidence)

    if (entityObject + "" === 'sentiment') {
      sentimentValue = entitiesList[entityObject][0].value
    }

    mapKey.push(entityObject)
    confidence.push(entitiesList[entityObject][0].confidence)

  }

  for (var i = 0; i < confidence.length; i++) {

    for (var j = 0; j < confidence.length; j++) {
      if (parseFloat(parseFloat(confidence[i]).toFixed(4)) < parseFloat(parseFloat(confidence[i + 1]).toFixed(4))) {

        //swap confidence 
        var tempConfidence = confidence[i]
        confidence[i] = confidence[i + 1]
        confidence[i + 1] = tempConfidence

        //swap key
        var tempMapKey = mapKey[i]
        mapKey[i] = mapKey[i + 1]
        mapKey[i + 1] = tempMapKey
      }
    }

    if (mapKey[i] + "" === 'sentiment') {
      sortedConfidence.set('value', sentimentValue);
    }

  }

  console.log('===========Sorted Entities==============')
  for (var i = 0; i < confidence.length; i++) {
    console.log(`Entity: ${mapKey[i]} and Confidence is ${confidence[i]}`)
  }
  sortedConfidence.set(mapKey[0], confidence[0]);
  if (confidence[0]>0.50){
    return sortedConfidence
  } 
  else {
    return null
  }
  
}





