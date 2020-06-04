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
          newServiceList.push(children[i]);
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
   * @param {*} newList
   */
  onChangeServiceList(newList) {
    // 三种情况
    // newList 有 oldList 也有。不用管
    // newList 有 oldList 没有。 添加到oldList中 并且 调用 listServiceProviders
    // newList 没有 oldList 有。 在oldList中删除 就可以了。（这个服务如果关闭了 在zk会还存在但是provider情况这里和下面的逻辑重复了）
    
    newList;
  }

  //删除数据
  remove(arr, data) {
    const index = arr.indexOf(data);
    if (index !== -1) {
      arr.splice(index, 1);
    }
  }

  // 更新服务提供者数据
  listServiceProviders(serviceName) {
    // todo
  }

  //
}

module.exports = { ZkBank };
