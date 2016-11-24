var mysql = require('mysql');
// db
var dbConfig = {
  host : 'ibubogosu.ct3yjugtyuqo.ap-northeast-2.rds.amazonaws.com',
  user : 'admin',
  password : 'adminadmin',
  port : '3306',
  multiplestatements : true,
  database : 'ibubogosu'
};

var pool = mysql.createPool(dbConfig);

module.exports = pool;
