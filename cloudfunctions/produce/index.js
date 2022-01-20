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
const Order = db.collection('Order') // Theme 表
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
      console.log(err)
    })
  })
}

const Api = {
  getThemeList: async (event, content) => {
    const data = event.data
    const countWhere = {
      isDel: _.neq(true)
    }
    if (data.series) {
      countWhere.series = parseFloat(data.series)
    }
    if (data.type) {
      countWhere.type = parseFloat(data.type)
    }

    const count = await new Promise((resolve) => {
      Theme.where(countWhere).count().then((res) => {
        resolve(res.total)
      }).catch((err) => {
        resolve(false)
      })
    })

    const currentPage = (data.currentPage - 1) * data.pageSize
    const result = await new Promise((resolve) => {
      Theme.where(countWhere).skip(currentPage).limit(data.pageSize).orderBy('createTime', 'desc').get().then((res) => {
        resolve(res.data)
      }).catch((err) => {
        resolve(false)
      })
    })

    if (!result) {
      return {
        code: -1,
        msg: '获取数据失败'
      }
    }

    return {
      code: 0,
      count,
      data: result
    }
  },
  getThemeDetail: async (event, content) => {
    const field = {
      id: 'id'
    }
    const msg = checkRequired(field, event.data)
    if (msg) {
      return {
        code: -1,
        msg
      }
    }
    const {
      id
    } = event.data
    const result = await new Promise((resolve) => {
      Theme.doc(id).get().then((res) => {
        resolve(res.data)
      }).catch((err) => {
        resolve(false)
      })
    })

    if (!result) {
      return {
        code: -1,
        msg: '获取数据失败'
      }
    }

    // 查询该 "主题/服务单" 预约过的订单数
    const num = await new Promise((resolve) => {
      Order.where({
        themeId: id,
        status: _.gte(0)
      })
      .count()
      .then((res) => {
        resolve(res.total)
      })
      .catch((err) => {
        resolve(false)
      })
    })

    result.num = num
    return {
      code: 0,
      data: result
    }
  }
}