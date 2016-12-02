const express = require('express');
const async = require('async');
const pool = require('../dbConnection');

var router = express.Router();

/* GET home page. */
router.route('/:type/:count')
    .get(prodList)
    .post(revList);

function prodList(req, res) {
    prodQuery = 'select p.prod_id, p.prod_name, p.shopping_site_name, p.folder_count, count(review_id) as review_count from product p join review r on p.prod_id = r.prod_id and r.type = ? group by p.prod_id limit ?, ?';
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
            conn.query(prodQuery, [req.params.type, (req.params.count-1)*50 ,req.params.count*50],
                function(err, rows) {
                    console.log(err, rows);
                    if (err) {
                        console.log('product query err ', err);
                        res.send({
                            err: {
                                code: 1,
                                msg: 'product query err'
                            },
                            data: {}
                        });
                        conn.release();
                    } else {
                        if (rows.length <= 0) {
                            console.log('product query result is 0', rows);
                            res.send({
                                err: {
                                    code: 1,
                                    msg: 'product query result is 0'
                                },
                                data: {}
                            });
                            conn.release();
                        } else {
                            console.log('product query success ', rows);
                            res.send({
                                err: {
                                    code: 0,
                                    msg: ''
                                },
                                data: rows
                            });
                        }
                    }
                });
        }
    });
}

function revList(req, res) {

}

module.exports = router;
