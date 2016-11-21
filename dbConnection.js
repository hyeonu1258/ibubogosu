var mysql = require('mysql');

var dbConfig = {
  host : 'localhost',
  user : 'root',
  password : '123456',
  port : '3306',
  multiplestatements : true,
  database : 'ibubogosu'
};

var pool = mysql.createPool(dbConfig);

module.exports = pool;
