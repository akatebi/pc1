/*
 *  Copyright (c) 2015 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */

'use strict';

const startButton = document.getElementById('startButton');
const callButton = document.getElementById('callButton');
const hangupButton = document.getElementById('hangupButton');
callButton.disabled = true;
hangupButton.disabled = true;
startButton.addEventListener('click', start);
callButton.addEventListener('click', call);
hangupButton.addEventListener('click', hangup);

let startTime;
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

////
let lastPeerId = null;
let peer = null; // Own peer object
let peerId = null;
let mediaConn = null;
const localId = document.getElementById("local-id");
const localStatus = document.getElementById("local-status");
const remoteId = document.getElementById("remote-id");
////

localVideo.addEventListener('loadedmetadata', function() {
  console.log(`Local video videoWidth: ${this.videoWidth}px,  videoHeight: ${this.videoHeight}px`);
});

remoteVideo.addEventListener('loadedmetadata', function() {
  console.log(`Remote video videoWidth: ${this.videoWidth}px,  videoHeight: ${this.videoHeight}px`);
});

remoteVideo.addEventListener('resize', () => {
  console.log(`Remote video size changed to ${remoteVideo.videoWidth}x${remoteVideo.videoHeight}`);
  // We'll use the first onsize callback as an indication that video has started
  // playing out.
  if (startTime) {
    const elapsedTime = window.performance.now() - startTime;
    console.log('Setup time: ' + elapsedTime.toFixed(3) + 'ms');
    startTime = null;
  }
});

let localStream;
const offerOptions = {
  offerToReceiveAudio: 1,
  offerToReceiveVideo: 1
};

async function start() {
  
  console.log('Requesting local stream');
  startButton.disabled = true;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({audio: true, video: true});
    console.log('Received local stream');
    localVideo.srcObject = stream;
    localStream = stream;
    callButton.disabled = false;
  } catch (e) {
    alert(`getUserMedia() error: ${e.name}`);
  }
  
  peer = new Peer(null, { debug: 3 });
  
  peer.on('open', function (id) {
    // Workaround for peer.reconnect deleting previous id
    if (peer.id === null) {
        console.log('Received null id from peer open');
        peer.id = lastPeerId;
    } else {
        lastPeerId = peer.id;
    }
    console.log('ID: ' + peer.id);
    localId.innerHTML = "Local ID: " + peer.id;
    localStatus.innerHTML = "Awaiting Call...";
  });

  peer.on('close', hangup);

  peer.on('error', hangup);

  peer.on('disconnected', function() {
    peer.reconnect();
  });

  peer.on('call', function(mediaConnection) {
    console.log("Got a Media Call");
    localStatus.innerHTML = "Call Establised !!!";
    remoteId.disabled = true;
    callButton.disabled = true;
    hangupButton.disabled = false;
    mediaConnection.answer(localStream);
    mediaConnection.on('stream', function(stream) {
      remoteVideo.srcObject = stream;
    });
    mediaConnection.on('close', hangup);
    mediaConnection.on('error', hangup);
  });
}

async function call() {
  // Create connection to destination peer specified in the input field
  console.log("##### Remote Peer ID:", remoteId.value);
  mediaConn = peer.call(remoteId.value, localStream);

  mediaConn.on('stream', function(stream) {
    // `stream` is the MediaStream of the remote peer.
    // Here you'd add it to an HTML video/canvas element.
    remoteVideo.srcObject = stream;
    localStatus.innerHTML = "Call Establised !!!";
    remoteId.disabled = true;
    callButton.disabled = true;
    hangupButton.disabled = false;
  });

  mediaConn.on('open', function () {
      localStatus.innerHTML = "Connected to: " + mediaConn.peer;
      console.log("Connected to: " + mediaConn.peer);
  });

  mediaConn.on('close', hangup);

  mediaConn.on('error', hangup);
  
}

function gotRemoteStream(e) {
  if (remoteVideo.srcObject !== e.streams[0]) {
    remoteVideo.srcObject = e.streams[0];
    console.log('pc2 received remote stream');
  }
}

async function onCreateAnswerSuccess(desc) {
  // console.log(`Answer from pc2:\n${desc.sdp}`);
  console.log('pc2 setLocalDescription start');
  
}

function hangup(err) {
  console.log('Ending call', err);
  localStatus.innerHTML = "Connection closed";
  if(mediaConn) {
    mediaConn.close();
    // mediaConn = null;
  }
  peer.disconnect();
  remoteVideo.srcObject = null;
  remoteId.disabled = false;
  callButton.disabled = false;
  hangupButton.disabled = true;
}
