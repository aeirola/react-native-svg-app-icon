import main from "../cli";

describe("cli", () => {
  it("fails on missing file", async () => {
    await expect(main()).rejects.toThrow();
  });
});
