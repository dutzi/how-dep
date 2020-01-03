import ts from 'typescript';

export interface IImportCounts {
  [key: string]: number | undefined;
}

export interface IImportLine {
  filePath: string;
  position: ts.LineAndCharacter;
  line: string;
  libName: string;
}
