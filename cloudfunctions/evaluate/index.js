// 云函数入口文件
const cloud = require('wx-server-sdk')
const env = 'clound2-9ga4gs443dee48af' // 云环境 ID
cloud.init({ // 初始化云环境
  env
});
const db = cloud.database({ // 云环境数据库
  env
})
const _ = db.command // 查询指令
const Theme = db.collection('Theme') // Theme 表
const Evaluate = db.collection('Evaluate') // Evaluate 表
const User = db.collection('User') // User 表
const Token = db.collection('Token') // Token 表

// 云函数入口函数
exports.main = async (event, context) => {
  return Api[event.method](event, context)
};

const Api = {
  getEvaluates: async (event, content) => {
    const data = event.data
    const count = await new Promise((resolve) => {
      Theme.where({
        themeId: data.themeId
      })
      .count()
      .then((res) => {
        resolve(res.total)
      })
      .catch((err) => {
        resolve(false)
      })
    })

    const skipNum = (data.currentPage - 1) * data.pageSize
    // 获取评论数据
    const result = await new Promise((resolve) => {
      Evaluate.where({
        themeId: data.themeId
      })
      .skip(skipNum)
      .limit(data.pageSize)
      .orderBy('createTime', 'desc')
      .get()
      .then((res) => {
        resolve(res.data)
      })
      .catch((err) => {
        resolve(false)
      })
    })

    if (!result) {
      return {
        code: -1,
        msg: '获取数据失败'
      }
    }

    const userIdList = result.reduce((total, item) => {
      total.push(item.userId)
      return total
    }, [])

    // 获取评论用户头像
    const userList = await new Promise((resolve) => {
      User.where({
        _id: _.in(userIdList)
      })
      .field({
        _id: true,
        avatar: true
      })
      .get()
      .then((res) => {
        resolve(res.data)
      })
      .catch((err) => {
        resolve(false)
      })
    })

    // 更新用户头像
    for (let i = 0; i < result.length; i++) {
      for (let j = 0; j < userList.length; j++) {
        if (userList[j]._id === result[i].userId) {
          result[i].avatar = userList[j].avatar
          break
        }
      }
    }
    return {
      code: 0,
      data: result,
      count
    }
  },
  getEvaluateStatistics: async (event, content) => { // 获取 "评价统计"
    const result = await new Promise((resolve) => {
      Evaluate.where({
        themeId: event.data.themeId
      })
      .field({
        evalueteType: true
      })
      .get()
      .then((res) => {
        const map = {
          1: 'good',
          2: 'middle',
          3: 'bad'
        }
        const obj = {}
        for (let index = 0; index < res.data.length; index++) {
          obj[map[res.data[index].evalueteType]] = obj[map[res.data[index].evalueteType]] ? obj[map[res.data[index].evalueteType]] += 1 : 1
        }
        resolve(obj)
      }).catch((err) => {
        resolve(false)
      })
    })
    if (result) {
      return {
        code: 0,
        data: result
      }
    } else {
      return {
        code: -1,
        msg: '获取评价统计失败'
      }
    }
  }
}