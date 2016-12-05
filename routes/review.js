const express = require('express');
const async = require('async');
const pool = require('../dbConnection');
const aws = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');

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

router.route('/:review_id/:type/image')
    .get(imageReviewList);

router.route('/:review_id/:type/noImage')
    .get(noImageReviewList);

router.route('/:review_id/update')
    .put(adjustReview)
    .delete(removeReview);

router.route('/regist')
    .post(upload.single('review_image'), registReview);

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
        if (err) {
            console.log('db connection err', err);
            res.send({
                err: {
                    code: 1,
                    msg: 'db connection err'
                },
                data: []
            });
        } else {
            async.series([
                    function(callback) {
                        conn.query(imageReviewQuery, [req.params.review_id, req.params.type],
                            function(err, rows) {
                                if (err) {
                                    console.log("image reivew query err", err);
                                    conn.release();
                                    res.send({
                                        err: {
                                            code: 1,
                                            msg: 'image review query err'
                                        },
                                        data: []
                                    });
                                } else {
                                    if (rows.length <= 0) {
                                        console.log('image review query result is 0', err);
                                        res.send({
                                            err: {
                                                code: 1,
                                                msg: 'image review query result is 0'
                                            },
                                            data: []
                                        });
                                        conn.release();
                                    } else {
                                        callback(null, rows);
                                    }
                                }
                            });
                    },
                    function(callback) {
                        var a = function(i) {
                            conn.query(countQuery, [req.params.review_id, i, req.params.type],
                                function(err, rows) {
                                    if (err) {
                                        console.log('rating query err', err);
                                        res.send({
                                            err: {
                                                code: 1,
                                                msg: 'rating query err'
                                            },
                                            data: []
                                        });
                                        conn.release();
                                    } else {
                                        rating[i] = rows[0].cnt;
                                        if (i == 5) {
                                            callback(null, rating);
                                        }
                                    }
                                });
                        }
                        for (i in index) a(i);
                    },
                    function(callback) {
                        conn.query(comReviewQuery, [req.params.review_id, req.params.type],
                            function(err, rows) {
                                if (err) {
                                    console.log('common review query err', err);
                                    conn.release();
                                    res.send({
                                        err: {
                                            code: 1,
                                            msg: 'common review query err'
                                        },
                                        data: []
                                    });
                                } else {
                                    if (rows.length <= 0) {
                                        console.log('common review query result is 0', err);
                                        res.send({
                                            err: {
                                                code: 1,
                                                msg: 'common review query result is 0'
                                            },
                                            data: []
                                        });
                                        conn.release();
                                    } else {
                                        callback(null, rows);
                                    }
                                }
                            });
                    }
                ],
                function(err, result) {
                    if (err) {
                        console.log('load review err ', err);
                        res.send(err);
                        conn.rollback();
                        conn.release();
                    } else {
                        console.log('result : ', result);
                        res.send({
                            err: {
                                code: 0,
                                msg: ''
                            },
                            data: [
                              {
                                revList: result[0],
                                rating: result[1],
                                comRevList: result[2]
                              }
                            ]
                        });
                        conn.commit();
                        conn.release();
                    }
                }
            );
        }
    });
}

function noImageReviewList(req, res) {
    var comReviewQuery = 'select r.review_id, r.review_content, r.prod_rating, u.user_id, u.nickname, u.prof_image_url, u.type, u.age, u.height, u.weight from review r join product p on r.prod_id=p.prod_id and p.prod_id=(select prod_id from review where review_id=?) and r.image_exist_chk=0 join user u on r.user_id=u.user_id and u.type=?';

    pool.getConnection(function(err, conn) {
        if (err) {
            console.log('connection err', err);
            res.send({
                err: {
                    code: 1,
                    msg: 'db connection err'
                },
                data: []
            });
            conn.release();
        } else {
            conn.query(comReviewQuery, [req.params.review_id, req.params.type],
                function(err, rows) {
                    if (err) {
                        console.log('common review query err', err);
                        res.send({
                            err: {
                                code: 1,
                                msg: 'common review query err'
                            },
                            data: []
                        });
                        conn.release();
                    } else {
                        if (rows.length <= 0) {
                            console.log('common review query result is 0');
                            res.send({
                                err: {
                                    code: 1,
                                    msg: 'common review query result is 0'
                                },
                                data: []
                            });
                            conn.release();
                        } else {
                            console.log('rows : ', rows);
                            res.send({
                                err: {
                                    code: 0,
                                    msg: ''
                                },
                                data: rows
                            });
                            conn.release();
                        }
                    }
                });
        }
    });
}

function searchReview(req, res) {

}

