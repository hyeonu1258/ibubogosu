const express = require('express');
const pool = require('../dbConnection');

const router = express.Router();

router.route('/')
      .post(registLike)
      .put(deleteLike);

function registLike(req, res) {
    pool.getConnection(function(err, conn) {
        if(err) {
            console.log(err);
            res.send({
                err: {
                    code: 1,
                    msg: 'db connection err'
                },
                data: []
            });
            conn.release();
        } else {
            conn.query('insert into like_list(user_id, review_id) values(?, ?)', [req.body.user_id, req.body.review_id],
            function(err, rows) {
                if(err) {
                    console.log(err);
                    res.send({
                        err: {
                            code: 1,
                            msg: 'query err'
                        },
                        data: []
                    });
                } else {
                    res.send({
                        err: {
                            code: 0,
                            msg: ''
                        },
                        data: []
                    });
                }
                conn.release();
            });
        }
    });
}

function deleteLike(req, res) {
    pool.getConnection(function(err, conn) {
        if(err) {
            console.log(err);
            res.send({
                err: {
                    code: 1,
                    msg: 'db connection err'
                },
                data: []
            });
            conn.release();
        } else {
            conn.query('delete from like_list where user_id=? and review_id=?', [req.body.user_id, req.body.review_id],
            function(err, rows) {
                if(err) {
                    console.log(err);
                    res.send({
                        err: {
                            code: 1,
                            msg: 'query err'
                        },
                        data: []
                    });
                } else {
                    res.send({
                        err: {
                            code: 0,
                            msg: ''
                        },
                        data: []
                    });
                }
                conn.release();
            });
        }
    });
}

module.exports = router;
