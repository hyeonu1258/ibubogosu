const express = require('express');
const async = require('async');
const pool = require('../dbConnection');
const aws = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const msg = require('./message');
const push = require('./pushAlarm');

// merge
aws.config.loadFromPath('./config/aws_config.json');
var s3 = new aws.S3();
var upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: 'ibubogosu',
        acl: 'public-read',
        key: function(req, file, cb) {
            console.log("file is ", file);
            cb(null, Date.now() + '.' + file.originalname.split('.').pop());
        }
    }),
    limits: {
        fileSize: Infinity
    }
});

const router = express.Router();

router.route('/myReview')
      .post(myReviewList);

router.route('/detail/:division')
      .post(reviewList);

router.route('/ratingReview')
      .post(ratingReview);

router.route('/update')
      .put(adjustReview)
      .post(removeReview);

router.route('/regist')
      .post(upload.single('review_image'), registReview);

router.route('/')
      .put(autoComplete)
      .post(searchProduct)

router.route('/category/:category/:type')
      .get(categoryReview)

function reviewList(req, res) {
    if (req.body.prod_id == -1) {
        imageReviewQuery = 'select r.review_id, r.review_content, r.prod_rating, (select count(*) from like_list where review_id=?) as like_count, url.review_image_id, url.review_image_url, u.user_id, u.nickname, u.prof_image_url, u.type, u.age, u.height, u.weight, p.prod_id, p.prod_name, p.prod_purchase_site_url, p.shopping_site_name, (select count(*) from prod_list pl join folder f on pl.folder_id = f.folder_id where user_id=? and prod_id=p.prod_id) as putCheck, (select count(*) from like_list where user_id=? and review_id=r.review_id) as likeCheck from review r join product p on r.prod_id=p.prod_id and p.prod_id=(select prod_id from review where review_id=?) and r.image_exist_chk=1 join user u on r.user_id=u.user_id and r.type=? join review_image_url url on r.review_id=url.review_id';
        countQuery = 'select count(*) as cnt from review where prod_id=(select prod_id from review where review_id=?) and type=? and prod_rating=? ';
        comReviewQuery = 'select r.review_id, r.review_content, r.prod_rating, u.user_id, u.nickname, u.prof_image_url, u.type, u.age, u.height, u.weight, p.prod_name, p.shopping_site_name from review r join product p on r.prod_id=p.prod_id and p.prod_id=(select prod_id from review where review_id=?) and r.image_exist_chk=0 join user u on r.user_id=u.user_id and r.type=?';
        imageInserts = [req.body.review_id, req.body.user_id, req.body.user_id, req.body.review_id, req.body.type];
        textInserts = [req.body.review_id, req.body.type];
    } else {
        imageReviewQuery = 'select r.review_id, r.review_content, r.prod_rating, (select count(*) from like_list where review_id=r.review_id) as like_count, url.review_image_id, url.review_image_url, u.user_id, u.nickname, u.prof_image_url, u.type, u.age, u.height, u.weight, p.prod_id, p.prod_name, p.prod_purchase_site_url, p.shopping_site_name, (select count(*) from prod_list pl join folder f on pl.folder_id = f.folder_id where user_id=? and pl.prod_id=p.prod_id) as putCheck, (select count(*) from like_list where user_id=? and review_id=r.review_id) as likeCheck from review r join product p on r.prod_id=p.prod_id and p.prod_id=? and r.image_exist_chk=1 join user u on r.user_id=u.user_id and r.type=? join review_image_url url on r.review_id=url.review_id;';
        countQuery = 'select count(*) as cnt from review where prod_id=? and type=? and prod_rating=?';
        comReviewQuery = 'select r.review_id, r.review_content, r.prod_rating, u.user_id, u.nickname, u.prof_image_url, u.type, u.age, u.height, u.weight, p.prod_name, p.shopping_site_name from review r join product p on r.prod_id=p.prod_id and p.prod_id=? and r.image_exist_chk=0 join user u on r.user_id=u.user_id and r.type=?';
        imageInserts = [req.body.user_id, req.body.user_id, req.body.prod_id, req.body.type];
        textInserts = [req.body.prod_id, req.body.type];
    }
    if (req.params.division == 2)
        comReviewQuery = comReviewQuery + ' limit 3'
    var revList, response;
    var rating = new Array(); rating[6] = 0;
    var index = [0, 1, 2, 3, 4, 5];
    var total = 0;

    pool.getConnection(function(err, conn) {
        if (err) {
            console.log('db connection err', err);
            res.send(msg(1, 'db connection err', []));
            conn.release();
        } else {
            async.series([
                    function(callback) {
                        if (req.params.division == 1) {
                            conn.query(imageReviewQuery, imageInserts, function(err, rows) {
                                    if (err) callback(msg(1, 'query err : ' + err, []));
                                    else
                                        if (rows.length <= 0) callback(msg(1, 'no data', []));
                                        else                  callback(null, rows);
                                });
                        } else callback(null, null);
                    },
                    function(callback) {
                        if (req.params.division == 2) {
                            var a = function(i) {
                                if (req.body.prod_id == -1) id = req.body.review_id;
                                else                        id = req.body.prod_id;
                                conn.query(countQuery, [id, req.body.type, i], function(err, rows) {
                                        if (err) callback(msg(1, 'query err : ' + err, []));
                                        else {
                                            rating[i] = rows[0].cnt;
                                            rating[6] += rows[0].cnt * i * 20;
                                            total += rows[0].cnt;
                                            if (i == 5) {
                                                rating[6] = Math.round(rating[6] / total);
                                                callback(null, rating);
                                            }
                                        }
                                    });
                            }
                            for (i in index) a(i);
                        } else callback(null, null);
                    },
                    function(callback) {
                        if (req.params.division == 2 || req.params.division == 3) {
                            conn.query(comReviewQuery, textInserts, function(err, rows) {
                                    if (err) callback(msg(1, 'query err : ' + err, []));
                                    else     callback(null, rows);
                                });
                        } else callback(null, null);
                    }
                ],
                function(err, result) {
                    if (err) {
                        console.log(err);
                        res.send(err);
                    } else {
                        console.log(result);
                        data = [{ revList: result[0], rating: result[1], comRevList: result[2] }];
                        res.send(msg(0, 'get review list success', data));
                    }
                    conn.release();
                });
        }
    });
}

