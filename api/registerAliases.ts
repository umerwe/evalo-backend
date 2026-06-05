import Module from "module";
import path from "path";

const srcPath = path.resolve(__dirname, "../src");
const originalResolveFilename = (Module as any)._resolveFilename;

(Module as any)._resolveFilename = function (
  request: string,
  parent: NodeModule | undefined,
  isMain: boolean,
  options: any
) {
  if (request.startsWith("@/")) {
    return originalResolveFilename.call(
      this,
      path.join(srcPath, request.slice(2)),
      parent,
      isMain,
      options
    );
  }

  return originalResolveFilename.call(this, request, parent, isMain, options);
};
