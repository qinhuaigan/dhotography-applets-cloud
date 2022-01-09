// custom-tab-bar/index.js
const app = getApp()
import tabsMap from '../../../json/tabs.js'
Component({
  /**
   * 组件的属性列表
   */
  properties: {

  },

  /**
   * 组件的初始数据
   */
  data: {
    tabs: [{
      text: '首页',
      icon: 'ios-home',
      path: '/pages/index/index',
    }, {
      text: '预约',
      icon: 'ios-alarm',
      path: '/pages/produce/index'
    }, {
      text: '我的',
      icon: 'ios-person',
      path: '/pages/mine/index'
    }],
    active: 0
  },

  /**
   * 组件的方法列表
   */
  methods: {
    tabChange(e) {
      const pagePath = this.getCurrentPage().route
      const url = e.currentTarget.dataset.path
      if (`/${pagePath}` === url) {
        return
      }
      wx.reLaunch({
        url
      })
    },
    getCurrentPage() {
      let pages = getCurrentPages();
      let currPage = null;
      if (pages.length) {
        currPage = pages[pages.length - 1];
      }
      return currPage
    }
  },
  attached() {
    const currPage = this.getCurrentPage()
    for (const key in tabsMap) {
      if (tabsMap[key].includes(currPage.route)) {
        this.setData({
          active: key
        })
      }
    }
  }
})