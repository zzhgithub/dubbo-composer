/**
 * 负载均衡器
 */

const Random = "random";
const Robin = "robin";

class Balancer {
  constructor(opt) {
    // dubbo 数据银行
    this.bank = opt.bank;
    this.mode = opt.mode;
    // 轮询游标
    this.probe = 0;
  }

  /**
   * 获取到资源
   * @param {String} serviceName
   * @param {any} callback
   * 回调函数(err,{ip,port})=>{...}
   *
   */
  pick(serviceName, callback) {
    if (
      this.bank.serviceMap.hasOwnProperty(serviceName) &&
      this.bank.serviceMap[serviceName].lenght > 0
    ) {
      var list = this.bank.serviceMap[serviceName];
      var index = 0;
      switch (this.mode) {
        case Random:
          index = this.random_number(list.lenght - 1);
          break;
        default:
          index = this.robin(list.lenght - 1);
      }
      var provider = list[index];
      var ip = provider.ip;
      var port = provider.port;
      // 找到数据进行回调
      callback(null, { ip, port });
    } else {
      callback(`Can't find service:${serviceName} provicder`, null);
    }
  }

  /**
   * 范围随机数
   * @param {*} max
   */
  random_number(max) {
    var min = 0;
    var range = max - min;
    var rand = Math.random();
    var num = min + Math.round(rand * range);
    return num;
  }

  /**
   * 轮询
   * @param {Number} max
   */
  robin(max) {
    if (this.probe > max) {
      this.probe = 0;
    }
    var now = this.probe;
    this.probe++;
    return now;
  }
}

module.exports = { Balancer };
