/* eslint-disable global-require */
// 核心入口
const program = require('commander');
const chalk = require('chalk');
const figlet = require('figlet');
const path = require('path');

const { version } = require('./constants');

// 命令行指令集合
const commandList = {
  create: {
    alias: 'c',
    description: 'create a new app',
    option: ['-f, --force', 'overwrite target directory if it exist'],
    examples: ['wangjie-cli create <app-name>'],
  },
  '*': {
    alias: '',
    description: 'command not found',
    option: ['-not found'],
    examples: [''],
  },
};

// 创建命令
Object.keys(commandList).forEach((key) => {
  const {
    alias,
    description,
    option = [],
  } = commandList[key];
  program
    .command(key)
    .alias(alias)
    .description(description)
    .option(...option)
    .action(() => {
      if (key === '*') {
        console.log(description);
      } else {
        const params = process.argv.slice(3);
        // eslint-disable-next-line import/no-dynamic-require
        require(path.resolve(__dirname, `./lib/${key}`))(...params);
      }
    });
});

// 监听 --help 指令  打印logo和示例
program.on('--help', () => {
  console.log('\r\nExamples:');
  Object.keys(commandList).forEach((key) => {
    commandList[key].examples.forEach((example) => {
      console.log(`  ${example}`);
    });
  });

  // 使用 figlet 绘制 Logo
  console.log(`\r\n${figlet.textSync('wangjie', {
    font: 'Ghost',
    horizontalLayout: 'default',
    verticalLayout: 'default',
    width: 80,
    whitespaceBreak: true,
  })}`);

  console.log(`\r\nRun ${chalk.cyan('wangjie-cli <command> --help')} for detailed usage of given command\r\n`);
});

program.version(version);

// 解析命令行传递过来的参数
program.parse(process.argv);
