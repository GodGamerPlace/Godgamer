alert("JavaScript file is linked and working!");

// Your existing camera code goes below this line
const videoElement = document.querySelector("#camera-stream");
// ... rest of your code
const videoElement = document.querySelector("#camera-stream");
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => {
    videoElement.srcObject = stream;
  })
  .catch(error => {
    console.error("Camera access denied or not available.", error);
  });
