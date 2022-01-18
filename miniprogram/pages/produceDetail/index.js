// pages/produceDetail/index.js
const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    baseURL: app.globalData.baseURL,
    themeDetail: null,
    currentPage: 1,
    pageSize: 2,
    evaluateList: [], // 评论列表
    evaluateStatistics: null,
    totalEvaluete: 0,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.getThemeDetail(options.id)
    this.getEvaluates(options.id)
    this.getEvaluateStatistics(options.id)
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
  call() { // 打电话
    wx.makePhoneCall({
      phoneNumber: this.data.themeDetail.phone,
    })
  },
  async getThemeDetail(id) {
    const result = await app.cloudFun({
      name: 'produce',
      data: {
        method: 'getThemeDetail',
        data: {
          id
        }
      }
    })

    if (result) {
      result.data.totalMoney = `${result.data.price.toFixed(2)}`
      this.setData({
        themeDetail: result.data
      })
    }
  },
  async getEvaluates(themeId) { // 获取评论
    const result = await app.postData('/Evaluates/getEvaluateByThemeId', {
      currentPage: this.data.currentPage,
      pageSize: this.data.pageSize,
      themeId
    })
    if (result) {
      const evaluateList = result.data
      evaluateList.forEach((item) => {
        item.avatar = item.avatar ? `${app.globalData.baseURL}${item.avatar}` : app.globalData.defaultAvatar
        item.imgs.forEach((img) => {
          img.path = `${app.globalData.baseURL}${img.path}`
        })
      })
      this.setData({
        evaluateList,
        totalEvaluete: result.total
      })
    }
  },
  async getEvaluateStatistics(themeId) { // 获取评论统计
    const result = await app.postData('/Evaluates/getEvaluateStatisticsByThemeId', {
      themeId
    })
    if (result) {
      this.setData({
        evaluateStatistics: result.data
      })
    }
  },
  showBigImg(e) { // 查看大图
    const {
      current,
      index
    } = e.currentTarget.dataset
    wx.previewImage({
      urls: this.data.evaluateList[index].imgs.reduce((total, item) => {
        total.push(item.path)
        return total
      }, []),
      current
    })
  }
})