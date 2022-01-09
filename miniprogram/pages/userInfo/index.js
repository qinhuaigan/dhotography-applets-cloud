// pages/userInfo/index.js
import {
  $wuxToptips
} from '../../components/wux-weapp/index'
const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    userInfo: null
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
    const userInfo = JSON.parse(JSON.stringify(app.globalData.userInfo))
    userInfo.avatar = userInfo.avatar || app.globalData.defaultAvatar
    userInfo.provincialArea = userInfo.provincialArea || []
    userInfo.provincialAreaCode = userInfo.provincialAreaCode || []
    this.setData({
      userInfo
    })
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
  bindRegionChange: function (e) {
    const userInfo = this.data.userInfo
    userInfo.provincialArea = e.detail.value
    userInfo.provincialAreaCode = e.detail.code
    this.setData({
      userInfo
    })
  },
  uploadAvatar(e) { // 上传头像
    wx.chooseImage({
      count: 1,
      success: (e) => {
        if (e.tempFilePaths && e.tempFilePaths.length > 0) {
          const suffix = e.tempFilePaths[0].split('.').pop() // 文件后缀名
          const cloudPath = `avatar/${app.globalData.userInfo['_id']}.${suffix}`
          app.showLoading()
          wx.cloud.uploadFile({
            cloudPath, // 上传至云端的路径
            filePath: e.tempFilePaths[0], // 小程序临时文件路径
            success: res => {
              app.cloudFun({
                name: 'user',
                data: {
                  method: 'updateUserAvatarByToken',
                  data: {
                    avatar: res.fileID
                  }
                }
              }).then((result) => {
                app.hideLoading()
                if (res) {
                  $wuxToptips().success({
                    hidden: false,
                    text: '头像上传成功',
                    duration: 3000,
                    success() {},
                  })
                  this.data.userInfo.avatar = res.fileID
                  this.setData({
                    userInfo: this.data.userInfo
                  })
                  app.globalData.userInfo.avatar = res.fileID
                }
              })
            },
            fail: console.error
          })
        }
      },
      fail: () => {}
    })
  },
  async saveInfo() { // 保存 "信息"
    const data = {
      nickname: this.data.userInfo.nickname,
      gender: this.data.userInfo.gender,
      provincialArea: this.data.userInfo.provincialArea,
      provincialAreaCode: this.data.userInfo.provincialAreaCode,
      address: this.data.userInfo.address
    }
    // const result = await app.postData('/UserInformations/updateUserInfoByToken', data)
    const result = await app.cloudFun({
      name: 'user',
      data: {
        method: 'updateUserInfoByToken',
        data
      }
    })
    if (result) {
      $wuxToptips().success({
        hidden: false,
        text: '保存成功',
        duration: 3000,
        success() {},
      })
      app.globalData.userInfo = JSON.parse(JSON.stringify(this.data.userInfo))
    }
  },
  updateName(e) { // 更新 "用户昵称"
    const {
      value
    } = e.detail
    this.data.userInfo.chineseName = value
  },
  updateAddress(e) { // 更新 "详细地址"
    const {
      value
    } = e.detail
    this.data.userInfo.address = value
  },
  updateGender(e) { // 更新 "性别"
    const {
      value
    } = e.detail
    this.data.userInfo.gender = value
  }
})