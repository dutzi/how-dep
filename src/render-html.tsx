import React from 'react';
import ReactDOMServer from 'react-dom/server';
import ReactDOM from 'react-dom';
import { IImportCounts, IImportLine } from './types';
import { ServerStyleSheet } from 'styled-components';
import tempDirectory from 'temp-dir';
import fs from 'fs-extra';
import path from 'path';
import log from './log';
import App from './web/App';
import { Helmet, HelmetProvider } from 'react-helmet-async';

export const helmetContext: any = {};

const sheet = new ServerStyleSheet();

function getPackageName(tsConfigPath: string) {
  try {
    const tsConfigPathWithoutFileName = tsConfigPath
      .split('/')
      .slice(0, -1)
      .join('/');
    const packageJson = require(path.join(
      tsConfigPathWithoutFileName,
      'package.json'
    ));
    log('Found package.json, extracting package name.');
    return packageJson.name as string;
  } catch (err) {}

  return undefined;
}

export default function createHTMLReport(
  importCounts: IImportCounts,
  importLines: IImportLine[],
  tsConfigPath: string
) {
  const packageName = getPackageName(tsConfigPath);

  const importCounterArray = Object.entries(importCounts).sort(
    (a, b) => b[1] - a[1]
  );

  const html = ReactDOMServer.renderToString(
    sheet.collectStyles(
      <HelmetProvider context={helmetContext}>
        <script
          dangerouslySetInnerHTML={{
            __html: fs
              .readFileSync(path.join(__dirname, '/web/bundle.js'))
              .toString(),
          }}
        ></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__HOW_DEP = {
              importCounts: ${JSON.stringify(importCounterArray)},
              importLines: ${JSON.stringify(importLines)},
              packageName: ${JSON.stringify(packageName)}
            }`,
          }}
        ></script>
        <App
          importCounts={importCounterArray}
          importLines={importLines}
          packageName={packageName}
        ></App>
      </HelmetProvider>
    )
  );

  const styleTags = sheet.getStyleTags();
  const { helmet } = helmetContext;

  const output =
    helmet.title.toString() +
    helmet.script.toString() +
    helmet.link.toString() +
    styleTags +
    html;

  const filenameFriendlyDate = new Date()
    .toISOString()
    .replace(/\:|-|T/g, '_')
    .slice(0, -5);

  const outputFilePath = `${tempDirectory}/how-dep-${filenameFriendlyDate}.html`;

  fs.writeFileSync(outputFilePath, output);

  return outputFilePath;
}

// try {
//   ReactDOM.hydrate(<App importCounts={{}} importLines={[]} />, document.querySelector('div'));
// } catch (err) {}
