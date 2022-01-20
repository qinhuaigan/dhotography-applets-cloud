// pages/order/index.js
import {
  $wuxDialog,
  $wuxToptips
} from '../../components/wux-weapp/index'
const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    tabs: [{
      label: '全部',
      value: null
    }, {
      label: '预约中',
      value: 0
    }, {
      label: '进行中',
      value: 1
    }, {
      label: '已完成',
      value: 2
    }, {
      label: '已取消',
      value: -1
    }],
    orderList: [],
    searchStatus: null,
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
    currentPage: 1,
    pageSize: 5,
    total: 0,
    sliderOffset: 0,
    sliderLeft: 0,
    defaultCurrent: 0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const status = options.status ? parseFloat(options.status) : null
    this.setData({
      searchStatus: status,
      defaultCurrent: status
    })
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
    this.data.currentPage = 1
    this.data.orderList = []
    this.getMyOrders()
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
  tabChange(e) { // 切换tab
    const {
      key
    } = e.detail
    this.data.searchStatus = key ? parseFloat(key) : ''
    this.data.currentPage = 1
    this.data.orderList = []
    this.getMyOrders()
  },
  nextPage() { // 加载 "下一页"
    if (this.data.currentPage < this.data.total) {
      this.data.currentPage += 1
      this.getMyOrders()
    }
  },
  async getMyOrders() { // 获取 "订单列表"
    const data = {
      status: this.data.searchStatus,
      currentPage: this.data.currentPage,
      pageSize: this.data.pageSize
    }
    const result = await app.cloudFun({
      name: 'order',
      data: {
        method: 'getOrderByToken',
        data
      }
    })
    if (result) {
      const orderList = result.data
      this.setData({
        orderList: [...this.data.orderList, ...orderList],
        total: Math.ceil(result.count / this.data.pageSize),
        currentPage: this.data.currentPage
      })
    }
  },
  async cancelOrder(e) { // 取消订单
    const {
      id
    } = e.target.dataset
    $wuxDialog().prompt({
      resetOnClose: true,
      title: '提示',
      content: '请输入备注说明',
      defaultText: '',
      placeholder: '请输入说明',
      maxlength: -1,
      onConfirm: async (e, response) => {
        const content = response
        const result = await app.cloudFun({
          name: 'order',
          data: {
            method: 'cancelOrder',
            data: {
              id,
              customerCancelRemarks: content
            }
          }
        })
        if (result) {
              $wuxToptips().success({
              hidden: false,
              text: '订单取消成功',
              duration: 3000,
              success() {},
            })
            for (let i = 0; i < this.data.orderList.length; i++) {
              if (this.data.orderList[i]._id === id) {
                this.data.orderList[i].status = -2
                break
              }
            }
            this.setData({
              orderList: this.data.orderList
            })
        }
      },
    })
  },
  gotoDetail(e) { // 查看订单详情
    const {
      id
    } = e.currentTarget.dataset
    console.log('id ====', id)
    wx.navigateTo({
      url: `../orderDetail/index?id=${id}`,
    })
  },
  comment(e) { // 前往评论页面
    const {
      id,
      type
    } = e.currentTarget.dataset
    wx.navigateTo({
      url: `../evaluatePage/index?id=${id}&type=${type}`,
    })
  }
})