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
  let fmt = type || 'yyyy-MM-dd HH:mm:dd';
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
const Evaluate = db.collection('Evaluate') // Evaluate 表
const User = db.collection('User') // User 表
const Order = db.collection('Order') // Order 表
const Token = db.collection('Token') // Token 表

// 云函数入口函数
exports.main = async (event, context) => {
  return Api[event.method](event, context)
};

const Api = {
  createOrder: async (event, content) => { // 下单/预约
    let data = event.data
    const userId = await new Promise((resolve) => {
      Token.doc(data.token).get().then((res) => {
        resolve(res.data.userId)
      }).catch((err) => {
        resolve(false)
      })
    })
    const field = {
      appointmentTime: '预约时间',
      phone: '手机号',
      customerName: '姓名',
      token: 'token'
    }
    const msg = checkRequired(field, data)
    if (msg) {
      return {
        code: -1,
        msg
      }
    }
    data = Object.assign(data, {
      createTime: new Date(),
      status: 0,
      userId,
      orderNo: `YU_${formatDate(new Date(), 'yyyyMMddHHmmss')}` // 服务单号
    })
    const result = await new Promise((resolve) => {
      Order.add({
        data
      }).then((res) => {
        resolve(res)
      }).catch((err) => {
        resolve(false)
      })
    })

    if (!result) {
      return {
        code: -1,
        msg: '提交失败'
      }
    }
    return {
      code: 0
    }
  },
  getOrderCount: async (event, content) => { // 获取订单统计
    const data = event.data
    const msg = checkRequired({
      token: 'token'
    }, data)
    if (msg) {
      return {
        code: -1,
        msg
      }
    }
    const userId = await new Promise((resolve) => {
      Token.doc(data.token).get().then((res) => {
        resolve(res.data.userId)
      }).catch((err) => {
        resolve(false)
      })
    })

    if (!userId) {
      return {
        code: -1,
        msg: '账号不存在或异常'
      }
    }
    const result = await new Promise((resolve) => {
      Order.where({
          userId
        })
        .field({
          userId: true,
          status: true
        })
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
        msg: '查询订单失败'
      }
    }
    // 开始统计
    let isAppointment = 0 // 预约中 "订单数量"
    let isHand = 0 // 进行中的 "订单数量"
    let isCompleted = 0 // 已完成的 "订单数量"
    let isCancel = 0 // 已取消的 "订单数量"
    for (let i = 0; i < result.length; i++) {
      switch (result[i].status) {
        case -2:
          isCancel += 1
          break;
        case -1:
          isCancel += 1
          break;
        case 0:
          isAppointment += 1
          break;
        case 1:
          isHand += 1
          break;
        case 2:
          isCompleted += 1
          break;
      }
    }

    return {
      code: 0,
      data: {
        isCancel,
        isAppointment,
        isHand,
        isCompleted
      }
    }
  },
  getOrderByToken: async (event, content) => { // 获取用户订单
    const data = event.data
    const msg = checkRequired({
      token: 'token'
    }, data)
    if (msg) {
      return {
        code: 0,
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
    const countWhere = {
      userId
    }
    if (data.status !== null && data.status !== undefined) {
      countWhere.status = data.status < 0 ? _.lt(0) : _.eq(data.status)
    }

    const count = await new Promise((resolve) => {
      Order.where(countWhere).count().then((res) => {
        resolve(res.total)
      }).catch((err) => {
        resolve(false)
      })
    })

    // 获取订单数据
    const result = await new Promise((resolve) => {
      const skipNum = (data.currentPage - 1) * data.pageSize
      Order.where(countWhere).skip(skipNum).limit(data.pageSize).orderBy('createTime', 'desc').get().then((res) => {
        resolve(res.data)
      }).catch((err) => {
        resolve(false)
      })
    })
    if (!result) {
      return {
        code: -1,
        msg: '订单获取失败'
      }
    }

    // 获取订单中，"主题/服务单" 信息
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

    // 合并数据
    for (let i = 0; i < result.length; i++) {
      for (let j = 0; j < themeList.length; j++) {
        if (result[i].themeId === themeList[j]._id) {
          result[i].themeInfo = themeList[j]
          break
        }
      }
    }

    return {
      code: 0,
      count,
      data: result
    }
  },
  cancelOrder: async (event, content) => { // 取消订单
    const data = event.data
    const msg = checkRequired({
      token: 'token',
      id: 'id'
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

    const updateInfo = await new Promise((resolve) => {
      Order.where({
        _id: data.id,
        userId
      }).update({
        data: {
          status: -2,
          customerCancelRemarks: data.customerCancelRemarks
        }
      }).then((res) => {
        resolve(res.stats.updated)
      }).catch((err) => {
        resolve(false)
      })
    })
    if (!updateInfo) {
      return {
        code: -1,
        msg: '取消失败'
      }
    }

    return {
      code: 0
    }
  },
  getOrderDetail: async (event, content) => { // 获取订单详情
    console.log(111111111111111111)
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
    // 获取订单数据
    const orderInfo = await new Promise((resolve) => {
      Order.doc(data.id).get().then((res) => {
        resolve(res.data)
      }).catch((err) => {
        resolve(false)
      })
    })
    if (!orderInfo) {
      return {
        code: -1,
        msg: '获取订单信息失败'
      }
    }

    // 获取 "主题/服务单" 信息
    const themeInfo = await new Promise((resolve) => {
      Theme.doc(orderInfo.themeId).get().then((res) => {
        resolve(res.data)
      }).catch((err) => {
        resolve(false)
      })
    })

    if (!themeInfo) {
      return {
        code: -1,
        msg: '主题/服务单查询失败'
      }
    }
    orderInfo.themeInfo = themeInfo
    return {
      code: 0,
      data: orderInfo
    }
  }
}