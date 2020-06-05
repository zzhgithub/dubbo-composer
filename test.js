/**
 * 测试代码
 */
const { Dispatcher } = require("./lib/dispatcher");
const { Socket } = require("./lib/socket");
const Encode = require("./lib/encode");

const dispatcher = new Dispatcher();
console.log("test1");
dispatcher.config({
  //注册 链接生成器
  createSocket: Socket,
});

//todo 需要一个代理！！

const args = [
  {
    $class: "com.startlink.user.dto.RegisterUserRequestDto",
    $: {
      userName: { $class: "java.lang.String", $: "周子好" },
      password: { $class: "java.lang.String", $: "zhouzihao" },
    },
  },
];

var metaData = {
  _args: args,
  _dver: "2.7.6",
  _interface: "com.startlink.user.api.UserService",
  _version: "0.0.1",
  _method: "register",
  _timeout: 5 * 1000,
  _group: "",
};

var data = new Encode(metaData);

const test = async function (data) {
  return new Promise((resolve, reject) => {
    const attach = { data, resolve, reject };

    dispatcher.gain({
      ip: "10.0.1.195",
      port: 20880,
      callback: function (err, socket) {
        if (err) {
          return reject(err);
        }
        console.info(socket.isConnect);
        console.info("开始调用invoke");
        // console.info(JSON.stringify(socket));
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
        //
      },
    });
  });
};

// 测试调用
test(data)
  .then((result) => {
    console.log("ok");
    console.info(JSON.stringify(result));
  })
  .catch((err) => {
    console.info("22222");
    console.error(err);
  });
