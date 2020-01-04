<img title="How-Dep" src="/logo.png" width="380">

how-dep is a command line tool that analyzes your TypeScript<sup>1</sup> project and tells you which libraries you are most dependent on.

# Install

```sh
$ yarn global add how-dep
# or npm install -g how-dep
```

# Usage

```sh
$ how-dep
97  react         # react is imported 97 times
55  react-i18next # react-i18next is imported 55 times
47  classnames    # etc...
...
```

By default, how-dep will try to find a tsconfig.json file within the current directory, it will then load the project and analyze each file, looking for import statements. It will count how many times each module (3rd party or a local file) is imported and will output a nice report.

## Flags

### --lib-name, -l

Looking for a single library? Use this flag, passing the library's name (supports regular expressions) [default: `"/.*/"`]

```sh
$ how-dep -l lodash
# or
$ how-dep -l /lodash.*/ # will also catch lodash.get imports (and similar)
```

### --tsconfig-path, -t

A path to a tsconfig.json file [default: `"./tsconfig.json"`]

```sh
$ how-dep -t ../../tsconfig.json
```

### --all, -a

If set to true, will includes all imports (not just 3rd party libraries) [default: `false`]

```sh
$ how-dep -a
97  react                               # node module
55  react-i18next                       # node module
48  /example/src/hooks/use-current-user # local app module!
...
```

### --full-report, -f

If set to true, will first print out a report of all import occurrences [default: `false`]

```sh
$ how-dep -f -l classnames
/example/src/App.tsx                        # file path
2:import cx from 'classnames';              # import statement within that file

/example/src/components/AvatarWall/index.js # another file path
3:import cx from 'classnames';              # import statement within that file
...
```

### --html, -h

If set to true, will generate an HTML report ([example](https://dutzi.github.io/how-dep/example-report)) [default: `false`]

```sh
$ how-dep -h
```

### --merge-similar, -m

If set to false, will treat imports of files within a 3rd party package as a different module (i.e., `lodash` and `lodash/fp` will be counted separately) [default: `true`]

```sh
$ how-dep -m
```

## Developing

Clone, run `yarn` to install dependencies, then `yarn link` to have the `how-dep` "binary" linked globally, then:

```sh
$ yarn start
```

Then, after making changes to the code, test them by running `how-dep` in any one of your projects.

<sup>1</sup> - Could run on plain javascript projects as well, as long as you provide a tsconfig.json file
