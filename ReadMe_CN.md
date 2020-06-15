# dubbo-composer

[English](ReadMe.md)
可能是目前最好用的 node 调用 dubbo 方案之一。

## 局限

- 仅仅支持 zookeeper 做注册中心
- 仅仅支持 dubbo 协议
- 不要使用dubbo多版本，以后会支持

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
  mehods:{
    "register":{
      paramsType:[
          {
          $class: "com.startlink.user.dto.RegisterUserRequestDto",
          $: {
              userName: { $class: "java.lang.String" },
              password: { $class: "java.lang.String" },
            },
          },
        ],
      },
  }
  // paramsType: [

  // ],
};
module.exports = { UserService };
```

> paramsType 0.0.3 兼容 0.0.2 版本。如果你不配置这个选项，在后面的调用中写全 java 风格的对象就可以了。

> paramsType 0.1.0 不兼容 0.0.2 版本的接口定义方式。methods被单独提出来 建议使用api生成工具来优雅处理定义。

### 幸运的是自动生成上面接口定义
基于java api的定义可以自动生成。上面的接口定义，方便你引入到项目中开始使用。这个接口定义直到0.1.0版本才开始使用


[dubbo-composer-api-gen](https://www.npmjs.com/package/dubbo-composer-api-gen)



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
- 0.1.0 支持docker-composer-api-gen 自动生成工具的接口调用
- 0.1.1 处理注册版本问题
## 感谢

感谢 [node-zookeeper-dubbo](https://www.npmjs.com/package/node-zookeeper-dubbo) 这个项目和他的作者。
这个项目的部分功能由这个项目的思路而来。

## 求赞
都看到这里了，点击项目给个赞吧！
