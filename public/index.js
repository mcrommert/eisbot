function requestChatBot() {
    const params = new URLSearchParams(location.search);
    const oReq = new XMLHttpRequest();
    oReq.addEventListener("load", initBotConversation);
    var path = "/chatBot?";
    if (params.has('userId')) {
        path += "&userId=" + params.get('userId');
    }
    if (params.has('region')) {
        path += "&region=" + params.get('region');
    }
    //if (loc) {
   //     path += "&lat=" + loc.lat + "&long=" + loc.long;
  //  }
    oReq.open("POST", path);
    oReq.send();
}
//function chatRequested() {
  //  const params = new URLSearchParams(location.search);
    //if (params.has('shareLocation')) {
      //  getUserLocation(requestChatBot);
    //}
    //else {
      //  requestChatBot();
    //}
//}
//function getUserLocation(callback) {
  //  navigator.geolocation.getCurrentPosition(
    //    function(position) {
      //      var latitude  = position.coords.latitude;
        //    var longitude = position.coords.longitude;
          //  var location = {
            //    lat: latitude,
              //  long: longitude
          //  }
            //callback(location);
        //},
      //  function(error) {
            // user declined to share location
          //  console.log("location error:" + error.message);
         //   callback();
       // });
//}
//Suggestion for document referrer location
//function getParentUrl() {
  //  var isInIframe = (parent !== window),
    //    parentUrl = null;
    //if (isInIframe) {
      //  parentUrl = document.referrer;
    //}
    //return parentUrl;
//}
function initBotConversation() {
    if (this.status >= 400) {
        alert(this.statusText);
        return;
    }
    // extract the data from the JWT
    const jsonWebToken = this.response;
    const tokenPayload = JSON.parse(atob(jsonWebToken.split('.')[1]));
    const user = {
        id: tokenPayload.userId,
        name: tokenPayload.userName
    };
    let domain = undefined;
    if (tokenPayload.directLineURI) {
        domain =  "https://" +  tokenPayload.directLineURI + "/v3/directline";
    }
    let region = undefined;
    if (tokenPayload.region) {
        region = tokenPayload.region;
    }
    var botConnection = window.WebChat.createDirectLine({
        token: tokenPayload.connectorToken,
        domain: domain
    });
  
      
    const styleOptions = {
       // avatarBorderRadius: '50%',
       // avatarSize: 40,
        botAvatarBackgroundColor: '#555659',
       // botAvatarImage: 'https://media-exp1.licdn.com/dms/image/C4E0BAQEclA3Vh3sTNw/company-logo_200_200/0?e=2159024400&v=beta&t=KD7qFl36K5BdZmGGqu1k8uZD-wYIn47CW_nR5f0l1z4',
        // userAvatarImage: '',
        richCardWrapTitle: true,
        hideSendBox: false, /* set to true to hide the send box from the view */
        botAvatarInitials: 'C',
        userAvatarInitials: 'You',
        backgroundColor: '#F8F8F8',
         // Bubble
  bubbleBackground: 'White',
  bubbleBorderColor: '#E6E6E6',
  bubbleBorderRadius: 2,
  bubbleBorderStyle: 'solid',
  bubbleBorderWidth: 1,
  bubbleFromUserBackground: 'White',
  bubbleFromUserBorderColor: '#E6E6E6',
  bubbleFromUserBorderRadius: 2,
  bubbleFromUserBorderStyle: 'solid',
  bubbleFromUserBorderWidth: 1,
  bubbleFromUserNubOffset: 'bottom',
  bubbleFromUserNubSize: 0,
  bubbleFromUserTextColor: 'Black',
  bubbleImageHeight: 240,
  bubbleMaxWidth: 480, // screen width = 600px
  bubbleMinHeight: 40,
  bubbleMinWidth: 250, // min screen width = 300px, Edge requires 372px (https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/13621468/)
  bubbleNubOffset: 'bottom',
  bubbleNubSize: 0,
  bubbleTextColor: 'Black',
  hideScrollToEndButton: false,

}

    const store = window.WebChat.createStore(
        {},
        function(store) {
            return function(next) {
                return function(action) {
                    if (action.type === 'DIRECT_LINE/CONNECT_FULFILLED') {

                        // Use the following activity to enable an authenticated end user experience
                        /*
                        store.dispatch({
                            type: 'WEB_CHAT/SEND_EVENT',
                            payload: {
                                name: "InitAuthenticatedConversation",
                                value: jsonWebToken
                            }
                        });
                        */

                        // Use the following activity to proactively invoke a bot scenario
                        
                        store.dispatch({
                            type: 'DIRECT_LINE/POST_ACTIVITY',
                            meta: {method: 'keyboard'},
                             payload: {
                                 activity: {
                                     type: "invoke",
                                     name: "TriggerScenario",
                                     value: {
                                         trigger: "choose",
                                         args: {region: region}
                                     }
                                }
                            }
                        });
                        
                    }
                    return next(action);
                }
            }
        }
    );

    const webchatOptions = {
        directLine: botConnection,
        store: store,
        styleOptions: styleOptions,
        userID: user.id,
        username: user.name,
        locale: 'en'
    };
    startChat(user, webchatOptions);
}

