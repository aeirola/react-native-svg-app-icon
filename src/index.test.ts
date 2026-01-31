import * as path from "node:path";
import * as fse from "fs-extra";
import { glob } from "glob";
import pixelmatch from "pixelmatch";
import sharp from "sharp";
import * as tmp from "tmp";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import * as index from "./index";

describe("index", () => {
	const originalCwd = process.cwd();
	const fixturesPath = path.join(__dirname, "..", "test_fixtures");
	const defaultConfig: index.Config = {
		icon: {
			backgroundPath: path.join(fixturesPath, "example", "icon-background.svg"),
			foregroundPath: path.join(fixturesPath, "example", "icon.svg"),
		},
		platforms: ["android", "ios"],
		force: false,
	};

	let tmpDir: tmp.DirResult;
	beforeEach(() => {
		tmpDir = tmp.dirSync({
			unsafeCleanup: true,
		});
		process.chdir(tmpDir.name);
	});
	afterEach(() => {
		process.chdir(originalCwd);
		tmpDir.removeCallback();
	});

	it("generates files from example matching fixtures", () =>
		testFixture("example", 0.16));

	it("generates files from empty matching fixtures", () =>
		testFixture("empty", 0.1));

	it(
		"generates files from text matching fixtures",
		() => testFixture("text", 0.12),
		20 * 1000,
	);

	it("determines the correct ios asset path", async () => {
		await fse.ensureDir(path.join("ios", "project", "Images.xcassets"));

		const generator = index.generate(defaultConfig);
		const generatedFiles = await readIterable(generator);

		expect(generatedFiles).toContain(
			"ios/project/Images.xcassets/AppIcon.appiconset/iphone-40@3x.png",
		);
	});

	it("does not re-render files on second run", async () => {
		await fse.ensureDir(path.join("ios", "project", "Images.xcassets"));

		const firstRunFiles = await readIterable(index.generate(defaultConfig));
		const sedonRunFiles = await readIterable(index.generate(defaultConfig));

		expect(firstRunFiles.length).toBeGreaterThan(0);
		expect(sedonRunFiles.length).toBe(0);
	});

	it("does re-renders files on second run when force is set to true", async () => {
		await fse.ensureDir(path.join("ios", "project", "Images.xcassets"));

		const firstRunFiles = await readIterable(index.generate(defaultConfig));
		const sedonRunFiles = await readIterable(
			index.generate({ ...defaultConfig, force: true }),
		);

		expect(firstRunFiles.length).toBeGreaterThan(0);
		expect(sedonRunFiles.length).toBeGreaterThan(0);
	});

	async function testFixture(
		fixture: string,
		threshold: number,
	): Promise<void> {
		const fixtureDir = path.join(fixturesPath, fixture);
		const generator = index.generate({
			...defaultConfig,
			icon: {
				backgroundPath: (await fse.pathExists(
					path.join(fixtureDir, "icon-background.svg"),
				))
					? path.join(fixtureDir, "icon-background.svg")
					: undefined,
				foregroundPath: path.join(fixtureDir, "icon.svg"),
			},
			androidOutputPath: path.join(
				tmpDir.name,
				"android",
				"app",
				"src",
				"main",
				"res",
			),
			iosOutputPath: path.join(
				tmpDir.name,
				"ios",
				fixture,
				"Images.xcassets",
				"AppIcon.appiconset",
			),
		});

		const generatedFiles = [];
		for await (const file of generator) {
			const localPath = path.relative(tmpDir.name, file);
			const fixturePath = path.join(fixtureDir, localPath);
			await expectFilesToEqual(file, fixturePath, threshold);
			generatedFiles.push(localPath);
		}

		expect(generatedFiles.sort()).toEqual(
			(await glob("*/**", { cwd: fixtureDir, nodir: true })).sort(),
		);
	}
});

async function readIterable<Data>(
	iterable: AsyncIterable<Data>,
): Promise<Data[]> {
	const values = [];
	for await (const value of iterable) {
		values.push(value);
	}

	return values;
}

async function expectFilesToEqual(
	expected: string,
	actual: string,
	threshold: number,
): Promise<void> {
	await expectFileToExist(expected);
	await expectFileToExist(actual);

	const extension = path.extname(expected);
	switch (extension) {
		case ".png":
			return expectImagesToEqual(expected, actual, threshold);
		case ".json":
			return expectJsonToEqual(expected, actual);
		case ".xml":
			return expectXmlToEqual(expected, actual);
		default:
			throw Error(`Unsupported comparison file type ${extension}`);
	}
}

async function expectFileToExist(path: string): Promise<void> {
	if (!(await fse.pathExists(path))) {
		throw Error(`File did not exist: ${path}`);
	}
}

async function expectXmlToEqual(
	expected: string,
	actual: string,
): Promise<void> {
	// TODO: Compare XML structure
	expect(await fse.readFile(expected, "utf-8")).toEqual(
		await fse.readFile(actual, "utf-8"),
	);
}

async function expectJsonToEqual(
	expected: string,
	actual: string,
): Promise<void> {
	expect(await fse.readJson(expected)).toEqual(await fse.readJson(actual));
}

async function expectImagesToEqual(
	expected: string,
	actual: string,
	threshold: number,
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
		undefined,
		expectedData.info.width,
		expectedData.info.height,
		{ threshold },
	);

	expect(mismatchingPixelCount / totalPixelCount).toBeLessThanOrEqual(
		threshold,
	);
}
