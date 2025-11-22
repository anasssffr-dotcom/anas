import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

io.on("connection", socket => {
  socket.on("sendMessage", msg => {
    io.emit("receiveMessage", { id: socket.id, msg });
  });
});

app.get("/", (req, res) => res.send("Chat backend running."));

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => console.log("Server running on port " + PORT));
