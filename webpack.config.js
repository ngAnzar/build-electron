import path from "path"
import url from "url"

import webpack from "webpack"
import HtmlWebpackPlugin from "html-webpack-plugin"

import { config, options } from "@anzar/build"


options.setAll({
    __PLATFORM__: "electron",
    FEAT_CSS_VARIABLES: true
})


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
            clientLogLevel: "error",
            stats: "errors-only"
        },

        plugins: [
            new webpack.HotModuleReplacementPlugin(),
            new webpack.NamedModulesPlugin(),
            new HtmlWebpackPlugin({
                chunksSortMode: "dependency",
                inject: false,
                template: path.join(__dirname, "index.pug")
            })
        ]
    }
}).define((defs, cfg, key) => {
    if (key === "renderer") {
        defs.set("__DEV_SERVER__", () => {
            if (options.isServing && cfg.devServer) {
                let dvs = cfg.devServer
                return url.format({
                    protocol: dvs.https ? "https" : "http",
                    host: dvs.host ? dvs.host : "localhost",
                    port: dvs.port
                })
            } else {
                return null
            }
        })
    }
})
