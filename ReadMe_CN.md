# dubbo-composer

[English](ReadMe.md)
可能是目前最好用的node调用dubbo方案之一。

##
- 仅仅支持zookeeper做注册中心
- 仅仅支持dubbo协议


## 优势
- 实现基于ip:port的socket调度方式。最大限度的使用长链接
- 极度简化服务配置
- 动态变更provider信息。尽量保证调度器正常运作。
- 随机和轮询的负载均衡算法


## 使用方法
接口定义文档
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
    // Oh!
  });
```



## 已知不足
- 入参格式没有简化
- 暂时没有支持api生成接口的方案
- 接口没有良好代码提示


## TODO
- 暴露更多内部配置项
- api生成node文件方案支持
- 支持dubbo附件

# changeLog
- 0.0.1 基本功能
- 0.0.2 提供文档
- 0.0.3 注册comsumer到注册中心, 使用预定义的数据类型进行转化

## 感谢

感谢 [node-zookeeper-dubbo](https://www.npmjs.com/package/node-zookeeper-dubbo) 这个项目和他的作者。

这个项目的部分功能由这个项目的思路而来。
