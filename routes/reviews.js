const express = require('express');
// route given in app.js has parameters.
// we would get "cannot read property reviews of null" error if we don't include mergeParams: true
const router = express.Router( { mergeParams:true });

// utils, validation
const catchAsync = require('../utils/catchAsync');
const ExpressError = require('../utils/ExpressError');
const {validateReview, isLoggedIn, isReviewAuthor} = require('../middleware');

// models, schemas
const Campground = require('../models/campground');
const Review = require('../models/review');
const {reviewSchema} = require('../schemas');

// ? review
router.post('/', isLoggedIn, validateReview, catchAsync(async(req, res) => {
    const campground = await Campground.findById(req.params.id);

    // review[rating] and review[body] given in the form
    // ! WE DON'T HAVE ACCESS TO PARAMS IN THE ROUTE GIVEN IN APP.JS
    // use mergeParams: true to fix this!
    // console.log(req.params);

    const review = new Review(req.body.review);
    // campground model
    review.author = req.user._id;
    campground.reviews.push(review);

    await review.save();
    await campground.save();

    // flash message
    req.flash('success', 'Successfully created a new review!');

    res.redirect(`/campgrounds/${campground._id}`);
}))

// ! delete a review
router.delete('/:reviewId', isLoggedIn, isReviewAuthor, catchAsync(async(req, res) => {
    const { id, reviewId } = req.params;
    // https://docs.mongodb.com/manual/reference/operator/update/pull/
    // update the campground by popping the related review
    await Campground.findByIdAndUpdate(id, {$pull: {reviews: reviewId}});
    // then delete the review
    await Review.findByIdAndDelete(req.params.reviewId);

    // flash message
    req.flash('success', 'Successfully deleted a review :(.');
    res.redirect(`/campgrounds/${id}`);
}))

module.exports = router;