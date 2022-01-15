// pages/login/login.js
import {
  $wuxToptips
} from '../../components/wux-weapp/index'

const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    tabIndex: 1
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.autoLogin()
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {},

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },
  async autoLogin() { // 自动登录
    const autoLogin = await new Promise((resolve) => {
      wx.getStorage({
        key: 'autoLogin',
        success: (res) => {
          resolve(res.data)
        },
        fail: (err) => {
          resolve(false)
        }
      })
    })
    const token = await new Promise((resolve) => {
      wx.getStorage({
        key: 'token',
        success: (res) => {
          resolve(res.data)
        },
        fail: (err) => {
          resolve(false)
        }
      })
    })
    app.globalData.token = token
    this.setData({
      autoLogin
    })

    if (autoLogin) {
      // 填充账号和密码
      const username = await new Promise((resolve) => {
        wx.getStorage({
          key: 'username',
          success: (res) => {
            resolve(res.data)
          },
          fail: (err) => {
            resolve(false)
          }
        })
      })
      const password = await new Promise((resolve) => {
        wx.getStorage({
          key: 'password',
          success: (res) => {
            resolve(res.data)
          },
          fail: (err) => {
            resolve(false)
          }
        })
      })
      this.setData({
        username,
        password
      })

      // 获取用户信息
      if (token) {
        this.getLoginUserInfo()
      }
    }
  },
  selectedTab(e) {
    const {
      tab
    } = e.target.dataset
    this.setData({
      tabIndex: parseFloat(tab)
    })
  },
  isAutoLogin(e) {
    const autoLogin = e.detail.value[0]
    this.setData({
      autoLogin: autoLogin ? true : false
    })
    wx.setStorage({
      data: autoLogin ? true : false,
      key: 'autoLogin',
    })
    if (autoLogin) {
      wx.setStorage({
        data: this.data.username,
        key: 'username',
      })
      wx.setStorage({
        data: this.data.password,
        key: 'password',
      })
    } else {
      wx.removeStorage({
        key: 'username',
      })
      wx.removeStorage({
        key: 'password',
      })
    }
  },
  updateData(e) { // 更新 data 中的字段
    const {
      str
    } = e.target.dataset
    const {
      value
    } = e.detail
    this.setData({
      [str]: value
    })
    if (this.data.autoLogin) {
      wx.setStorage({
        data: this.data.username,
        key: 'username',
      })
      wx.setStorage({
        data: this.data.password,
        key: 'password',
      })
    }
  },
  async login() { // 登录
    let msg = ''
    if (!this.data.username) {
      msg = '请输入手机号或邮箱'
    } else if (!this.data.password) {
      msg = '请输入密码'
    }

    if (msg) {
      $wuxToptips().warn({
        hidden: false,
        text: msg,
        duration: 3000,
        success() {},
      })
      return
    }

    const result = await app.cloudFun({
      name: 'user',
      data: {
        method: 'login',
        data: {
          phone: this.data.username,
          password: this.data.password
        }
      }
    })

    if (result) {
      app.globalData.token = result.data
      wx.setStorage({
        data: result.data,
        key: 'token'
      })
      this.getLoginUserInfo()
    }
  },
  async getLoginUserInfo() { // 获取登陆用户信息
    const result = await app.cloudFun({
      name: 'user',
      data: {
        method: 'getUsetInfoByToken',
        data: {
          token: app.globalData.token
        }
      }
    })
    if (result) {
      $wuxToptips().success({
        hidden: false,
        text: '登录成功',
        duration: 3000,
        success() {},
      })
      app.globalData.userInfo = result.data
      wx.reLaunch({
        url: '../index/index',
      })
    }
  },
  async signUp() { // 注册
    let msg = null
    if (!this.data.username) {
      msg = '请输入手机号'
    } else if (!this.data.email) {
      msg = '请输入邮箱'
    } else if (!this.data.chineseName) {
      msg = '请输入昵称'
    } else if (!this.data.password) {
      msg = '请输入登陆密码'
    } else if (this.data.password !== this.data.password2) {
      msg = '两次输入的密码不一致'
    }
    if (msg) {
      $wuxToptips().warn({
        hidden: false,
        text: msg,
        duration: 3000,
        success() {},
      })
      return
    }
    const result = await app.cloudFun({
      // 云函数名称
      name: 'user',
      // 传给云函数的参数
      data: {
        name: 'user',
        method: 'signUp',
        data: {
          phone: this.data.username, // 手机号
          email: this.data.email,
          nickname: this.data.chineseName,
          password: this.data.password
        }
      },
    })
    if (result) {
      $wuxToptips().success({
        hidden: false,
        text: '注册成功，请登录',
        duration: 3000,
        success() {},
      })
      this.setData({
        tabIndex: 1
      })
    }
  }
})