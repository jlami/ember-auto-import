export default class BundleConfig {
    private emberApp;
    constructor(emberApp: any);
    readonly names: ReadonlyArray<string>;
    bundleEntrypoint(name: string): string;
    bundleForPath(path: string): string;
    readonly lazyChunkPath: string;
}
