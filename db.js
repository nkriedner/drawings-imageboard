// Setting up for the database functions:
const spicedPg = require("spiced-pg");
const db = spicedPg(
    process.env.DATABASE_URL ||
        "postgres:postgres:postgres@localhost:5432/marjoram-imageboard"
);

// old
// const db =
//     process.env.DATABASE_URL ||
//     spicedPg("postgres:postgres:postgres@localhost:5432/marjoram-imageboard");
// Function to get all the images data (for the starting presentation):
module.exports.getImagesData = () => {
    const q = `
        SELECT * FROM images
        ORDER BY created_at DESC
        LIMIT 6
    `;
    return db.query(q);
};

// Function to get more images upon click on show more:
module.exports.getMoreImages = (lastId) => {
    const q = `
        SELECT * FROM images
        WHERE id < $1
        ORDER BY id DESC
        LIMIT 6
    `;
    const params = [lastId];
    return db.query(q, params);
};

// Function to insert images into the database:
module.exports.insertImageIntoDb = (url, username, title, description) => {
    const q = `
        INSERT INTO images (url, username, title, description) VALUES ($1, $2, $3, $4) RETURNING *
    `;
    const params = [url, username, title, description];
    return db.query(q, params);
};

// Function to get one specific image:
module.exports.getSpecificImage = (imageId) => {
    const q = `
        SELECT * FROM images WHERE id = $1
    `;
    const params = [imageId];
    return db.query(q, params);
};

// Function for getting the comments for an image:
module.exports.getComments = (imageId) => {
    const q = `
        SELECT * FROM comments WHERE image_id = $1
    `;
    const params = [imageId];
    return db.query(q, params);
};

// Function for posting a comment to the database:
module.exports.postComment = (username, commentText, imageId) => {
    const q = `
        INSERT INTO comments (username, comment_text, image_id)
        VALUES ($1, $2, $3)
        RETURNING *
    `;
    const params = [username, commentText, imageId];
    return db.query(q, params);
};
