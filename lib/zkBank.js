/**
 * 管理zk中的节点信息
 * 获取全部节点信息
 * // 扫描节点
 * // 断开自动重连机制
 *
 * 监听节点
 * // 服务节点的信息
 * // 在节点改变的时候刷新表 和重新监听
 * // 缓存服务的节点信息
 *
 * // consumer注册功能
 * // 删除注册
 */

const EventEmitter = require("events");
const zookeeper = require("node-zookeeper-client");
const Config = require("./config");
const url = require("url");
const qs = require("querystring");

/**
 * 获取个管理dubbo原始数据
 */
class ZkBank extends EventEmitter {
  /**
   * 构造方法
   * @param {*} config 配置项
   */
  constructor(config) {
    super();
    if (!(config instanceof Config)) {
      Config.load(config);
    } else {
      console.error("请使用正确的配置");
      return;
    }
    this.app_name = Config.getAppName();
    this.root = Config.getDubboRoot();
    this.dver = Config.getDudbboVerion();
    this.zk_addr = Config.getZkAdrress();

    /**
     * zk 链接器
     */
    this.zkClient = null;
    this.zkIsConnect = false;

    // 服务列表
    this.serviceList = [];
    // 服务详情表
    this.serviceMap = {};

    this.initZkClient();
  }

  /**
   * 初始化ZK链接
   */
  initZkClient() {
    this.zkClient = zookeeper.createClient(this.zk_addr, {
      sessionTimeout: 30000,
      spinDelay: 1000,
      retries: 5,
    });

    this.zkClient.connect();
    //checkConnect
    this.checkConnect();
  }

  checkConnect() {
    const err = `FATAL: It seems that zookeeper cannot be connected, please check registry address or try later.`;
    this.zkConnectTimeout = setTimeout(() => {
      !this.zkIsConnect && print.err(err);
      clearTimeout(this.zkConnectTimeout);
    }, 10000);
  }

  onConnected() {
    this.zkIsConnect = true;
    // 更新 服务列表
    // 更新 服务详情列表
    this.listService();
  }

  listService() {
    const path = `/${this.root}`;
    this.zkClient.getChildren(
      path,
      this.eventServiceList.bind(this),
      (error, children, stat) => {
        if (error) {
          print.err(error);
          return;
        }
        if (children && !children.length) {
          const errMsg = `WARNING: Can\'t find the service: ${path}, please check!`;
          print.warn(errMsg);
          return;
        }
        let size = children.length;
        var newServiceList = [];
        for (let i = 0; i < size; i++) {
          //匹配包名 至少有一个.的 哈哈！
          if (
            /[a-zA-Z]+[0-9a-zA-Z_]*(\.[a-zA-Z]+[0-9a-zA-Z_]*)+/.test(
              children[i]
            )
          ) {
            newServiceList.push(children[i]);
          }
        }
        this.onChangeServiceList(newServiceList);
      }
    );
  }

  eventServiceList(event) {
    this.listService();
    this.emit("service:changed", event);
  }

  /**
   * 变更老数组
   * 原来有的不用管
   * 如果 存在新的才进行更
   * @param {Array} newList
   */
  onChangeServiceList(newList) {
    // 三种情况
    // newList 有 oldList 也有。不用管
    // newList 有 oldList 没有。 添加到oldList中 并且 调用 listServiceProviders
    // newList 没有 oldList 有。 在oldList中删除 就可以了。（这个服务如果关闭了 在zk会还存在但是provider情况这里和下面的逻辑重复了）
    for (old in this.serviceList) {
      if (newList.indexOf(old) === -1) {
        // 老的有新的没有 删除就可以了
        this.remove(this.serviceList, old);
      }
    }
    for (newService in newList) {
      if (this.serviceList.indexOf(newService) === -1) {
        // 老的没有 新的有
        this.newService.push(newService);
        // 去更新服务提供者？？
        this.listServiceProviders(newService);
      }
    }
  }

  //删除数据
  remove(arr, data) {
    const index = arr.indexOf(data);
    if (index !== -1) {
      arr.splice(index, 1);
    }
  }

  /**
   * 处理服务提供这者 变更
   */
  eventServiceListProviders(serviceName) {
    return (event) => {
      this.listServiceProviders(serviceName);
      this.emit("provider:changed", event);
    };
  }

  // 更新服务提供者数据
  listServiceProviders(serviceName) {
    const path = `/${this.root}/${serviceName}/providers`;
    this.zkClient.getChildren(
      path,
      this.eventServiceListProviders(serviceName).bind(this),
      (error, children, stat) => {
        if (error) {
          print.err(error);
          return;
        }
        if (children && !children.length) {
          const errMsg = `WARNING: Can\'t find the service: ${path}, please check!`;
          print.warn(errMsg);
          return;
        }
        let size = children.length;
        var providers = [];
        for (var i = 0; i < size; i++) {
          const provider = url.parse(decodeURIComponent(children[i]));
          const queryObj = qs.parse(provider.query);
          const hostname = provider.hostname;
          const port = provider.port;
          const version = queryObj.version;
          const group = queryObj.group;
          providers.push({
            key: `${hostname}:${port}`,
            hostname,
            port,
            version, //这个值现在用得到吗？
            group,
          });
        }
        this.onProviderChanged(serviceName, providers);
      }
    );
  }

  /**
   * 更新服务的服务列表
   * FIXME:
   * 服务在更新在了同一个ip的不同的端口时 不能正常删除服务
   *
   * @param {String} serviceName 服务名称
   * @param {Aarry} newProviderList 新的服务提供者列表
   */
  onProviderChanged(serviceName, newProviderList) {
    // 三种情况
    // 原来有 现在没有的 ip 删除在 provider中的数据。删除调度器中 ip下的链接queue 更新wait队列中的任务的ip和端口号
    // 原来没 有现在有的 ip 添加在 provoder中就可以了 （这样 在负载均衡器中就可以 被找到了）
    // 原来也有现在也有 不用管
    // todo
  }
}

module.exports = { ZkBank };
