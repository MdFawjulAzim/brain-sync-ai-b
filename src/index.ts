import app from "./app";
import { env } from "./config/env";
import { prisma } from "./config/db";

async function main() {
  try {
    await prisma.$connect();
    console.log("Database connected successfully");

    const port = env.PORT;
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

main();
