/**
 * 工具函数
 */
const ora = require('ora');

/**
 * 异步函数 添加loading效果
 * @param {*} fn 执行函数
 * @param {*} message loading message
 * @returns {Function} callback function
 */
const loading = (fn, message) => async (...args) => {
  let res;
  const spinner = ora(message);
  spinner.start();
  try {
    res = await fn(...args);
    spinner.succeed();
  } catch (error) {
    spinner.fail();
    console.log(error);
  }
  return res;
};

module.exports = { loading };
