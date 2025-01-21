var virtuallyhuman = null;
var needMicAccess = false;
var host = window.location.hostname;
// const avatarId = getParameter('avatarId');
const avatarId = "6510808814255558511";
const connect = getBooleanParameter("connect");
// id of video element to display avatar
let videoElements = {
  remoteVideo: "myvideo",
};

function authSuccessHandler(resp) {
  console.log("Auth succeeded!");
  virtuallyhuman.connectGateway();
}

function authFailHandler(error) {
  console.error("Auth failed: ", JSON.stringify(error));
  Swal.fire({
    title: "Authentication Error",
    html: `<div>${error.errorTitle}: ${
      error.errorTitle == "Invalid Avatar Id"
        ? "We could not find an avatar matching this ID: " + avatarId
        : error.message
    }</div>`,
  });
}

function showMicPermissionsErrorDialog() {
  Swal.fire({
    html: `
        <h2 style="margin-top:0px;margin-bottom:0px;margin-left:23px;margin-right:23px">Your microphone is disabled <h2>
        <div style='width: 100%; text-align:left; font-size: 18px; overflow: auto; height: auto;' >
          <ol type="1" style="margin: 4px;">
            <li> Click the icon in your browser's address bar
            <li> Enable your microphone
          </ol>
        </div>
        `,
    imageUrl: "https://virtually-human.services/sdk/MicPermissions.png",
    imageWidth: 200,
    imageHeight: 200,
    imageAlt: "Permission image",
  });
}

function micAccessUpdateHandler(details) {
  console.log("In micAccessUpdateHandler html page - details = ", details);
  if (!details.permissionGranted) {
    micUpdateHandler(false);
  }

  if (details.needMicAccess) {
    needMicAccess = true;
  } else {
    needMicAccess = false;
  }
}

function speakerUpdateHandler(status) {
  console.log("Speaker Update status - " + status);
  if (status) {
    document.getElementById("speakerButton").innerHTML = '<i class="material-icons">volume_off</i>';
  } else {
    document.getElementById("speakerButton").innerHTML = '<i class="material-icons">volume_up</i>';
  }
}

function micUpdateHandler(status) {
  console.log("Mic Update status - " + status);
  if (status) {
    document.getElementById("micButton").innerHTML = '<i class="material-icons">mic_off</i>';
  } else {
    document.getElementById("micButton").innerHTML = '<i class="material-icons">mic</i>';
  }
}

function mediaConnectHandler() {
  console.log("In mediaConnectHandler");
  virtuallyhuman.setMicEnabled(true);
  virtuallyhuman.setSpeakerEnabled(true);
  document.getElementById("connect").disabled = true;
  document.getElementById("submitButton").disabled = false;
  document.getElementById("micButton").disabled = false;
  document.getElementById("speakerButton").disabled = false;
}

function mediaDisconnectHandler() {
  console.log("In mediaDisconnectHandler");
  document.getElementById("connect").disabled = false;
  document.getElementById("disconnect").disabled = true;
  document.getElementById("submitButton").disabled = true;
  document.getElementById("micButton").disabled = true;
  document.getElementById("speakerButton").disabled = true;
}

function websocketMessageHandler(resp) {
  let messageType = resp.messageType;
  if (messageType === window.Trulience.MessageType.ChatText) {
    // Ignore the acknowledgement messages.
    if (
      resp.status === "MESSAGE_DELIVERED_TO_VPS" ||
      resp.status === "MESSAGE_NOT_DELIVERED_TO_VPS"
    ) {
      return;
    }

    if (resp.sttResponse === true) {
      // Received stt message.
      console.log("Received STT Message - " + resp.messageArray[0].message);
    }
  }
}

// Auto connect if asked so.
window.onload = () => {
  if (connect) {
    startCall();
  }
};

window.onunload = function () {
  this.endCall();
};

function getBooleanParameter(paramName) {
  const paramValue = getParameter(paramName);
  return paramValue !== null && paramValue.toLowerCase() === "true";
}

