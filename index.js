const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { User,Incident } = require('./model');

const app = express();
const port = process.env.PORT || 3000;
dotenv.config();


// Middleware
// app.use(bodyParser.json());
app.use(express.json({limit:"10mb"}));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cors());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });


const auth ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2Zjg1N2ZkODg4OGNhZWEzNWVmNzM2NiIsImlhdCI6MTcyNzU2Nzc4M30.V4RxuKwKxfEvz3alFvcTC9Wt1F4JJXzfAWsSFIOdOxU"

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader;
 
  console.log(token)

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    console.log(err,user)
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Routes

// User registration
app.post('/register', async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = new User({
      username: req.body.username,
      password: hashedPassword,
    });
    await user.save();
    res.status(201).send('User registered successfully');
  } catch (error) {
    res.status(500).send('Error registering user');
  }
});

// User login
app.post('/login', async (req, res) => {
  const user = await User.findOne({ username: req.body.username });
  console.log(user)
  if (user == null) {
    return res.status(400).send('Cannot find user');
  }
  try {
    if (await bcrypt.compare(req.body.password, user.password)) {
      const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
      res.json({ accessToken: accessToken });
    } else {
      res.send('Not Allowed');
    }
  } catch {
    res.status(500).send();
  }
});

// Add a new incident
app.post('/incidents', authenticateToken, async (req, res) => {
  try {
    const incident = new Incident({
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      location: req.body.location,
      imageUrl: req.body.imageUrl,
      userId: req.user.id,
    });
    await incident.save();
    res.status(201).json(incident);
  } catch (error) {
    res.status(500).send('Error creating incident');
  }
});

// Get all incidents
app.get('/incidents', async (req, res) => {
  try {
    const incidents = await Incident.find().sort('-createdAt');
    res.json(incidents);
  } catch (error) {
    res.status(500).send('Error fetching incidents');
  }
});

// Get incidents by category
app.get('/incidents/category/:category', async (req, res) => {
  try {
    const incidents = await Incident.find({ category: req.params.category }).sort('-createdAt');
    res.json(incidents);
  } catch (error) {
    res.status(500).send('Error fetching incidents by category');
  }
});

// Get incidents submitted by the logged-in user
app.get('/myincidents', authenticateToken, async (req, res) => {
  try {
    const incidents = await Incident.find({ userId: req.user.id }).sort('-createdAt');
    res.json(incidents);
  } catch (error) {
    res.status(500).send('Error fetching user incidents');
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});