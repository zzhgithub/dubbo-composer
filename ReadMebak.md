# dubbo-composer

thanks to @panzhichao.
and fix some bug! base on long connect.

# lib

- decode.js dubbo 协议解码器
- encode.js dubbo 协议编码器
- socket.js 建立链接
- dispatcher.js 链接调度器。使用 ip 进行调度管理
- balancer.js 负载均衡器 两种模式（随机和轮询）
- zkBank.js zk 链接池。

# 测试

- test.js 使用 dubbo 源数据进行调用的测试(没有使用 zk 和管理)
- test2.js 使用 zk 获取到 服务的地址信息

# Need Fixed!

- 在调度器中 只识别了 ip 没有使用 ip+port 的方法！！
- 在变更的时候没有。刷新调度器的资源

# 服务代理

- 服务 class->方法
- ====>（!!! 代理服务的行为 !!!）
- =====> 方法数据生成调用的 metaData
- ====> 负载均衡器 获取到 ip 和 port
- ===> 调度器去申请到 socket 链接
- ====>socket 完成链接，和请求。

# 使用示例 todo

./service/userService.js

```js
const UserService = {
  name: "com.startlink.user.api.UserService",
  group: "",
  version: "0.0.1",
};
module.exports = { UserService };
```

```js
const { UserService } = require("./service/userService");
const DubboComposer = require("dubbo-composer");
var config = {
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
};

const dubbo = new DubboComposer(config);
// 上面这个对象可以导出到公共位置 使用单例模式


var req = {
  $class: "com.dto.ExampleDto",
  $: {
    name: { $class: "com.lang.String", $: "test" },
  },
};

dubbo
  .proxy(UserService).register(req)
  .then((result) => {
    //... deal with result
  })
  .catch((err) => {
    //Oh!
  });
```
