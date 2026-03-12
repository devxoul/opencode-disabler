import { readFileSync, writeFileSync } from 'node:fs'

const pkgPath = 'package.json'
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))

pkg.main = pkg.main.replace(/^src\//, 'dist/src/').replace(/\.ts$/, '.js')

writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`)
console.log(`Rewrote main path for publish: ${pkg.main}`)
