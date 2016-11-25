const express = require('express');
const async = require('async');
const pool = require('../dbConnection');

const router = express.Router();

router.route('/:review_id/:type/image')
      .get(imageReviewList);

router.route('/:review_id/noImage')
      .get(noImageReviewList);

router.route('/:review_id/update')
      .post(registReview)
      .put(adjustReview)
      .delete(removeReview);

router.route('/:keyword')
      .get(autoComplete)
      .post(searchReview)

module.exports = router;

function imageReviewList(req, res) {
  var imageReviewQuery = 'select r.review_id, r.review_content, r.prod_rating, r.like_count, url.review_image_id, url.review_image_url, u.user_id, u.nickname, u.prof_image_url, u.type, u.age, u.height, u.weight, p.prod_id, p.prod_name, p.prod_purchase_site_url, p.shopping_site_name from review r join product p on r.prod_id=p.prod_id and p.prod_id=(select prod_id from review where review_id=?) and r.image_exist_chk=1 join user u on r.user_id=u.user_id and u.type=? join review_image_url url on r.review_id=url.review_id';
  var countQuery = 'select count(*) as cnt from review r join product p on r.prod_id=p.prod_id and p.prod_id=(select prod_id from review where review_id=?) and r.prod_rating=? join user u on r.user_id=u.user_id and u.type=?';
  var comReviewQuery = 'select r.review_id, r.review_content, r.prod_rating, u.user_id, u.nickname, u.prof_image_url, u.type, u.age, u.height, u.weight from review r join product p on r.prod_id=p.prod_id and p.prod_id=(select prod_id from review where review_id=?) and r.image_exist_chk=0 join user u on r.user_id=u.user_id and u.type=?';
  var revList, response;
  var rating = new Array();
  var index = [0, 1, 2, 3, 4, 5];

  pool.getConnection(function(err, conn) {
    if(err) {
      console.log('db connection err', err);
      res.send({err : {code : 1, msg : 'db connection err'}, data : {}});
    } else {
      async.series([
        function(callback) {
          conn.query(imageReviewQuery, [req.params.review_id, req.params.type],
            function(err, rows) {
              if(err) {
                console.log("image reivew query err", err);
                res.send({err : {code : 1, msg : 'image review query err'}, data : {}});
              } else {
                if(rows.length <= 0) {
                  console.log('image review query result is 0', err);
                  res.send({err : {code : 1, msg : 'image review query result is 0'}, data : {}});
                } else
                  callback(null, rows);
              }
            });
        },
        function(callback) {
          var a = function(i) {
            conn.query(countQuery, [req.params.review_id, i, req.params.type],
              function(err, rows) {
                if(err) {
                  console.log('rating query err', err);
                  res.send({err : {code : 1, msg : 'rating query err'}, data : {}});
                } else {
                  rating[i] = rows[0].cnt;
                  if(i == 5)
                    callback(null, rating);
                }
            });
          }
          for(i in index) a(i);
        },
        function(callback) {
          conn.query(comReviewQuery, [req.params.review_id, req.params.type],
            function(err, rows) {
              if(err) {
                console.log('common review query err', err);
                res.send({err : {code : 1, msg : 'common review query err'}, data : {}});
              } else {
                if(rows.length <= 0) {
                  console.log('common review query result is 0', err);
                  res.send({err : {code : 1, msg : 'common review query result is 0'}, data : {}});
                } else
                  callback(null, rows);
              }
          });
        }
      ],
      function(err, result) {
        console.log('result : ', result);
        res.send({err : {code : 0, msg : ''}, data : {revList : result[0], rating : result[1], comRevList : result[2]}});
      });
    }
  });
}

function noImageReviewList(req, res) {
  // var comReviewQuery = 'select r.review_id, r.review_content, r.prod_rating, u.user_id, u.nickname, u.prof_image_url, u.type, u.age, u.height, u.weight from review r join product p on r.prod_id=p.prod_id and p.prod_id=(select prod_id from review where review_id=?) and r.image_exist_chk=0 join user u on r.user_id=u.user_id and u.type=?';
  //
  // pool.getConnection(err, conn) {
  //   if(err) {
  //     console.log('connection err', err);
  //     res.send({err : {code : 1, msg : 'db connection err'}, data : {}});
  //   } else {
  //     async.series([
  //       function(callback) {
  //         conn.query(comReviewQuery, [req.params.review_id, req.params.type],
  //           function(err, rows) {}
  //       });
  //     ]);
  //   }
  // }
}


function searchReview(req, res) {

}

function registReview(req, res) {

}

function adjustReview(req, res) {

}

function removeReview(req, res) {

}

function autoComplete(req, res) {
  var autoQuery = 'select prod_name from product where prod_name like ?;';
  pool.getConnection(function(err, conn) {
    if(err) {
      console.log('db connection err', err);
      res.send({err : {code : 1, msg : 'db connection err'}, data : {}});
    } else {
      conn.query(autoQuery, ['%'+req.params.keyword+'%'],
      function(err, rows) {
        if(err) {
          console.log('auto query err', err);
          res.send({err : {code : 1, msg : 'auto query err'}, data : {}});
        } else {
          if(rows.length <= 0) {
            console.log('auto query result is 0');
            console.log();
            res.send({err : {code : 1, msg : 'auto query result is 0'}, data : {}});
          } else {
            console.log('result : ', rows);
            res.send({err : {code : 0, msg : ''}, data : rows});
          }
        }
      });
    }
  });
}

function searchReview(req, res) {
  var searchQuery = 'select prod_id, prod_name, prod_image_url, shopping_site_name, folder_count from product where prod_name like ?;';
  pool.getConnection(function(err, conn) {
    if(err) {
      console.log('db connection err', err);
      res.send({err : {code : 1, msg : 'db connection err'}, data : {}});
    } else {
      conn.query(searchQuery, ['%' + req.params.keyword + '%'],
      function(err, rows) {
        if(err) {
          console.log('search query err', err);
          res.send({err : {code : 1, msg : 'search query err'}});
        } else {
          if(rows.length <= 0) {
            console.log('search query result is 0');
            res.send({err : {code : 1, msg : 'search query result is 0'}});
          } else {
            console.log('result : ', rows);
            res.send({err : {code : 0, msg : ''}, data : rows});
          }
        }
      });
    }
  });
}
