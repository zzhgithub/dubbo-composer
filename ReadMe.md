# dubbo-composer

 [中文](ReadMe_CN.md)

It may be one of the best node calling dubbo solutions at present.

## Precautions
- Only supports zookeeper as a registration center
- Only supports dubbo protocol
- Do not use multiple versions of dubbo, it will be supported in the future

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
};
module.exports = { UserService };
```

> paramsType is compatible with version 0.0.2. If you do not configure this option, you can write all Java-style objects in subsequent calls.

> paramsType 0.1.0 is not compatible with the interface definition method of version 0.0.2. Methods are proposed separately. It is recommended to use API generation tools to handle definitions elegantly. 


### Fortunately, the above interface definition is automatically generated
The definition based on java api can be automatically generated. The above interface definition is convenient for you to introduce into the project and start using it. This interface definition was not used until version 0.1.0


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
  userName:"周子豪",
  password:"Best of Dubbo-Node"
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
- ~~The input parameter format is not simplified~~
- ~~There is no solution to support API generation interface for the time being~~
- Interface has no good code hints


# changeLog
- 0.0.1 Init (basic function)
- 0.0.2 document support
- 0.0.3 register comsumer to zookeeper, Conversion using predefined data types
- 0.1.0 Support interface call of docker-composer-api-gen automatic generation tool
- 0.1.1 Handling issues with registered versions
- 0.1.2 Fix the problem that the requested data is the same every time


## thanks
Thanks to [node-zookeeper-dubbo](https://www.npmjs.com/package/node-zookeeper-dubbo) for this project and his author.
Part of the function of this project comes from the idea of this project.

## Seeking Like
You all see here, click on the item to give it a thumbs up!