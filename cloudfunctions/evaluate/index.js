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
const Order = db.collection('Order') // Evaluate 表
const User = db.collection('User') // User 表
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

const Api = {
  getEvaluates: async (event, content) => {
    const data = event.data
    const count = await new Promise((resolve) => {
      Evaluate.where({
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
    
    // 日期格式化
    result.forEach((item) => {
      item.createTime = formatDate(item.createTime)
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
      if (result[i].isPublic) {
        for (let j = 0; j < userList.length; j++) {
          if (userList[j]._id === result[i].userId) {
            result[i].avatar = userList[j].avatar
            break
          }
        }
      } else {
        // 匿名评价
        result[i].nickname = '匿名用户'
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
  },
  addEvaluate: async (event, content) => { // 发布评价
    const data = event.data
    const msg = checkRequired({
      orderId: '订单ID',
      token: 'token',
      themeId: '服务单ID'
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
        msg: 'token无效或已过期，请重新登陆'
      }
    }

    // 获取评论用户信息
    const userInfo = await new Promise((resolve) => {
      User.doc(userId).get().then((res) => {
        resolve(res.data)
      }).catch((err) => {
        resolve(false)
      })
    })
    if (!userInfo) {
      return {
        code: -1,
        msg: '用户不存在'
      }
    }

    // 验证该订单是否 "已评论" 过，避免重复评论
    const hasEvaluate = await new Promise((resolve) => {
      Evaluate.where({
        userId,
        orderId: data.orderId,
        type: data.type
      })
      .get()
      .then((res) => {
        if (res.data.length > 0) {
          resolve(true)
        } else {
          resolve(false)
        }
      })
      .catch((err) => {
        // 出错。不允许评论
        resolve(true)
      })
    })

    if (hasEvaluate) {
      return {
        code: -1,
        msg: '您已评价过，请勿重复评价'
      }
    }

    // 保存评论数据
    const result = await new Promise((resolve) => {
      Evaluate.add({
          data: {
            createTime: new Date(),
            userId,
            nickname: userInfo.nickname,
            evalueteType: data.evalueteType,
            remark: data.remark,
            accordLevel: data.accordLevel,
            qualityLevel: data.qualityLevel,
            attitudeLevel: data.attitudeLevel,
            isPublic: data.isPublic,
            orderId: data.orderId,
            themeId: data.themeId,
            type: data.type,
            fileList: data.fileList
          }
        })
        .then((res) => {
          console.log(res)
          resolve(res)
        })
        .catch((err) => {
          resolve(false)
        })
    })
    if (!result) {
      return {
        code: -1,
        msg: '评论失败，请稍后重试'
      }
    }

    // 更新 "Order" 表的 hasEvaluate 字段
    await new Promise((resolve) => {
      Order.doc(data.orderId).update({
        data: {
          hasEvaluate: data.type
        }
      })
      .then((err) => {
        resolve(true)
      })
      .catch((err) => {
        resolve(false)
      })
    })
    
    return {
      code: 0
    }
  }
}