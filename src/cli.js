#!/usr/bin/env node

require("babel-register")({
    cache: true,
    ignore: function (filename) {
        const anzar = filename.lastIndexOf("@anzar")
        const node_modules = filename.lastIndexOf("node_modules")

        if (anzar >= 0) {
            if (node_modules < 0) {
                return false
            } else {
                return anzar < node_modules;
            }
        } else {
            return node_modules !== -1
        }
    }
})
require("./_cli.js")