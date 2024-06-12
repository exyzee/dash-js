document.addEventListener('DOMContentLoaded', function() {
    // Page Elements
    const homepage = document.getElementById('homepage');
    const detectingPage = document.getElementById('detecting-page');
    const detectedPage = document.getElementById('detected-page');
    const beginSessionPage = document.getElementById('begin-session-page');
    const feedbackPage = document.getElementById('feedback-page');

    // Buttons
    const startSessionBtn = document.getElementById('start-session-btn');
    const backBtn = document.getElementById('back-btn');
    const backBtn2 = document.getElementById('back-btn-2');
    const backBtn3 = document.getElementById('back-btn-3');
    const beginSessionBtn = document.getElementById('begin-session-btn');
    const sessionImage = document.getElementById('session-image');
    const micIcon = document.getElementById('mic-icon');
    const feedbackTextarea = document.getElementById('feedback-textarea');

    let micStream;
    let speechRecognition;
    let recognitionActive = false;

    // Event listener for the "Start a Session" button
    if (startSessionBtn) {
        startSessionBtn.addEventListener('click', function() {
            console.log('Start Session button clicked');
            homepage.style.display = 'none';
            detectingPage.style.display = 'flex'; 
            startEnvironmentDetection();
        });
    }

    // Event listener for the back button on detecting page
    if (backBtn) {
        backBtn.addEventListener('click', function() {
            console.log('Back button clicked');
            detectingPage.style.display = 'none';
            homepage.style.display = 'flex';
            stopMicrophoneDetection();
        });
    }

    // Event listener for the back button on detected page
    if (backBtn2) {
        backBtn2.addEventListener('click', function() {
            console.log('Back button on detected page clicked');
            detectedPage.style.display = 'none';
            homepage.style.display = 'flex';
            stopMicrophoneDetection();
        });
    }

    // Event listener for the "Begin Session" button on detected page
    if (beginSessionBtn) {
        beginSessionBtn.addEventListener('click', function() {
            console.log('Begin Session button clicked');
            detectedPage.style.display = 'none'; // Hide detected page
            beginSessionPage.style.display = 'flex'; // Show begin session page
            stopMicrophoneDetection();
        });
    }

    // Event listener for clicking the image on the "Begin Session" page
    if (sessionImage) {
        sessionImage.addEventListener('click', function() {
            console.log('Begin session image clicked');
            beginSessionPage.style.display = 'none';
            feedbackPage.style.display = 'flex';
        });
    }

    // Event listener for the back button on feedback page
    if (backBtn3) {
        backBtn3.addEventListener('click', function() {
            console.log('Back button on feedback page clicked');
            feedbackPage.style.display = 'none'; 
            homepage.style.display = 'flex'; 
        });
    }

    // Function to start environment detection
    function startEnvironmentDetection() {
        console.log('Starting environment detection');
        getLocation(startMicrophoneDetection);
    }

    // Function to start microphone detection
    function startMicrophoneDetection(isBusyArea) {
        console.log('Starting microphone detection, isBusyArea:', isBusyArea);
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(stream => {
                    micStream = stream; // Store the mucrophone stream
                    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    const mic = audioContext.createMediaStreamSource(stream);
                    const analyser = audioContext.createAnalyser();
                    analyser.fftSize = 256;
                    const bufferLength = analyser.frequencyBinCount;
                    const dataArray = new Uint8Array(bufferLength);
                    mic.connect(analyser);

                    const noiseThreshold = 20; // Threshold for noise detection
                    const consecutiveNoiseCountThreshold = 10; // Count for avoid false positives
                    let consecutiveNoiseCount = 0;

                    function checkNoiseLevel() {
                        analyser.getByteFrequencyData(dataArray);
                        let sum = dataArray.reduce((a, b) => a + b, 0);
                        let average = sum / bufferLength;

                        console.log(`Noise Level: ${average.toFixed(2)}, Threshold: ${noiseThreshold}, Consecutive Count: ${consecutiveNoiseCount}`);

                        if (average > noiseThreshold) {
                            consecutiveNoiseCount++;
                            console.log(`Noise detected. Count: ${consecutiveNoiseCount}`);
                            if (consecutiveNoiseCount >= consecutiveNoiseCountThreshold && isBusyArea) {
                                console.log('Busy and noisy environment detected, suggesting calm music.');
                                suggestCalmMusic();
                                return;
                            }
                        } else {
                            consecutiveNoiseCount = 0; // Reset count = if noise drops below threshold
                        }

                        requestAnimationFrame(checkNoiseLevel);
                    }
                    checkNoiseLevel();
                })
                .catch(err => {
                    console.error('Error accessing microphone:', err);
                });
        } else {
            console.error('getUserMedia not supported on your browser.');
        }
    }

    // suggest calm music
    function suggestCalmMusic() {
        console.log('Suggesting calm music');
        detectingPage.style.display = 'none';
        detectedPage.style.display = 'flex';
        stopMicrophoneDetection();
        console.log('Transition to detected page successful');
    }

    // stop microphone detection
    function stopMicrophoneDetection() {
        if (micStream) {
            micStream.getTracks().forEach(track => track.stop()); // Stop all tracks
            micStream = null;
            console.log('Microphone stream stopped');
        }
    }

    //  get user's location
    function getLocation(callback) {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(position => {
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;
                console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);

                const isBusyArea = isNearBusyArea(latitude, longitude);
                console.log(`Is Busy Area: ${isBusyArea}`);
                callback(isBusyArea);
            }, error => {
                console.error('Error getting location:', error);
                simulateLocation(callback);
            });
        } else {
            console.error('Geolocation not supported by your browser.');
            simulateLocation(callback);
        }
    }

    // simulate location
    function simulateLocation(callback) {
        console.log('Simulating location');
        const latitude = 51.028240;
        const longitude = 4.484570;
        const isBusyArea = isNearBusyArea(latitude, longitude);
        console.log(`Simulated Busy Area: ${isBusyArea}`);
        callback(isBusyArea);
    }

    // check if near a busy area
    function isNearBusyArea(lat, lon) {
        const busyAreas = [{ name: 'Bruul, Mechelen', lat: 51.028240, lon: 4.484570 }];
        const maxDistance = 0.7; // Maximum distance in kilometers

        for (let area of busyAreas) {
            const distance = getDistanceFromLatLonInKm(lat, lon, area.lat, area.lon);
            console.log(`Distance to ${area.name}: ${distance.toFixed(2)} km`);
            if (distance < maxDistance) {
                console.log(`Near ${area.name}.`);
                return true;
            }
        }

        return false;
    }

    // calculate distance between two points
    function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radius of the Earth in km
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c; // Distance in km

        console.log(`Calculating distance: lat1=${lat1}, lon1=${lon1}, lat2=${lat2}, lon2=${lon2}, distance=${distance}`);
        return distance;
    }

    //convert degrees to radians
    function deg2rad(deg) {
        return deg * (Math.PI / 180);
    }

    // Speech-to-Text
    if (micIcon) {
        micIcon.addEventListener('click', function() {
            if (!recognitionActive) {
                startSpeechRecognition();
            } else {
                stopSpeechRecognition();
            }
        });
    }

    function startSpeechRecognition() {
        try {
            window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            speechRecognition = new SpeechRecognition();
            speechRecognition.lang = 'en-US';
            speechRecognition.interimResults = false;
            speechRecognition.maxAlternatives = 1;

            speechRecognition.onresult = function(event) {
                const transcript = event.results[0][0].transcript;
                feedbackTextarea.value += transcript + ' ';
            };

            speechRecognition.onend = function() {
                recognitionActive = false;
                console.log('Speech recognition stopped');
            };

            speechRecognition.start();
            recognitionActive = true;
            console.log('Speech recognition started');
        } catch (err) {
            console.error('Speech recognition not supported', err);
        }
    }

    function stopSpeechRecognition() {
        if (speechRecognition) {
            speechRecognition.stop();
            recognitionActive = false;
            console.log('Speech recognition stopped');
        }
    }
});
