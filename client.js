import WebSocket from "ws";

const ws = new WebSocket("ws://localhost:3000");

ws.on("open", () => {
    console.log("Connected!");

    ws.send(JSON.stringify({
        type: "join-room",
        name: "Alice",
        room: "ABCD"
    }));
});

ws.on("message", (data) => {
    console.log("Server says:", data.toString());
});
