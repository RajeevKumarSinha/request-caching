// Importing required modules
const { MongoClient } = require("mongodb");
const dotenv = require("dotenv");
const express = require("express");
const NodeCache = require("node-cache");
const NCache = new NodeCache();
const Memcached = require('memcached');
const memcached = new Memcached('localhost:11211');
const util = require("util")
const memcachedGet = util.promisify(memcached.get).bind(memcached);
const memcachedSet = util.promisify(memcached.set).bind(memcached);
const { faker } = require("@faker-js/faker");

// memcached for storing 1000 random things
const memcached2 = new Memcached('localhost:11212');
const memcachedGet2 = util.promisify(memcached2.get).bind(memcached2);
const memcachedSet2 = util.promisify(memcached2.set).bind(memcached2);

const morgan = require('morgan');
// Configuring environment variables
dotenv.config();
const MONGO_URL = process.env.MONGO_URL;

// Initializing MongoDB client
let client;

// Function to connect to MongoDB
const connectToMongodb = async () => {
  
  try {
    client = new MongoClient(MONGO_URL);
    await client.connect();
    console.log("connected to mongodb successfully");
  } catch (error) {
    console.log(error);
  }
};

// Initializing Express app
const app = express();

// Use morgan for logging
app.use(morgan('dev'));

// Route to fetch data from MongoDB and use node-cache
app.get("/node-cache", async (req, res) => {
  try {
    const db = await client.db("pmdb");
    let data;
    if (NCache.has("node-cache")) {
      data = JSON.parse(NCache.get("node-cache"));
    } else {
      data = await db.collection("algoliaproducts").find({ name: /alpha/i }).toArray();
      NCache.set("node-cache", JSON.stringify(data));
    }
    res.status(200).json({ ok: true, data });
  } catch (error) {
    console.log(error);
    res.json({ error: error.message });
  }
});

// Route to fetch data from MongoDB and use memcached
app.get("/mem-cache", async (req, res) => {
  try {
    const db = client.db("pmdb");
    let data;
    const cache = await memcachedGet("mem-cache");
    
    if (cache) {
      data = JSON.parse(cache);
    } else {
      data = await db.collection("algoliaproducts").find({ name: /alpha/i }).toArray();
      memcachedSet("mem-cache", JSON.stringify(data), 36000);  // 1-hour expiry
    }

    res.status(200).json({ ok: true, data });
  } catch (error) {
    console.error("Error fetching data with mem-cache:", error);
    res.status(500).json({ error: error.message });
  }
});

// Route to generate data from faker and use memcached for storing 1000 random things
app.get("/mem-cache2", async (req, res) => {
  try {
    // Generate a random key
    const randomKey = faker.string.uuid();

    // Generate one random item using faker
    const data = {
      id: faker.string.uuid(),
      name: faker.commerce.productName(),
      price: faker.commerce.price(),
      description: faker.commerce.productDescription(),
      category: faker.commerce.department(),
    };

    // Store the item in memcached with the random key
    await memcachedSet2(randomKey, JSON.stringify(data), 36000);  // 1-hour expiry

    res.status(200).json({ ok: true, key: randomKey, data });
  } catch (error) {
    console.error("Error generating or storing data with mem-cache2:", error);
    res.status(500).json({ error: error.message });
  }
});

// Starting the server
app.listen(3000, async () => {
  await connectToMongodb();
  console.log("Server is running on port 3000");
});
module.exports = app;

//cache random 1000 things in memcache for checking the memory usage, 3rd API.

// Non-registered users are allowed to export a maximum of 1000 documents