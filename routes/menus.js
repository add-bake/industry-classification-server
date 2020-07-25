const express = require('express');
const router = express.Router();
const mysql = require('../common/basicConnection')
const tableName = 'classification'

router.get('/', function (req, res, next) {
  res.send("user api");
});

// 获取菜单树
router.get('/getMenus', async (req, res, next) => {
  try {
    const sql = `SELECT * from ${tableName}`
    const result = await mysql.query(sql)
    res.json({
      code: '200',
      data: toTreeData(result)
    })
  } catch (error) {
    res.json({
      code: '500',
      data: error
    })
  }
});

// 修改菜单名称
router.post('/updateMenu', async (req, res) => {
  try {
    const sql = `update ${tableName} set name='${req.body.name}' where id='${req.body.id}'`
    await mysql.query(sql)
    res.json({ code: '200' })
  } catch (error) {
    res.json({
      code: '500',
      data: error
    })
  }
})

// 添加菜单
router.post('/addMenu', async (req, res) => {
  try {
    const variables = ['id', 'pid', 'name', 'seqNum', 'level']
    const sql = `insert into ${tableName} (${variables.join(',')}) values(${variables.map(x => `'${req.body[x]}'`).join(',')})`
    await mysql.query(sql)
    res.json({ code: '200' })
  } catch (error) {
    res.json({
      code: '500',
      data: error
    })
  }
})

// 删除菜单
router.post('/deleteMenu', async (req, res) => {
  try {
    const sqlDel = `delete from content where classifyId like '${req.body.id}%'`
    const sql = `delete from ${tableName} where id like '${req.body.id}%'`
    await mysql.query(sqlDel)
    await mysql.query(sql)
    res.json({ code: '200' })
  } catch (error) {
    res.json({
      code: '500',
      data: error
    })
  }
})

function toTreeData (data) {
  var pos = {};
  var tree = [];
  var i = 0;
  while (data.length != 0) {
    if (data[i].pid == 0) {
      tree.push({
        id: data[i].id,
        pid: data[i].pid,
        name: data[i].name,
        level: data[i].level,
        seqNum: data[i].seqNum,
        children: []
      });
      pos[data[i].id] = [tree.length - 1];
      data.splice(i, 1);
      i--;
    } else {
      var posArr = pos[data[i].pid];
      if (posArr != undefined) {

        var obj = tree[posArr[0]];
        for (var j = 1; j < posArr.length; j++) {
          obj = obj.children[posArr[j]];
        }

        obj.children.push({
          id: data[i].id,
          pid: data[i].pid,
          name: data[i].name,
          level: data[i].level,
          seqNum: data[i].seqNum,
          children: []
        });
        pos[data[i].id] = posArr.concat([obj.children.length - 1]);
        data.splice(i, 1);
        i--;
      }
    }
    i++;
    if (i > data.length - 1) {
      i = 0;
    }
  }
  return tree;
}

module.exports = router
