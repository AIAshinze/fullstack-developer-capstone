const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const port = 3030;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const dataDirectory = path.join(__dirname, 'data');
const reviewsData = JSON.parse(fs.readFileSync(path.join(dataDirectory, 'reviews.json'), 'utf8'));
const dealershipsData = JSON.parse(fs.readFileSync(path.join(dataDirectory, 'dealerships.json'), 'utf8'));

const Reviews = require('./review');
const Dealerships = require('./dealership');

async function seedDatabase() {
  if (await Reviews.countDocuments() === 0) {
    await Reviews.insertMany(reviewsData.reviews);
  }
  if (await Dealerships.countDocuments() === 0) {
    await Dealerships.insertMany(dealershipsData.dealerships);
  }
}

app.get('/', (req, res) => {
  res.send('Welcome to the Mongoose API');
});

app.get('/fetchReviews', async (req, res) => {
  try {
    res.json(await Reviews.find());
  } catch (error) {
    res.status(500).json({ error: 'Error fetching reviews' });
  }
});

app.get('/fetchReviews/dealer/:id', async (req, res) => {
  try {
    res.json(await Reviews.find({ dealership: req.params.id }));
  } catch (error) {
    res.status(500).json({ error: 'Error fetching dealer reviews' });
  }
});

app.get('/fetchDealers', async (req, res) => {
  try {
    res.json(await Dealerships.find());
  } catch (error) {
    res.status(500).json({ error: 'Error fetching dealerships' });
  }
});

app.get('/fetchDealers/:state', async (req, res) => {
  try {
    res.json(await Dealerships.find({ state: req.params.state }));
  } catch (error) {
    res.status(500).json({ error: 'Error fetching dealerships by state' });
  }
});

app.get('/fetchDealer/:id', async (req, res) => {
  try {
    res.json(await Dealerships.find({ id: req.params.id }));
  } catch (error) {
    res.status(500).json({ error: 'Error fetching dealership' });
  }
});

app.post('/insert_review', async (req, res) => {
  try {
    const latestReview = await Reviews.findOne().sort({ id: -1 });
    const review = new Reviews({
      id: (latestReview?.id || 0) + 1,
      name: req.body.name,
      dealership: req.body.dealership,
      review: req.body.review,
      purchase: req.body.purchase,
      purchase_date: req.body.purchase_date,
      car_make: req.body.car_make,
      car_model: req.body.car_model,
      car_year: req.body.car_year,
    });
    const savedReview = await review.save();
    res.status(201).json({ status: 200, review: savedReview });
  } catch (error) {
    res.status(400).json({ error: 'Error inserting review', details: error.message });
  }
});

async function startServer() {
  try {
    await mongoose.connect('mongodb://mongo_db:27017/', { dbName: 'dealershipsDB' });
    await seedDatabase();
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Unable to start the API:', error.message);
    process.exit(1);
  }
}

startServer();
