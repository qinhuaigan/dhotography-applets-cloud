// pages/produce/index.js
const app = getApp()
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
      label: '主题拍摄',
      value: 1
    }, {
      label: '婚纱定制',
      value: 2
    }, {
      label: '婚礼定制',
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
  getThemes() {
    const that = this
    app.showLoading()
    wx.request({
      url: `${app.globalData.baseURL}/Themes/getThemes?token=${app.globalData.token}`,
      method: 'post',
      data: {
        series: this.data.series,
        type: this.data.type,
        currentPage: this.data.currentPage,
        pageSize: this.data.pageSize
      },
      success(response) {
        if (response.data.code === 0) {
          that.data.themeData = [...that.data.themeData, ...response.data.data]
          that.data.total = response.data.count
          that.data.themeData.forEach((item) => {
            item.totalMoney = item.price.toFixed(2)
          })
          that.setData({
            themeData: that.data.themeData,
            total: that.data.total
          })
        } else {

        }
        app.hideLoading()
      },
      fail(err) {
        app.hideLoading()
      }
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
      url: `../produceDetail/index?id=${e.currentTarget.dataset.theme.id}`,
    })
  },
  gotoOrderPage(e) { // 跳转到预约页面
    wx.navigateTo({
      url: `../newOrder/index?id=${e.currentTarget.dataset.theme.id}`
    })
  }
})