import express from "express";
import http from "http";
import { Server as IOServer } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import { getDb } from "./db";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new IOServer(server, {
  cors: {
    origin: "*"
  }
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;

// Health
app.get("/", (req, res) => res.json({ ok: true }));

// Simple rooms in-memory fallback (DB will be added later)
let rooms: any[] = [];

app.post("/rooms", async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "name required" });
  const room = { id: String(Date.now()), name };
  rooms.push(room);
  res.status(201).json(room);
});

app.get("/rooms", async (req, res) => {
  res.json(rooms);
});

// SocketIO realtime
io.on("connection", socket => {
  console.log("socket connected:", socket.id);

  socket.on("join", (roomId: string) => {
    socket.join(roomId);
    io.to(roomId).emit("joined", { id: socket.id });
  });

  socket.on("message", async (payload: any) => {
    const { roomId, text, user } = payload;
    io.to(roomId).emit("message", { roomId, text, user, ts: Date.now() });
  });

  socket.on("disconnect", () => {
    console.log("disconnected", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  try {
    getDb();
    console.log("DB initialized");
  } catch (e: any) {
    console.warn("DB not initialized yet:", e.message);
  }
});
