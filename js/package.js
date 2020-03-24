"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const resolve_1 = __importDefault(require("resolve"));
const path_1 = require("path");
const fs_1 = require("fs");
const cache = new WeakMap();
let pkgGeneration = 0;
function reloadDevPackages() {
    pkgGeneration++;
}
exports.reloadDevPackages = reloadDevPackages;
class Package {
    constructor(appOrAddon) {
        this.isAddonCache = new Map();
        this.name = appOrAddon.parent.pkg.name;
        this.root = appOrAddon.parent.root;
        this.isAddon = appOrAddon.parent !== appOrAddon.project;
        this.isDeveloping = !this.isAddon || this.root === appOrAddon.project.root;
        // This is the per-package options from ember-cli
        let options = this.isAddon
            ? appOrAddon.parent.options
            : appOrAddon.app.options;
        // Stash our own config options
        this.autoImportOptions = options.autoImport;
        this.babelOptions = this.buildBabelOptions(appOrAddon, options);
        this.pkgCache = appOrAddon.parent.pkg;
        this.pkgGeneration = pkgGeneration;
    }
    static lookup(appOrAddon) {
        if (!cache.has(appOrAddon)) {
            cache.set(appOrAddon, new this(appOrAddon));
        }
        return cache.get(appOrAddon);
    }
    buildBabelOptions(instance, options) {
        // Generate the same babel options that the package (meaning app or addon)
        // is using. We will use these so we can configure our parser to
        // match.
        let babelAddon = instance.addons.find(addon => addon.name === 'ember-cli-babel');
        let babelOptions = babelAddon.buildBabelOptions(options);
        // https://github.com/babel/ember-cli-babel/issues/227
        delete babelOptions.annotation;
        delete babelOptions.throwUnlessParallelizable;
        if (babelOptions.plugins) {
            babelOptions.plugins = babelOptions.plugins.filter(p => !p._parallelBabel);
        }
        return babelOptions;
    }
    get pkg() {
        if (!this.pkgCache ||
            (this.isDeveloping && pkgGeneration !== this.pkgGeneration)) {
            // avoiding `require` here because we don't want to go through the
            // require cache.
            this.pkgCache = JSON.parse(fs_1.readFileSync(path_1.join(this.root, 'package.json'), 'utf-8'));
            this.pkgGeneration = pkgGeneration;
        }
        return this.pkgCache;
    }
    get namespace() {
        // This namespacing ensures we can be used by multiple packages as
        // well as by an addon and its dummy app simultaneously
        return `${this.name}/${this.isAddon ? 'addon' : 'app'}`;
    }
    hasDependency(name) {
        let pkg = this.pkg;
        return ((pkg.dependencies && Boolean(pkg.dependencies[name])) ||
            (pkg.devDependencies && Boolean(pkg.devDependencies[name])) ||
            (pkg.peerDependencies && Boolean(pkg.peerDependencies[name])));
    }
    hasNonDevDependency(name) {
        let pkg = this.pkg;
        return ((pkg.dependencies && Boolean(pkg.dependencies[name])) ||
            (pkg.peerDependencies && Boolean(pkg.peerDependencies[name])));
    }
    isEmberAddonDependency(name) {
        if (!this.isAddonCache.has(name)) {
            let packageJSON = require(resolve_1.default.sync(`${name}/package.json`, {
                basedir: this.root
            }));
            let keywords = packageJSON.keywords;
            this.isAddonCache.set(name, keywords && keywords.includes('ember-addon'));
        }
        return this.isAddonCache.get(name);
    }
    assertAllowedDependency(name) {
        if (this.isAddon && !this.hasNonDevDependency(name)) {
            throw new Error(`${this.name} tried to import "${name}" from addon code, but "${name}" is a devDependency. You may need to move it into dependencies.`);
        }
    }
    excludesDependency(name) {
        return (this.autoImportOptions &&
            this.autoImportOptions.exclude &&
            this.autoImportOptions.exclude.includes(name));
    }
    get webpackConfig() {
        return this.autoImportOptions && this.autoImportOptions.webpack;
    }
    aliasFor(name) {
        return ((this.autoImportOptions &&
            this.autoImportOptions.alias &&
            this.autoImportOptions.alias[name]) ||
            name);
    }
    get publicAssetURL() {
        return this.autoImportOptions && this.autoImportOptions.publicAssetURL;
    }
}
exports.default = Package;
//# sourceMappingURL=package.js.map