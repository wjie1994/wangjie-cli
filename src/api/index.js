const axios = require('axios');
const { ORGANIZATION } = require('../constants');

module.exports = {
  /**
   * 获取模板列表
   * @returns {*}
   */
  async getReposList() {
    const { data } = await axios.get(`https://api.github.com/orgs/${ORGANIZATION}/repos`);
    return data;
  },

  /**
   * 根据模板名称获取tag
   * @returns {*}
   */
  async getTagsList(name) {
    const { data } = await axios.get(`https://api.github.com/repos/${ORGANIZATION}/${name}/tags`);
    return data;
  },
};
