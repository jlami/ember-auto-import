export declare function reloadDevPackages(): void;
export default class Package {
    name: string;
    root: string;
    isAddon: boolean;
    babelOptions: any;
    private autoImportOptions;
    private isAddonCache;
    private isDeveloping;
    private pkgGeneration;
    private pkgCache;
    static lookup(appOrAddon: any): Package;
    constructor(appOrAddon: any);
    private buildBabelOptions;
    private readonly pkg;
    readonly namespace: string;
    hasDependency(name: any): boolean;
    private hasNonDevDependency;
    isEmberAddonDependency(name: any): boolean;
    assertAllowedDependency(name: any): void;
    excludesDependency(name: any): boolean;
    readonly webpackConfig: any;
    aliasFor(name: any): string;
    readonly publicAssetURL: string | undefined;
}
