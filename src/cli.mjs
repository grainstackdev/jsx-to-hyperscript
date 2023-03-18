#!/usr/bin/env node

import fs from 'fs'
import glob from "glob";
import minimist from "minimist";
import jsxConvert from './index.mjs'
import prettier from 'prettier'
import {execSync} from 'child_process'

const args = minimist(process.argv.slice(2))
const pattern = args._[0]
const writeFlag = args.write
const factory = args.factory || "h"
const flow = args.flow

glob(pattern, {}, async (err, files) => {
  for (const file of files) {
    console.log("convert", file)
    let str = fs.readFileSync(file, { encoding: "utf8" })
    // const standard = prettier.format(str, {})

    if (flow) {
      str = execSync(`npx flow-remove-types ${file}`).toString()
    }

    str = prettier.format(str, {parser: 'typescript'})

    const out = jsxConvert(str, {
      factory
    })

    if (writeFlag) {
      fs.writeFileSync(file, out, "utf8")
    } else {
      console.log(out)
    }
  }
})