const express = require("express");
const cors = require("cors");
const socketIO = require("socket.io");
const http = require("http");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const users = new Set();

function getName(id) {
    let userName = "";
    users.forEach((user) => {
        if (user.id === id) userName = user.userName;
        return;
    });
    return userName;
}

function removeUser(id) {
    const leftMember = getName(id);
    users.forEach((user) => {
        if (user.userName === leftMember) users.delete(user);
    });
}

app.use(cors());

io.on("connection", (socket) => {
    const id = socket.id;

    socket.on("joinRoom", ({ room, userName }) => {
        socket.join(room);

        users.add({ id, userName, room });

        socket.emit("getId", { id });

        socket.emit("welcomeMessage", {
            id,
            type: "welcome",
            userName,
            message: `Hey ${userName}, welcome to the chat`,
        });

        socket.broadcast.to(room).emit("userJoined", {
            id,
            type: "joined",
            userName,
            message: `${userName} has joined the chat`,
        });
    });

    socket.on("disconnected", ({ id, room }) => {
        socket.broadcast.to(room).emit("userLeft", {
            id,
            type: "left",
            userName: getName(id),
            message: `${getName(id)} has left`,
        });
        removeUser(id);
    });

    socket.on("message", ({ id, room, message, time }) => {
        socket.to(room).emit("receiveMessage", {
            id,
            time,
            type: "",
            message,
            userName: getName(id),
        });
    });
});

server.listen(8085);
