const express = require('express');
const pool = require('../dbConnnection');

const router = express.Router();

router.route('/:review_id/image')
      .get(imageReviewList);

router.route('/:review_id/noImage')
      .get(noImageReviewList);

router.route('/:review_id/update')
      .get(searchReview)
      .post(registReview)
      .put(adjustReview)
      .delete(removeReview);

module.exports = router;

function imageReviewList(req, res) {

}

function noImageReviewList(req, res) {

}

function searchReview(req, res) {

}

function registReview(req, res) {

}

function adjustReview(req, res) {

}

function removeReview(req, res) {

}
