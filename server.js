import express from "express";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";

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
            console.log("Invalid JSON: ", data.toString());
            return;
        }

        if (msg.type == "create-room") {
            const name = msg.name;
            let temp = Math.random().toString(36).substring(2, 8).toUpperCase();

            while (rooms.has(temp)) {
                temp = Math.random().toString(36).substring(2, 8).toUpperCase();
            }

            const roomCode = temp;

            rooms.set(roomCode, new Set());
            rooms.get(roomCode).add(ws);

            ws.room = roomCode;
            ws.name = name;
            ws.score = 0;
            ws.isHost = true;

            console.log(`${name} created room ${roomCode}`);

            ws.send(JSON.stringify ({
                type: "room-created",
                room: roomCode
            }));

            return;
        }

        if (msg.type == "join-room") {
            const roomCode = msg.room;
            const name = msg.name;

            if (!roomCode || roomCode.length != 6) {
                ws.send(JSON.stringify({ error: "Invalid room code" }));
                console.log("Invalid room code");
                return;
            }

            if (!rooms.has(roomCode)) {
                ws.send(JSON.stringify({ error: "Room does not exist"}));
                console.log("Room does not exist");
                return;
            }

            rooms.get(roomCode).add(ws);
            ws.room = roomCode;
            ws.name = name;
            ws.score = 0;
            ws.isHost = false;

            console.log(`Client joined room ${roomCode}`);

            broadcastToRoom(roomCode, {
                type: "room-update",
                message: `${name} has joined!`,
                count: rooms.get(roomCode).size
            });

            return;
        }

        if (msg.type == "start-game") {
            const roomCode = ws.room;

            if (!rooms.has(roomCode)) {
                console.log("Room does not exist");
                return;
            }

            if (!ws.isHost) {
                ws.send(JSON.stringify({ error: "Only host can start game"}));
                console.log("Only host can start game");
                return;
            }

            if (rooms.get(roomCode).size < 2) {
                ws.send(JSON.stringify({ error: "Not enough players to start game"}));
                console.log("Not enough players to start game");
                return;
            }

            console.log(`Starting game in room ${roomCode}`);
            startGame(roomCode);

            return;
        }

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
        if (client.readyState === WebSocket.OPEN) {
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