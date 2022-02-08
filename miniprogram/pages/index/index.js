//index.js
//获取应用实例
const app = getApp()

Page({
  data: {
    titleIcon: `${app.globalData.baseURL}/Containers/themeIcon/download/05.png`,
    scienceImgs: [],
    themeData: [],
    baseURL: app.globalData.baseURL,
    motto: 'Hello World',
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    carouselList: [],
    indicatorDots: true,
    vertical: false,
    autoplay: true,
    interval: 2000,
    duration: 500,
    tabsData: [{
      label: 'l',
      value: '1',
      path: `cloud://clound2-9ga4gs443dee48af.636c-clound2-9ga4gs443dee48af-1308948710/icon/AFEIDBAEGAAg2YXv0wUolsjw1AIwbDhsQGc.png`
    }, {
      label: '写真',
      value: '2',
      path: `cloud://clound2-9ga4gs443dee48af.636c-clound2-9ga4gs443dee48af-1308948710/icon/AFEIDBAEGAAg24Xv0wUooa6o0AcwbDhsQGc.png`
    }, {
      label: '棚拍',
      value: '3',
      path: `cloud://clound2-9ga4gs443dee48af.636c-clound2-9ga4gs443dee48af-1308948710/icon/AFEIDBAEGAAg3IXv0wUo9ajG4QIwbDhsQGc.png`
    }, {
      label: '婚庆',
      value: '4',
      path: `cloud://clound2-9ga4gs443dee48af.636c-clound2-9ga4gs443dee48af-1308948710/icon/AFEIDBAEGAAg3oXv0wUo5IrS6QcwbDhsQGc.png`
    }]
  },
  //事件处理函数
  bindViewTap: function () {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },
  onLoad: async function () {
    // 获取 token
    app.globalData.token = await new Promise((resolve) => {
      wx.getStorage({
        key: 'token',
        success: function (res) {
          resolve(res.data)
        },
        fail: function (err) {
          resolve(false)
        }
      })
    })
    // 获取用户信息
    this.getUserInfoByToken()
    // 获取 "今日推荐" 数据
    this.getThemes()
    // 获取 "环境展示" 图片
    this.getScienceImgs()
    // 获取轮播图
    this.getCarousel()
  },
  // 通过 token 获取用户信息
  async getUserInfoByToken() {
    // 获取登录用户信息
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
      app.globalData.userInfo = result.data
    }
  },
  async getCarousel() { // 获取轮播图
    const result = await app.cloudFun({
      name: 'home',
      data: {
        method: 'getCarousel',
        type: '1'
      }
    })
    if (result) {
      this.carouselList = result.data
      this.setData({
        carouselList: this.carouselList
      })
    }
  },
  async getThemes() { // 获取 "今日推荐" 的 "服务单"
    const result = await app.cloudFun({
      name: 'home',
      data: {
        method: 'getIsRecommend'
      }
    })
    if (result) {
      this.themeData = result.data
      this.setData({
        themeData: this.themeData
      })
    }
  },
  async getScienceImgs() { // 获取 "环境展示" 图片
    const result = await app.cloudFun({
      name: 'home',
      data: {
        method: 'getCarousel',
        type: '2'
      }
    })
    if (result) {
      this.scienceImgs = result.data
      this.setData({
        scienceImgs: this.scienceImgs
      })
    }
  },
  gotoDetailPage(e) {
    wx.navigateTo({
      url: `../produceDetail/index?id=${e.currentTarget.dataset.theme._id}`,
    })
  }
})