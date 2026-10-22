import { env } from './src/config/env.js';
import app from './src/app.js';
import { connectDB } from './src/config/db.js';

const startServer = async () => {
  try {
    await connectDB();
    app.listen(env.PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${env.PORT}`);
    });
  } catch (error) {
    console.error(`Startup failed: ${error.message}`);
    process.exit(1);
  }
};

startServer();
