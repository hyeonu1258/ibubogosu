const express = require('express');
const async = require('async');
const pool = require('../dbConnection');

var router = express.Router();

/* GET home page. */
router.route('/:type/:count')
      .get(prodList);

function prodList(req, res) {
    prodQuery = 'select p.prod_id, p.prod_name, p.shopping_site_name, p.folder_count, (select count(*) from review where p.prod_id = review.prod_id ) as review_count from product p join review r on p.prod_id = r.prod_id and r.image_exist_chk = 1 and r.type = ? group by p.prod_id having count(review_id) > 2 limit ?, ?';
    revQuery = 'select url.review_id, url.review_image_id, url.review_image_url from review_image_url url join review r on r.review_id = url.review_id join product p on r.prod_id = p.prod_id where r.prod_id = ? group by r.review_id;';
    productList = [];

    pool.getConnection(function(err, conn) {
            if (err) {
                console.log('db connection err', err);
                res.send({
                    err: {
                        code: 1,
                        msg: 'db connection err'
                    },
                    data: {}
                });
            } else {
                async.waterfall([
                        function(callback) {
                            conn.query(prodQuery, [req.params.type, (req.params.count - 1) * 50, 50],
                                function(err, rows) {
                                    console.log(err, rows);
                                    if (err) {
                                        console.log('product query err ', err);
                                        var err = {
                                            err: {
                                                code: 1,
                                                msg: 'product query err'
                                            },
                                            data: {}
                                        };
                                        callback(err);
                                    } else {
                                        if (rows.length <= 0) {
                                            console.log('product query result is 0', rows);
                                            var err = {
                                                err: {
                                                    code: 1,
                                                    msg: 'product query result is 0'
                                                },
                                                data: {}
                                            };
                                            callback('no product');
                                        } else {
                                            console.log('product query success ', rows);
                                            callback(null, rows);
                                        }
                                    }
                                });
                        },
                        function(arg, callback) {
                            console.log(arg);
                            async.every(arg, function(product, done) {
                                        console.log(product);
                                        console.log(product.prod_id);
                                        conn.query(revQuery, product.prod_id, function(err, rows) {
                                                if (err) {
                                                    console.log('review query err', err);
                                                    var err = {
                                                        err: {
                                                            code: 1,
                                                            msg: 'review query err'
                                                        },
                                                        data: {}
                                                    };
                                                done(err);
                                            } else {
                                                console.log('review query success', rows);
                                                product.review = rows;
                                                productList.push(product);
                                                done(null, !err);
                                            }
                                        });
                                },
                                function(err, result) {
                                    if (err) {
                                        console.log('every prodnrev err', err);
                                        callback(err);
                                    } else {
                                        console.log('every prodnver success', result);
                                        callback(null, result);
                                    }
                                });
                    }],
                    function(err, result) {
                        if (err) {
                            console.log('waterfall prodnrev err ', err);
                            res.send(err);
                            conn.release();
                        } else {
                            console.log('waterfall prodnrev success ');
                            res.send(productList);
                            conn.release();
                        }
                    });
        }
    });
}

module.exports = router;
