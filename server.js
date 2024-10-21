const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const session = require('express-session');

const app = express();
const port = process.env.PORT || 3000;

// Use CORS middleware
app.use(cors());

// MongoDB connection URI (hardcoded)
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

// API routes for notes
app.post('/api/notes', async (req, res) => {
  const note = req.body.note; // Assuming the note content is sent in the request body

  try {
    const result = await client.db("NoteApp").collection("notes").insertOne({ note });
    res.status(201).json({ message: "Note created", id: result.insertedId });
  } catch (error) {
    res.status(500).json({ error: "Failed to create note" });
  }
});

app.get('/api/notes', async (req, res) => {
  try {
    const notes = await client.db("NoteApp").collection("notes").find({}).toArray();
    res.status(200).json(notes);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve notes" });
  }
});

// DELETE route for notes
app.delete('/api/notes/:id', async (req, res) => {
  const noteId = req.params.id; // Get the note ID from the request parameters

  try {
    const result = await client.db("NoteApp").collection("notes").deleteOne({ _id: new ObjectId(noteId) });

    if (result.deletedCount === 1) {
      res.status(200).json({ message: "Note deleted successfully" });
    } else {
      res.status(404).json({ error: "Note not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to delete note" });
  }
});

// Sign Up Route
app.post('/api/signup', async (req, res) => {
  const { username, password } = req.body;

  // Validate the request body
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  try {
    // Check if the username already exists
    const existingUser = await client.db("NoteApp").collection("users").findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: "Username already exists" }); // Return an error if user exists
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    // Insert the user into the database
    const result = await client.db("NoteApp").collection("users").insertOne({ username, password: hashedPassword });
    res.status(201).json({ message: "User registered", id: result.insertedId });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ error: "Failed to register user" });
  }
});

// Sign In Route
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  // Validate the request body
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  try {
    // Find the user in the database
    const user = await client.db("NoteApp").collection("users").findOne({ username });
    if (!user) {
      return res.status(401).json({ message: "Username does not exist" });
    }

    if (await bcrypt.compare(password, user.password)) {
      // If user is found and password matches, store user session
      req.session.userId = user._id;
      res.status(200).json({ message: "Login successful" });
    } else {
      res.status(401).json({ message: "Invalid username or password" });
    }
  } catch (error) {
    console.error("Error logging in user:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

// New route to handle GET requests to the root
app.get('/', (req, res) => {
  res.send('Welcome to the Note App API!');
});

// Start the Express server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
