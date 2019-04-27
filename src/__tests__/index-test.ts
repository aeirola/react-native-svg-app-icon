import * as fse from "fs-extra";
import * as path from "path";
import pixelmatch from "pixelmatch";
import sharp from "sharp";
import * as tmp from "tmp";

import * as index from "../index";

describe("index", () => {
  const fixturesPath = path.join(__dirname, "fixtures");
  let tmpDir: tmp.DirResult;
  beforeEach(async () => {
    tmpDir = await tmp.dirSync({
      unsafeCleanup: true
    });
  });
  afterEach(async () => {
    await tmpDir.removeCallback();
  });

  it("generates files from example matching fixtures", async () => {
    const fixtureDir = path.join(fixturesPath, "example");
    const generator = index.generate({
      icon: path.join(fixtureDir, "icon.svg"),
      resDirPath: path.join(
        tmpDir.name,
        "android",
        "app",
        "src",
        "main",
        "res"
      ),
      iconsetDir: path.join(tmpDir.name, "ios", "example", "Images.xcassets")
    });

    for await (let file of generator) {
      const localPath = path.relative(tmpDir.name, file);
      const fixturePath = path.join(fixtureDir, localPath);
      await expectFilesToEqual(file, fixturePath, 0.85);
    }
  });
});

async function expectFilesToEqual(
  expected: string,
  actual: string,
  threshold: number
): Promise<void> {
  expectFileToExist(expected);
  expectFileToExist(actual);

  const extension = path.extname(expected);
  switch (extension) {
    case ".png":
      return expectImagesToEqual(expected, actual, threshold);
    case ".json":
      return expectJsonToEqual(expected, actual);
    case ".xml":
      return expectXmlToEqual(expected, actual);
    default:
      return fail(`Unsupported comparison file type ${extension}`);
  }
}

async function expectFileToExist(path: string): Promise<void> {
  if (!(await fse.pathExists(path))) {
    fail(`File did not exist: ${path}`);
  }
}

async function expectXmlToEqual(
  expected: string,
  actual: string
): Promise<void> {
  // TODO: Compare XML structure
  expect(await fse.readFile(expected)).toEqual(await fse.readFile(actual));
}

async function expectJsonToEqual(
  expected: string,
  actual: string
): Promise<void> {
  expect(await fse.readJson(expected)).toEqual(await fse.readJson(actual));
}

async function expectImagesToEqual(
  expected: string,
  actual: string,
  threshold: number
): Promise<void> {
  const expectedImage = sharp(expected);
  const actualImage = sharp(actual);

  const expectedMetadata = await expectedImage.metadata();
  const actualMetadata = await actualImage.metadata();

  expect({
    width: expectedMetadata.width,
    height: expectedMetadata.height
  }).toEqual({
    width: actualMetadata.width,
    height: actualMetadata.height
  });

  if (!(expectedMetadata.width && expectedMetadata.height)) {
    throw new Error(
      `Image dimensions not match: expected ${expectedMetadata.width}x${
        expectedMetadata.height
      }, got ${actualMetadata.width}x${actualMetadata.height}`
    );
  }

  const mismatchingPixelCount = pixelmatch(
    await expectedImage.toBuffer(),
    await actualImage.toBuffer(),
    null,
    expectedMetadata.width,
    expectedMetadata.height,
    { threshold }
  );

  expect(mismatchingPixelCount).toEqual(0);
}
