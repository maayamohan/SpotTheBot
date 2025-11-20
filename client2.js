import WebSocket from "ws";

const ws = new WebSocket("ws://localhost:3000");

ws.on("open", () => {
    console.log("Connected as Player2!");

    ws.send(JSON.stringify({
        type: "join-room",
        room: "ABC123",
        name: "Player2"
    }));

    // extra start-game message
    ws.send(JSON.stringify({
        type: "start-game"
    }));
});

ws.on("message", (msg) => {
    console.log("SERVER:", msg.toString());
});
