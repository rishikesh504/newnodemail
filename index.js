import express from "express";
import { promises } from "dns";
import { Socket } from "net";
import net from "net";
import tls from "tls";

const app = express();
const ports = 4000;

// Sample data for demonstration
const items = [
  { id: 1, name: 'Item 1' },
  { id: 2, name: 'Item 2' },
  { id: 3, name: 'Item 3' }
];


let results = []

function checkEmailWithAuth(email, host, port, username, password, from) {
    return new Promise((resolve) => {
        const smtpOptions = {
            host: host,
            port: port,
            timeout: 15000, // 15 seconds
        };
        const smtpSocket = net.connect(smtpOptions, () => {
            console.log(smtpOptions,"here")
            sendCommand(smtpSocket, '', () => {
                console.log("here")
                sendCommand(smtpSocket, `EHLO`, () => {
                    console.log("here 1")
                    sendCommand(smtpSocket,"STARTTLS",async () => {
                        console.log("here 2")
                        const tlsSocket = tls.connect({
                            socket: smtpSocket,
                           
                        });
                        console.log("here 3")
                        tlsSocket.once('secureConnect', () => {
                            console.log("here 4")
                            sendCommand(tlsSocket, `EHLO ${host}`, () => {
                                sendCommand(tlsSocket, 'AUTH LOGIN', () => {
                                    sendCommand(tlsSocket, Buffer.from(username).toString('base64'), () => {
                                        sendCommand(tlsSocket, Buffer.from(password).toString('base64'), () => {
                                            sendCommand(tlsSocket, `MAIL FROM:<${from}>`, () => {
                                                sendCommand(tlsSocket, `RCPT TO:<${email}>`, (response) => {
                                                    if (response.includes('550')) {
                                                        resolve('invalid');
                                                    } else {
                                                        resolve('valid');
                                                    }

                                                    sendCommand(tlsSocket, 'QUIT', () => {
                                                        tlsSocket.end();
                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });

        smtpSocket.on('error', () => {
            resolve('invalid');
        });
    });
}

function sendCommand(socket, command, callback) {
    socket.write(command + '\r\n', 'utf8');
    socket.once('data', (data) => {
        const response = data.toString();
        if (callback) {
            callback(response);
        }
    });
}

// 'smtp.live.com',587,'bXZlcmlmaWVyQGhvdG1haWwuY29t','VGduQ19Rfm8oO3s6','mverifier@hotmail.com'

// Example usage:
const email = 'rishikeshkeshari901@outlook.com';
const host = 'smtp.office365.com';
const port = 587;
const username = "rishikeshkeshari47@outlook.com";
const password = 'mlqeidmtpuvggscu';
const from = 'rishikeshkeshari47@outlook.com';






// Define a route to handle GET requests
app.get('/items', (req, res) => {
    checkEmailWithAuth(email, host, port, username, password, from).then(result => {
        console.log(`Email validity: ${result}`);
        res.json(result)
    });
  
});

// Start the server
app.listen(port, () => {
  console.log(`Server is listening at http://localhost:${ports}`);
});
