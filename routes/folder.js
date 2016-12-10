const express = require('express');
const async = require('async');
const pool = require('../dbConnection');
const msg = require('./message');

const router = express.Router();

router.route('/')
      .post(showFolderList)

router.route('/:folder_name')
      .post(makeFolder)
      .put(deleteFolder)

router.route('/:folder_id/product')
      .get(showProductList)

// folder_id를 받아 폴더 등록, 삭제처리를 한다면 등록, 삭제하는 단계는 간단하겠지만 그전에 해당 유저가 맞는지에 대해 확인하는 쿼리가 선행되어야 하므로 전체적인 코드가 복잡해진다.
// 그러나 애초에 등록, 삭제시 조건문에 folder_name, user_id를 넣는다면 user_id를 통해 유저 확인 과정이 내포되므로 전체적은 흐름이 간단해진다.
router.route('/:folder_name/product/:prod_id')
      .post(registProduct)
      .put(deleteProduct)

router.route('/:folder_name/product/:prod_id/:location')
      .put(moveProduct)

function showFolderList(req, res) {
    pool.getConnection(function(err, conn) {
        if (err) {
            console.log('db connection err : ' + err);
            res.send(msg(1, 'db connection err : ' + err, []));
            conn.release();
        } else {
            conn.query('select folder_id, folder_name from folder where user_id=?', [req.body.user_id], function(err, rows) {
                if (err) {
                    console.log('query err : ' + err);
                    res.send(msg(1, 'query err : ' + err, []));
                    conn.release();
                } else {
                    if (rows.length < 1) {
                        console.log('no data');
                        res.send(msg(1, 'no data', []));
                        conn.release();
                    } else {
                        console.log(rows);
                        res.send(msg(0, 'success', rows));
                        conn.release();
                    }
                }
            });
        }
    });
}

function makeFolder(req, res) {
    pool.getConnection(function(err, conn) {
        if(err) {
            console.log('db connection err : ' + err);
            res.send(msg(1, 'db connection err : ' + err, []));
            conn.release();
        } else {
            async.series([
                function(callback) {
                    conn.query('select folder_id from folder where folder_name=? and user_id=? ', [req.params.folder_name, req.body.user_id], function(err, rows) {
                        if(err)                 callback(msg(1, 'query err : ' + err, []));
                        else
                            if(rows.length < 1) callback(null, rows);
                            else                callback(msg(1, 'already exist', []));
                    });
                },
                function(callback) {
                    conn.query('insert into folder(folder_name, user_id) values(?, ?)', [req.params.folder_name, req.body.user_id], function(err, rows) {
                        if(err) callback(msg(1, 'query err : ' + err, []));
                        else    callback(null, rows);
                    })
                }
            ], function(err, result) {
                if(err) {
                    console.log(err);
                    res.send(err);
                    conn.release();
                } else {
                    console.log(result);
                    res.send(msg(0, 'success', result));
                    conn.release();
                }
            });
        }
    });
}

