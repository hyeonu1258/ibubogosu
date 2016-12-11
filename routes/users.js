const express = require('express');
const pool = require('../dbConnection');
const msg = require('./message');
const async = require('async');

var router = express.Router();

router.route('/')
      .post(registUser)

router.route('/update')
      .put(reviseUser)
      .post(deleteUser)

function registUser(req, res) {
    pool.getConnection(function(err, conn) {
        if (err) {
            console.log(err);
            res.send(msg(1, 'db connection err: ' + err, []));
            conn.release();
        } else {
            async.series([
                function(callback) {
                    conn.query('select user_id from user where user_id=?', [req.body.user_id], function(err, rows) {
                        if (err) callback(msg(1, 'query err: ' + err, []));
                        else
                            if (rows.length < 1)  callback(null, 'success');
                            else                  callback(msg(0, 'login success', []));
                    })
                },
                function(callback) {
                    conn.query('insert into user(user_id, sns_token, prof_image_url, type, weight, height) values(?,?,?,?,?,?)', [req.body.user_id, req.body.sns_token, req.body.prof_image_url, req.body.type, req.body.height, req.body.weight], function(err, rows) {
                        if (err)  callback(msg(1, 'query err: ' + err, []));
                        else      callback(null, 'regist user success');
                    });
                }
            ], function(err, result) {
                if (err) {
                    console.log(err);
                    res.send(err);
                } else {
                    console.log(result);
                    res.send(msg(0, 'success', result));
                }
                conn.release();
            });
        }
    });
}

function reviseUser(req, res) {}

function deleteUser(req, res) {}

module.exports = router;
