// Import required modules
const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const bcrypt = require('bcrypt');
const session = require('express-session');
const cors = require('cors'); // Import CORS

const app = express();
const port = process.env.PORT || 3000;

// MongoDB connection URI
const uri = "mongodb+srv://ultanjim75nta:ntaClusterpassword@ntacluster.6fz5n.mongodb.net/NoteApp?retryWrites=true&w=majority&appName=NTAcluster";

// Create a MongoClient
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// Connect to the MongoDB server
async function connectToDatabase() {
  try {
    await client.connect();
    console.log("Connected to MongoDB!");
    await client.db("NoteApp").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

// Call the function to connect
connectToDatabase();

// Middleware to parse JSON bodies
app.use(express.json());

// Middleware for sessions
app.use(session({
  secret: 'your_secret_key', // Change this to a strong secret
  resave: false,
  saveUninitialized: true,
}));

// Add CORS middleware
app.use(cors());

// Signup route
app.post('/signup', async (req, res) => {
  const { username, password } = req.body;

  try {
    const database = client.db("NoteApp");
    const usersCollection = database.collection("notes");

    // Check if the username already exists
    const existingUser = await usersCollection.findOne({ username });

    if (existingUser) {
      // Username exists, send an alert message
      return res.json({ message: "Account already exists" });
    }

    // Hash the password and save the new user
    const hashedPassword = await bcrypt.hash(password, 10);
    await usersCollection.insertOne({ username, password: hashedPassword });

    // Send success message
    res.json({ message: "Signup successful" });
  } catch (error) {
    console.error("Error during signup:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
