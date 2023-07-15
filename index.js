var app = require("express")();
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var cors = require("cors");
var Schema = mongoose.Schema;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const authorize = require("./middleware/jwt-auth");

const todoSchema = new Schema({
  srno: Number,
  title: String,
  name: String,
  desc: String,
  active: Boolean,
});
let userSchema = new Schema({
  name: {
    type: String,
  },
  email: {
    type: String,
    unique: true,
  },
  password: {
    type: String,
  },
});

mongoose
  .connect(
    "mongodb+srv://anojadubey:qjmgXNa1oVnzrgw4@cluster0.8fwzjox.mongodb.net/?retryWrites=true&w=majority"
  )
  .then(() => {
    console.log("connected to mongoDB");
  })
  .catch((err) => console.log(err));

const Todos = mongoose.model("Todos", todoSchema);
const User = mongoose.model("User", userSchema);

app.use(cors());

app.post("/register-user", bodyParser.json(), function (req, res) {
  bcrypt.hash(req.body.password, 10).then((hash) => {
    console.log(hash);
    const user = new User({
      name: req.body.name,
      email: req.body.email,
      password: hash,
    });
    user
      .save()
      .then((result) => {
        res.status(201).json({
          message: "User successfully created!",
          result: result,
        });
      })
      .catch((err) => {
        res.status(500).json({
          error: err,
        });
      });
  });
});

app.post("/signin", bodyParser.json(), function (req, res) {
  let getUser;
  User.findOne({
    email: req.body.email,
  })
    .then((user) => {
      console.log(user);
      if (!user) {
        return res.status(401).json({
          message: "Authentication failed",
        });
      }
      getUser = user;
      return bcrypt.compare(req.body.password, user.password);
    })
    .then((response) => {
      if (!response) {
        return res.status(401).json({
          message: "Authentication failed",
        });
      }
      let jwtToken = jwt.sign(
        {
          email: getUser.email,
          userId: getUser._id,
        },
        "longer-secret-is-better",
        {
          expiresIn: "1h",
        }
      );
      res.status(200).json({
        token: jwtToken,
        expiresIn: 3600,
        _id: getUser._id,
      });
    })
    .catch((err) => {
      return res.status(401).json({
        message: "Authentication failed" + err,
      });
    });
});

app.get("/user/:id", function (req, res) {
  const id = req.params.id;
  User.findById(id)
    .then((user) => {
      if (!user) {
        return res.status(404).json({ message: "No User found" });
      } else {
        return res.status(200).json({ user: user });
      }
    })
    .catch((err) => console.log(err));
});
app.post("/todo", bodyParser.json(), function (req, res) {
  const name = req.body.name;
  Todos.find({ name: name })
    .then((todos) => {  
      if (!todos || todos.length === 0) {
        return res.status(404).json({ message: "No Todos found" });
      } else {
        return res.status(200).json({ todos: todos });
      }
    }
    )
    .catch((err) => console.log(err));
});
app.get("/", function (req, res) {
  Todos.find()
    .then((todos) => {
      if (!todos || todos.length === 0) {
        return res.status(404).json({ message: "No Todos found" });
      } else {
        return res.status(200).json({ todos: todos });
      }
    })
    .catch((err) => console.log(err));
});

app.post("/", bodyParser.json(), function (req, res) {
  const todo = new Todos({
    srno: req.body.srno,
    title: req.body.title,
    desc: req.body.desc,
    active: req.body.active,
    name: req.body.name,
  });
  todo
    .save()
    .then((result) => {
      res.status(201).json({
        message: "Post added successfully",
        result: result,
      });
    })
    .catch((err) => console.log(err));
});

app.put("/edit", bodyParser.json(), function (req, res) {
  const id = req.body.id;
  const todo = Todos.findByIdAndUpdate(id, {
    title: req.body.title,
    desc: req.body.desc,
  })
    .then((result) => {
      res.status(201).json({
        message: "Post updated successfully",
      });
    })
    .catch((err) => console.log(err));
});

app.delete("/deletetodo/:id", function (req, res) {
  const id = req.params.id;
  Todos.findByIdAndDelete(id)
    .then((result) => {
      res.status(201).json({
        message: "Post deleted successfully",
      });
    })
    .catch((err) => console.log(err));
});

app.listen(5000, function () {
  console.log("listening on port 5000!");
});
