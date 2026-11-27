/** The options of {@link renderVisitor}. */
export type RenderOptions = RenderMapOptions & {
    /** Whether to delete the output folder before writing the pages. Defaults to `true`. */
    deleteFolderBeforeRendering?: boolean;
};

/** The options of {@link getRenderMapVisitor}. */
export type RenderMapOptions = {
    /** The extension of the rendered files. Defaults to `md`. */
    extension?: string;
    /** The name of the program page, without its extension. Defaults to `README`. */
    indexFilename?: string;
    /** The indentation of type definitions rendered on multiple lines. Defaults to four spaces. */
    typeIndent?: string;
};
