require("dotenv").config();

const http = require("http");

const app = require("./app");
const connectDB = require("./config/db");
const { initSocket } = require("../utils/socket");

const PORT = process.env.PORT || 5000;

connectDB();

const server = http.createServer(app);

initSocket(server);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});