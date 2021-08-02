// Create the express app:
const express = require("express");
const app = express();

// To serve static files (such as images, html, css and js files in the folder "public")
app.use(express.static("public"));

app.use(express.json());

// the following code is required to upload files ->
const multer = require("multer");
const uidSafe = require("uid-safe");
const path = require("path");
const s3 = require("./s3");
const { s3Url } = require("./config.json");

const diskStorage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, __dirname + "/uploads");
    },
    filename: function (req, file, callback) {
        uidSafe(24).then(function (uid) {
            callback(null, uid + path.extname(file.originalname));
        });
    },
});

const uploader = multer({
    storage: diskStorage,
    limits: {
        fileSize: 2097152, // files over 2mb cannot be uploaded!
    },
});
// <- end of code that uploads files!

// Require my destructured database functions:
const {
    getImagesData,
    getMoreImages,
    insertImageIntoDb,
    getSpecificImage,
    getComments,
    postComment,
} = require("./db");

// Create the /images Route:
app.get("/images", (req, res) => {
    console.log("GET request to /images route");
    // Get the data of the images from the database:
    console.log("Getting images data from database...");
    getImagesData()
        .then((result) => {
            // Log the data:
            // console.log("result.rows:", result.rows);
            res.json({
                message: "success", // defining a success message
                firstImages: result.rows, // storing the images data in firstImages
            });
        })
        .catch((err) => {
            console.log("error when getting the images data: ", err);
        });
});

// Get more images on show more click:
app.get("/moreimages/:smallestimage", (req, res) => {
    console.log("get request to /moreimages/:smallestimage route");
    console.log("req.params: ", req.params);
    console.log("req.params.smallestimage: ", req.params.smallestimage);
    getMoreImages(req.params.smallestimage)
        .then((result) => {
            console.log("getting more images from database...");
            // console.log("result.rows: ", result.rows);
            res.json(result.rows);
        })
        .catch((err) => {
            console.log("error when getting more images from database: ", err);
        });
});

// Get route for a specific image:
app.get("/image/:imageId", (req, res) => {
    // res.send("test image id route");
    getSpecificImage(req.params.imageId)
        .then((result) => {
            console.log("get specific image - result.rows: ", result.rows);
            res.json(result.rows[0]);
        })
        .catch((err) => {
            console.log("error when getting a specific image: ", err);
        });
});

app.get("/comments/:imageId", (req, res) => {
    console.log(
        "get request on the /comments/:imageId route",
        req.params.imageId
    );

    getComments(req.params.imageId)
        .then((result) => {
            console.log(result.rows);
            res.json(result.rows);
        })
        .catch((err) => {
            console.log("error when getting comments for image: ", err);
        });
});

app.post("/comment", (req, res) => {
    console.log("POST request on /comment route");
    // console.log("req.body: ", req.body);
    postComment(req.body.username, req.body.comment_text, req.body.image_id)
        .then((result) => {
            res.json(result.rows[0]);
        })
        .catch((err) => {
            console.log("error when posting a comment: ", err);
        });
});

app.post("/upload", uploader.single("file"), s3.upload, (req, res) => {
    console.log("upload worked!!");
    // here we're going to insert the title, desc, username, and filename to the database
    // console.log("req.body: ", req.body);
    console.log("req.body.title: ", req.body.title);
    console.log("req.body.description: ", req.body.description);
    console.log("req.body.username: ", req.body.username);

    console.log("req.file: ", req.file); // req.file comes from multer
    console.log("req.file.path: ", req.file.path);

    if (req.file) {
        // this will run if everything worked!
        // Store the complete the amazon-url + file-url in a variable imageUrl:
        var imageUrl = `${s3Url}${req.file.filename}`;
        console.log("(complete) imageUrl: ", imageUrl);
        // insert the image and the image-data into the images table:
        insertImageIntoDb(
            imageUrl,
            req.body.username,
            req.body.title,
            req.body.description
        ).then((result) => {
            console.log("insertimage result.rows:", result.rows);
            res.json({
                success: true,
                newImage: result.rows[0],
            });
        });

        // send back a response to Vue using res.json
    } else {
        // this will run if something breaks along the way :(
        // send back a response to Vue using res.json
        // the response we send back needs to be something that indicates that the upload didn't work
        res.json({
            success: false,
        });
    }
});

// Make the express app listen on port 8080:
app.listen(process.env.PORT || 8080, () => {
    console.log("Imageboard running on port 8080");
});
