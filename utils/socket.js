let io;

const initSocket = (server) => {
  const { Server } = require("socket.io");

  io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

 io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("joinUserRoom", (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their room`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.io is not initialized");
  }

  return io;
};

module.exports = {
  initSocket,
  getIO,
};