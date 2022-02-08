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
const Carousel = db.collection('Carousel') // Carousel 表
const Theme = db.collection('Theme') // Carousel 表
const Token = db.collection('Token') // Token 表

// 云函数入口函数
exports.main = async (event, context) => {
  return Api[event.method](event, context)
};

// 验证必填函数
function checkRequired(field, data) {
  let msg = null
  for (const key in field) {
    if (!data[key]) {
      msg = `${key}不能为空`
    }
  }
  return msg
}

// 验证 token
function checkToken(token) {
  return new Promise((resolve) => {
    Token.doc(token).get().then((res) => {
      if (res.data) {
        resolve(res.data)
      } else {
        resolve(false)
      }
    }).catch((err) => {
    })
  })
}

const Api = {
  getCarousel: async (event, context) => {
    const result = await new Promise((resolve) => {
      Carousel.where({
          type: event.type || '1'
        })
        .orderBy('sort', 'desc')
        .get().then((res) => {
          if (res.data) {
            resolve(res.data)
          } else {
            resolve(false)
          }
        }).catch(() => {})
    })
    if (!result) {
      return {
        code: -1,
        msg: '获取轮播图失败'
      }
    }

    return {
      code: 0,
      data: result
    }
  },
  // 获取 "今日推荐" 数据
  getIsRecommend: async (event, context) => {
    const result = await new Promise((resolve) => {
      Theme.where({
        isRecommend: true
      }).get().then((res) => {
        resolve(res.data)
      }).catch((err) => {
        resolve(false)
      })
    })

    if (result) {
      return {
        code: 0,
        data: result
      }
    }
  }
}