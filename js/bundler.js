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
const broccoli_plugin_1 = __importDefault(require("broccoli-plugin"));
const debug_1 = __importDefault(require("debug"));
const webpack_1 = __importDefault(require("./webpack"));
const package_1 = require("./package");
const lodash_1 = require("lodash");
const path_1 = require("path");
const fs_extra_1 = require("fs-extra");
const debug = debug_1.default('ember-auto-import:bundler');
class Bundler extends broccoli_plugin_1.default {
    constructor(allAppTree, options) {
        super([allAppTree], { persistentOutput: true });
        this.options = options;
        this.lastDeps = null;
        this.didEnsureDirs = false;
    }
    get publicAssetURL() {
        // Only the app (not an addon) can customize the public asset URL, because
        // it's an app concern.
        let rootPackage = [...this.options.packages.values()].find(pkg => !pkg.isAddon);
        if (rootPackage) {
            let url = rootPackage.publicAssetURL;
            if (url) {
                if (url[url.length - 1] !== '/') {
                    url = url + '/';
                }
                return url;
            }
        }
    }
    get bundlerHook() {
        if (!this.cachedBundlerHook) {
            let extraWebpackConfig = lodash_1.merge({}, ...[...this.options.packages.values()].map(pkg => pkg.webpackConfig));
            debug('extraWebpackConfig %j', extraWebpackConfig);
            this.cachedBundlerHook = new webpack_1.default(this.options.bundles, this.options.environment, extraWebpackConfig, this.options.consoleWrite, this.publicAssetURL);
        }
        return this.cachedBundlerHook;
    }
    build() {
        return __awaiter(this, void 0, void 0, function* () {
            this.ensureDirs();
            package_1.reloadDevPackages();
            let { splitter } = this.options;
            let bundleDeps = yield splitter.deps();
            if (bundleDeps !== this.lastDeps) {
                let buildResult = yield this.bundlerHook.build(bundleDeps);
                this.addEntrypoints(buildResult);
                this.addLazyAssets(buildResult);
                this.lastDeps = bundleDeps;
            }
        });
    }
    ensureDirs() {
        if (this.didEnsureDirs) {
            return;
        }
        fs_extra_1.emptyDirSync(path_1.join(this.outputPath, 'lazy'));
        for (let bundle of this.options.bundles.names) {
            fs_extra_1.emptyDirSync(path_1.join(this.outputPath, 'entrypoints', bundle));
        }
        this.didEnsureDirs = true;
    }
    addEntrypoints({ entrypoints, dir }) {
        for (let bundle of this.options.bundles.names) {
            if (entrypoints.has(bundle)) {
                entrypoints
                    .get(bundle)
                    .forEach(asset => {
                    fs_extra_1.copySync(path_1.join(dir, asset), path_1.join(this.outputPath, 'entrypoints', bundle, asset));
                });
            }
        }
    }
    addLazyAssets({ lazyAssets, dir }) {
        let contents = lazyAssets.map(asset => {
            // we copy every lazy asset into place here
            let content = fs_extra_1.readFileSync(path_1.join(dir, asset));
            fs_extra_1.writeFileSync(path_1.join(this.outputPath, 'lazy', asset), content);
            // and then for JS assets, we also save a copy to put into the fastboot
            // combined bundle. We don't want to include other things like WASM here
            // that can't be concatenated.
            if (/\.js$/i.test(asset)) {
                return content;
            }
        }).filter(Boolean);
        fs_extra_1.writeFileSync(path_1.join(this.outputPath, 'lazy', 'auto-import-fastboot.js'), contents.join('\n'));
    }
}
exports.default = Bundler;
//# sourceMappingURL=bundler.js.map