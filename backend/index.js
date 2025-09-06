import app from './app.js';
import dotenv from 'dotenv';
import connectDB from './src/db/index.js';
import logger from './src/utils/logger.js';
// Load environment variables from the .env file
dotenv.config({
  path: './.env'
});

// Connect to the database and then start the server
connectDB()
.then(() => {
  // Start the Express server
  app.listen(process.env.PORT || 8080, () => {
    logger.info(`⚙️  Server is running at port : ${process.env.PORT || 8080}`);
  });

  // Optional: Listen for Express app errors
  app.on("error", (error) => {
    logger.error("EXPRESS APP ERROR: ", error);
    throw error;
  });

  
})
.catch((err) => {
  logger.fatal("MONGO db connection failed !!! ", err);
  process.exit(1);
});
