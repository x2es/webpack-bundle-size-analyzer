"use strict";
var commander = require("commander");
var fs = require("fs");
var size_tree = require("./size_tree");
function printStats(json, opts) {
    var bundleStats = JSON.parse(json);
    var depTrees = size_tree.dependencySizeTree(bundleStats);
    if (opts.outputAsJson) {
        console.log(JSON.stringify(depTrees, undefined, 2));
    }
    else {
        depTrees.forEach(function (tree) { return size_tree.printDependencySizeTree(tree, opts.sharesStat); });
    }
}
commander.version('1.1.0')
    .option('-j --json', 'Output as JSON')
    .option('--no-shares-stat', 'Suppress shares stat from output')
    .usage('[options] [Webpack JSON output]')
    .description("Analyzes the JSON output from 'webpack --json'\n  and displays the total size of JS modules\n  contributed by each NPM package that has been included in the bundle.\n\n  The JSON output can either be supplied as the first argument or\n  passed via stdin.\n  ");
commander.parse(process.argv);
var opts = {
    outputAsJson: commander['json'],
    sharesStat: commander['sharesStat']
};
if (commander.args[0]) {
    printStats(fs.readFileSync(commander.args[0]).toString(), opts);
}
else if (!process.stdin.isTTY) {
    var json_1 = '';
    process.stdin.on('data', function (chunk) { return json_1 += chunk.toString(); });
    process.stdin.on('end', function () { return printStats(json_1, opts); });
}
else {
    console.error('No Webpack JSON output file specified. Use `webpack --json` to generate it.');
    process.exit(1);
}
