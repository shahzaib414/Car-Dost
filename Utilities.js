const sessions = {};
const constant = require('./Constants')
const moment = require('moment')

exports.fbMessage = (id, text) => {
  const body = JSON.stringify({
    recipient: { id },
    message: { text },
  });
  const qs = 'access_token=' + encodeURIComponent(constant.FB_PAGE_TOKEN);
  return fetch('https://graph.facebook.com/me/messages?' + qs, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  })
    .then(rsp => rsp.json())
    .then(json => {
      if (json.error && json.error.message) {
        throw new Error(json.error.message);
      }
      return json;
    });
};

exports.findOrCreateSession = (fbid) => {
  let sessionId;
  // Let's see if we already have a session for the user fbid
  Object.keys(sessions).forEach(k => {
    if (sessions[k].fbid === fbid) {
      // Yep, got it!
      sessionId = k;
    }
  });
  if (!sessionId) {
    // No session found for user fbid, let's create a new one
    sessionId = new Date().toISOString();
    sessions[sessionId] = { fbid: fbid, context: {} };
  }
  return sessionId;
};

exports.writeDataToFirebase = (ref, jsonData) => {
  ref.set(jsonData);
}
exports.updateDataToFirebase = (ref, jsonData) => {
  ref.update(jsonData);
}
exports.checkSessionType = (ref) => {
  return new Promise(function (res, rej) {
    ref.on("value", function (snapshot) {
      var jsonObj = snapshot.toJSON()

      if (jsonObj) {
        console.log(jsonObj.userType)
        res(jsonObj.userType)
      }
      else {
        rej(null)
      }
    }, function (errorObject) {
      console.log("The read failed: " + errorObject.code);
      rej(null)
    });
  })
}

exports.retriveData = (ref) => {
  var OwnerList = [];
  console.log("Retriving Data")
  return new Promise(function(res,rej) {
    ref.on("value", function (snapshot) {

      snapshot.forEach(function (_child) {
        var timeStamp = _child.key;
        var status = moment(timeStamp, "MMMM Do YYYY, h:mm:ss a").fromNow(); 
        console.log('Time Status' + status)
        if (validateDate(status)) {
          OwnerList.push(JSON.parse(JSON.stringify(_child)))
        }
        else {
          console.log("Validating Date" +validateDate(status))
        }
      });
      if (OwnerList.count > 0 ){
        console.log('No list Found')
        rej(null)
      } 
      else{
        res(OwnerList)
      }
      
    }, function (errorObject) {
      console.log("The read failed: " + errorObject.code);
    });
  });
}

function validateDate(str) {
  if (str.indexOf("minutes") !== -1 || str.indexOf("minute") !== -1) {
    return true
  }
  else {
    return false
  }
}

exports.getFacebookUrl = (ref) => {
  return new Promise(function(res,rej){
    ref.on("value",function(snapshot){
      res(snapshot.val())
    })
  })
}
exports.validateCarOwnerInfor = (ref) => {
  return new Promise(function(res,rej){
    ref.on("value",function(snapshot){
      if (snapshot.numChildren()>0) {
        res(true)
      } 
      else{
        res(false)
      }
    })
  })
}

