
import mongoose from "mongoose";

// MongoDB connection logic
let cachedConnection = null;

const connectMongo = async () => {
   if (cachedConnection) {
    return cachedConnection;
  }
  
  const connection = await mongoose.connect(process.env.MONGO);
  
  cachedConnection = connection;
  return connection;
}


export { connectMongo };