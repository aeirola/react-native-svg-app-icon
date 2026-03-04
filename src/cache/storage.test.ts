import { it as base, describe, expect } from "vitest";

import { tmpDir } from "../../test/utils/tmp-dir";
import { readCacheData, writeCacheData } from "./storage";

const it = base.extend({ tmpDir });

describe("storage", () => {
	it("returns written data after write", async ({ tmpDir: _tmpDir }) => {
		expect(await readCacheData()).toEqual({ inputs: {}, outputs: {} });

		const data = {
			inputs: { "icon.svg": "abc123" },
			outputs: { "icon.png": "def456" },
		};

		await writeCacheData(data);

		expect(await readCacheData()).toEqual(data);
	});
});
