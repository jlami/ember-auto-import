import Plugin, { Tree } from 'broccoli-plugin';
import Package from './package';
export interface Import {
    path: string;
    package: Package;
    specifier: string;
    isDynamic: boolean;
}
export default class Analyzer extends Plugin {
    private pack;
    private previousTree;
    private parserOptions;
    private modules;
    private paths;
    constructor(inputTree: Tree, pack: Package);
    readonly imports: Import[];
    private buildParserOptions;
    build(): void;
    private getPatchset;
    removeImports(relativePath: any): void;
    updateImports(relativePath: any, source: any): void;
    private parseImports;
}
