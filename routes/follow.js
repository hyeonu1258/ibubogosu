const express = require('express');
const async = require('async');
const pool = require('../dbConnection');
const msg = require('./message');

var router = express.Router();

router.route('/following')
    .post(showFollowingList)

router.route('/update')
    .post(registFollowing)
    .put(deleteFollowing);

router.route('/follower')
    .post(showFollowerList);

function showFollowingList(req, res) {
    var followQuery = 'select u.user_id, u.nickname, u.prof_image_url, u.height, u.weight from user u join following_list f on u.user_id = f.following_id and f.user_id=?';
    var followingList = [];

    pool.getConnection(function(err, conn) {
        if (err) {
            console.log('db connection err', err);
            res.send(msg(1, 'db connection err', []));
            conn.release();
        } else {
            async.waterfall([
                    function(callback) {
                        conn.query(followQuery, [req.body.user_id],
                            function(err, rows) {
                                if (err)
                                    callback(msg(1, 'query err : ' + err, []));
                                else
                                    if (rows.length < 1)
                                        callback(msg(1, 'no data', []));
                                    else
                                        callback(null, rows);
                            });
                    },
                    function(arg, callback) {
                        if (req.body.my_id != -1) {
                            var i = 0;
                            async.every(arg, function(data, done) {
                                conn.query('select user_id from following_list where following_id=? and user_id=?', [data.user_id, req.body.my_id],
                                    function(err, rows) {
                                        if (err)
                                            done(msg(1, 'query err: ' + err, []));
                                        else {
                                            if (rows.length < 1)
                                                data.followMe = 0;
                                            else
                                                data.followMe = 1;
                                            followingList[i] = data;
                                            done(null, true);
                                            i++;
                                        }
                                    });
                            }, function(err, result) {
                                if (err)
                                    callback(err)
                                else
                                    callback(null, msg(0, 'success', followingList));
                            });
                        } else
                            callback(null, msg(0, 'success', arg));
                    }
                ],
                function(err, result) {
                    if (err) {
                        console.log(err);
                        res.send(err)
                        conn.release();
                    } else {
                        console.log(result);
                        res.send(result)
                        conn.release();
                    }
                });
        }
    });
}

function registFollowing(req, res) {
    var selectFollowQuery = 'select * from following_list where following_id=? and user_id=?'
    var registFollowQuery = 'insert into following_list(following_id, user_id) values(?, ?)';

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
                    conn.query(selectFollowQuery, [req.body.following_id, req.body.user_id],
                        function(err, rows) {
                            if (err) {
                                console.log('select follow query err');
                                callback({
                                    err: {
                                        code: 1,
                                        msg: 'query err'
                                    },
                                    data: []
                                });
                            } else {
                                if (rows.length > 0) {
                                    callback({
                                        err: {
                                            code: 1,
                                            msg: 'already following'
                                        },
                                        data: []
                                    });
                                } else {
                                    callback(null, true);
                                }
                            }
                        });
                },
                function(callback) {
                    conn.query(registFollowQuery, [req.body.following_id, req.body.user_id],
                        function(err, rows) {
                            if (err) {
                                console.log('query err ', err);
                                callback({
                                    err: {
                                        code: 1,
                                        msg: 'query err'
                                    },
                                    data: []
                                });
                            } else {
                                console.log(rows);
                                callback(null, true);
                            }
                        });
                }
            ], function(err, result) {
                if (err) {
                    console.log(err);
                    res.send(err);
                    conn.release();
                } else {
                    console.log(result);
                    res.send({
                        err: {
                            code: 0,
                            msg: ''
                        },
                        data: []
                    });
                    conn.release();
                }
            });
        }
    });
}

function deleteFollowing(req, res) {
    pool.getConnection(function(err, conn) {
        if (err) {
            console.log('db connection err ', err);
            res.send({
                err: {
                    code: 1,
                    msg: 'db connection err'
                },
                data: []
            });
            conn.release();
        } else {
            conn.query('delete from following_list where following_id=? and user_id=?', [req.body.following_id, req.body.user_id],
                function(err, rows) {
                    if (err) {
                        console.log('query err ', err);
                        res.send({
                            err: {
                                code: 1,
                                msg: 'query err'
                            },
                            data: []
                        });
                        conn.release();
                    } else {
                        console.log(rows);
                        res.send({
                            err: {
                                code: 0,
                                msg: ''
                            },
                            data: []
                        });
                        conn.release();
                    }
                });
        }
    });
}

function showFollowerList(req, res) {
    followerList = [];
    pool.getConnection(function(err, conn) {
        if (err) {
            console.log('db connection err ', err);
            res.send(msg(1, 'db connection err', []));
            conn.release();
        } else {
            async.waterfall([
                function(callback) {
                    conn.query('select u.user_id, u.nickname, u.prof_image_url, u.height, u.weight from user u join following_list f on u.user_id = f.user_id and f.following_id=?', [req.body.user_id],
                        function(err, rows) {
                            if (err)
                                callback(msg(1, 'query err', []));
                            else
                                if (rows.length < 1)
                                    callback(msg(1, 'no data', []));
                                else
                                    callback(null, rows);
                        });
                },
                function(arg, callback) {
                    var i = 0;
                    async.every(arg, function(data, done) {
                        conn.query('select user_id from following_list where following_id=? and user_id=?', [data.user_id, req.body.user_id],
                            function(err, rows) {
                                if (err)
                                    done(msg(1, 'query err', []));
                                else {
                                    if (rows.length < 1)
                                        data.followMe = 0;
                                    else
                                        data.followMe = 1;
                                    followerList[i] = data;
                                    done(null, true);
                                    i++;
                                }
                            })
                    }, function(err, result) {
                        if (err)
                            callback(err);
                        else
                            callback(null, msg(0, 'success', followerList));
                    });
                }
            ], function(err, result) {
                if (err) {
                    console.log(err);
                    res.send(err);
                    conn.release();
                } else {
                    console.log(result);
                    res.send(result);
                    conn.release();
                }
            });
        }
    });
}

module.exports = router;
