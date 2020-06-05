# dubbo-composer

 [中文](ReadMe_CN.md)

It may be one of the best node calling dubbo solutions at present.

## Precautions
- Only supports zookeeper as a registration center
- Only supports dubbo protocol

## Advantage
- Implement socket scheduling based on ip:port. Use long links to the maximum
- Extremely simplified service configuration
- Dynamically change provider information. Try to ensure the normal operation of the scheduler.
- Random and polling load balancing algorithm

## Usage
Interface definition document

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

## Known deficiency
- The input parameter format is not simplified
- There is no solution to support API generation interface for the time being
- Interface has no good code hints

## thanks
Thanks to [node-zookeeper-dubbo](https://www.npmjs.com/package/node-zookeeper-dubbo) for this project and his author.

Part of the function of this project comes from the idea of this project.
