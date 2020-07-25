var mysql = require('mysql');
var $dbConfig = require('../config/mysql');

// 使用连接池，避免开太多的线程，提升性能
var pool = mysql.createPool($dbConfig);

/**
 * 对query执行的结果自定义返回JSON结果
 */
function responseDoReturn(res, result, resultJSON) {
  if (typeof result === 'undefined') {
    res.json({
      code: '201',
      msg: 'failed to do'
    });
  } else {
    res.json(result);
  }
};

/**
 * 封装query之sql带不占位符func
 */
function query (sql) {
  return new Promise((resolve, reject) => {
    pool.getConnection((err, connection) => {
      if (err) {
        reject(new Error(err))
      } else {
        connection.query(sql, (err, rows) => {
          //释放链接
          connection.release()
          if (rows) {
            resolve(rows)
          } else {
            reject(new Error(err))
          }
        })
      }
    })
  })
}

/**
 * 封装query之sql带占位符func
 */
function queryArgs(sql, args, callback) {
  pool.getConnection(function (err, connection) {
    connection.query(sql, args, function (err, rows) {
      callback(err, rows);
      //释放链接
      connection.release();
    });
  });
}

//exports
module.exports = {
  query: query,
  queryArgs: queryArgs,
  doReturn: responseDoReturn
}
