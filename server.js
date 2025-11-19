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
        // console.log("Received: ", data.toString());
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

            console.log(`Client joined room ${roomCode}`);

            broadcastToRoom(roomCode, {
                type: "room-update",
                message: `${name} has joined!`,
                count: rooms.get(roomCode).size
            });
        }

        ws.send("Server received: " + data.toString());
    });

    ws.on("close", () => {
        // console.log("Client Disconnected");
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
    const roomSet =rooms.get(room);
    if (!roomSet) {
        return;
    }
    const json = JSON.stringify(obj);

    for (const client of roomSet) {
        client.send(json);
    }
}

server.listen(3000, () => {
    console.log("Server listening on http://localhost:3000");
});