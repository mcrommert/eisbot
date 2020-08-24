function requestChatBot() {
  const params = new URLSearchParams(location.search);
  const oReq = new XMLHttpRequest();
  oReq.addEventListener("load", initBotConversation);
  var path = "/chatBot?";
  if (params.has("userId")) {
    path += "&userId=" + params.get("userId");
  }
  if (params.has("region")) {
    path += "&region=" + params.get("region");
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
  const tokenPayload = JSON.parse(atob(jsonWebToken.split(".")[1]));
  const user = {
    id: tokenPayload.userId,
    name: tokenPayload.userName,
  };
  let domain = undefined;
  if (tokenPayload.directLineURI) {
    domain = "https://" + tokenPayload.directLineURI + "/v3/directline";
  }
  let region = undefined;
  if (tokenPayload.region) {
    region = tokenPayload.region;
  }
  var botConnection = window.WebChat.createDirectLine({
    token: tokenPayload.connectorToken,
    domain: domain,
  });

  // const DEFAULT_ACCENT = "#0063B1";
  const DEFAULT_ACCENT = "#AF292E";
  const DEFAULT_SUBTLE = "#767676"; // With contrast 4.5:1 to white
  const PADDING_REGULAR = 10;

  const styleOptions = {
    // Color and paddings
    accent: DEFAULT_ACCENT,
    backgroundColor: "#F8F8F8",
    cardEmphasisBackgroundColor: "#F0F0F0",
    paddingRegular: PADDING_REGULAR,
    paddingWide: PADDING_REGULAR * 2,
    subtle: DEFAULT_SUBTLE,

    // Word break
    messageActivityWordBreak: "break-word", // 'normal' || 'break-all' || 'break-word' || 'keep-all'

    // Fonts
    fontSizeSmall: "80%",
    monospaceFont: "Consolas, Courier New, monospace",
    primaryFont: "Calibri, Helvetica Neue, Arial, sans-serif",

    // Avatar
    avatarBorderRadius: "50%",
    avatarSize: 40,
    botAvatarBackgroundColor: undefined, // defaults to accent color

    botAvatarImage: "",
    botAvatarInitials: "C",
    userAvatarBackgroundColor: undefined, // defaults to accent color
    userAvatarImage: "",
    userAvatarInitials: "You",
    // Bubble
    // TODO: Should we make a bubbleFromBot*
    bubbleBackground: "White",
    bubbleBorderColor: "#E6E6E6",
    bubbleBorderRadius: 2,
    bubbleBorderStyle: "solid",
    bubbleBorderWidth: 1,
    bubbleFromUserBackground: "White",
    bubbleFromUserBorderColor: "#E6E6E6",
    bubbleFromUserBorderRadius: 2,
    bubbleFromUserBorderStyle: "solid",
    bubbleFromUserBorderWidth: 1,
    bubbleFromUserNubOffset: "bottom",
    bubbleFromUserNubSize: 0,
    bubbleFromUserTextColor: "Black",
    bubbleImageHeight: 240,
    bubbleMaxWidth: 480, // screen width = 600px
    bubbleMinHeight: 40,
    bubbleMinWidth: 250, // min screen width = 300px, Edge requires 372px (https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/13621468/)
    bubbleNubOffset: "bottom",
    bubbleNubSize: 0,
    bubbleTextColor: "Black",

    // Markdown
    markdownRespectCRLF: true,

    // Rich Cards
    richCardWrapTitle: true, // Applies to subtitles as well

    // Root
    rootHeight: "100%",
    rootWidth: "100%",
    rootZIndex: 0, // "z-index" for the root container of Web Chat. This will form a new stacking context so "z-index" used in children won't pollute.

    // Scroll to end button
    hideScrollToEndButton: false,

    // Send box
    hideSendBox: false,
    hideUploadButton: true,
    microphoneButtonColorOnDictate: "#F33",
    sendBoxBackground: "White",
    sendBoxButtonColor: undefined, // defaults to subtle
    sendBoxButtonColorOnDisabled: "#CCC",
    sendBoxButtonColorOnFocus: "#333",
    sendBoxButtonColorOnHover: "#333",
    sendBoxDisabledTextColor: undefined, // defaults to subtle
    sendBoxHeight: 40,
    sendBoxMaxHeight: 200,
    sendBoxTextColor: "Black",
    // TODO: We should deprecate this because there isn't an easy way to make the width of the send box, narrower than the transcript
    sendBoxBorderBottom: "",
    sendBoxBorderLeft: "",
    sendBoxBorderRight: "",
    sendBoxBorderTop: "solid 1px #E6E6E6",
    sendBoxPlaceholderColor: undefined, // defaults to subtle
    sendBoxTextWrap: false,

    // Visually show spoken text
    showSpokenText: false,

    // Suggested actions
    suggestedActionBackground: "White",
    suggestedActionBorder: undefined, // split into 3, null
    suggestedActionBorderColor: undefined, // defaults to accent
    suggestedActionBorderRadius: 0,
    suggestedActionBorderStyle: "solid",
    suggestedActionBorderWidth: 2,
    suggestedActionDisabledBackground: undefined, // defaults to suggestedActionBackground
    suggestedActionDisabledBorder: null,
    suggestedActionDisabledBorderColor: "#E6E6E6",
    suggestedActionDisabledBorderStyle: "solid",
    suggestedActionDisabledBorderWidth: 2,
    suggestedActionDisabledTextColor: undefined, // defaults to subtle
    suggestedActionHeight: 40,
    suggestedActionImageHeight: 20,
    suggestedActionLayout: "carousel", // either "carousel" or "stacked"
    suggestedActionTextColor: null,

    // Timestamp
    groupTimestamp: true,
    sendTimeout: 20000,
    sendTimeoutForAttachments: 120000,
    timestampColor: undefined, // defaults to subtle
    timestampFormat: "relative", // 'absolute'

    // Transcript overlay buttons (e.g. carousel and suggested action flippers, scroll to bottom, etc.)
    transcriptOverlayButtonBackground: "rgba(0, 0, 0, .6)",
    transcriptOverlayButtonBackgroundOnFocus: "rgba(0, 0, 0, .8)",
    transcriptOverlayButtonBackgroundOnHover: "rgba(0, 0, 0, .8)",
    transcriptOverlayButtonColor: "White",
    transcriptOverlayButtonColorOnFocus: undefined, // defaults to transcriptOverlayButtonColor
    transcriptOverlayButtonColorOnHover: undefined, // defaults to transcriptOverlayButtonColor

    // Video
    videoHeight: 270, // based on bubbleMaxWidth, 480 / 16 * 9 = 270

    // Connectivity UI
    connectivityIconPadding: PADDING_REGULAR * 1.2,
    connectivityMarginLeftRight: PADDING_REGULAR * 1.4,
    connectivityMarginTopBottom: PADDING_REGULAR * 0.8,
    connectivityTextSize: "75%",
    failedConnectivity: "#C50F1F",
    slowConnectivity: "#EAA300",
    notificationText: "#5E5E5E",
    slowConnectionAfter: 15000,

    typingAnimationBackgroundImage: null,
    typingAnimationDuration: 5000,
    typingAnimationHeight: 20,
    typingAnimationWidth: 64,

    spinnerAnimationBackgroundImage: null,
    spinnerAnimationHeight: 16,
    spinnerAnimationWidth: 16,
    spinnerAnimationPadding: 12,

    enableUploadThumbnail: true,
    uploadThumbnailContentType: "image/jpeg",
    uploadThumbnailHeight: 360,
    uploadThumbnailQuality: 0.6,
    uploadThumbnailWidth: 720,

    // deprecated; will be removed on or after 2021-02-01
    spinnerAnimationPaddingRight: undefined,

    // Toast UI

    // New debounce timeout value only affect new notifications.
    notificationDebounceTimeout: 400,

    hideToaster: false,
    toasterHeight: 32,
    toasterMaxHeight: 32 * 5,
    toasterSingularMaxHeight: 50,
    toastFontSize: "87.5%",
    toastIconWidth: 36,
    toastSeparatorColor: "#E8EAEC",
    toastTextPadding: 6,

    toastErrorBackgroundColor: "#FDE7E9",
    toastErrorColor: "#A80000",
    toastInfoBackgroundColor: "#CEF1FF",
    toastInfoColor: "#105E7D",
    toastSuccessBackgroundColor: "#DFF6DD",
    toastSuccessColor: "#107C10",
    toastWarnBackgroundColor: "#FFF4CE",
    toastWarnColor: "#3B3A39",
  };

  const store = window.WebChat.createStore({}, function (store) {
    return function (next) {
      return function (action) {
        if (action.type === "DIRECT_LINE/POST_ACTIVITY_FULFILLED") {
          document
            .querySelector('ul[role="list"]')
            .lastChild.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        if (action.type === "DIRECT_LINE/CONNECT_FULFILLED") {
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
            type: "DIRECT_LINE/POST_ACTIVITY",
            meta: { method: "keyboard" },
            payload: {
              activity: {
                type: "invoke",
                name: "TriggerScenario",
                value: {
                  trigger: "",
                  args: { region: region },
                },
              },
            },
          });
        }
        return next(action);
      };
    };
  });

  //sends the message "restart" to the chat window onclick of restartButton
  document.querySelector('#restartButton').addEventListener('click', () => {
    store.dispatch({
        type: 'WEB_CHAT/SEND_MESSAGE',
        payload: { text: 'restart' }
    });
  });

  const webchatOptions = {
    directLine: botConnection,
    store: store,
    styleOptions: styleOptions,
    userID: user.id,
    username: user.name,
    locale: "en",
  };
  startChat(user, webchatOptions);
}

