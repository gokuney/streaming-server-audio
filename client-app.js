class audioStreamer{
    constructor(domElement){

        const API_SOCKET = 'ws://192.168.29.58:8585'

        if(!domElement)
            throw new Error(`No domElement passed`)
        if(document.querySelectorAll(`#${domElement}`).length != 1)
            throw new Error(`No/multiple domElement instances found. Please make sure that the passed reference id ${domElement} occurs only once in DOM`)
        
        // Socket configuration
        // Create WebSocket connection.
        try{
        this.socket = new WebSocket(API_SOCKET);
        // Connection opened
        this.socket.addEventListener('open', function (event) {
            console.log("Connected to the ws service")
        });
        }catch(e){
            console.log('Error in connecting to the websocket service: ', e)
            alert("Websocket service is unavailable. Streaming won't work")
        }

        this.appTarget = document.querySelector(`#${domElement}`)
        this.startListeningText = "Listening 🎙 (Click to stop)"
        this.stopListeningText = "Not Listening 🙉 (Click to start)"
        this.isListening = false
        this.lastBlobSize=0

        // Style and intial config
        this.appTarget.innerHTML = this.stopListeningText
        this.appTarget.classList.add('audioStreamer--app')
        
        // Bind events
        this.bindEvents()

        // Setup recorder
        this.microphone = null
        this.recorderOptions = {
            audio: true
        }
        this.recorderInstance = null
    }

    /********* Media recorder starts *********/
    async getMicrophoneInstance(){
        let response = null
        try{

            let permission = await navigator.permissions.query({name: 'microphone'})
            
            if(permission.state === "denied"){
                alert("You denied the permission for mic. Please allow it and refresh the page")
                return 
            }
            
            if(typeof navigator.mediaDevices === 'undefined' || !navigator.mediaDevices.getUserMedia) {
                alert('This browser does not supports WebRTC getUserMedia API.');
        
                if(!!navigator.getUserMedia) {
                    alert('This browser seems supporting deprecated getUserMedia API.');
                }
            }
        
            response = await navigator.mediaDevices.getUserMedia({
                audio:  {
                    echoCancellation: false
                }
                })
        }catch(e){
            throw new Error('Error in setting up microphone', e)
        }
        return response
    }

    askMediaRecorderStartRecording(microphone){
        let self = this
        self.recorderInstance = new MediaStreamRecorder(microphone);
        console.log(microphone, self.recorderInstance)
        self.recorderInstance.mimeType = 'audio/wav';
        self.recorderInstance.ondataavailable = (blob) => {
            console.log("Blob info",blob.size)
            self.sendAudioChunkToCloud(blob)
        }
        // Delay in sending the chunks
        self.recorderInstance.start(2000)
    }

    /********* Media recorder ends *********/

    async sendAudioChunkToCloud(data){
        console.log("Sending audio to server")
        console.log('Blob size: ', data.size)
        let d = await this.getBase64Data(data)
        this.socket.send(d)
    }

    async getBase64Data(blob){
        return new Promise((resolve, reject) => {
                try{var reader = new FileReader();
                reader.onload = function() {
                    var dataUrl = reader.result;
                    var base64 = dataUrl.split(',')[1];
                    resolve(blob)
                };
                reader.readAsDataURL(blob);
            }catch(e){
                reject(blob)
            }
        })
    }

    async startListening(){
        console.log("Starting to listen")
        this.isListening = true
        this.microphone = await this.getMicrophoneInstance()
        this.askMediaRecorderStartRecording(this.microphone)
        this.appTarget.innerHTML = this.startListeningText



    }

    async stopListening(){
        let self = this
        console.log("Stopping listen")
        self.isListening = false
        self.appTarget.innerHTML = self.stopListeningText
        self.recorderInstance.stop()
        this.microphone.stop()
        
    }

    toggleListening(){
        console.log(this.isListening)
        if(this.isListening)
            this.stopListening()
        else
            this.startListening()
    }

    bindEvents(){
        this.appTarget.addEventListener('click', this.toggleListening.bind(this))
    }

    

}