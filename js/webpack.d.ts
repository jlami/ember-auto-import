import { BundleDependencies } from './splitter';
import { BundlerHook, BuildResult } from './bundler';
import BundleConfig from './bundle-config';
export default class WebpackBundler implements BundlerHook {
    private consoleWrite;
    private publicAssetURL;
    private stagingDir;
    private webpack;
    private outputDir;
    constructor(bundles: BundleConfig, environment: any, extraWebpackConfig: any, consoleWrite: any, publicAssetURL: any);
    build(bundleDeps: Map<string, BundleDependencies>): Promise<BuildResult>;
    private summarizeStats;
    private writeEntryFile;
    private runWebpack;
}
