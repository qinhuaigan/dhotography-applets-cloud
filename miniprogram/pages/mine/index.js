// pages/mine/index.js
const app = getApp()
import {
  $wuxToptips
} from '../../components/wux-weapp/index'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    visible: false,
    defaultAvatar: null,
    userInfo: null,
    orderCount: {
      isCancel: 0, // 已取消
      isAppointment: 0, // 预约中
      isHand: 0, // 进行中
      isCompleted: 0 // 已完成
    },
    subscribeMsgNum: 0, // "我的订阅" 未读数量 
    unreadMsgNum: 0 // "我的订阅" 未读消息数量
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    const userInfo = app.globalData.userInfo ? JSON.parse(JSON.stringify(app.globalData.userInfo)) : null
    if (userInfo) {
      userInfo.avatar = userInfo && userInfo.avatar ? userInfo.avatar : app.globalData.defaultAvatar
    }
    this.setData({
      userInfo,
      defaultAvatar: app.globalData.defaultAvatar
    })
    this.getOrderCount()
    this.getUnreadMsgNum()
    this.getSubscribeMsgNum()
  },

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
  loginOut() { // 退出登录
    app.globalData.userInfo = null
    app.globalData.token = null
    wx.removeStorage({
      key: 'token',
    })
    wx.reLaunch({
      url: '../login/index',
    })
  },
  async getOrderCount() { // 获取订单 "统计数据"
    const result = await app.cloudFun({
      name: 'order',
      data: {
        method: 'getOrderCount'
      }
    })
    // const result = await app.postData('/Orders/userOrderCount')
    if (result) {
      this.setData({
        orderCount: result.data
      })
    }
  },
  async getUnreadMsgNum() { // 获取 "最新消息--未读消息" 数量
    const result = await app.cloudFun({
      name: 'message',
      data: {
        method: 'getSubscribeMsgNum',
        data: {
          msgType: 2
        }
      }
    })
    if (result) {
      this.setData({
        unreadMsgNum: result.count
      })
    }
  },
  async getSubscribeMsgNum() { // 获取 "我的订阅--未读消息" 数量
    const result = await app.cloudFun({
      name: 'message',
      data: {
        method: 'getSubscribeMsgNum',
        data: {
          msgType: 1
        }
      }
    })
    if (result) {
      this.setData({
        subscribeMsgNum: result.count
      })
    }
  },
  openMap() { // 打开地图导航
    app.openLocation(109.422046, 24.281037, this)
  },
  openAuthority() {
    this.setData({
      visible: false
    })
  },
  call(e) { // 打电话
    const {
      phone
    } = e.currentTarget.dataset
    wx.makePhoneCall({
      phoneNumber: phone,
    })
  },
})