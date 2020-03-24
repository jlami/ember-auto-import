"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const webpack_1 = __importDefault(require("webpack"));
const path_1 = require("path");
const lodash_1 = require("lodash");
const quick_temp_1 = __importDefault(require("quick-temp"));
const fs_1 = require("fs");
const handlebars_1 = require("handlebars");
const js_string_escape_1 = __importDefault(require("js-string-escape"));
handlebars_1.registerHelper('js-string-escape', js_string_escape_1.default);
const entryTemplate = handlebars_1.compile(`
if (typeof document !== 'undefined') {
  {{#if publicAssetURL}}
  __webpack_public_path__ = '{{js-string-escape publicAssetURL}}';
  {{else}}
  {{!
      locate the webpack lazy loaded chunks relative to the currently executing
      script. The last <script> in DOM should be us, assuming that we are being
      synchronously loaded, which is the normal thing to do. If people are doing
      weirder things than that, they may need to explicitly set a publicAssetURL
      instead.
  }}
  __webpack_public_path__ = (function(){
    var scripts = document.querySelectorAll('script');
    return scripts[scripts.length - 1].src.replace(/\\/[^/]*$/, '/');
  })();
  {{/if}}
}

module.exports = (function(){
  var w = window;
  var d = w.define;
  var r = w.require;
  w.emberAutoImportDynamic = function(specifier) {
    return r('_eai_dyn_' + specifier);
  };
  {{#each staticImports as |module|}}
    d('{{js-string-escape module.specifier}}', [], function() { return require('{{js-string-escape module.entrypoint}}'); });
  {{/each}}
  {{#each dynamicImports as |module|}}
    d('_eai_dyn_{{js-string-escape module.specifier}}', [], function() { return import('{{js-string-escape module.entrypoint}}'); });
  {{/each}}
})();
`);
class WebpackBundler {
    constructor(bundles, environment, extraWebpackConfig, consoleWrite, publicAssetURL) {
        this.consoleWrite = consoleWrite;
        this.publicAssetURL = publicAssetURL;
        quick_temp_1.default.makeOrRemake(this, 'stagingDir', 'ember-auto-import-webpack');
        quick_temp_1.default.makeOrRemake(this, 'outputDir', 'ember-auto-import-webpack');
        let entry = {};
        bundles.names.forEach(bundle => (entry[bundle] = path_1.join(this.stagingDir, `${bundle}.js`)));
        let config = {
            mode: environment === 'production' ? 'production' : 'development',
            entry,
            output: {
                path: this.outputDir,
                filename: `chunk.[chunkhash].js`,
                chunkFilename: `chunk.[chunkhash].js`,
                libraryTarget: 'var',
                library: '__ember_auto_import__'
            },
            optimization: {
                splitChunks: {
                    chunks: 'all'
                }
            }
        };
        if (extraWebpackConfig) {
            lodash_1.merge(config, extraWebpackConfig);
        }
        this.webpack = webpack_1.default(config);
    }
    build(bundleDeps) {
        return __awaiter(this, void 0, void 0, function* () {
            for (let [bundle, deps] of bundleDeps.entries()) {
                this.writeEntryFile(bundle, deps);
            }
            let stats = yield this.runWebpack();
            return this.summarizeStats(stats);
        });
    }
    summarizeStats(stats) {
        let output = {
            entrypoints: new Map(),
            lazyAssets: [],
            dir: this.outputDir
        };
        let nonLazyAssets = new Set();
        for (let id of Object.keys(stats.entrypoints)) {
            let entrypoint = stats.entrypoints[id];
            output.entrypoints.set(id, entrypoint.assets);
            entrypoint.assets.forEach(asset => nonLazyAssets.add(asset));
        }
        for (let asset of stats.assets) {
            if (!nonLazyAssets.has(asset.name)) {
                output.lazyAssets.push(asset.name);
            }
        }
        return output;
    }
    writeEntryFile(name, deps) {
        fs_1.writeFileSync(path_1.join(this.stagingDir, `${name}.js`), entryTemplate({
            staticImports: deps.staticImports,
            dynamicImports: deps.dynamicImports,
            publicAssetURL: this.publicAssetURL
        }));
    }
    runWebpack() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.webpack.run((err, stats) => {
                    if (err) {
                        this.consoleWrite(stats.toString());
                        reject(err);
                        return;
                    }
                    if (stats.hasErrors()) {
                        this.consoleWrite(stats.toString());
                        reject(new Error('webpack returned errors to ember-auto-import'));
                        return;
                    }
                    if (stats.hasWarnings() || process.env.AUTO_IMPORT_VERBOSE) {
                        this.consoleWrite(stats.toString());
                    }
                    resolve(stats.toJson());
                });
            });
        });
    }
}
exports.default = WebpackBundler;
//# sourceMappingURL=webpack.js.map