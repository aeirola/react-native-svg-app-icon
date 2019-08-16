import main from "../cli";

describe("cli", () => {
  it("fails on missing file", () => {
    expect(main()).rejects.toThrow();
  });
});
