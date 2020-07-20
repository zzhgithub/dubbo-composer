const jsonToJavaJson = function (java, data) {
  let javaClone = Object.assign({}, java);
  if (javaClone.hasOwnProperty("$")) {
    // java.$ 是map 遍历key 如果是list 遍历List
    var test = Object.prototype.toString.call(javaClone.$);
    switch (test) {
      case "[object Object]":
        for (var a in javaClone.$) {
          javaClone.$[a] = jsonToJavaJson(javaClone.$[a], data[a]);
        }
        break;
      case "[object Array]":
        var list = [];
        const tmpJava = javaClone.$.shift();
        for (var tmp of data) {
          list.push(jsonToJavaJson(tmpJava, tmp));
        }
        console.log(JSON.stringify(list));
        javaClone.$ = list;
        break;
      default:
        console.error("这里应该是错误的");
    }
  } else {
    javaClone["$"] = data;
  }
  return javaClone;
};

module.exports = { jsonToJavaJson };
