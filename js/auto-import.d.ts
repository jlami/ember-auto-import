import Bundler from './bundler';
import Analyzer from './analyzer';
import Append from './broccoli-append';
export default class AutoImport {
    private packages;
    private env;
    private consoleWrite;
    private analyzers;
    private bundles;
    static lookup(appOrAddon: any): AutoImport;
    constructor(appOrAddon: any);
    isPrimary(appOrAddon: any): boolean;
    analyze(tree: any, appOrAddon: any): Analyzer;
    makeBundler(allAppTree: any): Bundler;
    addTo(allAppTree: any): Append;
    included(addonInstance: any): void;
    private configureFingerprints;
    updateFastBootManifest(manifest: any): void;
}