function startChat(user, webchatOptions) {
  const botContainer = document.getElementById("webchat");
  window.WebChat.renderWebChat(webchatOptions, botContainer);
}

//
//the following code is added to control the availability of buttons from previous selections.  effect is once a selection is made, you can not go back
//

document.getElementById("webchat").addEventListener("click", function (event) {
  let button = null;
  if (event.target.tagName === "BUTTON") {
    button = event.target;
  } else if (event.target.parentElement.nodeName === "BUTTON") {
    button = event.target.parentElement;
  }
  if (button !== null) {
    selectOption(button);
    adaptiveCardsOption(button);
    selectParentOption(button);
  }
});

function selectOption(target) {
  disableButtons(target);
}

function selectParentOption(target) {
  var children = target.parentNode.parentNode.childNodes;
  disableParentButtons(children, target.innerText);
}

function adaptiveCardsOption(target) {
  var columnSet = target.closest(".ac-columnSet");
  if (columnSet) {
    var buttonsInColumnSets = columnSet.childNodes;
    for (let j = 0; j < buttonsInColumnSets.length; j++) {
      var columnSetButtons = buttonsInColumnSets[j].querySelectorAll("button");
      if (columnSetButtons) {
        disableParentButtons(
          columnSetButtons,
          target.parentNode.parentNode.innerText
        );
      }
    }
  }
}

