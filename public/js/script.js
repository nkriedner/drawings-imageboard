// Create Vue components:
Vue.component("comment-component", {
    template: "#comments-template",
    props: ["imageId"],
    data: function () {
        return {
            comments: [],
            comment: "",
            username: "",
        };
    },
    mounted: function () {
        console.log("trying to get comments for image...");
        axios
            .get(`/comments/${this.imageId}`)
            .then((response) => {
                console.log("response for axios get comments:", response);
                this.comments = response.data;
            })
            .catch((err) =>
                console.log("error when getting comments data: ", err)
            );
    },
    methods: {
        submitComment: function () {
            console.log("a comment is being submitted...");
            axios
                .post("/comment", {
                    username: this.username,
                    comment_text: this.comment,
                    image_id: this.imageId,
                })
                .then((response) => {
                    this.comments.unshift(response.data);
                })
                .catch((err) =>
                    console.log("error when posting a comment: ", err)
                );
        },
    },
});

Vue.component("modal-component", {
    template: "#modal-template",
    props: ["imageId"],
    data: function () {
        return {
            description: "",
            username: "",
            title: "",
            url: "",
            created_at: "",
        };
    },
    mounted: function () {
        console.log("this.imageId:", this.imageId);
        axios
            .get(`/image/${this.imageId}`)
            .then((response) => {
                console.log("getting image data for modal response:", response);
                console.log(
                    "response.data.description",
                    response.data.description
                );
                this.description = response.data.description;
                this.title = response.data.title;
                this.username = response.data.username;
                this.url = response.data.url;
                this.created_at = response.data.created_at;
            })
            .catch((err) => {
                console.log(
                    "error in getting the image data on modal component:",
                    err
                );
            });
    },
    watch: {
        imageId: function () {
            console.log("this.imageId:", this.imageId);
            axios
                .get(`/image/${this.imageId}`)
                .then((response) => {
                    console.log(
                        "getting image data for modal response:",
                        response
                    );
                    console.log(
                        "response.data.description",
                        response.data.description
                    );
                    this.description = response.data.description;
                    this.title = response.data.title;
                    this.username = response.data.username;
                    this.url = response.data.url;
                    this.created_at = response.data.created_at;
                })
                .catch((err) => {
                    console.log(
                        "error in getting the image data on modal component:",
                        err
                    );
                });
        },
    },
    methods: {
        closeModal: function () {
            console.log("click on closeModal");
            this.$emit("close");
        },
    },
});

// Create a Vue instance:
new Vue({
    el: "#main", // el tells Vue what element the UI will appear in
    data: {
        loadedImages: [], // this will store the images from the database
        description: "",
        username: "",
        title: "",
        file: null,
        // old:
        // imageId: null,
        // new:
        imageId: location.hash.slice(1),
    },
    mounted: function () {
        console.log("mounted succesfully, NILS!!!");
        // Store THIS (which refers to the vue instance) in a variable to keep it in the coming scope
        var self = this;
        // Use axios to make a get request to the /images route (where we make the request to get the images from the db)
        axios.get("/images").then((response) => {
            // Store the images in vues array loadImages:
            self.loadedImages = response.data.firstImages;
        });
        // to keep track of when hashes change:
        addEventListener("hashchange", function () {
            console.log("hash just changed to: ", location.hash);
            self.imageId = location.hash.slice(1);
        });
    },
    // Create a watcher for automatic update of the hashes:
    // watch: {
    //     imageId: function () {
    //         axios
    //             .get(`/image/${this.imageId}`)
    //             .then((response) => {
    //                 console.log(
    //                     "getting image data for modal response:",
    //                     response
    //                 );
    //                 console.log(
    //                     "response.data.description",
    //                     response.data.description
    //                 );
    //                 this.description = response.data.description;
    //                 this.title = response.data.title;
    //                 this.username = response.data.username;
    //                 this.url = response.data.url;
    //                 this.created_at = response.data.created_at;
    //             })
    //             .catch((err) => {
    //                 console.log(
    //                     "error in getting the image data on modal component:",
    //                     err
    //                 );
    //             });
    //     },
    // },
    methods: {
        handleChange: function (e) {
            console.log("handleChange() is called");
            // console.log("e.target.files[0]: ", e.target.files[0]);
            this.file = e.target.files[0];
            // console.log("this: ", this);
        },
        submitFile: function (e) {
            console.log("submitFile() is called");
            // To prevent reload on submit button (i use @click.prevent on button instead):
            // e.preventDefault();

            // we're going to use an API called FormData to send the file to the server
            // FormData is only for files
            var formData = new FormData();
            formData.append("file", this.file);

            // the file is the only thing that MUST go in formData
            // I'm putting the others in formData as well, just because it makes sense to
            // send everything along in one big object
            formData.append("title", this.title);
            formData.append("description", this.description);
            formData.append("username", this.username);

            // formData always logs an empty object. that does not mean the appends didn't work!
            // console.log("formData: ", formData);

            // next step - send this off to server!
            // whatever you pass as the second argument to axios.post is going to
            // in server.js end up in req.body
            // the second argument MUST be an object
            axios
                .post("/upload", formData)
                .then(({ data }) => {
                    console.log("data: ", data);
                    this.loadedImages.unshift(data.newImage);
                    // console.log("response received from server!");
                })
                .catch((err) => {
                    console.log("err in POST /upload: ", err);
                });
        },
        toggleImage: function (imageId) {
            console.log("toggle imageId:", imageId);
            this.imageId = imageId;
        },
        closeModal: function () {
            this.imageId = null;
            // new
            location.hash.value = "";
            history.pushState({}, "", "/");
        },
        showMoreImages: function () {
            console.log("Show More Images was clicked");
            // Figure out the SMALLEST image that is currently onscreen:
            // console.log(this.loadedImages);
            const smallestImage = this.loadedImages[
                this.loadedImages.length - 1
            ].id;
            console.log("SMALLEST image onscreen: ", smallestImage);
            axios.get(`/moreimages/${smallestImage}`).then(({ data }) => {
                console.log(
                    "data from axios get request on /moreimages/:smallesimtage: ",
                    data
                );
                for (let img in data) {
                    this.loadedImages.push(data[img]);
                }
            });
        },
    },
});
