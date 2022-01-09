// pages/commentPage/index.js
import {
  $wuxToptips
} from '../../components/wux-weapp/index'
const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    disabledBtn: false,
    orderInfo: null,
    evaluateList: [{ // 评价类型
      label: '好评',
      value: 1
    }, {
      label: '中评',
      value: 2
    }, {
      label: '差评',
      value: 3
    }],
    evaluateInfo: { // 评价信息
      evalueteType: 1, // 评价类型
      remark: null, // 评论内容
      accordLevel: 0, // 描述相符
      qualityLevel: 0, // 拍摄质量
      attitudeLevel: 0, // 服务态度
      isPublic: true // 是否公开
    },
    fileList: [], // 文件列表
    type: 1 // 评价类型
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.data.type = options.type
    this.getOrderInfo(options.id)
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
  async getOrderInfo(id) { // 获取订单详情
    const result = await app.postData('/Orders/getOrderDetail', {
      id
    })
    if (result) {
      result.data.themeInfo.files.forEach((item) => {
        item.path = `${app.globalData.baseURL}${item.path}`
      })
      this.setData({
        orderInfo: result.data
      })
    }
  },
  selectEvaluateType(e) { // 选择评价类型
    const {
      type
    } = e.currentTarget.dataset
    this.data.evaluateInfo.evalueteType = type
    this.setData({
      evaluateInfo: this.data.evaluateInfo
    })
  },
  chooseFile() { // 选择文件
    wx.chooseImage({
      count: 1,
      success: (res) => {
        this.data.fileList.push(res.tempFilePaths[0])
        this.setData({
          fileList: this.data.fileList
        })
      }
    })
  },
  removeFile(e) { // 删除文件
    const {
      index
    } = e.currentTarget.dataset
    this.data.fileList.splice(index, 1)
    this.setData({
      fileList: this.data.fileList
    })
  },
  levelChange(e) { // 星级变化、评价内容
    const {
      str
    } = e.currentTarget.dataset
    const {
      value
    } = e.detail
    this.data.evaluateInfo[str] = value
  },
  async submitEvaluate(type) { // 提交评价信息
    // 先提交 "评价信息"，再上传 "文件"
    const data = Object.assign(this.data.evaluateInfo, {
      id: this.data.orderInfo.id,
      type: this.data.type
    })
    this.setData({
      disabledBtn: true
    })
    const submitResult = await app.postData('/Evaluates/addEvaluate', data)
    if (submitResult) {
      // 上传文件
      const uploadArr = this.data.fileList.reduce((total, item) => {
        total.push(new Promise((resolve) => {
          wx.uploadFile({
            filePath: item,
            name: 'file',
            url: `${app.globalData.baseURL}/storages/wxUploadFile?container=${submitResult.result.id}`,
            success: (res) => {
              resolve(res)
            },
            fail: (err) => {
              console.log(err)
              resolve(false)
            }
          })
        }))
        return total
      }, [])
      Promise.all(uploadArr).then((uploadResult) => {
        wx.showToast({
          title: '发布成功',
          icon: 'success',
          success: () => {
            wx.navigateBack({
              delta: -1,
            })
          }
        })
        this.setData({
          disabledBtn: false
        })
      })
    } else {
      this.setData({
        disabledBtn: false
      })
    }
  },
  publichChange(e) { // 是否公开
    this.data.evaluateInfo.isPublic = e.detail.value.length > 0
    this.setData({
      evaluateInfo: this.data.evaluateInfo
    })
  }
})