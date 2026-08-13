let express = require('express');
let path = require('path');
let fs = require('fs');
let MongoClient = require('mongodb').MongoClient;
let bodyParser = require('body-parser');
let app = express();

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, "index.html"));
  });

app.get('/profile-picture', function (req, res) {
  let img = fs.readFileSync(path.join(__dirname, "images/profile-1.jpg"));
  res.writeHead(200, {'Content-Type': 'image/jpg' });
  res.end(img, 'binary');
});

// use when starting application locally with node command
let mongoUrlLocal = "mongodb://admin:password@localhost:27017";

// use when starting application as a separate docker container
let mongoUrlDocker = "mongodb://admin:password@host.docker.internal:27017";

// use when starting application as docker container, part of docker-compose
let mongoUrlDockerCompose = "mongodb://admin:password@mongodb";

// prefer explicit env var; default to localhost for host-run node process
let mongoUrl = process.env.MONGO_URL || mongoUrlLocal;

let mongoClient = null;

async function getDb() {
  if (!mongoClient) {
    mongoClient = new MongoClient(mongoUrl);
    await mongoClient.connect();
  }

  return mongoClient.db(databaseName);
}

// "user-account" in demo with docker. "my-db" in demo with docker-compose
let databaseName = "user-account";

app.post('/update-profile', function (req, res) {
  let userObj = req.body;
  userObj['userid'] = 1;

  let myquery = { userid: 1 };
  let newvalues = { $set: userObj };

  getDb()
    .then(function (db) {
      return db.collection("users").updateOne(myquery, newvalues, { upsert: true });
    })
    .then(function () {
      res.send(userObj);
    })
    .catch(function (err) {
      console.error(err);
      res.status(500).send({ error: "Database update failed" });
    });
});

app.get('/get-profile', function (req, res) {
  let myquery = { userid: 1 };

  getDb()
    .then(function (db) {
      return db.collection("users").findOne(myquery);
    })
    .then(function (result) {
      res.send(result ? result : {});
    })
    .catch(function (err) {
      console.error(err);
      res.status(500).send({ error: "Database query failed" });
    });
});

app.listen(3000, function () {
  console.log("app listening on port 3000!");
});

