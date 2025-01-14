require("dotenv").config();
const express = require("express");
const app = express();

// CORS
const cors = require("cors");
app.use(cors());

// Socket.io
const server = require("http").Server(app);
const io = require("socket.io")(server, {
  cors: {
    // origin: "https://radcats-karaoke.herokuapp.com",
    origin: process.env.APP_ORIGIN,
    methods: ["GET", "POST"],
  },
});

let users = [];

// Events handler
io.on("connection", (socket) => {
  console.log("connected");

  socket.on("joinSession", (sessionId, userId, username, pfp, pts, cb) => {
    const user = {
      session: sessionId,
      userId,
      username,
      pfp,
      pts: pts,
      socket: socket.id,
    };

    socket.join(sessionId);

    if (
      users.filter((u) => u.userId === userId && u.session === sessionId)
        .length === 0
    ) {
      users.push(user);
    }

    console.log("join", JSON.stringify(users));

    cb(users.filter((u) => u.session === sessionId));
  });

  socket.on("play", (sessionId, playMsg) => {
    console.log("play", JSON.stringify({ sessionId, playMsg }));
    io.to(sessionId).emit("play", playMsg);
  });

  socket.on("points", (sessionId, userId, pts, cb) => {
    console.log("points", JSON.stringify({ sessionId, userId, pts }));
    const user = users.filter(
      (u) => u.userId === userId && u.session === sessionId
    )[0];

    if (user) {
      user.pts = pts;
      cb(users.filter((u) => u.session === sessionId));
      const newPts = users.filter((u) => u.session === sessionId);
      io.to(sessionId).emit("leaderboard", newPts);
    }
  });

  socket.on("disconnect", () => {
    users = users.filter((user) => user.socket !== socket.id);
    console.log("disconnect", JSON.stringify(users));
    io.emit("newMembers", users);
  });
});

// Server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});
