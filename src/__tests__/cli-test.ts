import main from "../cli";

describe("cli", () => {
  it("fails on missing file", async () => {
    expect(main()).rejects.toThrow();
  });
});
