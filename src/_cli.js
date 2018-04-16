import path from "path"
import net from "net"
import { spawn } from "child_process"
import cancellation from "cancellation"

require("@anzar/build/src/cli/init")

const args = require("minimist")(process.argv.slice(2))

if (~args._.indexOf("serve")) {
    serve()
} else if (~args._.indexOf("build")) {
    build()
}

const config = require(process.env.anzar_config_path).default
const electronMain = config.get("main").entry.main

function serve() {
    let cancel = cancellation()

    require("async-exit-hook")(() => {
        cancel.cancel()
    })

    Promise.all([
        startBuild(cancel, ["serve", "--watch", "--hot", "--config", process.env.anzar_config_path])
            .catch(() => cancel.cancel()),
        waitDevServer(cancel, "localhost", 4201)
            .then(() => startElectron(cancel, [electronMain]))
            .catch(() => cancel.cancel())
    ])
}


function build() {

}


function start(cancel, program, args, init) {
    return new Promise((resolve, reject) => {
        let proc = spawn(program, args, {
            stdio: "inherit"
        })

        init(proc, resolve, reject)

        cancel.token.onCancelled(() => {
            proc.kill("SIGINT")
            resolve()
        })
    })
}


function startElectron(cancel, args) {
    return start(cancel, require("electron").toString(), args, (proc, resolve, reject) => {
        proc.on("close", (code) => {
            if (code === 100) {
                setImmediate(() => {
                    startElectron(args)
                })
            } else {
                reject(code)
                cancel.cancel()
            }
        })
    })
}


function startBuild(cancel, args) {
    var pkg = require("@anzar/build/package.json")
    var cli = pkg.bin["anzar-build"]
    args = [
        ...[require.resolve(path.join("@anzar/build", cli))],
        ...args
    ]

    return start(cancel, "node", args, (proc, resolve, reject) => {
        proc.on("close", (code) => {
            if (code === 0) {
                resolve()
            } else {
                reject(code)
            }
        })
    })
}


function waitDevServer(cancel, host, port) {
    return new Promise((resolve, reject) => {
        if (cancel.token.isCancelled()) {
            reject()
            return
        }

        const client = net.createConnection({ host, port }, () => {
            client.write("GET / HTTP/1.1\n\n")
        })

        client.on("data", (data) => {
            if (/HTTP.*?200\s+OK/.test(data)) {
                resolve()
            } else {
                waitDevServer(cancel, host, port).then(resolve, reject)
            }
            client.end()

        })

        client.on("error", () => {
            setTimeout(() => {
                waitDevServer(cancel, host, port).then(resolve, reject)
            }, 1000)
        })
    })
}
