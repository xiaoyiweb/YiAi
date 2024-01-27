module.exports = {
  root: true,
  extends: ['@antfu'],
  rules: {
    'no-tabs': 0,
  },
  globals: {
    WeixinJSBridge: false,
    wx: false,
    loginCount: true,
  },
}
