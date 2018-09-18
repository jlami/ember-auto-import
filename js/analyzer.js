"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const broccoli_plugin_1 = __importDefault(require("broccoli-plugin"));
const walk_sync_1 = __importDefault(require("walk-sync"));
const fs_extra_1 = require("fs-extra");
const fs_tree_diff_1 = __importDefault(require("fs-tree-diff"));
const debug_1 = __importDefault(require("debug"));
const babel_core_1 = require("babel-core");
const babylon_1 = require("babylon");
const path_1 = require("path");
const lodash_1 = require("lodash");
const symlink_or_copy_1 = __importDefault(require("symlink-or-copy"));
debug_1.default.formatters.m = modules => {
    return JSON.stringify(modules.map(m => ({
        specifier: m.specifier,
        path: m.path,
        isDynamic: m.isDynamic,
        package: m.package.name
    })), null, 2);
};
const debug = debug_1.default('ember-auto-import:analyzer');
/*
  Analyzer discovers and maintains info on all the module imports that
  appear in a broccoli tree.
*/
class Analyzer extends broccoli_plugin_1.default {
    constructor(inputTree, pack) {
        super([inputTree], {
            annotation: 'ember-auto-import-analyzer',
            persistentOutput: true
        });
        this.pack = pack;
        this.previousTree = new fs_tree_diff_1.default();
        this.modules = [];
        this.paths = new Map();
        this.parserOptions = this.buildParserOptions(pack.babelOptions);
    }
    get imports() {
        if (!this.modules) {
            this.modules = lodash_1.flatten([...this.paths.values()]);
            debug('imports %m', this.modules);
        }
        return this.modules;
    }
    buildParserOptions(babelOptions) {
        let p = new babel_core_1.Pipeline();
        let f = new babel_core_1.File(babelOptions, p);
        return f.parserOpts;
    }
    build() {
        this.getPatchset().forEach(([operation, relativePath]) => {
            let outputPath = path_1.join(this.outputPath, relativePath);
            switch (operation) {
                case 'unlink':
                    if (path_1.extname(relativePath) === '.js') {
                        this.removeImports(relativePath);
                    }
                    fs_extra_1.unlinkSync(outputPath);
                    break;
                case 'rmdir':
                    fs_extra_1.rmdirSync(outputPath);
                    break;
                case 'mkdir':
                    fs_extra_1.mkdirSync(outputPath);
                    break;
                case 'change':
                    fs_extra_1.removeSync(outputPath);
                // deliberate fallthrough
                case 'create': {
                    let absoluteInputPath = path_1.join(this.inputPaths[0], relativePath);
                    if (path_1.extname(relativePath) === '.js') {
                        this.updateImports(relativePath, fs_extra_1.readFileSync(absoluteInputPath, 'utf8'));
                    }
                    symlink_or_copy_1.default.sync(absoluteInputPath, outputPath);
                }
            }
        });
    }
    getPatchset() {
        let input = walk_sync_1.default.entries(this.inputPaths[0]);
        let previous = this.previousTree;
        let next = (this.previousTree = fs_tree_diff_1.default.fromEntries(input));
        return previous.calculatePatch(next);
    }
    removeImports(relativePath) {
        debug(`removing imports for ${relativePath}`);
        let imports = this.paths.get(relativePath);
        if (imports) {
            if (imports.length > 0) {
                this.modules = null; // invalidates cache
            }
            this.paths.delete(relativePath);
        }
    }
    updateImports(relativePath, source) {
        debug(`updating imports for ${relativePath}, ${source.length}`);
        let newImports = this.parseImports(relativePath, source);
        if (!lodash_1.isEqual(this.paths.get(relativePath), newImports)) {
            this.paths.set(relativePath, newImports);
            this.modules = null; // invalidates cache
        }
    }
    parseImports(relativePath, source) {
        let ast;
        try {
            ast = babylon_1.parse(source, this.parserOptions);
        }
        catch (err) {
            if (err.name !== 'SyntaxError') {
                throw err;
            }
            debug('Ignoring an unparseable file');
        }
        let imports = [];
        if (!ast) {
            return imports;
        }
        forEachNode(ast.program.body, node => {
            if (node.type === 'CallExpression' &&
                node.callee &&
                node.callee.type === 'Import') {
                // it's a syntax error to have anything other than exactly one
                // argument, so we can just assume this exists
                let argument = node.arguments[0];
                if (argument.type !== 'StringLiteral') {
                    throw new Error('ember-auto-import only supports dynamic import() with a string literal argument.');
                }
                imports.push({
                    isDynamic: true,
                    specifier: argument.value,
                    path: relativePath,
                    package: this.pack
                });
            }
        });
        // No need to recurse here, because we only deal with top-level static import declarations
        for (let node of ast.program.body) {
            let specifier;
            if (node.type === 'ImportDeclaration') {
                specifier = node.source.value;
            }
            if (node.type === 'ExportNamedDeclaration' && node.source) {
                specifier = node.source.value;
            }
            if (specifier) {
                imports.push({
                    isDynamic: false,
                    specifier,
                    path: relativePath,
                    package: this.pack
                });
            }
        }
        return imports;
    }
}
exports.default = Analyzer;
const skipKeys = {
    loc: true,
    type: true,
    start: true,
    end: true
};
function forEachNode(node, visit) {
    visit(node);
    for (let key in node) {
        if (skipKeys[key]) {
            continue;
        }
        let child = node[key];
        if (child &&
            typeof child === 'object' &&
            (child.type || Array.isArray(child))) {
            forEachNode(child, visit);
        }
    }
}
//# sourceMappingURL=analyzer.js.map