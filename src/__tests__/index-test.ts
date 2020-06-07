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
    process.chdir(tmpDir.name);
  });
  afterEach(() => {
    tmpDir.removeCallback();
  });

  it("generates files from example matching fixtures", () =>
    testFixture("example", 0.14));

  it("generates files from empty matching fixtures", () =>
    testFixture("empty", 0.06));

  it(
    "generates files from text matching fixtures",
    () => testFixture("text", 0.06),
    20 * 1000
  );

  it("determines the correct ios asset path", async () => {
    fse.ensureDir(path.join("ios", "project", "Images.xcassets"));

    const generator = index.generate({
      icon: {
        backgroundPath: path.join(
          fixturesPath,
          "example",
          "icon-background.svg"
        ),
        foregroundPath: path.join(fixturesPath, "example", "icon.svg")
      }
    });

    const generatedFiles = [];
    for await (const file of generator) {
      generatedFiles.push(file);
    }

    expect(generatedFiles).toContain(
      "ios/project/Images.xcassets/AppIcon.appiconset/iphone-40@3x.png"
    );
  });

  async function testFixture(
    fixture: string,
    threshold: number
  ): Promise<void> {
    const fixtureDir = path.join(fixturesPath, fixture);
    const generator = index.generate({
      icon: {
        backgroundPath: (await fse.pathExists(
          path.join(fixtureDir, "icon-background.svg")
        ))
          ? path.join(fixtureDir, "icon-background.svg")
          : undefined,
        foregroundPath: path.join(fixtureDir, "icon.svg")
      },
      resDirPath: path.join(
        tmpDir.name,
        "android",
        "app",
        "src",
        "main",
        "res"
      ),
      iconsetDir: path.join(
        tmpDir.name,
        "ios",
        fixture,
        "Images.xcassets",
        "AppIcon.appiconset"
      )
    });

    const generatedFiles = [];
    for await (const file of generator) {
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

  const expectedData = await expectedImage
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const actualData = await actualImage
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  expect(actualData.info).toEqual(expectedData.info);

  const totalPixelCount = expectedData.info.width * expectedData.info.height;
  const mismatchingPixelCount = pixelmatch(
    expectedData.data,
    actualData.data,
    null,
    expectedData.info.width,
    expectedData.info.height,
    { threshold }
  );

  expect(mismatchingPixelCount / totalPixelCount).toBeLessThanOrEqual(
    threshold
  );
}
