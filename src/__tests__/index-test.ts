import * as fse from "fs-extra";
import glob from "glob-promise";
import * as path from "path";
import pixelmatch from "pixelmatch";
import sharp from "sharp";
import * as tmp from "tmp";

import * as index from "../index";

describe("index", () => {
  const fixturesPath = path.join(__dirname, "fixtures");

  let tmpDir: tmp.DirResult;
  beforeEach(() => {
    tmpDir = tmp.dirSync({
      unsafeCleanup: true
    });
  });
  afterEach(() => {
    tmpDir.removeCallback();
  });

  it("generates files from example matching fixtures", async () => {
    await testFixture("example", false, 0.16);
  });

  it("generates files from white matching fixtures", async () => {
    await testFixture("white", true, 0.1);
  });

  async function testFixture(
    fixture: string,
    vectorDrawables: boolean,
    threshold: number
  ): Promise<void> {
    const fixtureDir = path.join(fixturesPath, fixture);
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
      vectorDrawables: vectorDrawables,
      iconsetDir: path.join(tmpDir.name, "ios", fixture, "Images.xcassets")
    });

    const generatedFiles = [];
    for await (let file of generator) {
      const localPath = path.relative(tmpDir.name, file);
      const fixturePath = path.join(fixtureDir, localPath);
      await expectFilesToEqual(file, fixturePath, threshold);
      generatedFiles.push(localPath);
    }

    expect(generatedFiles.sort()).toEqual(
      (await glob("*/**", { cwd: fixtureDir, nodir: true })).sort()
    );
  }
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
  expect(await fse.readFile(expected, "utf-8")).toEqual(
    await fse.readFile(actual, "utf-8")
  );
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

  const totalPixelCount = expectedMetadata.width * expectedMetadata.height;
  const mismatchingPixelCount = pixelmatch(
    await expectedImage.toBuffer(),
    await actualImage.toBuffer(),
    null,
    expectedMetadata.width,
    expectedMetadata.height,
    { threshold }
  );

  expect(mismatchingPixelCount / totalPixelCount).toBeLessThanOrEqual(
    threshold
  );
}
