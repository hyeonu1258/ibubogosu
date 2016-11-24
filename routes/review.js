const express = require('express');
const async = require('async');
const pool = require('../dbConnection');

const router = express.Router();

router.route('/:review_id/:type/image')
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
  var imageReviewQuery = 'select r.review_id, r.review_content, r.prod_rating, r.like_count, url.review_image_id, url.review_image_url, u.user_id, u.nickname, u.prof_image_url, u.type, u.age, u.height, u.weight, p.prod_id, p.prod_name, p.shopping_site_name from review r join product p on r.prod_id=p.prod_id and p.prod_id=(select prod_id from review where review_id=?) and r.image_exist_chk=1 join user u on r.user_id=u.user_id and u.type=? join review_image_url url on r.review_id=url.review_id';
  var countQuery = 'select count(*) as cnt from review r join product p on r.prod_id=p.prod_id and p.prod_id=(select prod_id from review where review_id=?) and r.prod_rating=? join user u on r.user_id=u.user_id and u.type=?';
  var revList, response;
  var rating = new Array();
  var index = [0, 1, 2, 3, 4, 5];

  pool.getConnection(function(err, conn) {
    if(err)
      console.error('Error', err);
    else {
      conn.query(imageReviewQuery, [req.params.review_id, req.params.type],
        function(err, rows) {
          if(err)
            console.log('query1 failed ', err);
          else {
            if(rows.length > 0) {
              revList = rows;
              var a = function(i) {
                conn.query(countQuery, [req.params.review_id, i*20, req.params.type],
                  function(err, rows) {
                    if(err)
                      console.log('query2 failed ', err);
                    else
                      if(rows.length > 0)
                        rating[i] = rows[0].cnt;
                    if(i == 5)
                        res.send({revList : revList, rating : rating});
                });
              }
              for(i in index)
                a(i);
            }
          }
        });
    }
  });
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
