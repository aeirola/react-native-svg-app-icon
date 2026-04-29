import { it as base, describe, expect } from "vitest";

import { tmpDir } from "../../../test/utils/tmp-dir";
import { CacheStorage } from "./storage";

const it = base.extend({ tmpDir });

describe("storage", () => {
	it("returns written data after write", async ({ tmpDir: _tmpDir }) => {
		const storage = new CacheStorage(process.cwd(), undefined);

		expect(await storage.read()).toEqual({ inputs: {}, outputs: {} });

		const data = {
			inputs: { "icon.svg": "abc123" },
			outputs: { "icon.png": "def456" },
		};

		await storage.write(data);

		expect(await storage.read()).toEqual(data);
	});
});
