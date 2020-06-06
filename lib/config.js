const os = require("os");

var Config = function () {
  this.ip = null;
  this.options = null;
};

Config.prototype = {
  init: function () {
    this.ip = this.getIp();
  },

  load: function (options) {
    this.options = options;
  },
  //获取当前app名称
  getAppName: function () {
    return this.options.app.name;
  },
  //获取zk 注册地址
  getZkAdrress: function () {
    return this.options.zk.addr;
  },
  //获取zk 跟地址
  getDubboRoot: function () {
    return this.options.zk.root;
  },
  getDudbboVerion: function () {
    return this.options.dubbo.verion;
  },
  // 获取失效时间
  getDubboTimeout: function () {
    return this.options.dubbo.timeout * 1000;
  },
  isLoopback: function (addr) {
    return (
      /^(::f{4}:)?127\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})/.test(addr) ||
      /^fe80::1$/.test(addr) ||
      /^::1$/.test(addr) ||
      /^::$/.test(addr)
    );
  },
  getIp: function () {
    const interfaces = os.networkInterfaces();
    return Object.keys(interfaces)
      .map(function (nic) {
        const addresses = interfaces[nic].filter(function (details) {
          return (
            details.family.toLowerCase() === "ipv4" &&
            !this.isLoopback(details.address)
          );
        });
        return addresses.length ? addresses[0].address : undefined;
      })
      .filter(Boolean)[0];
  },
};

module.exports = new Config();