function registReview(req, res) {
    var regProdQuery = 'insert into product(prod_id, prod_name, prod_purchase_site_url) values(?, ?, ?);';
    var regRevImgQuery = 'insert into review_image_url(review_image_url, review_id) values(?, ?);';
    var review_id, prod_id;

    pool.getConnection(function(err, conn) {
        if (err) {
            console.log('db connection err', err);
            res.send(msg(1, 'db connection err : ' + err, []));
            conn.release();
        }
        async.series([
                function(callback) {
                    conn.beginTransaction(function(err) {
                        if (err)  callback(msg(1, 'transaction err : ' + err, []));
                        else      callback(null, 'beginTransaction');
                    });
                },
                // 왜 안될까? post()안에 여러 함수를 넣으면 async로 실행되는지,, upload.single()함수를 콜백 안에서 실행시키면 실행이 되는지 실험해보기
                // function(callback) {
                //     const uploadRet = upload.single('review_image');
                //     console.log('upload Ret :', uploadRet)
                //     uploadRet(req, res, function(err) {
                //         console.log(req.file);
                //         if (err) {
                //             console.log('image upload err', err);
                //             var error = {
                //                 err: {
                //                     code: 1,
                //                     msg: 'image upload err'
                //                 },
                //                 data: {}
                //             }
                //             callback(error);
                //         } else {
                //             upload_review_image_url = 'https://s3.ap-northeast-2.amazonaws.com/ibubogosu/';
                //             console.log(upload_review_image_url);
                //             callback(null, 'upload success');
                //         }
                //     });
                // },
                function(callback) {
                    if (req.body.prod_id == -1) {
                        conn.query('select max(prod_id) as id from product', [], function(err, rows) {
                                if (err) callback(msg(1, 'query err : ' + err, []));
                                else {
                                    prod_id = Number(rows[0].id.split('_')[1]) + 1;
                                    prod_id = 'stylenanda_' + prod_id;
                                    callback(null, 'get max prod_id');
                                }
                            });
                    } else callback(null, 'pass get max prod_id');
                },
                function(callback) {
                    if (req.body.prod_id == -1) {
                        conn.query(regProdQuery, [prod_id, req.body.prod_name, req.body.prod_purchase_site_url], function(err, rows) {
                                if (err)  callback(msg(1, 'query err : ' + err, []));
                                else      callback(null, 'regist product success');
                            });
                    } else callback(null, 'pass regist product');
                },
                function(callback) {
                    conn.query('select max(review_id) as id from review', [], function(err, rows) {
                        if (err)  callback(msg(1, 'query err : ' + err, []));
                        else {
                            review_id = Number(rows[0].id.split('_')[1]) + 1;
                            review_id = 'stylenanda_' + review_id
                            callback(null, 'get max review_id')
                        }
                    });
                },
                function(callback) {
                    if (req.body.prod_id == -1) {
                        regRevQuery = 'insert into review(review_id, review_content, image_exist_chk, prod_rating, user_id, prod_id, type, height, weight) values(?, ?, ?, ?, ?, ?, ?, ?, ?);';
                        inserts = [review_id, req.body.review_content, 1, req.body.prod_rating, req.body.user_id, prod_id, req.body.type, req.body.height, req.body.weight];
                    } else {
                        regRevQuery = 'insert into review(review_id, review_content, image_exist_chk, prod_rating, user_id, prod_id, type, height, weight) values(?, ?, ?, ?, ?, ?, ?, ?, ?);';
                        inserts = [review_id, req.body.review_content, 1, req.body.prod_rating, req.body.user_id, req.body.prod_id, req.body.type, req.body.height, req.body.weight];
                    }
                    conn.query(regRevQuery, inserts, function(err, rows) {
                            if (err)  callback(msg(1, 'query err : ' + err, []));
                            else      callback(null, 'regist review success');
                        });
                },
                function(callback) {
                    if (req.file == undefined) callback(msg(1, 'upload err : ' + err, []));
                    else {
                        conn.query(regRevImgQuery, [req.file.location, review_id], function(err, rows) {
                                if (err)  callback(msg(1, 'query err : ' + err, []));
                                else      callback(null, 'regist review image success');
                            });
                    }
                },
            ],
            function(err, result) {
                if (err) {
                    console.log(err);
                    res.send(err);
                    conn.rollback();
                } else {
                    console.log('result : ', result);
                    push('test', 'testetet');
                    res.send(msg(0, 'upload review success', []));
                    conn.commit();
                }
                conn.release();
            });
    });
}

