const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js");
const listingSchema = new mongoose.Schema({
    title: String,
    description: String,
    price: Number,
    location: String,
    country: String,
    image: {
        url: String,
        filename: String
    },
    reviews: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Review"
        }
    ]
});
listingSchema.post("findOneAndDelete", async(listing)=>{
    if(listing){
        await Review.deleteMany({_id: {$in: listing.reviews}});
    }
});
module.exports = mongoose.model("Listing", listingSchema);
