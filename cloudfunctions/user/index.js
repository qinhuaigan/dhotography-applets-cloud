const cloud = require('wx-server-sdk');
const env = 'clound2-9ga4gs443dee48af' // 云环境 ID
cloud.init({ // 初始化云环境
  env
});
const db = cloud.database({ // 云环境数据库
  env
})
const _ = db.command // 查询指令
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
  // 用户注册
  signUp: async (event, context) => {
    const data = event.data
    const field = { // 字段
      phone: '用户名',
      nickname: '昵称',
      password: '密码'
    }
    const errMsg = checkRequired(field, data) // 验证必填字段
    if (errMsg) {
      return {
        code: -1,
        msg: errMsg
      }
    }

    // 查询手机号或者昵称是否已经被注册过
    const hasUser = await new Promise((resolve) => {
      User.where(_.or([{
        phone: data.phone
      }, {
        nickname: data.nickname
      }])).get().then((res) => {
        if (res.data && res.data.length > 0) {
          resolve(true)
        } else {
          resolve(false)
        }
      })
    })

    if (hasUser) {
      return {
        code: -1,
        msg: '手机号或昵称已经占用'
      }
    }

    const result = await new Promise((resolve) => {
      User.add({
        data: {
          phone: data.phone,
          email: data.email,
          nickname: data.nickname,
          password: data.password,
          createTime: new Date(),
          identity: 1 // 普通用户注册
        }
      }).then((res) => {
        resolve(res)
      }).catch((err) => {
        resolve(false)
      })
    })
    if (!result || !result['_id']) {
      return {
        code: -1,
        msg: '注册失败'
      }
    }
    return {
      code: 0
    }
  },

  // 用户登录
  login: async (event, context) => {
    const data = event.data
    const field = { // 字段
      phone: '用户名',
      password: '密码'
    }
    const errMsg = checkRequired(field, data) // 验证必填字段
    if (errMsg) {
      return {
        code: -1,
        msg: errMsg
      }
    }

    // 查询该手机号是否 "已注册"
    const userInfo = await new Promise((resolve) => {
      User.where({
        phone: data.phone
      }).get().then((res) => {
        if (!res || res.data.length === 0) {
          resolve(false)
        } else {
          resolve(res.data[0])
        }
      })
    })

    if (!userInfo) {
      return {
        code: -1,
        msg: '该手机号未注册'
      }
    }

    // 验证输入的密码是否正确
    if (data.password !== userInfo.password) {
      return {
        code: -1,
        msg: '账号或密码错误'
      }
    }

    // 生成 token
    const token = await new Promise((resolve) => {
      Token.add({
        data: {
          createTime: new Date(),
          userId: userInfo['_id']
        }
      }).then((res) => {
        if (res['_id']) {
          resolve(res['_id'])
        } else {
          resolve(false)
        }
      })
    })
    if (!token) {
      return {
        code: -1,
        msg: '登录失败'
      }
    }

    return {
      code: 0,
      data: token
    }
  },

  // 根据 token 获取用户信息
  getUsetInfoByToken: async (event, context) => {
    const data = event.data
    const field = { // 字段
      token: 'token'
    }
    const errMsg = checkRequired(field, data) // 验证必填字段
    if (errMsg) {
      return {
        code: -1,
        msg: errMsg
      }
    }

    // 检验 token 是否存在/有效
    const accessToken = await checkToken(data.token)
    if (!accessToken) {
      return {
        code: -1,
        msg: 'token 不存在或已过期'
      }
    }

    // 获取用户信息
    const userInfo = await new Promise((resolve) => {
      User.doc(accessToken['userId'])
        .field({
          password: false,
          identity: false
        })
        .get()
        .then((res) => {
          if (res.data) {
            resolve(res.data)
          } else {
            resolve(false)
          }
        })
        .catch((err) => {
        })
    })

    if (!userInfo) {
      return {
        code: -1,
        msg: '用户不存在'
      }
    }

    return {
      code: 0,
      data: userInfo
    }
  },

  // 根据 token 更新用户信息
  updateUserInfoByToken: async (event, context) => {
    const data = event.data
    const field = { // 字段
      token: 'token',
      nickname: '昵称'
    }
    const errMsg = checkRequired(field, data) // 验证必填字段
    if (errMsg) {
      return {
        code: -1,
        msg: errMsg
      }
    }

    // 检验 token 是否存在/有效
    const accessToken = await checkToken(data.token)
    if (!accessToken) {
      return {
        code: -1,
        msg: 'token 不存在或已过期'
      }
    }

    // 更新用户信息
    const result = await new Promise((resolve) => {
      User.doc(accessToken['userId']).update({
        data: {
          nickname: data.nickname,
          gender: data.gender,
          provincialArea: data.provincialArea,
          provincialAreaCode: data.provincialAreaCode,
          address: data.address
        }
      }).then((res) => {
        if (res.errMsg === 'document.update:ok') {
          resolve(true)
        } else {
          resolve(false)
        }
      }).catch((err) => {
        resolve(false)
      })
    })
    if (!result) {
      return {
        code: -1,
        msg: '更新失败'
      }
    }

    return {
      code: 0
    }
  },

  // 更新头像
  updateUserAvatarByToken: async (event, context) => {
    const data = event.data
    const field = { // 字段
      token: 'token',
      avatar: '头像'
    }
    const errMsg = checkRequired(field, data) // 验证必填字段
    if (errMsg) {
      return {
        code: -1,
        msg: errMsg
      }
    }

    // 检验 token 是否存在/有效
    const accessToken = await checkToken(data.token)
    if (!accessToken) {
      return {
        code: -1,
        msg: 'token 不存在或已过期'
      }
    }

    // 更新用户头像
    const result = await new Promise((resolve) => {
      User.doc(accessToken['userId']).update({
        data: {
          avatar: data.avatar
        }
      }).then((res) => {
        if (res.errMsg === 'document.update:ok') {
          resolve(true)
        } else {
          resolve(false)
        }
      }).catch((err) => {
        resolve(false)
      })
    })
    if (!result) {
      return {
        code: -1,
        msg: '更新失败'
      }
    }

    return {
      code: 0
    }
  }
}