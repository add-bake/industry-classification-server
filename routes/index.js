const express = require('express');
const router = express.Router();
const multipart = require('connect-multiparty')
const xlsx = require('xlsx')
const mysql = require('../common/basicConnection')
const URL = require('url');
const tableName = 'content'

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

// 获取分类内容
router.get('/getContentById', async (req, res, next) => {
  const params = URL.parse(req.url, true).query
  if (!params.classifyId) {
    res.json({
      code: 500,
      msg: '缺少必要参数'
    })
  } else {
    try {
      const sql = `SELECT * from ${tableName} where classifyId=${params.classifyId}`
      const result = await mysql.query(sql)
      res.json({
        code: '200',
        data: result
      })
    } catch (error) {
      res.json({
        code: '500',
        msg: error
      })
    }
  }
})

// 导入表格
const multipartMiddleware = multipart()
router.post('/import', multipartMiddleware, async (req, res) => {
  const workbook = xlsx.readFile(req.files.file.path)
  const sheetNames = workbook.SheetNames
  const sheet1 = workbook.Sheets[sheetNames[0]]
  const range = xlsx.utils.decode_range(sheet1['!ref'])
  let tableContent = []

  //循环获取单元格值
  for (let R = range.s.r; R <= range.e.r; ++R) {
    let rowValue = []
    for (let C = range.s.c; C <= range.e.c; ++C) {
      let cell_address = {c: C, r: R} //获取单元格地址
      let cell = xlsx.utils.encode_cell(cell_address) //根据单元格地址获取单元格
      //获取单元格值
      if (sheet1[cell]) {
        // 如果出现乱码可以使用iconv-lite进行转码
        // rowValue += iconv.decode(sheet1[cell].v, 'gbk') + ", ";
        rowValue.push(sheet1[cell].v)
      } else {
        rowValue.push('')
      }
    }
    tableContent.push(rowValue)
  }
  let sqlValues = ''
  tableContent.forEach((x, i) => {
    if (i) {
      sqlValues += `('${req.body.classifyId}',`
      x.forEach((j, k) => {
        sqlValues += `'${j}'${k === x.length - 1 ? '' : ','}`
      })
      sqlValues += `)${i === tableContent.length - 1 ? ';' : ','}`
    }
  })
  const sqlDel = `delete from ${tableName} where classifyId=${req.body.classifyId}`
  const sqlAdd = `insert into ${tableName} (classifyId,variable1,variable2,variable3) values${sqlValues}`
  try {
    await mysql.query(sqlDel)
    await mysql.query(sqlAdd)
    res.json({ code: '200' })
  } catch (error) {
    res.json({
      code: '500',
      data: error
    })
  }
})

module.exports = router;
