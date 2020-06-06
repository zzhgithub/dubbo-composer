const jsonToJavaJson = function (java, data) {
  if (java.hasOwnProperty("$")) {
    // java.$ 是map 遍历key 如果是list 遍历List
    var test = Object.prototype.toString.call(java.$);
    switch (test) {
      case "[object Object]":
        for (var a in java.$) {
          java.$[a] = jsonToJavaJson(java.$[a], data[a]);
        }
        break;
      case "[object Array]":
        var list = [];
        const tmpJava = java.$.shift();
        for (var tmp of data) {
          list.push(jsonToJavaJson(tmpJava, tmp));
        }
        console.log(JSON.stringify(list));
        java.$ = list;
        break;
      default:
        console.error("这里应该是错误的");
    }
  } else {
    java["$"] = data;
  }
  return java;
};

module.exports = { jsonToJavaJson };
