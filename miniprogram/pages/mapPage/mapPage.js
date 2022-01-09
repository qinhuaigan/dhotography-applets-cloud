// pages/mapPage/mapPage.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    destination: null, // 目的地
    markers: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.data.destination = {
      lat: options.lat,
      lng: options.lng
    }
    const that = this
    wx.getSetting({
      success(res) {
        if (!res.authSetting['scope.userLocation']) {
          // 用户未授权，请求用户授权
          wx.authorize({
            scope: 'scope.userLocation',
            success() {
              // 用户已经同意小程序获取地理位置
              wx.getLocation({
                altitude: 'altitude',
                success: function (res) {
                  that.setData({
                    longitude: res.longitude,
                    latitude: res.latitude,
                    markers: [{
                      longitude: that.data.destination.lng - 0.0065,
                      latitude: that.data.destination.lat - 0.0060
                    }]
                  })
                  const position = {
                    longitude: that.data.destination.lng - 0.0065,
                    latitude: that.data.destination.lat - 0.0060
                  }
                  wx.openLocation(position)
                },
                fail: function (err) {
                  console.log('获取地理位置失败 err', err)
                }
              })
            }
          })
        } else {
          // 用户已授权 "地理位置"
          wx.getLocation({
            altitude: 'altitude',
            success: function (res) {
              that.setData({
                longitude: res.longitude,
                latitude: res.latitude,
                markers: [{
                  longitude: that.data.destination.lng - 0.0065,
                  latitude: that.data.destination.lat - 0.0060
                }]
              })
              const position = {
                longitude: that.data.destination.lng - 0.0065,
                latitude: that.data.destination.lat - 0.0060
              }
              wx.openLocation(position)
            },
            fail: function (err) {
              console.log('获取地理位置失败 err', err)
            }
          })
        }
      }
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

  }
})