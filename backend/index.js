import app from './app.js';
import dotenv from 'dotenv';
import connectDB from './src/db/index.js';

// Load environment variables from the .env file
dotenv.config({
  path: './.env'
});

// Connect to the database and then start the server
connectDB()
.then(() => {
  // Start the Express server
  app.listen(process.env.PORT || 8080, () => {
    console.log(`⚙️  Server is running at port : ${process.env.PORT || 8080}`);
  });

  // Optional: Listen for Express app errors
  app.on("error", (error) => {
    console.log("EXPRESS APP ERROR: ", error);
    throw error;
  });
})
.catch((err) => {
  console.log("MONGO db connection failed !!! ", err);
});
