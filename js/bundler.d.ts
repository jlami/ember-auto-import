import Plugin, { Tree } from 'broccoli-plugin';
import Splitter, { BundleDependencies } from './splitter';
import Package from './package';
import BundleConfig from './bundle-config';
export interface BundlerPluginOptions {
    consoleWrite: (string: any) => void;
    environment: string;
    splitter: Splitter;
    packages: Set<Package>;
    bundles: BundleConfig;
}
export interface BuildResult {
    entrypoints: Map<string, string[]>;
    lazyAssets: string[];
    dir: string;
}
export interface BundlerHook {
    build(modules: Map<string, BundleDependencies>): Promise<BuildResult>;
}
export default class Bundler extends Plugin {
    private options;
    private lastDeps;
    private cachedBundlerHook;
    private didEnsureDirs;
    constructor(allAppTree: Tree, options: BundlerPluginOptions);
    private readonly publicAssetURL;
    readonly bundlerHook: BundlerHook;
    build(): Promise<void>;
    private ensureDirs;
    private addEntrypoints;
    private addLazyAssets;
}
