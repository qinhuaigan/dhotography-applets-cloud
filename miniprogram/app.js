//app.js
import {
  $wuxToptips
} from './components/wux-weapp/index'
App({
  onLaunch: async function () {
    // 初始化云函数
    wx.cloud.init({
      env: 'clound2-9ga4gs443dee48af',
      traceUser: true
    })
    // 展示本地存储能力
    var logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 登录
    // wx.login({
    //   success: res => {
    //     // 发送 res.code 到后台换取 openId, sessionKey, unionId
    //   }
    // })
    // // 获取用户信息
    // wx.getSetting({
    //   success: res => {
    //     if (res.authSetting['scope.userInfo']) {
    //       // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
    //       wx.getUserInfo({
    //         success: res => {
    //           // 可以将 res 发送给后台解码出 unionId
    //           this.globalData.userInfo = res.userInfo
    //           // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
    //           // 所以此处加入 callback 以防止这种情况
    //           if (this.userInfoReadyCallback) {
    //             this.userInfoReadyCallback(res)
    //           }
    //         }
    //       })
    //     }
    //   }
    // })
  },
  globalData: {
    userInfo: null,
    baseURL: 'http://101.200.137.140/api',
    token: null,
    firstLoad: true,
    themeDetail: null,
    defaultAvatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png' // 默认头像
  },
  showLoading() {
    wx.showLoading({
      title: '请稍后...',
      icon: 'loading',
      // duration: 000,
      mask: true
    })
  },
  hideLoading() {
    wx.hideLoading()
  },
  cloudFun(option) {
    wx.showLoading({
      title: '请稍候...',
      mask: true
    })
    return new Promise((resolve) => {
      // 默认带上 token
      option.data.data = option.data.data || {}
      option.data.data = Object.assign(option.data.data, { token: this.globalData.token})
      wx.cloud.callFunction({
        // 云函数名称
        name: option.name,
        // 传给云函数的参数
        data: option.data
      }).then(response => {
        wx.hideLoading()
        if (response.result.code === 0) {
          resolve(response.result)
        } else {
          $wuxToptips().error({
            hidden: false,
            text: response.result.msg,
            duration: 3000,
            success() {},
          })
        }
      }).catch(() => {
        wx.hideLoading()
        $wuxToptips().error({
          hidden: false,
          text: '网络错误',
          duration: 3000,
          success() {},
        })
        resolve(false)
      })
    })
  },
  formatDate(value, type) {
    // 日期格式过滤器
    if (!value) {
      return null
    }
    const date = new Date(value)
    let fmt = type || 'yyyy-MM-dd HH:mm:ss'
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
      'S': date.getMilliseconds() // 毫秒
    }
    var week = ['天', '一', '二', '三', '四', '五', '六']
    for (var i in obj) {
      fmt = fmt.replace(new RegExp(i + '+', 'g'), function (m) {
        var val = obj[i] + ''
        if (i === 'w') return (m.length > 2 ? '星期' : '周') + week[val]
        for (var j = 0, len = val.length; j < m.length - len; j++) val = '0' + val
        return m.length === 1 ? val : val.substring(val.length - m.length)
      })
    }
    return fmt
  },
  postData(url, data) { // post 请求后台数据
    data = data || {}
    data = Object.assign(data, {
      token: this.globalData.token
    })
    return new Promise((resolve) => {
      wx.showLoading({
        title: '请稍后...',
        mask: true
      })
      wx.request({
        method: 'post',
        url: `${this.globalData.baseURL}${url}?access_token=${this.globalData.token}`,
        data,
        success: (response) => {
          wx.hideLoading()
          if (response.data.code === 0) {
            resolve(response.data)
          } else {
            const msg = response.data.msg || response.data.error.message
            $wuxToptips().error({
              hidden: false,
              text: msg,
              duration: 3000,
              success() {},
            })
            resolve(false)
          }
        },
        fail: (err) => {
          wx.hideLoading()
          resolve(false)
        }
      })
    })
  },
  openLocation(lng, lat) {
    const that = this
    wx.getSetting({
      success(res) {
        if (!res.authSetting['scope.userLocation']) {
          // 用户未授权，请求用户授权
          wx.authorize({
            scope: 'scope.userLocation',
            success() {
              // 用户已经同意小程序获取地理位置
              wx.showLoading({
                title: '请稍候...',
              })
              wx.getLocation({
                altitude: 'altitude',
                success: function (res) {
                  wx.hideLoading()
                  const position = {
                    longitude: lng - 0.0065,
                    latitude: lat - 0.0060
                  }
                  wx.openLocation(position)
                },
                fail: function (err) {
                  wx.hideLoading()
                  console.log('获取地理位置失败 err', err)
                  $wuxToptips().error({
                    hidden: false,
                    text: '定位失败，请检查是否打开GPS',
                    duration: 3000,
                    success() {},
                  })
                }
              })
            }
          })
        } else {
          // 用户已授权 "地理位置"
          wx.showLoading({
            title: '请稍候...',
          })
          wx.getLocation({
            altitude: 'altitude',
            success: function (res) {
              wx.hideLoading()
              const position = {
                longitude: lng - 0.0065,
                latitude: lat - 0.0060
              }
              wx.openLocation(position)
            },
            fail: function (err) {
              wx.hideLoading()
              console.log('获取地理位置失败 err', err)
              $wuxToptips().error({
                hidden: false,
                text: '定位失败，请检查是否打开GPS',
                duration: 3000,
                success() {},
              })
            }
          })
        }
      }
    })
  }
})