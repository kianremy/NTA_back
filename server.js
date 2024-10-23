// Import required modules
const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const bcrypt = require('bcrypt');
const session = require('express-session');
const cors = require('cors'); // Don't forget to import cors

const app = express();
const port = process.env.PORT || 3000;

// Middleware for CORS
app.use(cors());

// Middleware to parse JSON bodies
app.use(express.json());

// Middleware for sessions
app.use(session({
  secret: 'your_secret_key', // Change this to a strong secret
  resave: false,
  saveUninitialized: true,
}));

// Route for the root URL
app.get('/', (req, res) => {
  res.send('Welcome to the Note App API!');
});

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

// Signup route
app.post('/signup', async (req, res) => {
  const { username, password } = req.body;

  try {
    const database = client.db("NoteApp");
    const usersCollection = database.collection("notes");

    // Check if the username already exists
    const existingUser = await usersCollection.findOne({ username });

    if (existingUser) {
      return res.json({ message: "Account already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await usersCollection.insertOne({ username, password: hashedPassword });

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
