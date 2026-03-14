#!/usr/bin/env node
/**
 * Rewrites relative image and link references in README.md to absolute
 * version-tagged GitHub URLs before npm pack/publish, and reverts them after.
 * Images use raw.githubusercontent.com, links use github.com/blob/.
 *
 * Usage:
 *   node scripts/prepack-readme.js          # relative → absolute
 *   node scripts/prepack-readme.js revert   # absolute → relative
 */

const fs = require("node:fs");
const path = require("node:path");

const pkg = JSON.parse(
	fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf8"),
);

const match = pkg.repository.url.match(
	/github\.com[/:](?<ownerRepo>[^/]+\/[^/.]+?)(?:\.git)?$/,
);
if (!match) {
	throw new Error(
		`Could not extract GitHub owner/repo from repository URL: ${pkg.repository.url}`,
	);
}
const { ownerRepo } = match.groups;
const tag = `v${pkg.version}`;
const rawTagUrl = `https://raw.githubusercontent.com/${ownerRepo}/${tag}/`;
const blobBaseUrl = `https://github.com/${ownerRepo}/blob/${tag}/`;

const readmePath = path.join(__dirname, "..", "README.md");
let readme = fs.readFileSync(readmePath, "utf8");

const revert = process.argv[2] === "revert";

/** @param {string} string */
function escapeRegExp(string) {
	return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

if (revert) {
	// Revert absolute raw URLs → relative for images
	readme = readme.replace(
		new RegExp(
			`!\\[(?<alt>[^\\]]*)\\]\\(${escapeRegExp(rawTagUrl)}(?<url>[^)]+)\\)`,
			"g",
		),
		"![$<alt>]($<url>)",
	);
	// Revert absolute blob URLs → relative for links
	readme = readme.replace(
		new RegExp(
			`\\[(?<text>[^\\]]+)\\]\\(${escapeRegExp(blobBaseUrl)}(?<url>[^)]+)\\)`,
			"g",
		),
		"[$<text>]($<url>)",
	);

	fs.writeFileSync(readmePath, readme);
	console.log(`README.md URLs reverted to relative paths`);
} else {
	// Rewrite markdown images: ![alt](relative/path) → raw URL
	readme = readme.replace(
		/!\[(?<alt>[^\]]*)\]\((?!https?:\/\/)(?<url>[^)]+)\)/g,
		`![$<alt>](${rawTagUrl}$<url>)`,
	);

	// Rewrite markdown links: [text](relative/path) → blob URL
	readme = readme.replace(
		/\[(?<text>[^\]]+)\]\((?!https?:\/\/)(?<url>[^)]+)\)/g,
		`[$<text>](${blobBaseUrl}$<url>)`,
	);

	fs.writeFileSync(readmePath, readme);
	console.log(`README.md URLs rewritten for v${pkg.version}`);
}
