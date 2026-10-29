import { describe, expect, it } from "vitest";
import {
  dollarsToCents,
  formatPrice,
  slugify,
} from "@/lib/format";

describe("formatPrice", () => {
  it("renders dollars from cents with 2 decimals", () => {
    expect(formatPrice(1290)).toBe("$12.90");
  });

  it("renders zero as $0.00", () => {
    expect(formatPrice(0)).toBe("$0.00");
  });

  it("groups thousands", () => {
    expect(formatPrice(101_500)).toBe("$1,015.00");
  });

  it("handles single-digit cents", () => {
    expect(formatPrice(99)).toBe("$0.99");
  });
});

describe("slugify", () => {
  it("lowercases and dash-splits on every non-alphanumeric run", () => {
    expect(slugify("K2 Mechanical Keyboard!")).toBe("k2-mechanical-keyboard");
  });

  it("trims and collapses whitespace", () => {
    expect(slugify("  Hello   World  ")).toBe("hello-world");
  });

  it("strips quotes", () => {
    expect(slugify(`O'Brien "special"`)).toBe("obrien-special");
  });

  it("collapses punctuation runs into a single dash", () => {
    expect(slugify("Cool — Thing / Edition")).toBe("cool-thing-edition");
  });

  it("trims leading/trailing dashes", () => {
    expect(slugify("---weird---name---")).toBe("weird-name");
  });

  it("never returns more than 64 chars", () => {
    expect(slugify("a".repeat(30) + " " + "b".repeat(60)).length).toBeLessThanOrEqual(64);
  });

  it("returns an empty string when nothing alphanumeric remains", () => {
    expect(slugify("  ---  ")).toBe("");
  });
});

describe("dollarsToCents", () => {
  it("parses plain dollars", () => {
    expect(dollarsToCents("10")).toBe(1000);
  });

  it("parses decimals", () => {
    expect(dollarsToCents("12.5")).toBe(1250);
    expect(dollarsToCents("12")).toBe(1200);
  });

  it("ignores currency symbols and spaces", () => {
    expect(dollarsToCents("$ 9.99")).toBe(999);
  });

  it("strips thousands separators", () => {
    expect(dollarsToCents("1,299.00")).toBe(1_299_00);
  });

  it("accepts a bare decimal point", () => {
    expect(dollarsToCents(".5")).toBe(50);
  });

  it("rounds sub-cent output to the nearest cent", () => {
    // 0.005 dollars * 100 = 0.5 cents -> Math.round -> 1
    expect(dollarsToCents("0.005")).toBe(1);
  });

  it("returns 0 for empty strings", () => {
    expect(dollarsToCents("")).toBe(0);
  });

  it("returns 0 for non-numeric input", () => {
    expect(dollarsToCents("abc")).toBe(0);
  });

  it("returns 0 for malformed decimals like 1.2.3", () => {
    expect(dollarsToCents("1.2.3")).toBe(0);
  });
});