function getParameter(paramName) {
  const urlParams = new URLSearchParams(window.location.search);
  const paramValue = urlParams.get(paramName);
  return paramValue;
}
function startCall() {
  // Clear exsiting object.
  if (virtuallyhuman) {
    virtuallyhuman = null;
  }

  // Create a new virtuallyhuman object.
  virtuallyhuman = Trulience.Builder()
    .setAvatarId(avatarId)
    .setUserName("Guest")
    .enableAvatar(true)
    .setRetry(false)
    .registerVideoElements(videoElements)
    .build();

  // Register for the events.
  virtuallyhuman.on("mic-access", micAccessUpdateHandler);
  virtuallyhuman.on("auth-success", authSuccessHandler);
  virtuallyhuman.on("auth-fail", authFailHandler);
  virtuallyhuman.on("speaker-update", speakerUpdateHandler);
  virtuallyhuman.on("mic-update", micUpdateHandler);
  virtuallyhuman.on("websocket-message", websocketMessageHandler);
  virtuallyhuman.on("media-connected", mediaConnectHandler);
  virtuallyhuman.on("media-disconnected", mediaDisconnectHandler);
  virtuallyhuman.on("load-progress", loadProgress);

  // Trigger auth.
  virtuallyhuman.authenticate();
  document.getElementById("disconnect").disabled = false;
  document.getElementById("connect").disabled = true;
  document.getElementById("submitButton").disabled = false;

  //
  document.getElementById("connect").style.cursor = "default";
  document.getElementById("disconnect").style.cursor = "pointer";
  document.getElementById("submitButton").style.cursor = "pointer";
  document.getElementById("micButton").style.cursor = "pointer";
  document.getElementById("speakerButton").style.cursor = "pointer";
}

function endCall(reason) {
  if (virtuallyhuman) {
    virtuallyhuman.disconnectGateway(reason);

    // Unregister for the events.
    virtuallyhuman.off("mic-access", micAccessUpdateHandler);
    virtuallyhuman.off("auth-success", authSuccessHandler);
    virtuallyhuman.off("speaker-update", speakerUpdateHandler);
    virtuallyhuman.off("mic-update", micUpdateHandler);
    virtuallyhuman.off("websocket-message", websocketMessageHandler);
    virtuallyhuman.off("media-connected", mediaConnectHandler);
    virtuallyhuman.off("media-disconnected", mediaDisconnectHandler);
    virtuallyhuman.off("load-progress", loadProgress);
    document.getElementById("progress").innerHTML = "Progress: 0%";
    document.getElementById("connect").style.cursor = "pointer";
    document.getElementById("disconnect").style.cursor = "default";
    document.getElementById("submitButton").style.cursor = "default";
    document.getElementById("micButton").style.cursor = "default";
    document.getElementById("speakerButton").style.cursor = "default";
    document.getElementById(videoElements.remoteVideo).srcObject = null;
  }
}

function loadProgress(progress) {
  console.log("Progress - " + progress.percent);
  document.getElementById("progress").innerHTML =
    "Progress: " + (progress.percent * 100).toFixed(0) + "%";
  if (progress.percent === 1) {
    document.getElementById("progress").style.visibility = "hidden";
    document.getElementById("progress").style.display = "none";
  } else {
    document.getElementById("progress").style.visibility = "visible";
    document.getElementById("progress").style.display = "flex";
  }
}

function toggleMic() {
  let permissionGranted = virtuallyhuman.isPermissionGranted("mic");
  console.log("permissionGranted - " + permissionGranted);
  if (permissionGranted && !needMicAccess) {
    virtuallyhuman.toggleMic();
  } else {
    showMicPermissionsErrorDialog();
  }
}

function toggleSpeaker() {
  virtuallyhuman.toggleSpeaker();
}

const handleKeyPress = () => {
  const textBox = document.getElementById("textBox");
  textBox.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      var msg = document.getElementById("textBox").value;
      document.getElementById("textBox").value = "";
      virtuallyhuman.sendMessage(msg);
      event.preventDefault(); // Prevents the default new line behavior
    }
  });
};

function sendText() {
  var msg = document.getElementById("textBox").value;
  document.getElementById("textBox").value = "";
  virtuallyhuman.sendMessage(msg);
}
