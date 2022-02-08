// pages/evaluateList/index.js
const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    baseURL: app.globalData.baseURL,
    currentPage: 1,
    pageSize: 5,
    evaluateList: [], // 评论列表
    evaluateStatistics: null,
    totalEvaluete: 0,
    totalPage: 0,
    themeId: null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.data.evaluateList = []
    this.data.currentPage = 1
    this.data.themeId = options.id
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
    this.nextPage()
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },
  async getEvaluates(themeId) { // 获取评论
    const result = await app.cloudFun({
      name: 'evaluate',
      data: {
        method: 'getEvaluates',
        data: {
          currentPage: this.data.currentPage,
          pageSize: this.data.pageSize,
          themeId
        }
      }
    })
    if (result) {
      const evaluateList = result.data
      for (let i = 0; i < evaluateList.length; i++) {
        evaluateList[i].avatar = await this.getAvatar(evaluateList[i].avatar)
      }
      this.setData({
        evaluateList: [...this.data.evaluateList, ...evaluateList],
        totalEvaluete: result.count,
        totalPage: Math.ceil(result.count / this.data.pageSize)
      })
    }
  },
  getAvatar(fileId) {
    return new Promise((resolve) => {
      if (!fileId) {
        resolve(app.globalData.defaultAvatar)
      } else {
        wx.cloud.getTempFileURL({
          fileList: [fileId],
          success: res => {
            resolve(res.fileList[0].tempFileURL)
          },
          fail: () => {
            resolve(false)
          }
        })
      }
    })
  },
  async getEvaluateStatistics(themeId) { // 获取评论统计
    const result = await app.cloudFun({
      name: 'evaluate',
      data: {
        method: 'getEvaluateStatistics',
        data: {
          themeId
        }
      }
    })
    this.setData({
      evaluateStatistics: result.data
    })
  },
  showBigImg(e) { // 查看大图
    const {
      current,
      index
    } = e.currentTarget.dataset
    wx.previewImage({
      urls: this.data.evaluateList[index].fileList.reduce((total, item) => {
        total.push(item.filePath)
        return total
      }, []),
      current
    })
  },
  nextPage() { // 下一页
    if (this.data.currentPage < this.data.totalPage) {
      this.data.currentPage += 1
      this.setData({
        currentPage: this.data.currentPage
      })
      this.getEvaluates(this.data.themeId)
    }
  }
})