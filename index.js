const { Dispatcher } = require("./lib/dispatcher");
const { Socket } = require("./lib/socket");
const Encode = require("./lib/encode");
const { ZkBank } = require("./lib/zkBank");
const { Balancer } = require("./lib/balancer");
const proxyMethodMissing = require("proxy-method-missing");
const { jsonToJavaJson } = require("./lib/tools");

const dispatcher = new Dispatcher();
dispatcher.config({
  //注册 链接生成器
  createSocket: Socket,
});

class DubboComposer {
  constructor(config) {
    this.config = config;
    this.zkBank = new ZkBank(config);
    this.zkBank.setDispacher(dispatcher);
    this.balancer = new Balancer({
      bank: this.zkBank,
      mode: "defualt",
    });
    return this;
  }

  /**
   * 代理对象
   * @param {} service
   */
  proxy(service) {
    var name = service.name;
    var version = service.version;
    var group = service.group;

    return new proxyMethodMissing({}, (method, ...args) => {
      return new Promise((resolve, reject) => {
        this.balancer.pick(name, (err, info) => {
          // 注册到comsumer到注册中心
          service.version = info.version;
          this.zkBank.registerComsumer(service);
          
          if (err) {
            reject(err);
          }
          // 处理入参
          // 如果存在 方法入参的定义择进行转换
          if (
            service.hasOwnProperty("methods") &&
            service.methods.hasOwnProperty(method) &&
            service.methods[method].hasOwnProperty("paramsType")
          ) {
            var paramsType = service.methods[method].paramsType;
            if (paramsType.length !== args.length) {
              reject(
                `param is not match need ${paramsType.length}, but find ${args.length}`
              );
            } else {
              args = paramsType.map(function (e, i) {
                return jsonToJavaJson(e, args[i]);
              });
            }
          }
          var metaData = {
            _args: args,
            _dver: this.config.dubbo._version,
            _interface: name,
            // fixme 这里的版本号控制不好
            _version: info.version,
            _method: method,
            _timeout: this.config.dubbo.timeout,
            _group: group,
          };
          var data = new Encode(metaData);
          const attach = { data, resolve, reject };

          dispatcher.gain({
            ip: info.ip,
            port: parseInt(info.port),
            callback: (err, socket) => {
              if (err) {
                return reject(err);
              }
              socket.invoke(attach, (err) => {
                console.log("执行了invoke");
                if (err) {
                  reject(err);
                }
                // 释放资源
                dispatcher.release(socket);
                //链接丢失释放资源
                if (socket.isInit === false && socket.isConnect === false) {
                  //清除链接
                  dispatcher.clearSocket(socket);
                }
              });
            },
          });
        });
      });
    });
  }
}

module.exports = DubboComposer;
