// pages/produce/index.js
const app = getApp()
import {
  $wuxToptips
} from '../../components/wux-weapp/index'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    baseURL: app.globalData.baseURL,
    series: null,
    type: null,
    currentPage: 1,
    pageSize: 5,
    total: 0,
    tabs: [{
      label: '全部',
      value: null
    }, {
      label: '校园主题',
      value: 1
    }, {
      label: '海景主题',
      value: 2
    }, {
      label: '纪念主题',
      value: 3
    }],
    themeData: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.data.series = options.series ? JSON.parse(options.series) : null
    this.getThemes()
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
  async getThemes() {
    const result = await app.cloudFun({
      name: 'produce',
      data: {
        method: 'getThemeList',
        data: {
          series: this.data.series,
          type: this.data.type,
          currentPage: this.data.currentPage,
          pageSize: this.data.pageSize
        }
      }
    })
    this.data.themeData = [...this.data.themeData, ...result.data]
    this.data.total = result.count
    this.data.themeData.forEach((item) => {
      item.totalMoney = item.price.toFixed(2)
    })
    this.setData({
      themeData: this.data.themeData,
      total: this.data.total
    })

  },
  change(e) {
    this.data.themeData = []
    this.data.type = e.detail.key
    this.data.currentPage = 1
    this.getThemes()
  },
  nextPage() {
    this.data.currentPage += 1
    this.getThemes()
  },
  gotoDetailPage(e) {
    wx.navigateTo({
      url: `../produceDetail/index?id=${e.currentTarget.dataset.theme._id}`,
    })
  },
  gotoOrderPage(e) { // 跳转到预约页面
    if (!app.globalData.userInfo) {
      $wuxToptips().warn({
        hidden: false,
        text: '请先登录',
        duration: 3000,
        success() {},
      })
      wx.navigateTo({
        url: '../login/index',
      })
      return
    }
    wx.navigateTo({
      url: `../newOrder/index?id=${e.currentTarget.dataset.theme._id}`
    })
  }
})