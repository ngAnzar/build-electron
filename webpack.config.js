import path from "path"
import url from "url"

import webpack from "webpack"
import HtmlWebpackPlugin from "html-webpack-plugin"

import { config, options } from "@anzar/build"


options.setAll({
    __PLATFORM__: "electron",
    FEAT_CSS_VARIABLES: true
})


let __DEV_SERVER__ = null

export default config.multi("@anzar/build", {
    renderer: {
        target: "electron-renderer",
        node: {
            __dirname: false
        }
    },

    main: {
        target: "electron-main",
        node: {
            __dirname: false
        }
    }
}).ifMode("development", {
    renderer: {
        devServer: {
            contentBase: path.join(options.package_path, "dist", "[__MODE__]"),
            port: 4201,
            hot: options.hot,
            historyApiFallback: true,
            // clientLogLevel: "error",
            // stats: "errors-only"
        },

        plugins: [
            new webpack.HotModuleReplacementPlugin(),
            // new webpack.NamedModulesPlugin(),
            new HtmlWebpackPlugin({
                chunksSortMode: "dependency",
                inject: false,
                template: path.join(__dirname, "index.pug")
            })
        ]
    }
}).define((defs, cfg, key) => {
    if (key === "renderer") {
        if (cfg.devServer) {
            let dvs = cfg.devServer
            __DEV_SERVER__ = url.format({
                protocol: dvs.https ? "https" : "http",
                hostname: dvs.host ? dvs.host : "localhost",
                port: dvs.port
            })
        } else {
            __DEV_SERVER__ = null
        }
    }

    defs.set("__DEV_SERVER__", () => {
        if (options.isServing) {
            return __DEV_SERVER__
        } else {
            return null
        }
    })
})
