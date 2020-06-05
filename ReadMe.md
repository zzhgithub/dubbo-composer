# dubbo-composer

thanks to @panzhichao.

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
