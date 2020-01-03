#!/usr/bin/env node

import { tsquery } from '@phenomnomnominal/tsquery';
import yargs from 'yargs';
import chalk from 'chalk';
import path from 'path';
import createProgram from './create-program';
import createHTMLReport from './render-html';
import { IImportCounts, IImportLine } from './types';
import openurl from 'openurl';
import log from './log';
// import('chalk');
// import Pie from 'cli-pie';

// import(
//   /*a asdas djkasdnfkasjndfasdf*/
//   'path'
// ).then(res => console.log('wtf'));

function isNodeModule(libName: string) {
  return !libName.startsWith('/') && !libName.startsWith('.');
}

function getAbsolutePath(
  libName: string,
  filePath: string,
  mergeSimilar: boolean
) {
  if (!isNodeModule(libName)) {
    const fileDirectoryPath = filePath
      .split('/')
      .slice(0, -1)
      .join('/');
    return path.join(fileDirectoryPath, libName);
  } else {
    if (mergeSimilar) {
      const splitLibName = libName.split('/');
      if (libName.startsWith('@')) {
        return splitLibName[0] + '/' + splitLibName[1];
      } else {
        return splitLibName[0];
      }
    } else {
      return libName;
    }
  }
}

function createLogger() {
  const logs: any[][] = [];
  return {
    log: (...args: any[]) => {
      logs.push(args);
    },
    flush: () => {
      logs.forEach(args => log(...args));
    },
  };
}

function createImportsManager() {
  const counts: IImportCounts = {};
  const lines: IImportLine[] = [];

  return {
    increaseCount(libname: string) {
      counts[libname] = counts[libname] ?? 0;
      counts[libname]++;
    },
    addLine(lineData: IImportLine) {
      lines.push(lineData);
    },
    counts,
    lines,
  };
}

async function main() {
  const yargsObject = yargs
    .usage('Usage: $0 [options]')
    .option('libName', {
      alias: 'l',
      type: 'string',
      desc:
        'The name of the library you want to count (supports regular expressions)',
      default: '/.*/',
    })
    .option('tsconfig-path', {
      alias: 't',
      type: 'string',
      desc: 'A path to a tsconfig.json file',
      default: './tsconfig.json',
    })
    .option('all', {
      alias: 'a',
      type: 'boolean',
      desc:
        'If set to true, includes all imports (not just 3rd party libraries)',
      default: false,
    })
    .option('full-report', {
      alias: 'f',
      type: 'boolean',
      desc: 'If set to true, will print all import occurrences',
      default: false,
    })
    .option('html', {
      alias: 'h',
      type: 'boolean',
      desc: 'If set to true, will generate an HTML report',
      default: false,
    })
    .option('merge-similar', {
      alias: 'm',
      type: 'boolean',
      desc:
        'If set to false, will treat imports of files within a 3rd party package as a different module (i.e., `lodash` and `lodash/fp` will be counted separately)',
      default: true,
    });

  const argv = yargsObject.argv;

  const tsConfigAbsPath = argv['tsconfig-path'].startsWith('/')
    ? argv['tsconfig-path']
    : path.join(process.cwd(), argv['tsconfig-path']);

  log(`Analyzing project ${tsConfigAbsPath}...`);

  const program = createProgram(tsConfigAbsPath);
  const libName = argv.libName;
  const libNameWithQuotes = libName.startsWith('/') ? libName : `"${libName}"`;

  const importsData = createImportsManager();

  program.getRootFileNames().forEach(filePath => {
    const file = program.getSourceFile(filePath);

    const moduleImportNodes = tsquery(
      file,
      `ImportDeclaration > StringLiteral[value=${libNameWithQuotes}]`
    );

    const dynamicImportNodes = tsquery(
      file,
      `CallExpression:has(ImportKeyword) > StringLiteral[value=${libNameWithQuotes}]`
    );

    if (moduleImportNodes.length || dynamicImportNodes.length) {
      const logger = createLogger();
      logger.log(chalk.magenta(filePath));
      let isLoggedImport;

      for (const libNameNode of [...moduleImportNodes, ...dynamicImportNodes]) {
        const libName = libNameNode.getText();
        const libNameNoQuotes = libName.slice(1, -1);
        const position = file.getLineAndCharacterOfPosition(
          libNameNode.getStart()
        );

        const line = libNameNode.parent.getText();

        // increaseCount;

        let output = chalk.green(position.line + 1) + ':';
        output +=
          line.substr(0, position.character) +
          chalk.redBright(libName) +
          line.substr(position.character + libNameNode.getWidth());

        if (argv.all || isNodeModule(libNameNoQuotes)) {
          logger.log(output);
          importsData.increaseCount(
            getAbsolutePath(libNameNoQuotes, filePath, argv['merge-similar'])
          );
          importsData.addLine({
            filePath,
            position: position,
            line,
            libName: libNameNoQuotes,
          });
          isLoggedImport = true;
        }
      }

      // for (const libNameNode of dynamicImportNodes) {
      //   const libName = libNameNode.getText();
      //   const libNameNoQuotes = libName.slice(1, -1);
      //   // const parentPosition = file.getLineAndCharacterOfPosition(
      //   //   libNameNode.parent.getStart()
      //   // );
      //   const position = file.getLineAndCharacterOfPosition(
      //     libNameNode.getStart()
      //   );

      //   // const line = file.getText().split('\n')[position.line];
      //   const line = libNameNode.parent.getText();

      //   let output = chalk.green(position.line + 1) + ':';
      //   output +=
      //     line.substr(0, position.character) +
      //     chalk.redBright(libName) +
      //     line.substr(position.character + libNameNode.getWidth());

      //   if (argv.all || isNodeModule(libNameNoQuotes)) {
      //     logger.log(output);
      //     increaseCount(
      //       importCounts,
      //       getAbsolutePath(libNameNoQuotes, filePath)
      //     );
      //     isLoggedImport = true;
      //   }
      // }
      logger.log('');

      if (isLoggedImport && argv['full-report']) {
        logger.flush();
      }
    }
  });

  // const pieEntries: any[] = [];

  if (!argv.html) {
    Object.entries(importsData.counts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([fileOrLibName, count]) => {
        log(`${chalk.green(count)}\t${fileOrLibName}`);
      });
  } else {
    const htmlReportPath = createHTMLReport(
      importsData.counts,
      importsData.lines,
      tsConfigAbsPath
    );
    openurl.open(htmlReportPath);
  }

  // .slice(0, 5)
  // .forEach(([fileOrLibName, count]) => {
  //   pieEntries.push({
  //     label: (fileOrLibName as string).split('/').pop(),
  //     value: count,
  //     color: [0, 0, 255],
  //   });
  // });

  // var p = new Pie(5, pieEntries, {
  //   legend: true,
  // });

  // // Stringify
  // console.log(p.toString());
}

main();
