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
  return this;
};

Dispatcher.prototype.config = function (config) {
  // 初始化时的链接实例个数
  this._init_conn = config.initConn ? config.initConn : this._init_conn;
  // 使用时最大弹性链接数
  this._max_conn = config.maxConn ? config.maxConn : this._max_conn;
  // 使用时最小链接数
  this._min_conn = config.minConn ? config.minConn : this._min_conn;

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
Dispatcher.prototype.gain = async function (socketInfo) {
  let ip = socketInfo.ip;
  //回调函数
  let cb = socketInfo.callback;
  // 获取ip下的可用链接
  if (!this.ipQueue.hasOwnProperty(ip)) {
    // 没有ip这个key
    this.ipQueue[ip] = [];
    this.busyIpQueue[ip] = [];
    //TODO create n个socket链接
    // console.log("first");
    this.addNSocket(socketInfo, this._init_conn);
  }
  var availble_len = this.ipQueue[ip].length;
  var busy_len = this.busyIpQueue[ip].length;

//   console.info(availble_len);
//   console.info(busy_len);

  if (availble_len + busy_len < this._min_conn) {
    // console.log("<MIN");
    // 把链接数提升到最小值后在重新的添加一些
    this.addNSocket(socketInfo, this._min_conn - (availble_len + busy_len));
    // this._min_conn-（availble_len+busy_len） creat socket
    return this.gain(socketInfo);
  } else if (availble_len > 0) {
    let socket = this.ipQueue[ip].shift();
    if (socket.isConnect === false) {
      // 获取到的链接已经丢失
      if (socket.isInit) {
        // 初次建立初始化
        return socket
          .build()
          .then((rs) => {
            this.ipQueue[ip].push(rs);
            return this.gain(socketInfo);
          })
          .catch((err) => {
            // console.log(err);
            // 链接失败怎么处理
            this.clearSocket(socket);
            cb("connect fail", null);
          });
      } else {
        // 关闭链接
        this.clearSocket(socket);
      }
      // 重新获取
      return this.gain(socketInfo);
    }
    // 加入数据到 busy中
    // console.info("获取到了消费者");
    this.busyIpQueue[ip].push(socket);
    // console.log(socket.invoke);
    cb(null, socket);
  } else if (busy_len < this._max_conn) {
    console.log(">MIN < MAX");
    // 链接不够添加一个链接
    this.addNSocket(socketInfo, 1);
    // create Socket +1
    // 重新分配
    return this.gain(socketInfo);
  } else {
    // console.log("ALL USED!");
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
  //   console.log(num);
  var tmp = [];
  for (var i = 0; i < num; i++) {
    var socket = new this.createSocket(socketInfo);
    tmp.push(socket);
    //   console.log("创建了数据");
    //   console.log(socket.invoke);
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
Dispatcher.prototype.clearSocket = function (socket) {
  let ip = socket.socketIp;
  if (this.ipQueue.hasOwnProperty(ip)) {
    this.remove(this.ipQueue[ip], socket);
  }
  if (this.busyIpQueue.hasOwnProperty(ip)) {
    this.remove(this.busyIpQueue[ip], socket);
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
  if (this.waitIpTask.hasOwnProperty[ip] && this.waitIpTask[ip].length > 0) {
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
