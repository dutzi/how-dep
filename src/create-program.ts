// blatantly stolen from https://github.com/phenomnomnominal/tsquery/blob/master/src/project.ts
//
import * as fs from 'fs';
import * as path from 'path';
import {
  createCompilerHost,
  createProgram as tsCreateProgram,
  ParseConfigHost,
  parseJsonConfigFileContent,
  Program,
  readConfigFile,
  sys,
} from 'typescript';

export default function createProgram(
  configFilePath: string
): Program | undefined {
  const fullPath = findConfig(configFilePath);
  if (fullPath) {
    return getProgram(fullPath);
  }
  return undefined;
}

function findConfig(configFilePath: string): string | null {
  try {
    const fullPath = path.resolve(process.cwd(), configFilePath);
    // Throws if file does not exist:
    const stats = fs.statSync(fullPath);
    if (!stats.isDirectory()) {
      return fullPath;
    }
    const inDirectoryPath = path.join(fullPath, 'tsconfig.json');
    // Throws if file does not exist:
    fs.accessSync(inDirectoryPath);
    return inDirectoryPath;
  } catch (e) {
    return null;
  }
}

function getProgram(configFilePath: string): Program {
  const config = readConfigFile(configFilePath, sys.readFile);

  const parseConfigHost: ParseConfigHost = {
    fileExists: fs.existsSync,
    readDirectory: sys.readDirectory,
    readFile: file => fs.readFileSync(file, 'utf8'),
    useCaseSensitiveFileNames: true,
  };
  const parsed = parseJsonConfigFileContent(
    config.config,
    parseConfigHost,
    path.dirname(configFilePath),
    { noEmit: true }
  );
  const host = createCompilerHost(parsed.options, true);
  const createdProgram = tsCreateProgram(
    parsed.fileNames,
    parsed.options,
    host
  );

  return createdProgram;
}