function registReview(req, res) {
    var regProdQuery = 'insert into product(prod_name, prod_purchase_site_url) values(?, ?);';
    var regRevImgQuery = 'insert into review_image_url(review_image_url, review_id) values(?, (select review_id from review where review_content=?));';
    if (req.body.prod_id == -1) {
        regRevQuery = 'insert into review(review_content, image_exist_chk, prod_rating, user_id, prod_id) values(?, 1, ?, ?, (select prod_id from product where prod_name=?));';
        inserts = [req.body.review_content, 1, req.body.prod_rating, req.body.user_id, req.body.prod_name];
    } else {
        reqRevQuery = 'insert into review(review_content, image_exist_chk, prod_rating, user_id, prod_id) values(?, 1, ?, ?, ?);';
        inserts = [req.body.review_content, 1, req.body.prod_rating, req.body.user_id, req.body.prod_id];
    }

    pool.getConnection(function(err, conn) {
        if (err) {
            console.log('db connection err', err);
            res.send({
                err: {
                    code: 1,
                    msg: 'db connection err'
                },
                data: []
            });
            conn.release();
            return;
        }
        console.log(req.body);
        async.series([
                function(callback) {
                    conn.beginTransaction(function(err) {
                        if (err) {
                            console.log('transaction err', err);
                            var error = {
                                err: {
                                    code: 1,
                                    msg: 'transaction err'
                                },
                                data: []
                            }
                            callback(error);
                        } else
                            callback(null, 'beginTransaction');
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
                        conn.query(regProdQuery, inserts,
                            function(err, rows) {
                                if (err) {
                                    console.log('regist product query err', err);
                                    var error = {
                                        err: {
                                            code: 1,
                                            msg: 'regist product query err'
                                        },
                                        data: []
                                    }
                                    callback(error);
                                } else {
                                    console.log(rows);
                                    callback(null, rows);
                                }
                            });
                    } else
                        callback(null, 'pass regist product');
                },
                function(callback) {
                    conn.query(regRevQuery, [req.body.review_content, req.body.prod_rating, req.body.user_id, req.body.prod_name],
                        function(err, rows) {
                            if (err) {
                                console.log('regist review query err', err);
                                var error = {
                                    err: {
                                        code: 1,
                                        msg: 'regist review query err'
                                    },
                                    data: []
                                }
                                callback(error);
                            } else {
                                console.log(rows);
                                callback(null, rows);
                            }
                        });
                },
                function(callback) {
                    console.log(req.file);
                    conn.query(regRevImgQuery, [req.file.location, req.body.review_content],
                        function(err, rows) {
                            if (error) {
                                console.log('regist review image err', err);
                                var error = {
                                    err: {
                                        code: 1,
                                        msg: 'regist review image err'
                                    },
                                    data: []
                                }
                                callback(error);
                            } else {
                                console.log(rows);
                                callback(null, rows);
                            }
                        });
                }
            ],
            function(err, result) {
                if (err) {
                    console.log(err);
                    res.send(err)
                    conn.rollback();
                    conn.release();
                } else {
                    console.log('result : ', result);
                    res.send({
                        err: {
                            code: 0,
                            msg: '',
                        },
                        data: [result]
                    });
                    conn.commit();
                    conn.release();
                }
            });
    });
}

function adjustReview(req, res) {

}

function removeReview(req, res) {

}

function autoComplete(req, res) {
    var autoQuery = 'select prod_name from product where prod_name like ?;';
    pool.getConnection(function(err, conn) {
        if (err) {
            console.log('db connection err', err);
            res.send({
                err: {
                    code: 1,
                    msg: 'db connection err'
                },
                data: []
            });
            conn.release();
        } else {
            conn.query(autoQuery, ['%' + req.params.keyword + '%'],
                function(err, rows) {
                    if (err) {
                        console.log('auto query err', err);
                        res.send({
                            err: {
                                code: 1,
                                msg: 'auto query err'
                            },
                            data: []
                        });
                        conn.release();
                    } else {
                        if (rows.length <= 0) {
                            console.log('auto query result is 0');
                            res.send({
                                err: {
                                    code: 1,
                                    msg: 'auto query result is 0'
                                },
                                data: []
                            });
                            conn.release();
                        } else {
                            var prodList = [];
                            for (i in rows)
                                prodList[i] = rows[i].prod_name;
                            console.log('result : ', rows);
                            res.send({
                                err: {
                                    code: 0,
                                    msg: ''
                                },
                                data: [prodList]
                            });
                            conn.release();
                        }
                    }
                });
        }
    });
}

function searchReview(req, res) {
    var searchQuery = 'select prod_id, prod_name, prod_image_url, shopping_site_name, folder_count from product where prod_name like ?;';
    pool.getConnection(function(err, conn) {
        if (err) {
            console.log('db connection err', err);
            res.send({
                err: {
                    code: 1,
                    msg: 'db connection err'
                },
                data: []
            });
            conn.release();
        } else {
            conn.query(searchQuery, ['%' + req.params.keyword + '%'],
                function(err, rows) {
                    if (err) {
                        console.log('search query err', err);
                        res.send({
                            err: {
                                code: 1,
                                msg: 'search query err'
                            }
                        });
                        conn.release();
                    } else {
                        if (rows.length <= 0) {
                            console.log('search query result is 0');
                            res.send({
                                err: {
                                    code: 1,
                                    msg: 'search query result is 0'
                                }
                            });
                            conn.release();
                        } else {
                            console.log('result : ', rows);
                            res.send({
                                err: {
                                    code: 0,
                                    msg: ''
                                },
                                data: [rows]
                            });
                            conn.release();
                        }
                    }
                });
        }
    });
}
