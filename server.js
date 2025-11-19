import express from "express";
import http from "http";
import { WebSocketServer } from "ws";

const app = express();
const server = http.createServer(app);

app.get("/", (req, res) => {
    res.send("WebSocket Server is Running");
});

const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
    console.log("Client Connected");

    ws.on("message", (data) => {
        console.log("Received: ", data.toString());

        ws.send("Server received: " + data.toString());
    });

    ws.on("close", () => {
        console.log("Client Disconnected");
    });
});

server.listen(3000, () => {
    console.log("Server listening on http://localhost:3000");
});