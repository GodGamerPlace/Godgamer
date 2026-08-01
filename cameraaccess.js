const videoElement = document.querySelector("#camera-stream");
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => {
    videoElement.srcObject = stream;
  })
  .catch(error => {
    console.error("Camera access denied or not available.", error);
  });
