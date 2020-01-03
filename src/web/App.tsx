import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { IImportCounts, IImportLine } from '../types';
import styled, { css, createGlobalStyle } from 'styled-components';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import Favicon from './Favicon';
import GithubLink from './GithubLink';
// import './styles.css';

const GlobalStyle = createGlobalStyle`
  html {
    background: #cecece;
  }
`;

const Wrapper = styled.div`
  font-family: Helvetica, Arial, sans-serif;
  margin: 5em auto;
  max-width: 660px;
`;

const Panel = styled.div`
  border: 5px solid #000000;
  padding: 1em;
  box-shadow: 0px 0px 20px #00000052;
  background: white;
`;

const Logo = styled.div`
  font-size: 1.9em;
  font-weight: bold;
  margin-bottom: 0.4em;
`;

const LogoGray = styled.span`
  color: #c5c5c5;
`;

const Subtitle = styled.div`
  font-size: 1.3em;
  border-bottom: 4px solid #000000;
  padding-bottom: 0.7em;
  margin-bottom: 1.2em;
`;

const List = styled.div`
  /* display: grid; */
  /* grid-template-columns: auto 1fr; */
  /* align-items: baseline; */
  /* grid-gap: 18px 22px; */
`;

const Count = styled.strong`
  min-width: 70px;
  font-weight: bold;
  /* background: #cccccc;
  padding: 4px 8px;
  border-radius: 30px; */
`;

const Item = styled.a`
  display: flex;
  margin-bottom: 0.6em;
  line-height: 1.5em;
  text-decoration: none;
  color: inherit;

  ${(p: any) =>
    p.selected &&
    css`
      ${Count} span {
        background: #f44336;
        color: white;
        padding: 3px 8px;
        border-radius: 30px;
        margin: -3px -8px;
      }
    `} /* &:visited:not(:focus) {
    color: #aaaaaa;
  } */
`;

const resetButton = css`
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
  padding: 0px;
  background: none;
  border: none;
  text-align: left;
`;

const LibName = styled.div`
  /* ${resetButton} */
  flex: 1;
  min-width: 0px;
  word-break: break-all;
  max-width: 100%;
  flex: 0 1 auto;
  /* background: #cccccc;
  padding: 4px 8px;
  border-radius: 30px; */
`;

// const FixedPanel = styled.div`
//   padding: 5em 1em;
//   position: fixed;
//   top: 0px;
//   left: calc(5em + 660px + 10px);
//   width: calc(100vw - 5em - 660px - 30px);
//   background: none;
//   height: 100vh;
//   box-sizing: border-box;
//   z-index: 0;
//   overflow: scroll;
// `;

// const ImportLine = styled.div`
//   display: grid;
//   grid-template-columns: auto 1fr;
//   margin-top: 2em;

//   &:first-child {
//     margin-top: 0px;
//   }
// `;

// const FilePath = styled.div`
//   grid-column-start: 1;
//   grid-column-end: 3;
//   margin-bottom: 0.3em;
// `;

// const CodeLine = styled.div`
//   font-family: 'Fira Code';
//   display: flex;
//   align-items: baseline;
// `;

// const Number = styled.div`
//   margin-right: 12px;
//   font-size: 0.8em;
// `;

// const Line = styled.div`
//   font-family: monaco;
//   font-size: 0.8em;
// `;

const LineLibName = styled.span`
  color: #e91e63;
`;

function Now() {
  const date = new Date();

  return (
    <span title={date.toDateString() + ' ' + date.toTimeString()}>
      {date.toDateString()}
    </span>
  );
}

function Line({ line }: { line: IImportLine }) {
  return (
    <span>
      <span>{line.line.substr(0, line.position.character)}</span>
      <LineLibName>'{line.libName}'</LineLibName>
      <span>
        {line.line.substr(line.position.character + line.libName.length + 2)}
      </span>
    </span>
  );
}

export default function App({
  importCounts,
  importLines,
  packageName,
}: {
  importCounts: [string, number][];
  importLines: IImportLine[];
  packageName?: string;
}) {
  const [selectedLibName, setSelectedLibName] = useState('');

  useEffect(() => {
    function updateSelectedLibName(scroll?: boolean) {
      const { hash } = window.location;
      setSelectedLibName(hash.substr(1));
      if (scroll) {
        const element = document.querySelector(`[href="${hash}"]`);

        if (element) {
          element.scrollIntoView();
        }
      }
    }

    window.addEventListener('hashchange', () => {
      updateSelectedLibName();
    });

    updateSelectedLibName(true);
  }, []);

  return (
    <Wrapper>
      <Panel>
        <Helmet>
          <title>how-dep - {packageName}</title>
          {/* <link
            rel="stylesheet"
            href="https://cdn.jsdelivr.net/gh/tonsky/FiraCode@1.207/distr/fira_code.css"
          /> */}
        </Helmet>
        <Favicon />
        <GlobalStyle />
        <Logo>
          $ how-dep<LogoGray>endent-am-i?</LogoGray>
        </Logo>
        <Subtitle>
          Report for <strong>{packageName ?? 'unknown'}</strong> generated on{' '}
          <Now />
        </Subtitle>
        <List>
          {importCounts.map(([libName, count]) => (
            <Item
              key={libName}
              href={`#${libName}`}
              selected={selectedLibName === libName}
            >
              <Count>
                <span>{count}</span>
              </Count>
              <LibName>{libName}</LibName>
            </Item>
          ))}
        </List>
      </Panel>
      {/* <FixedPanel>
        {selectedLibName && (
          <div>
            {importLines
              .filter(line => line.libName === selectedLibName)
              .map(line => (
                <ImportLine>
                  <FilePath>{line.filePath}</FilePath>
                  <CodeLine>
                    <Number>{line.position.line + 1}</Number>
                    <Line line={line} />
                  </CodeLine>
                </ImportLine>
              ))}
          </div>
        )}
      </FixedPanel> */}
      <GithubLink />
    </Wrapper>
  );
}

if (process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    ReactDOM.hydrate(
      <HelmetProvider>
        <App
          importCounts={(window as any).__HOW_DEP.importCounts}
          importLines={(window as any).__HOW_DEP.importLines}
          packageName={(window as any).__HOW_DEP.packageName}
        />
      </HelmetProvider>,
      document.body
    );
  });
}
