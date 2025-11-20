import WebSocket from "ws";

const ws = new WebSocket("ws://localhost:3000");

ws.on("open", () => {
    console.log("Connected as Player1!");

    ws.send(JSON.stringify({
        type: "join-room",
        room: "ABC123",
        name: "Player1"
    }));
});

ws.on("message", (msg) => {
    console.log("FROM SERVER:", msg.toString());
});
