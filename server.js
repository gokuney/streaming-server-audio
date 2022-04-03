const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const port = 8585;
const server = http.createServer(express);
const wss = new WebSocket.Server({ server })

const {exec} = require('child_process')
const fs = require('fs')

wss.on('connection', function connection(ws) { 
  ws.on('message', function incoming(data) {
    // wss.clients.forEach(function each(client) {
    //     client.send("You sent something");
    // })

    // This broadcasts to all, make a logic to target clients

    // 
    fs.writeFileSync('/tmp/playaudio.mp3',data)
    exec(`ffplay -hide_banner -nodisp /tmp/playaudio.mp3`, (err, stdout, stderr) => {
        if(err)
            console.log(`Error in running ffmpeg command: `, err)
        console.log('stdout', stdout)
        console.log('stderr', stderr)
    })
  })
})

server.listen(port, function() {
  console.log(`Server is listening on ${port}!`)
})