function disableParentButtons(children, targetButton) {
  for (let i = 0; i < children.length; i++) {
    var alreadhClicked = false;
    for (var j = 0; j < children[i].classList.length; j++) {
      if (
        children[i].classList[j] === "disabled" ||
        children[i].classList[j] === "expandable"
      ) {
        alreadhClicked = true;
        break;
      }
    }
    if (children[i].nodeName === "BUTTON" && !alreadhClicked) {
      if (children[i].innerText) {
        children[i].classList.add("disabled");
        // setTimeout(function () {
        //   if (children[i] != null) {
        //     children[i].onclick = "null";
        //   }
        // }, 50);
        // children[i].removeEventListener("click", selectOption);
      }
    }
  }
}

function disableButtons(targetButton) {
  var alreadyClicked = false;
  for (var j = 0; j < targetButton.classList.length; j++) {
    if (
      targetButton.classList[j] === "disabled" ||
      targetButton.classList[j] === "expandable"
    ) {
      alreadyClicked = true;
      break;
    }
  }
  for (var k = 0; k < targetButton.parentNode.classList.length; k++) {
    if (
      targetButton.parentNode.classList[k] === "disabled" ||
      targetButton.parentNode.classList[k] === "expandable"
    ) {
      alreadyClicked = true;
      break;
    }
  }
  if (alreadyClicked) {
    return;
  }
  targetButton.classList.add("disabled");
  // targetButton.parentNode.parentNode.parentNode.parentNode.style.cursor =
  //   "not-allowed";
  var allChildren = targetButton.parentNode.childNodes;
  for (let i = 0; i < allChildren.length; i++) {
    if (allChildren[i].innerText) {
      allChildren[i].classList.add("disabled");
      allChildren[i].removeEventListener("click", selectOption);
    }
  }
}
