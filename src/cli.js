import fs from 'fs'
import glob from "glob";
import minimist from "minimist";
import parseJsx from './index.mjs'

const args = minimist(process.argv.slice(2))
const pattern = args._[0]
const writeFlag = args.write
const factory = args.factory || "h"

glob(pattern, {}, async (err, files) => {
  for (const file of files) {
    console.log("convert", file)
    let str = fs.readFileSync(file, { encoding: "utf8" })
    // const standard = prettier.format(str, {})

    const out = parseJsx(str, {
      factory
    })

    if (writeFlag) {
      fs.writeFileSync(file, out, "utf8")
    } else {
      console.log(out)
    }
  }
})