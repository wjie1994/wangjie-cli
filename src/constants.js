// 常量

// 组织名
const ORGANIZATION = 'wangjie-cli';

// 获取版本号
const { version } = require('../package.json');

/**
 * 获取缓存模板的目录
 * process.platform  darwin: mac;  win32:window
 */
const cacheDir = `${process.env[process.platform === 'darwin' ? 'HOME' : 'USERPROFILE']}/.template`;

// 是否是需要编译的字段   <% xxx %>
const compileReg = /<%=(.)+%>/;

module.exports = {
  version,
  ORGANIZATION,
  cacheDir,
  compileReg,
};