function startChat(user, webchatOptions) {
    const botContainer = document.getElementById('webchat');
    window.WebChat.renderWebChat(webchatOptions, botContainer);
}

//
//the following code is added to control the availability of buttons from previous selections.  effect is once a selection is made, you can not go back
//

setInterval(function () {
    // remove all buttons except the selected one, change its color, and make unclickable
    var buttons = document.getElementsByClassName("ac-pushButton");
    for (let i = 0; i < buttons.length; i++) {
        buttons[i].addEventListener("click", selectOption);
        buttons[i].addEventListener("click", adaptiveCardsOption);
        var allChildren = buttons[i].childNodes;
        for (let j = 0; j < allChildren.length; j++) {
            allChildren[j].addEventListener("click", selectParentOption);
        }
    }
}, 10);

function selectOption(event) {
    disableButtons(event.target);
}

function selectParentOption(event) {
    var children = event.target.parentNode.parentNode.childNodes;
    disableParentButtons(children, event.target.innerText);
    //parentNode.parentNode
}

function adaptiveCardsOption(event) {
    var columnSet = $(event.target).closest(".ac-columnSet")[0];
    if (columnSet) {
        var buttonsInColumnSets = columnSet.childNodes;
        for (let j = 0; j < buttonsInColumnSets.length; j++) {
            var columnSetButtons = buttonsInColumnSets[j].querySelectorAll("button");
            if (columnSetButtons) {
                disableParentButtons(columnSetButtons, event.target.parentNode.parentNode.innerText);
            }
        }
    }
}

function grayButton(button) {
    button.style.backgroundColor = "#d9d9d9";
    button.style.color = "#ffffff";
    button.height = "37px";
}

function blueButton(button) {
    button.style.backgroundColor = "#0078d7";
    button.style.color = "white";
    button.height = "37px";
}

function disableParentButtons(children, targetButton) {
    for (let i = 0; i < children.length; i++) {
        var alreadhClicked = false;
        for (var j = 0; j < children[i].classList.length; j++) {
            if (children[i].classList[j] === "old-button" || children[i].classList[j] === "expandable") {
                alreadhClicked = true;
                break;
            }
        }
        if (children[i].nodeName === "BUTTON" && !alreadhClicked) {
            if (children[i].innerText) {
                if (children[i].innerText !== targetButton) {
                    grayButton(children[i]);
                } else {
                    blueButton(children[i]);
                }
                children[i].classList.remove("ac-pushButton");
                children[i].classList.add("old-button");
                setTimeout(function () {
                    if (children[i] != null) {
                        children[i].onclick = "null";
                    }
                }, 50);
                children[i].removeEventListener("click", selectOption);
                children[i].style.outline = "none";
                children[i].style.cursor = "default";
            }
        }
    }
}

function disableButtons(targetButton) {
    var alreadyClicked = false;
    for (var j = 0; j < targetButton.classList.length; j++) {
        if (targetButton.classList[j] === "old-button" || targetButton.classList[j] === "expandable") {
            alreadyClicked = true;
            break;
        }
    }
    for (var k = 0; k < targetButton.parentNode.classList.length; k++) {
        if (targetButton.parentNode.classList[k] === "old-button" || targetButton.parentNode.classList[k] === "expandable") {
            alreadyClicked = true;
            break;
        }
    }
    if (alreadyClicked) {
        return;
    }
    blueButton(targetButton);
    targetButton.classList.add("old-button");
    targetButton.parentNode.parentNode.parentNode.parentNode.style.cursor = "not-allowed";
    var allChildren = targetButton.parentNode.childNodes;
    for (let i = 0; i < allChildren.length; i++) {
        if (allChildren[i].innerText) {
            if (allChildren[i].innerText !== targetButton.innerText) {
                grayButton(allChildren[i]);
            }
            allChildren[i].classList.remove("ac-pushButton");
            allChildren[i].classList.add("old-button");
            allChildren[i].onclick = "null";
            allChildren[i].removeEventListener("click", selectOption);
            allChildren[i].style.outline = "none";
            allChildren[i].style.cursor = "default";
        }
    }
}
