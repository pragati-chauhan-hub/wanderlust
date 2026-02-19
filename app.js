const express = require("express");

const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync= require("./utils/wrapAsync.js");
const ExpressError= require("./utils/ExpressError.js")
const {listingSchema, reviewSchema}= require("./schema.js");
const Review = require("./models/review.js");

// Move method-override to the very top before any routes


const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";


// --------------------- DB CONNECTION -------------------------
async function main() {
    await mongoose.connect(MONGO_URL);
}
main()
  .then(() => console.log("connected to DB"))
  .catch((err) => console.log(err));


// ------------------ MIDDLEWARE -------------------------
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));


app.use(express.urlencoded({ extended: true }));
// app.use(methodOverride("_method"));
app.use(methodOverride(function (req, res) {
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    let method = req.body._method;
    delete req.body._method;
    return method;
  }
}));

app.use(express.json()); 



// Static files
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


// ------------------ ROUTES -------------------------

app.get("/", (req, res) => {
    res.send("Hi, I am root");
});

const validateListing = (req, res, next) => {
    const { error } = listingSchema.validate(req.body);

    if (error) {
        const errMsg = error.details.map((el) => el.message).join(",");
        console.log("Validation Error:", errMsg); // Debugging line
        throw new ExpressError(400, errMsg);
    } else {
        next();
    }
};

// const validateReview = (req, res, next) => {
//     // Validate review as an object with 'review' key
//     const { error } = reviewSchema.validate({ review: req.body.review });

//     if (error) {
//         let errMsg = error.details.map((el) => el.message).join(",");
//         throw new ExpressError(400, errMsg);
//     } else {
//         next();
//     }
// };
const validateReview = (req, res, next) => {
    const { error } = reviewSchema.validate(req.body);

    if (error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    } else {
        next();
    }
};


// ----- All Listings -----
app.get("/listings", wrapAsync(async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings });
}));


// ----- Create New Listing Form -----
// 🔥 Must be ABOVE '/listings/:id'
app.get("/listings/new", (req, res) => {
    res.render("listings/new.ejs");
});


// ----- Create Listing -----
app.post("/listings", validateListing, wrapAsync(async (req, res, next) => {
    console.log("REQ.BODY=", req.body);

    const { title, description, image, price, country, location } = req.body.listing;

    const newListing = new Listing({
        title,
        description,
        image: {
            url: image,
            filename: "listingimage"
        },
        price,
        country,
        location
    });

    await newListing.save();
    res.redirect("/listings");
})
    
);



// ----- Show Listing -----
app.get("/listings/:id",wrapAsync(async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id).populate("reviews");

    if (!listing) {
        return res.send("Listing not found!");
    }

    res.render("listings/show.ejs", { listing });
}));


// ----- Edit Form -----
app.get("/listings/:id/edit", wrapAsync(async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id).populate("reviews");

    if (!listing) {
        return res.send("Listing not found!");
    }

    res.render("listings/edit.ejs", { listing });
}));


// ----- Update Listing -----
app.put("/listings/:id", validateListing, wrapAsync(async (req, res) => {
    console.log("REQ.BODY:", req.body); // Debugging line

    let { id } = req.params;
    let listing = await Listing.findById(id);

    if (!listing) {
        return res.send("Listing not found!");
    }

    let updatedData = req.body.listing;

    // If user entered new image
    if (updatedData.image && updatedData.image.trim() !== "") {
        updatedData.image = {
            url: updatedData.image,
            filename: "listingimage"
        };
    } else {
        delete updatedData.image;
    }

    await Listing.findByIdAndUpdate(id, updatedData);
    res.redirect(`/listings/${id}`);
}));



// ----- Delete Listing -----
app.delete("/listings/:id", wrapAsync(async (req, res) => {
    const { id } = req.params;
    await Listing.findByIdAndDelete(id);

    res.redirect("/listings");
}));


// reviews - POST ROUTE
app.post("/listings/:id/reviews",validateReview,wrapAsync(async(req,res)=>{
  let listing=await Listing.findById(req.params.id);
  let newReview= new Review(req.body.review);

  listing.reviews.push(newReview);

  await newReview.save();
  await listing.save();

 res.redirect(`/listings/${listing._id}`);
}));
//  reviews - DELETE ROUTE
    app.delete("/listings/:id/reviews/:reviewId", wrapAsync(async(req,res)=>{
    console.log("DELETE ROUTE HIT");
    let {id, reviewId}= req.params;
    await Listing.findByIdAndUpdate(id, {$pull: {reviews: reviewId}});
    await Review.findByIdAndDelete(reviewId);
    res.redirect(`/listings/${id}`);
}));


// ------------------ SERVER -------------------------

app.all(/.*/,(req, res, next) =>{
    next(new ExpressError(404, "Page not found!"));
});
app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = "Something went wrong!";
    res.status(statusCode).render("error", { err });
});
app.listen(8080, () => {
    console.log("server is listening to port 8080");
});
