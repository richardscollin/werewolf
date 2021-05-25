import express from "express";
import mediasoup from "mediasoup";
import { WerewolfServer } from "./werewolf-server.js";
const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.static("public"));
app.use(express.static("dist"));

const server = app.listen(PORT, async () => {
  console.log(`️[server]: Server is running at http://localhost:${PORT}`);

  const worker = await mediasoup.createWorker({
    logLevel: "warn",
  });
});

const gameServer = new WerewolfServer();
server.on("upgrade", (req, socket, head) => {
  gameServer.wss.handleUpgrade(req, socket, head, function done(ws) {
    gameServer.wss.emit("connection", ws, req);
  });
});

mediasoup.observer.on("newworker", (worker) => {
  console.log("new mediasoup worker created [pid:%d]", worker.pid);
});
