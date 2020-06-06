# dubbo-composer

[English](ReadMe.md)
可能是目前最好用的 node 调用 dubbo 方案之一。

##

- 仅仅支持 zookeeper 做注册中心
- 仅仅支持 dubbo 协议

## 优势

- 实现基于 ip:port 的 socket 调度方式。最大限度的使用长链接
- 极度简化服务配置
- 动态变更 provider 信息。尽量保证调度器正常运作。
- 随机和轮询的负载均衡算法

## 使用方法

接口定义文档
./service/userService.js

```js
const UserService = {
  name: "com.startlink.user.api.UserService",
  group: "",
  version: "0.0.1",
  paramsType: [
    {
      $class: "com.startlink.user.dto.RegisterUserRequestDto",
      $: {
        userName: { $class: "java.lang.String" },
        password: { $class: "java.lang.String" },
      },
    },
  ],
};
module.exports = { UserService };
```
> paramsType 兼容0.0.2版本。如果你不配置这个选项，在后面的调用中写全java风格的对象就可以了。

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
  userName: "zzhgithub",
  password: "Best of Dubbo-Node",
};

dubbo
  .proxy(UserService)
  .register(req)
  .then((result) => {
    //... deal with result
  })
  .catch((err) => {
    // Oh!
  });
```

## 已知不足

- ~~入参格式没有简化~~
- 暂时没有支持 api 生成接口的方案
- 接口没有良好代码提示

## TODO

- 暴露更多内部配置项
- api 生成 node 文件方案支持
- 支持 dubbo 附件

# changeLog

- 0.0.1 基本功能
- 0.0.2 提供文档
- 0.0.3 注册 comsumer 到注册中心, 使用预定义的数据类型进行转化

## 感谢

感谢 [node-zookeeper-dubbo](https://www.npmjs.com/package/node-zookeeper-dubbo) 这个项目和他的作者。

这个项目的部分功能由这个项目的思路而来。