function deleteFolder(req, res) {
    pool.getConnection(function(err, conn) {
        if(err) {
            console.log('db connection err : ' + err);
            res.send(msg(1, 'db connection err : ' + err, []));
            conn.release();
        } else {
            async.series([
              function(callback) {
                  conn.query('delete from prod_list where folder_id=(select folder_id from folder where folder_name=? and user_id=?)', [req.params.folder_name, req.body.user_id], function(err, rows) {
                      if(err)   callback(msg(1, 'query err: ' + err, []));
                      else      callback(null, 'delete prod_list success');
                  });
              },
              function(callback) {
                  conn.query('delete from folder where folder_name=? and user_id=?', [req.params.folder_name, req.body.user_id], function(err, rows) {
                    if(err)   callback(msg(1, 'query err: ' + err, []));
                    else      callback(null, 'delete folder success');
                });
              }
          ], function(err, result) {
              if(err) {
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

function showProductList(req, res) {
    var prodListQuery = 'select p.prod_id, p.prod_name, p.shopping_site_name, url.review_image_url, (select count(*) from prod_list where prod_id=p.prod_id) as putCount, (select count(*) from review where review.prod_id=p.prod_id) as reviewCount from prod_list pl join product p on pl.prod_id = p.prod_id join folder f on pl.folder_id = f.folder_id join review r on p.prod_id = r.prod_id join review_image_url url on r.review_id = url.review_id and f.folder_id=? group by p.prod_id';
    pool.getConnection(function(err, conn) {
        if(err) {
            console.log('db connection err : ' + err);
            res.send(msg(1, 'db connection err : ' + err, []));
            conn.release();
        } else {
            conn.query(prodListQuery, [req.params.folder_id], function(err, rows) {
                if(err) {
                    console.log('query err : ' + err);
                    res.send(msg(1, 'query err : ' + err, []));
                    conn.release();
                } else {
                    if(rows.length < 1) {
                        console.log('no data');
                        res.send(msg(1, 'no data', []));
                        conn.release();
                    } else {
                        console.log(rows);
                        res.send(msg(0, 'success', rows))
                        conn.release();
                    }
                }
            });
        }
    });
}

function registProduct(req, res) {
    var folderCheck;
    pool.getConnection(function(err, conn) {
        if(err) {
            console.log('db connection err : ' + err);
            res.send(msg(1, 'db connection err : ' + err, []));
            conn.release();
        } else {
            async.series([
                function(callback) {
                    conn.query('select folder_name from folder where folder_name=? and user_id=?', [req.params.folder_name, req.body.user_id], function(err, rows) {
                        if(err)   callback(msg(1, 'query err : ' + err, []));
                        else {
                            if(rows.length < 1) folderCheck = false;
                            else                folderCheck = true;
                            callback(null, true);
                        }
                    });
                },
                function(callback) {
                    if(folderCheck == false) {
                        conn.query('insert into folder(folder_name, user_id) values(?, ?)', [req.params.folder_name, req.body.user_id], function(err, rows) {
                            if(err)   callback(msg(1, 'query err : ' + err, []));
                            else      callback(null, 'regist basic folder success');
                        });
                    } else callback(null, 'pass regist basic folder');
                },
                function(callback) {
                    conn.query('select prod_id from prod_list where folder_id=(select folder_id from folder where folder_name=? and user_id=?) and prod_id=?', [req.params.folder_name, req.body.user_id, req.params.prod_id], function(err, rows) {
                        if(err) callback(msg(1, 'query err : ' + err, []));
                        else
                            if(rows.length < 1) callback(null, 'no exist');
                            else                callback(msg(1, 'already exist', []));
                    });
                },
                function(callback) {
                    conn.query('insert into prod_list(folder_id, prod_id) values((select folder_id from folder where folder_name=? and user_id=?), ?)', [req.params.folder_name, req.body.user_id, req.params.prod_id], function(err, rows) {
                        if(err) callback(msg(1, 'query err : ' + err, []));
                        else    callback(null, rows);
                    });
                },
          ], function(err, result) {
                if(err) {
                    console.log(err);
                    res.send(err);
                    conn.release();
                } else {
                    console.log(result);
                    res.send(msg(0, 'success', result));
                    conn.release();
                }
          });
        }
    });
}

function deleteProduct(req, res) {
    pool.getConnection(function(err, conn) {
        if(err) {
            console.log('db connection err : ' + err);
            res.send(msg(1, 'db connection err : ' + err, []));
            conn.release();
        } else {
            conn.query('delete from prod_list where folder_id=(select folder_id from folder where folder_name=? and user_id=?) and prod_id=?', [req.params.folder_name, req.body.user_id, req.params.prod_id], function(err, rows) {
                if(err) {
                    console.log('query err : ' + err);
                    res.send(msg(1, 'query err : ' + err, []));
                    conn.release();
                } else {
                    console.log(rows);
                    res.send(msg(0, 'success', []));
                }
          });
        }
    });
}

function moveProduct(req, res) {
    pool.getConnection(function(err, conn) {
        if(err) {
            console.log('db connection err : ' + err);
            res.send(msg(1, 'db connection err : ' + err, []));
            conn.release();
        } else {
            async.series([
                function(callback) {
                    conn.query('select prod_id from prod_list where folder_id=(select folder_id from folder where folder_name=? and user_id=?) and prod_id=?', [req.params.location, req.body.user_id, req.params.prod_id], function(err, rows) {
                        if(err) callback(msg(1, 'query err : ' + err, []));
                        else
                            if(rows.length < 1) callback(null, 'no exist');
                            else                callback(msg(1, 'already exist', rows));
                    });
                },
                function(callback) {
                    conn.query('update prod_list set folder_id=(select folder_id from folder where folder_name=? and user_id=?) where folder_id=(select folder_id from folder where folder_name=? and user_id=?) and prod_id=?',  [req.params.location, req.body.user_id, req.params.folder_name, req.body.user_id, req.params.prod_id], function(err,rows) {
                        if(err)  callback(msg(1, 'query err : ' + err, []));
                        else     callback(msg(null, 'success', []));
                    });
                }
              ], function(err, result) {
                  if(err) {
                      console.log(err);
                      res.send(err);
                      conn.release();
                  } else {
                      console.log(result);
                      res.send(msg(0, 'success', result));
                      conn.release();
                  }
              });
        }
    });
}

module.exports = router;
// 169, 205
