import { Server } from "http";
import app from "./app";
import { Server as SocketIOServer } from "socket.io";
import { env } from "./config/env";
import { prisma } from "./config/db";

async function main() {
  try {
    await prisma.$connect();
    console.log("Database connected successfully");

    const server = new Server(app);

    const io = new SocketIOServer(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST", "PATCH", "DELETE"],
      },
    });

    app.set("io", io);

    io.on("connection", (socket) => {
      console.log("New Real-time Client Connected:", socket.id);

      socket.on("disconnect", () => {
        console.log("Client Disconnected:", socket.id);
      });
    });

    server.listen(env.PORT, () => {
      console.log(`Server is running on port ${env.PORT}`);
      console.log(`Socket.io is active`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

main();
