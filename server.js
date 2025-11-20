import express from "express";
import http from "http";
import { WebSocketServer } from "ws";

const app = express();
const server = http.createServer(app);

app.get("/", (req, res) => {
    res.send("WebSocket Server is Running");
});

const wss = new WebSocketServer({ server });

const rooms = new Map();

wss.on("connection", (ws) => {
    console.log("Client Connected");
    ws.room = null;

    ws.on("message", (data) => {
        let msg;

        try {
            msg = JSON.parse(data.toString());
        }
        catch (e) {
            console.log("Invalid JSON: ", data.toString);
            return;
        }

        if (msg.type == "join-room") {
            const roomCode = msg.room;
            const name = msg.name;

            if (!rooms.has(roomCode)) {
                rooms.set(roomCode, new Set());
            }

            rooms.get(roomCode).add(ws);
            ws.room = roomCode;
            ws.name = name;
            ws.score = 0;

            console.log(`Client joined room ${roomCode}`);

            broadcastToRoom(roomCode, {
                type: "room-update",
                message: `${name} has joined!`,
                count: rooms.get(roomCode).size
            });
        }

        if (msg.type == "start-game") {
            const roomCode = ws.room;

            if (!rooms.has(roomCode)) {
                console.log("Room does not exist");
            }

            if (rooms.get(roomCode).size < 2) {
                broadcastToRoom(roomCode, {
                    type: "room-size",
                    message: "Not enough players to start game :(",
                    count: rooms.get(roomCode).size
                });
                console.log("Not enough players");
                return;
            }

            console.log(`Starting game in room ${roomCode}`);
            startGame(roomCode);
        }

        ws.send("Server received: " + data.toString());
    });

    ws.on("close", () => {
        if (ws.room) {
            const roomSet = rooms.get(ws.room);
            if (roomSet) {
                roomSet.delete(ws);

                broadcastToRoom(ws.room, {
                    type: "room-update",
                    message: `${ws.name} has left.`,
                    count: rooms.get(ws.room).size
                });

                if (roomSet.size === 0) {
                    rooms.delete(ws.room);
                }
            }

            console.log(`Client has left room ${ws.room}`);
        }
    });
});

function broadcastToRoom(room, obj) {
    const roomSet = rooms.get(room);
    if (!roomSet) {
        return;
    }
    const json = JSON.stringify(obj);

    for (const client of roomSet) {
        if (client.readyState === client.OPEN) {
            client.send(json);
        }
    }
}

function startGame(room) {
    console.log(`Game has started in room ${room}`);
    broadcastToRoom(room, {
        type: "game-started",
        message: "Game has started!"
    });

    //TO DO: Game Logic
}

server.listen(3000, () => {
    console.log("Server listening on http://localhost:3000");
});