/* eslint-disable import/no-dynamic-require */
/**
 * 创建
 */
const Inquirer = require('inquirer');
let downloadGitRepo = require('download-git-repo');
const { promisify } = require('util');
let ncp = require('ncp');
const path = require('path');
const MetalSmith = require('metalsmith');
const { render } = require('consolidate').ejs;
const fs = require('fs');
const fsExtra = require('fs-extra');
const chalk = require('chalk');

const { getReposList, getTagsList } = require('../api');
const { loading } = require('../utils');
const { cacheDir, ORGANIZATION, compileReg } = require('../constants');

downloadGitRepo = promisify(downloadGitRepo);
ncp = promisify(ncp);

/**
 * 下载模板
 * @param {string} repo 模板名称
 * @param {string} tag tag
 * @return {string} 模板下载路径
 */
const downTemplate = async (repo, tag) => {
  let api = `${ORGANIZATION}/${repo}`;
  // eslint-disable-next-line no-unused-expressions
  tag && (api += `#${tag}`);
  const dest = `${cacheDir}/${repo}_${tag}`;
  await downloadGitRepo(api, dest);
  return dest;
};

module.exports = async function (...args) {
  const [projectName, ...options] = args;

  // 不要创建
  let notCreated = false;

  const forces = ['-f', '--force'];
  // 判断目录是否已经存在
  if (fs.existsSync(path.resolve(projectName))) {
    // 说明需要强制创建
    if (forces.some((item) => options.includes(item))) {
      fsExtra.removeSync(path.resolve(projectName));
    } else {
      const { force } = await Inquirer.prompt([
        {
          name: 'force',
          type: 'input',
          message: 'The directory already exists. Whether to create it forcibly? (yes/no)',
        },
      ]);
      // eslint-disable-next-line no-unused-expressions
      (force !== 'yes' && force !== 'y') && (notCreated = true);
    }
  }

  if (notCreated) {
    return;
  }
  fsExtra.removeSync(path.resolve(projectName));
  // 获取模板列表
  let repos = await loading(getReposList, 'fetching template ...')();
  repos = repos.map((item) => item.name);
  // 让用户选择模板
  const { repo } = await Inquirer.prompt([
    {
      name: 'repo',
      type: 'list',
      message: 'Please select template',
      choices: repos,
    },
  ]);

  let tags = await loading(getTagsList, 'fetching tag ...')(repo);
  tags = tags.map((tag) => tag.name);
  // 让用户选择tag
  const { tag } = await Inquirer.prompt([
    {
      name: 'tag',
      type: 'list',
      message: 'Please select tag',
      choices: tags,
    },
  ]);

  // 下载模板
  const dest = await loading(downTemplate, 'Downloading template ...')(repo, tag);

  try {
    // 判断模板是否需要编译   如果下载的模板中存在ask.js就认为是需要编译的
    if (!fs.existsSync(path.join(dest, 'ask.js'))) {
      await ncp(dest, path.resolve(projectName));
    } else {
      await new Promise((resolve, reject) => {
        MetalSmith(__dirname)
          .source(dest) // 文件来源
          .destination(path.resolve(projectName)) // 拷贝到哪里
          .use(async (files, metal, done) => {
            // eslint-disable-next-line import/no-dynamic-require
            // eslint-disable-next-line global-require
            const ask = require(path.join(dest, 'ask.js'));
            const obj = await Inquirer.prompt(ask);
            // 通过 metal.metadata 把参数传递到下一个 use 的metal
            const meta = metal.metadata();
            Object.assign(meta, obj);
            delete files['ask.js'];
            done();
          })
          .use((files, metal) => {
            const ask = metal.metadata();
            // 需要编译的文件类型
            const exts = ['.js', '.json', '.jsx', '.ejs'];
            Object.keys(files).forEach(async (file) => {
              // 如果文件是需要编译的类型
              if (exts.some((ext) => file.includes(ext))) {
                // content默认是 Buffer
                let content = files[file].contents.toString();
                // 有需要编译的字段才编译
                if (compileReg.test(content)) {
                  content = await render(content, ask);
                  files[file].contents = Buffer.from(content);
                }
              }
            });
          })
          .build((error) => {
            if (error) {
              reject(error);
            } else {
              resolve();
            }
          });
      });
    }
    console.log(`\r\n${chalk.green('Success')}\r\n`);
    console.log(` ${chalk.cyan(`$  cd ${projectName}`)}`);
    console.log(` ${chalk.cyan('$  npm install')}`);
  } catch (error) {
    console.log(`\r\n${chalk.red('Error')}\r\n`);
    console.log(error);
  }
};
