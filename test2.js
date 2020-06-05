/**
 * 测试代码
 */
const { Dispatcher } = require("./lib/dispatcher");
const { Socket } = require("./lib/socket");
const Encode = require("./lib/encode");
const { ZkBank } = require("./lib/zkBank");
const { Balancer } = require("./lib/balancer");

const dispatcher = new Dispatcher();
console.log("test1");
dispatcher.config({
  //注册 链接生成器
  createSocket: Socket,
});

const zkBank = new ZkBank({
  app: {
    name: "test-app",
  },
  zk: {
    addr:
      "zookeeper.1.inter:2181,zookeeper.2.inter:2182,zookeeper.3.inter:2183",
    root: "dubbo",
  },
  dubbo: {
    version: "2.7.6",
    timeout: 5,
  },
});

zkBank.setDispacher(dispatcher);

var balancer = new Balancer({
  bank: zkBank,
  mode: "defualt",
});

var serviceName = "com.startlink.user.api.UserService";

// todo 要等待一段时间吗？

//延迟5秒钟调用
setTimeout(function () {
  balancer.pick(serviceName, (err, ob) => {
    if (err) {
      console.log("err:" + err);
      return;
    }
    console.log(JSON.stringify(ob));
  });
}, 30*1000);