function adjustReview(req, res) {
    pool.getConnection(function(err, conn) {
        if (err) {
            console.log('db connection err : ' + err);
            res.send(msg(1, 'db connection err : ' + err, []));
            conn.release();
        } else {
            // 자기가 작성한 리뷰만 수정하도록 바꾸기
            conn.query('update review set review_content=? where review_id=?', [req.body.review_content, req.body.review_id], function(err, rows) {
                    if (err)  res.send(msg(1, 'query err : ' + err, []));
                    else      res.send(msg(0, 'adjust review success', []));
                    conn.release();
                });
        }
    });
}

function removeReview(req, res) {
    pool.getConnection(function(err, conn) {
        if (err) {
            console.log(err);
            res.send(msg(1, 'db connection err : ' + err, []));
            conn.release();
        } else {
            async.series([
                function(callback) {
                    conn.beginTransaction(function(err) {
                        if(err) callback(msg(1, 'transaction err : ' + err, []));
                        else    callback(null, 'transaction start');
                    });
                },
                function(callback) {
                    conn.query('delete from review_image_url where review_id=?', [req.body.review_id], function(err, rows) {
                            if (err)  callback(msg(1, 'query err : ' + err, []));
                            else      callback(null, 'delete image success');
                        });
                },
                function(callback) {
                    // 자기가 작성한 리뷰만 지우도록 바꾸기
                    conn.query('delete from review where review_id=? and user_id=?', [req.body.review_id, req.body.user_id], function(err, rows) {
                            if (err)  callback(msg(1, 'query err : ' + err, []));
                            else      callback(null, 'delete review success');
                        });
                }
            ], function(err, result) {
                if (err) {
                    res.send(err);
                    conn.rollback;
                } else {
                    res.send(msg(0, 'success', result));
                    conn.commit;
                }
                conn.release();
            });
        }
    });
}

function autoComplete(req, res) {
    var autoQuery = 'select prod_name from product where prod_name like ?;';
    pool.getConnection(function(err, conn) {
        if (err) {
            console.log('db connection err', err);
            res.send(msg(1, 'db connection err : ' + err, []));
            conn.release();
        } else {
            conn.query(autoQuery, ['%' + req.body.keyword + '%'], function(err, rows) {
                    if (err) {
                        console.log('auto query err', err);
                        res.send(msg(1, 'query err : ' + err, []));
                    } else {
                        if (rows.length <= 0) {
                            console.log('no data');
                            res.send(msg(1, 'no data', []));
                        } else {
                            console.log('result : ', rows);
                            var prodList = [];
                            for (i in rows) prodList[i] = rows[i].prod_name;
                            res.send(msg(0, 'auto complete success', prodList));
                        }
                    }
                    conn.release();
                });
        }
    });
}

function searchProduct(req, res) {
    var searchQuery = 'select prod_id, prod_name, prod_image_url, shopping_site_name, (select count(*) from prod_list where prod_id=p.prod_id) as folder_count, (select count(*) from review r where r.prod_id=p.prod_id and r.type=?) as review_count from product p where prod_name like ?;';
    pool.getConnection(function(err, conn) {
        if (err) {
            console.log('db connection err', err);
            res.send(msg(1, 'db connection err : ' + err, []));
            conn.release();
        } else {
            conn.query(searchQuery, [req.body.type, '%' + req.body.keyword + '%'], function(err, rows) {
                    if (err) {
                        console.log('search query err', err);
                        res.send(msg(1, 'query err : ' + err, []));
                    } else {
                        if (rows.length <= 0) {
                            console.log('search query result is 0');
                            res.send(msg(1, 'no data', []));
                        } else {
                            console.log('result : ', rows);
                            res.send(msg(0, 'search product success', rows));
                        }
                    }
                    conn.release();
                });
        }
    });
}

