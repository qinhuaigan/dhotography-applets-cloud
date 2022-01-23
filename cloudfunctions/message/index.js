// 云函数入口文件
const cloud = require('wx-server-sdk')
const env = 'clound2-9ga4gs443dee48af' // 云环境 ID
cloud.init({ // 初始化云环境
  env
});
const db = cloud.database({ // 云环境数据库
  env
})

// 验证必填函数
function checkRequired(field, data) {
  let msg = null
  for (const key in field) {
    if (!data[key]) {
      msg = `${field[key]}不能为空`
    }
  }
  return msg
}

// 日期格式化
function formatDate(value, type) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  let fmt = type || 'yyyy-MM-dd HH:mm:ss';
  var obj = {
    'y': date.getFullYear(), // 年份，注意必须用getFullYear
    'M': date.getMonth() + 1, // 月份，注意是从0-11
    'd': date.getDate(), // 日期
    'q': Math.floor((date.getMonth() + 3) / 3), // 季度
    'w': date.getDay(), // 星期，注意是0-6
    'H': date.getHours(), // 24小时制
    'h': date.getHours() % 12 === 0 ? 12 : date.getHours() % 12, // 12小时制
    'm': date.getMinutes(), // 分钟
    's': date.getSeconds(), // 秒
    'S': date.getMilliseconds(), // 毫秒
  };
  var week = ['天', '一', '二', '三', '四', '五', '六'];
  for (var i in obj) {
    fmt = fmt.replace(new RegExp(i + '+', 'g'), function (m) {
      var val = obj[i] + '';
      if (i === 'w') return (m.length > 2 ? '星期' : '周') + week[val];
      for (var j = 0, len = val.length; j < m.length - len; j++) {
        val = '0' + val;
      }
      return m.length === 1 ? val : val.substring(val.length - m.length);
    });
  }
  return fmt;
}

const _ = db.command // 查询指令
const Theme = db.collection('Theme') // Theme 表
const Order = db.collection('Order') // Theme 表
const Message = db.collection('Message') // Message 表
const Token = db.collection('Token') // Token 表

// 云函数入口函数
exports.main = async (event, context) => {
  return Api[event.method](event, context)
};

const Api = {
  getSubscribeMsgNum: async (event, content) => { // 获取 "未读消息数"
    const data = event.data
    const msg = checkRequired({
      msgType: '消息类型',
      token: 'token'
    }, data)
    if (msg) {
      return {
        code: -1,
        msg
      }
    }

    const {
      userId
    } = await new Promise((resolve) => {
      Token.doc(data.token).get().then((res) => {
        resolve(res.data)
      }).catch((err) => {
        resolve(false)
      })
    })

    if (!userId) {
      return {
        code: -1,
        msg: 'token 无效或已过期'
      }
    }

    const count = await new Promise((resolve) => {
      Message.where({
          msgType: data.msgType,
          status: 0,
          userId
        })
        .count()
        .then((res) => {
          resolve(res.total)
        })
        .catch((err) => {
          resolve(false)
        })
    })
    if (count === false) {
      return {
        code: -1,
        msg: '查询未读消息数失败'
      }
    }

    return {
      code: 0,
      count
    }
  },
  getMessageListByToken: async (event, content) => { // 获取 "消息列表"
    const data = event.data
    const msg = checkRequired({
      token: 'token',
      msgType: '消息类型'
    }, data)
    if (msg) {
      return {
        code: -1,
        msg
      }
    }

    const {
      userId
    } = await new Promise((resolve) => {
      Token.doc(data.token).get().then((res) => {
        resolve(res.data)
      }).catch((err) => {
        resolve(false)
      })
    })

    if (!userId) {
      return {
        code: -1,
        msg: 'token 无效或已过期'
      }
    }

    const count = await new Promise((resolve) => {
      Message.where({
          msgType: data.msgType,
          userId
        })
        .count()
        .then((res) => {
          resolve(res.total)
        })
        .catch((err) => {
          resolve(false)
        })
    })
    if (count === false) {
      return {
        code: -1,
        msg: '查询未读消息数失败'
      }
    }

    // 查询消息
    const skipNum = (data.currentPage - 1) * data.pageSize
    const result = await new Promise((resolve) => {
      Message.where({
          userId,
          msgType: data.msgType
        })
        .orderBy('status', 'asc')
        .orderBy('createTime', 'desc')
        .skip(skipNum)
        .limit(data.pageSize)
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
        msg: '消息查询失败'
      }
    }

    // 查询消息相关的主题信息
    const themeIdArr = result.reduce((total, item) => {
      total.push(item.themeId)
      return total
    }, [])

    const themeList = await new Promise((resolve) => {
      Theme.where({
          _id: _.in(themeIdArr)
        })
        .get()
        .then((res) => {
          resolve(res.data)
        })
        .catch((err) => {
          resolve(false)
        })
    })

    if (!themeList) {
      return {
        code: -1,
        msg: '查询主题/服务单信息失败'
      }
    }

    // 合并数据（主题数据）
    for (let i = 0; i < result.length; i++) {
      for (let j = 0; j < themeList.length; j++) {
        if (themeList[j]._id === result[i].themeId) {
          result[i].themeInfo = themeList[j]
          break
        }
      }
    }

    // 查询相关的 "订单信息"
    const orderIdList = result.reduce((total, item) => {
      total.push(item.orderId)
      return total
    }, [])

    if (orderIdList.length > 0) {
      const orderList = await new Promise((resolve) => {
        Order.where({
            _id: _.in(orderIdList)
          })
          .get()
          .then((res) => {
            resolve(res.data)
          })
          .catch((err) => {
            resolve(false)
          })
      })
      if (orderList) {
        // 合并数据（订单数据）
        for (let i = 0; i < result.length; i++) {
          for (let j = 0; j < orderList.length; j++) {
            if (orderList[j]._id === result[i].orderId) {
              orderList[j].createTime = formatDate(orderList[j].createTime)
              result[i].orderInfo = orderList[j]
              break
            }
          }
        }
      }
    }

    return {
      code: 0,
      count,
      data: result
    }
  },
  setRead: async (event, content) => {
    const data = event.data
    const msg = checkRequired({
      id: 'id'
    }, data)

    if (msg) {
      return {
        code: -1,
        msg
      }
    }

    const result = await new Promise((resolve) => {
      Message.doc(data.id).update({
          data: {
            status: 1
          }
        })
        .then((res) => {
          resolve(res.stats)
        })
        .catch((err) => {
          resolve(false)
        })
    })

    if (!result) {
      return {
        code: -1,
        msg: '消息状态更新失败'
      }
    }

    return {
      code: 0
    }
  }
}