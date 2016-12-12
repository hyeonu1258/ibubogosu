const express = require('express');
const async = require('async');
const pool = require('../dbConnection');
const msg = require('./message');

var router = express.Router();

/* GET home page. */
router.route('/:type/:count')
      .post(prodList);

function prodList(req, res) {
    if(req.params.type == 100) {
        prodQuery = 'select p.prod_id, p.prod_name, p.shopping_site_name, p.folder_count, (select count(*) from review where p.prod_id = review.prod_id) as review_count, (select count(*) from prod_list where prod_id=p.prod_id) as folder_count, (select count(*) from prod_list pl join folder f on pl.folder_id = f.folder_id where user_id=? and prod_id=p.prod_id) as putCheck from product p join review r on p.prod_id = r.prod_id and r.image_exist_chk = 1 group by p.prod_id having count(review_id) > 2 order by rand() limit ?, ?';
        inserts = [req.body.user_id, (req.params.count - 1) * 50, 50]
    } else {
        prodQuery = 'select p.prod_id, p.prod_name, p.shopping_site_name, p.folder_count, (select count(*) from review where p.prod_id = review.prod_id) as review_count, (select count(*) from prod_list where prod_id=p.prod_id) as folder_count, (select count(*) from prod_list pl join folder f on pl.folder_id = f.folder_id where user_id=? and prod_id=p.prod_id) as putCheck from product p join review r on p.prod_id = r.prod_id and r.image_exist_chk = 1 and r.type = ? group by p.prod_id having count(review_id) > 2 order by rand() limit ?, ?';
        inserts = [req.body.user_id, req.params.type, (req.params.count - 1) * 50, 50]
    }
    revQuery = 'select url.review_id, url.review_image_id, url.review_image_url, r.type from review_image_url url join review r on r.review_id = url.review_id join product p on r.prod_id = p.prod_id where r.prod_id = ? and r.type=? group by r.review_id;';
    productList = [];
    rating = [];

    pool.getConnection(function(err, conn) {
            if (err) {
                console.log('db connection err', err);
                res.send(msg(1, 'db connection err : ' + err, []));
            } else {
                async.waterfall([
                        function(callback) {
                            conn.query(prodQuery, inserts,
                                function(err, rows) {
                                    if (err) callback(msg(1, 'query err : ' + err, []));
                                    else
                                        if (rows.length <= 0) callback(msg(1, 'no data', []));
                                        else                  callback(null, rows);
                                });
                        },
                        function(arg, callback) {
                            async.every(arg, function(product, done) {
                                conn.query(revQuery, [product.prod_id, req.params.type], function(err, rows) {
                                    if (err) done(msg(1, 'query err : ' + err, []));
                                    else {
                                        if(product.putCheck != 0)  product.putCheck = 1;
                                        product.review = rows;
                                        productList.push(product);
                                        done(null, true);
                                    }
                                });
                            },  function(err, result) {
                                if (err)  callback(err);
                                else      callback(null, productList);
                            });
                      },
                      function(arg, callback) {
                          var i = 0;
                          async.every(arg, function(product, done) {
                              conn.query('select prod_rating from review where prod_id=?', [product.prod_id], function(err, rows) {
                                  if(err) done(msg(1, 'query err: ' + err, []));
                                  else {
                                      rating[i] = 0;
                                      for(j in rows)            rating[i] += rows[j].prod_rating;
                                      if(j == rows.length - 1)  rating[i] = Math.round(rating[i] / rows.length * 20);
                                      product.avgRating = rating[i];
                                      productList[i] = product;
                                      done(null, true);
                                      i++;
                                  }
                              });
                          }, function(err, result) {
                              if(err) callback(err);
                              else    callback(null, productList);
                          });
                      }
                  ], function(err, result) {
                        if (err) {
                            console.log(err);
                            res.send(err);
                            conn.release();
                        } else {
                            console.log('success');
                            res.send(msg(0, 'success', productList));
                            conn.release();
                        }
                });
        }
    });
}



module.exports = router;