function myReviewList(req, res) {
    var userQuery = 'select user_id, nickname, prof_image_url, age, height, weight from user where user_id=?';
    var revQuery = 'select p.prod_id, p.prod_name, p.shopping_site_name, r.review_id, r.review_content, url.review_image_url, r.prod_rating, r.weight, r.height from review r join product p on r.prod_id = p.prod_id join review_image_url url on r.review_id = url.review_id and r.user_id=? group by r.review_id';
    var userInfo;

    pool.getConnection(function(err, conn) {
        if (err) {
            console.log('db connection err : ' + err);
            res.send(msg(1, 'db connection err : ' + err, []));
            conn.release();
        } else {
            async.series([
                    function(callback) {
                        async.waterfall([
                                function(done) {
                                    conn.query(userQuery, [req.body.user_id], function(err, rows) {
                                        if (err)  done(msg(1, 'query err : ' + err, []));
                                        else      done(null, rows[0]);
                                    });
                                },
                                function(arg, done) {
                                    if (req.body.my_id != -1) {
                                        conn.query('select user_id from following_list where following_id=? and user_id=?', [arg.user_id, req.body.my_id], function(err, rows) {
                                                if (err) done(msg(1, 'query err : ' + err, []));
                                                else {
                                                    if (rows.length < 1)  arg.followMe = 0;
                                                    else                  arg.followMe = 1;
                                                    done(null, arg);
                                                }
                                            });
                                    } else done(null, arg);
                                }
                            ],
                            function(err, result) {
                                if (err)  callback(err);
                                else      callback(null, result);
                            });
                    },
                    function(callback) {
                        conn.query(revQuery, [req.body.user_id], function(err, rows) {
                            if (err)  callback(msg(1, 'query err : ' + err, []));
                            else      callback(null, rows);
                        });
                    },
                ],
                function(err, result) {
                    if (err) {
                        console.log(err);
                        res.send(err);
                    } else {
                        console.log(result);
                        data = [{ userInfo: result[0], reviewList: result[1] }];
                        res.send(msg(0, 'success', data));
                    }
                    conn.release();
                });
        }
    });
}

function ratingReview(req, res) {
    ratingReviewQuery = 'select r.review_id, url.review_image_url, r.prod_rating from review r join product p on p.prod_id = r.prod_id join review_image_url url on r.review_id = url.review_id and r.prod_id=? and r.type=?';
    inserts = [req.body.prod_id, req.body.type];
    if (req.body.prod_rating != -1) {
        ratingReviewQuery += ' and r.prod_rating=?';
        inserts.push(req.body.prod_rating);
    }
    pool.getConnection(function(err, conn) {
        if (err) {
            console.log(err);
            res.send(msg(1, 'db connection err : ' + err, []));
            conn.release();
        } else {
            conn.query(ratingReviewQuery, inserts, function(err, rows) {
                    if (err) {
                        console.log(err);
                        res.send(msg(1, 'query err : ' + err, []));
                    } else {
                        if (rows.length < 1) {
                            console.log('no data');
                            res.send(msg(1, 'no data', []));
                        } else {
                            console.log('get review by rating success');
                            res.send(msg(0, 'rating review success', rows));
                        }
                    }
                    conn.release();
                });
        }
    });
}

function categoryReview(req, res) {
    var categoryQuery = 'select p.prod_id, p.prod_name, url.review_image_url, p.shopping_site_name, (select count(*) from prod_list where prod_id=p.prod_id) as folder_count, (select count(*) from review r where r.prod_id=p.prod_id and r.type=?) as review_count from review r join review_image_url url on r.review_id = url.review_id join product p on r.prod_id = p.prod_id where p.category=? and r.type=? group by r.review_id';
    pool.getConnection(function(err, conn) {
        if(err) {
            console.log(err);
            res.send(msg(1, 'db connection err : ' + err, []));
            conn.release();
        } else {
            conn.query(categoryQuery, [req.params.type, req.params.category, req.params.type], function(err, rows) {
                if(err) {
                    console.log(err);
                    res.send(msg(1, 'query err : ' + err, []));
                } else {
                    if(rows.length < 1) {
                      console.log('category query result is 0');
                      res.send(msg(1, 'no data', []));
                    } else {
                      console.log(rows);
                      res.send(msg(0, 'category review success', rows));
                    }
                }
                conn.release();
            });
        }
    });
}

module.exports = router;
