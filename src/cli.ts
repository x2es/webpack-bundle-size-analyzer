import commander = require('commander');
import fs = require('fs');

import size_tree = require('./size_tree');
import webpack_stats = require('./webpack_stats');

function printStats(json: string, opts: { outputAsJson: boolean, shareStats: boolean }) {
    const bundleStats = JSON.parse(json) as webpack_stats.WebpackStats;
	const depTrees = size_tree.dependencySizeTree(bundleStats);
    if (opts.outputAsJson) {
        console.log(JSON.stringify(depTrees, undefined, 2));
    } else {
        depTrees.forEach(tree => size_tree.printDependencySizeTree(tree, opts.shareStats));
    }
}

commander.version('1.1.0')
         .option('-j --json', 'Output as JSON')
         .option('--no-share-stats', 'Do not output dependency sizes as a percentage')
         .usage('[options] [Webpack JSON output]')
         .description(
 `Analyzes the JSON output from 'webpack --json'
  and displays the total size of JS modules
  contributed by each NPM package that has been included in the bundle.

  The JSON output can either be supplied as the first argument or
  passed via stdin.
  `
  );

commander.parse(process.argv);


const opts = {
	outputAsJson: commander['json'],
	shareStats:   commander['shareStats']
}

if (commander.args[0]) {
	printStats(fs.readFileSync(commander.args[0]).toString(), opts);
} else if (!process.stdin.isTTY) {
	let json = '';
	process.stdin.on('data', (chunk: any) => json += chunk.toString());
	process.stdin.on('end', () => printStats(json, opts));
} else {
	console.error('No Webpack JSON output file specified. Use `webpack --json` to generate it.');
	process.exit(1);
}
