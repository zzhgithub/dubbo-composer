/**
 * 调度器
 * 功能：
 * 1.复用socket长链接
 * 2. 建立ip到链接的缓存给所有服务使用
 * 3. 弹性扩展 链接实例个数
 * FIXME
 */
const Dispatcher = function () {
  this._init_conn = 3;
  this._max_conn = 6;
  this._min_conn = 3;
  // 等待执行任务
  this.waitIpTask = {};
  // ip索引队列
  this.ipQueue = {};
  // ip索引忙绿队列
  this.busyIpQueue = {};
};

Dispatcher.prototype.config = function (config) {
  // 初始化时的链接实例个数
  this._init_conn = config.initConn;
  // 使用时最大弹性链接数
  this._max_conn = config.maxConn;
  // 使用时最小链接数
  this._min_conn = config.minConn;

  //创建调用函数
  this.createSocket = config.createSocket;
};

/**
 * 尝试获取一个可以用的链接
 * @param {*} socketInfo
 *
 * socketInfo {ip,port,callback}
 * 中的回调函数
 * (err,socket)=>{处理函数}
 *
 */
Dispatcher.prototype.gain = function (socketInfo) {
  let ip = socketInfo.ip;
  //回调函数
  let cb = socketInfo.callback;
  // 获取ip下的可用链接
  if (!this.ipQueue.hasOwnProperty(ip)) {
    // 没有ip这个key
    this.ipQueue[ip] = [];
    this.busyIpQueue[ip] = [];
    //TODO create n个socket链接
    this.addNSocket(socketInfo, this._init_conn);
  }
  var availble_len = this.ipQueue.length;
  var busy_len = this.busyIpQueue.length;

  if (availble_len + busy_len < this._min_conn) {
    // 把链接数提升到最小值后在重新的添加一些
    this.addNSocket(socketInfo, this._min_conn - (availble_len + busy_len));
    // this._min_conn-（availble_len+busy_len） creat socket
    return this.gain(socketInfo);
  } else if (availble_len > 0) {
    let socket = this.ipQueue[ip].shift();
    if (socket.isConnect === false) {
      // 获取到的链接已经丢失
      // 这里的socket链接已经移除了 不需要在继续处理了
      this.clearSocket(ip, socket);
      return this.gain(socketInfo);
    }
    // 加入数据到 busy中
    this.busyIpQueue[ip].push(socket);
    cb(null, socket);
  } else if (busy_len < this._max_conn) {
    // 链接不够添加一个链接
    this.addNSocket(socketInfo, 1);
    // create Socket +1
    // 重新分配
    return this.gain(socketInfo);
  } else {
    // 没有可以使用的链接了 要进入到wait中
    if (!this.waitIpTask.hasOwnProperty(ip)) {
      this.waitIpTask[ip] = [];
    }
    this.waitIpTask[ip].push(socketInfo);
  }
};

/**
 * TODO
 * 添加n个可以使用的链接
 */
Dispatcher.prototype.addNSocket = function (socketInfo, num) {
  let ip = socketInfo.ip;
  if (!this.ipQueue.hasOwnProperty(ip)) {
    this.ipQueue[ip] = [];
  }
  for (var i = 0; i < num; i++) {
    var socket = this.createSocket(socketInfo);
    this.ipQueue[ip].push(socket);
  }
};

/**
 * 溢出数组中的链接
 */
Dispatcher.prototype.remove = function (arr, socket) {
  const index = arr.indexOf(socket);
  if (index !== -1) {
    arr.splice(index, 1);
  }
};

/**
 * 全力清空环境中存在的链接
 */
Dispatcher.prototype.clearSocket = function (ip, socket) {
  if (this.ipQueue.hasOwnProperty(ip)) {
    this.remove(this.ipQueue[ip], socket);
  }
  if (this.busyIpQueue.hasOwnProperty(ip)) {
    this.removed(this.busyIpQueue[ip], socket);
  }
};

/**
 *
 * 资源释放
 * FIXME:
 * 当中途dubbo服务断开链接失效后 对应的socketInfo将要失效 这时累积的调用应该重新获取ip!!!
 */
Dispatcher.prototype.release = function (socket) {
  // 获取链接ip
  let ip = socket.socketIp;
  this.remove(this.busyIpQueue[ip], socket);
  this.ipQueue[ip].push(socket);
  if (this.waitIpTask[ip].length > 0) {
    this.gain(this.waitIpTask[ip].shift());
  }
};

/**
 * TODO
 * 当原来的 服务关闭后更新ip的操作
 */
Dispatcher.prototype.change = function (oldIp, newIp) {
  // 关闭原来的全部链接
  // 重新的修改原来的ip中的等待任务重新赋值给新的ip和port
};

module.exports = { Dispatcher };
