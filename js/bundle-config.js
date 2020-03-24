"use strict";
/*
  This module is the only place where we make assumptions about Ember's default
  "app" vs "test" bundles.
*/
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const testsPattern = new RegExp(`^/?[^/]+/(tests|test-support)/`);
class BundleConfig {
    constructor(emberApp) {
        this.emberApp = emberApp;
    }
    // This list of valid bundles, in priority order. The first one in the list that
    // needs a given import will end up with that import.
    get names() {
        return Object.freeze(['app', 'tests']);
    }
    // Which final JS file the given bundle's dependencies should go into.
    bundleEntrypoint(name) {
        switch (name) {
            case 'tests':
                return 'assets/test-support.js';
            case 'app':
                return this.emberApp.options.outputPaths.vendor.js.replace(/^\//, '');
        }
    }
    // For any relative path to a module in our application, return which bundle its
    // imports go into.
    bundleForPath(path) {
        if (testsPattern.test(path)) {
            return 'tests';
        }
        else {
            return 'app';
        }
    }
    get lazyChunkPath() {
        return path_1.dirname(this.bundleEntrypoint(this.names[0]));
    }
}
exports.default = BundleConfig;
//# sourceMappingURL=bundle-config.js.map