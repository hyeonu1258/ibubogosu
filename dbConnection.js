var mysql = require('mysql');
// db

var dbConfig = {
  host : '',
  user : '',
  password : '',
  port : '3306',
  multiplestatements : true,
  database : 'ibubogosu'
};

var pool = mysql.createPool(dbConfig);

module.exports = pool;
