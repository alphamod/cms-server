const express = require('express');
const app = express();
const bodyparser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const jwtConfig = require("./auth.config");
const mongoose = require("mongoose");
const UserModel = require("./model/userModel");
const PostModel = require("./model/postModel");
const { mongoURI } = require('./db.config');
const { secret } = require('./auth.config');

mongoose.set('useUnifiedTopology', true);
mongoose.connect(mongoURI, { useNewUrlParser: true, useCreateIndex: true });


app.use(cors());
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));

const authenticate = (req, res, next) => {
    let incomingToken = req.header('x-access-token');
    if (!incomingToken) {
        console.log(`no token`);
        return res.status(403).send({ message: "No token provided!" });
    }

    jwt.verify(incomingToken, jwtConfig.secret, (err, decoded) => {
        // console.log(`decoded: \n${decoded}`);
        if (decoded !== undefined) {
            req.userID = decoded.id;
            next();
        } else {
            res.status(401).send({ message: "Unauthorized" });
        }
    })
}


app.get("/", authenticate, (req, res) => {
    res.json({ message: "Welcome to CMS server" });
});

app.post("/register", (req, res) => {
    console.log(req.body);
    const { username, email, password } = req.body;
    bcrypt.genSalt(10, (err, salt) => {
        if (err) throw err;
        bcrypt.hash(password, salt, (err, hash) => {
            if (err) {
                res.status(500).send({ message: "Something went wrong on our end. :(" })
            }
            const userModel = new UserModel({
                email, hash, username
            });
            userModel.save((err, data) => {
                // console.log(`register db save error:\n${err.code}`);
                if (err) {
                    if (err.code == 11000) {
                        res.status(400).send({ message: "Username already exists" });
                        throw err;
                    }
                }
                console.log(`db register save response:${data}`);
                res.send({ message: "User was registered successfully!" });
            });


        })
    })
});


app.post("/login", (req, res) => {
    console.log(req.body);
    const { username, password } = req.body;
    UserModel.findOne({ username }, (err, result) => {
        if (err) throw err;
        console.log(`result: \n${result}`);
        if (result != null) {

            console.log(`login DB result: \n${result}`);
            const { hash, _id, email } = result;
            bcrypt.compare(password, hash, (err, resp) => {
                if (err) throw err;
                if (resp) {
                    const accessToken = jwt.sign({ id: _id }, secret, { expiresIn: '1h' });
                    res.status(200).send({ username, email, _id, accessToken });
                } else {
                    res.status(401).send({ message: "Invalid password" });
                }
            })
        }
        else {
            res.status(404).send({ message: "User not found" });
        }
    })
})


app.post('/addcontent', authenticate, (req, res) => {
    console.log(req.body);
    const { title, content, postedBy } = req.body;
    const postModel = new PostModel({
        title, content, postedBy
    });
    // console.log(`postModel: ${postModel}`);
    postModel.save((err, dbResponse) => {
        if (err) throw err;
        console.log(`db add post response: \n${dbResponse}`);
        res.send({ message: "Posted Successfully!! :)" });
    })

});

app.get('/getcontent', authenticate, (req, res) => {
    PostModel.find({}).populate('postedBy', 'username').exec((err, allPosts) => {
        if (err) throw err;
        console.log(`\n\n====db populate result=====\n\n${allPosts}\n\n=============\n\n`)
        res.status(200).send({ allPosts });
    });
});

app.get('/getMycontent/:userID', authenticate, (req, res) => {
    console.log(req.params);
    // const 
    PostModel.find({ postedBy: req.params.userID }).populate('postedBy', 'username').exec((err, allMyPosts) => {
        if (err) throw err;
        console.log(`\n\n====db populate myposts result=====\n\n${allMyPosts}\n\n=============\n\n`);
        res.status(200).send({ allMyPosts });

    })
})

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});