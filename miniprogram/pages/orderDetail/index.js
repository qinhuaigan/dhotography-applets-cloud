// pages/orderDetail/index.js
import {
  $wuxToptips
} from '../../components/wux-weapp/index'
const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    orderInfo: null,
    statusMap: {
      '-2': '己取消', // 客户自己取消订单
      '-1': '已取消', // 管理员取消订单
      '0': '预约中',
      '1': '进行中',
      '2': '已完成'
    },
    statusColorMap: {
      '-2': 'invalidColor',
      '-1': 'invalidColor',
      '0': 'warnColor',
      '1': 'warnColor',
      '2': 'successColor'
    },
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
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
    const result = await app.cloudFun({
      name: 'order',
      data: {
        method: 'getOrderDetail',
        data: {
          id
        }
      }
    })
    if (result) {
      this.setData({
        orderInfo: result.data
      })
    }
  },
  call() { // 联系我们（打电话）
    wx.makePhoneCall({
      phoneNumber: this.data.orderInfo.themeInfo.phone,
    })
  },
  goMapPage() { // 查看位置
    if (!this.data.orderInfo.themeInfo || !this.data.orderInfo.themeInfo.latitude) {
      $wuxToptips().warn({
        hidden: false,
        text: '暂无位置信息',
        duration: 3000,
        success() {},
      })
      return
    }
    app.openLocation(this.data.orderInfo.themeInfo.longitude, this.data.orderInfo.themeInfo.latitude)
  }
})