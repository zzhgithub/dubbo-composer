/**
 * 建立网络链接层
 * 返回socket长链接对象
 * 要有正常的心跳检查?
 * 有较好的异常检查和处理正常的关闭链接的方式？(在销毁方法里？？)
 *
 */

const net = require("net");
const decode = require("./decode");
const { PromiseSocket } = require("promise-socket");

const HEADER_LENGTH = 16;
const FLAG_EVENT = 0x20;

/**
 *
 * @param {*} socketInfo {ip,port}
 */
const Socket = function (socketInfo) {
  // 是否是初次建立
  this.isInit = true;
  // 链接信息
  this.port = socketInfo.port;
  this.socketIp = socketInfo.ip;
  // 链接状态
  this.isConnect = false;

  // 错误信息
  this.error = null;
  // 错误回调函数
  this.errCallBack = null;

  // 外层promise回调函数
  this.resolve = null;
  this.reject = null;

  // 接受数据块
  this.chunks = [];
  this.bl = HEADER_LENGTH;

  // 心跳检查锁
  this.heartBeatLock = false;
  // 心跳检查定时器
  this.heartBeatInter = null;
  // 是否是请求链接
  this.transmiting = false;

  return this;
};

Socket.prototype.build = function () {
  return new Promise((resolve) => {
    this.socket = net.connect(this.port, this.socketIp);
    this.socket.on("error", this.onError.bind(this));
    this.socket.on("data", this.onData.bind(this));
    this.socket.on("timeout", this.onTimeout.bind(this));
    this.socket.on("connect", () => {
      this.isConnect = true;
      this.isInit = false;
      // 建立心跳检查 定时任务
      this.heartBeatInter = setInterval(() => {
        if (!this.heartBeatLock) {
          // prettier-ignore
          // 心跳检查 报文
          this.socket.write(Buffer([0xda, 0xbb, 0xe2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0x01, 0x4e]));
        }
      }, 5000);
      resolve(this);
    });
  });
};

/**
 * dubbo 方法实现
 * data 是dubbo请求的数据
 * resolve reject 外层promise的参数
 */
Socket.prototype.invoke = function ({ data, resolve, reject }, callback) {
  this.reject = reject;
  this.resolve = resolve;
  this.errCallBack = callback;
  // 心跳检查上锁
  this.heartBeatLock = true;
  // 数据传输标识打开
  this.transmiting = true;
  console.log("发生了消息");
  //
  this.socket.write(data);
};

/**
 * 接收返回值
 */
Socket.prototype.onData = function (data) {
  if (!this.chunks.length) {
    this.bl += data.readInt32BE(12);
  }
  this.chunks.push(data);
  const heap = Buffer.concat(this.chunks);
  if (heap.length === this.bl) {
    //重置bl
    this.bl = HEADER_LENGTH;
    // 清空块缓存
    this.chunks = [];
    this.deSerialize(heap);
  }
};

/**
 * 数据 反序列化 得出结果（在这里面使用外层的 reject 或者 resolve）
 */
Socket.prototype.deSerialize = function (heap) {
  if (!((heap[2] & FLAG_EVENT) !== 0)) {
    decode(heap, (err, result) => {
      this.transmiting = false;
      this.heartBeatLock = false;
      console.log(err);
      
      err ? this.reject(err) : this.resolve(result);

      this.resolve = null;
      this.reject = null;
      //?? 这段代码什么意思？
      this.errCallBack(null, true);
    });
  }
};

/**
 * 链接超时异常处理
 */
Socket.prototype.onTimeout = function () {
  if (this.reject) {
    this.reject("socket timeout");
  }
  this.socket.end();
};

/**
 * 链接成功处理
 */
Socket.prototype.onConnect = function () {
  this.isConnect = true;
  // 建立心跳检查 定时任务
  this.heartBeatInter = setInterval(() => {
    if (!this.heartBeatLock) {
      // prettier-ignore
      // 心跳检查 报文
      this.socket.write(Buffer([0xda, 0xbb, 0xe2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0x01, 0x4e]));
    }
  }, 5000);
  // 链接成功回调
};

/**
 * 销毁当前链接
 * 释放心跳检查任务
 */
Socket.prototype.destroy = function (msg) {
  this.isConnect = false;
  this.reject && this.reject(msg);
  clearInterval(this.heartBeatInter);
  this.socket.destroy();
};

Socket.prototype.onError = function (err) {
  console.error("报错了" + err);
  this.error = err;

  if (this.errCallBack) {
    this.errCallBack(err);
  }
  console.log(err.code);
  if (this.reject) {
    switch (err.code) {
      case "EHOSTUNREACH":
        this.reject("ehostunreach!");
        break;
      case "EADDRINUSE":
        this.reject("Address already in use");
        break;
      case "ECONNREFUSED":
        this.reject("Connection refused");
        break;
      case "ECONNRESET":
        this.destroy("Connection reset by peer");
        break;
      case "EPIPE":
        this.destroy("Broken pipe");
        break;
      case "ETIMEDOUT":
        this.reject("Operation timed out");
        break;
    }
  }
};

module.exports = {
  Socket,
};
