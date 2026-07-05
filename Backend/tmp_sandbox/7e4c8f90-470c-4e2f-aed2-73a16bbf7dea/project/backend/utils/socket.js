const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

let users = {};
let connections = new Map();

wss.on('connection', (ws) => {
    console.log('Client connected');

    ws.on('message', (message) => {
        const data = JSON.parse(message);
        switch (data.type) {
            case 'join':
                users[data.username] = data.username;
                connections.set(data.username, ws);
                broadcast({ type: 'newUser', username: data.username });
                break;
            case 'message':
                broadcast({ type: 'message', username: data.username, message: data.message });
                break;
            case 'leave':
                connections.delete(data.username);
                broadcast({ type: 'userLeft', username: data.username });
                break;
            default:
                console.log('Unknown message type');
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        for (let [username, connection] of connections) {
            if (connection === ws) {
                connections.delete(username);
                broadcast({ type: 'userLeft', username: username });
                break;
            }
        }
    });

    ws.on('error', (error) => {
        console.log('Error occurred');
        console.log(error);
    });
});

function broadcast(message) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
        }
    });
}

module.exports = wss;