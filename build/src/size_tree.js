"use strict";
var filesize = require("filesize");
var path = require("path");
var webpack_stats = require("./webpack_stats");
function modulePath(identifier) {
    // the format of module paths is
    //   '(<loader expression>!)?/path/to/module.js'
    var loaderRegex = /.*!/;
    return identifier.replace(loaderRegex, '');
}
/** Walk a dependency size tree produced by dependencySizeTree() and output the
  * size contributed to the bundle by each package's own code plus those
  * of its dependencies.
  */
function printDependencySizeTree(node, sharesStat, depth, outputFn) {
    if (depth === void 0) { depth = 0; }
    if (outputFn === void 0) { outputFn = console.log; }
    if (node.hasOwnProperty('bundleName')) {
        var rootNode = node;
        outputFn("Bundle: " + rootNode.bundleName);
    }
    var childrenBySize = node.children.sort(function (a, b) {
        return b.size - a.size;
    });
    var totalSize = node.size;
    var remainder = totalSize;
    var includedCount = 0;
    var prefix = '';
    for (var i = 0; i < depth; i++) {
        prefix += '  ';
    }
    for (var _i = 0, childrenBySize_1 = childrenBySize; _i < childrenBySize_1.length; _i++) {
        var child = childrenBySize_1[_i];
        ++includedCount;
        var out = "" + prefix + child.packageName + ": " + filesize(child.size);
        if (sharesStat) {
            var percentage = ((child.size / totalSize) * 100).toPrecision(3);
            out = out + " (" + percentage + "%)";
        }
        outputFn(out);
        printDependencySizeTree(child, sharesStat, depth + 1, outputFn);
        remainder -= child.size;
        if (remainder < 0.01 * totalSize) {
            break;
        }
    }
    if (depth === 0 || remainder !== totalSize) {
        var out = prefix + "<self>: " + filesize(remainder);
        if (sharesStat) {
            var percentage = ((remainder / totalSize) * 100).toPrecision(3);
            out = out + " (" + percentage + "%)";
        }
        outputFn(out);
    }
}
exports.printDependencySizeTree = printDependencySizeTree;
function bundleSizeTree(stats) {
    var statsTree = {
        packageName: '<root>',
        size: 0,
        children: []
    };
    if (stats.name) {
        statsTree.bundleName = stats.name;
    }
    // extract source path for each module
    var modules = stats.modules.map(function (mod) {
        return {
            path: modulePath(mod.identifier),
            size: mod.size
        };
    });
    modules.sort(function (a, b) {
        if (a === b) {
            return 0;
        }
        else {
            return a < b ? -1 : 1;
        }
    });
    modules.forEach(function (mod) {
        // convert each module path into an array of package names, followed
        // by the trailing path within the last module:
        //
        // root/node_modules/parent/node_modules/child/file/path.js =>
        //  ['root', 'parent', 'child', 'file/path.js'
        var packages = mod.path.split(new RegExp('\\' + path.sep + 'node_modules\\' + path.sep));
        var filename = '';
        if (packages.length > 1) {
            var lastSegment = packages.pop();
            var lastPackageName = lastSegment.slice(0, lastSegment.search(new RegExp('\\' + path.sep + '|$')));
            packages.push(lastPackageName);
            filename = lastSegment.slice(lastPackageName.length + 1);
        }
        else {
            filename = packages[0];
        }
        packages.shift();
        var parent = statsTree;
        parent.size += mod.size;
        packages.forEach(function (pkg) {
            var existing = parent.children.filter(function (child) { return child.packageName === pkg; });
            if (existing.length > 0) {
                existing[0].size += mod.size;
                parent = existing[0];
            }
            else {
                var newChild = {
                    packageName: pkg,
                    size: mod.size,
                    children: []
                };
                parent.children.push(newChild);
                parent = newChild;
            }
        });
    });
    return statsTree;
}
/** Takes the output of 'webpack --json', and returns
  * an array of trees of require()'d package names and sizes.
  *
  * There is one entry in the array for each bundle specified
  * in the Webpack compilation.
  */
function dependencySizeTree(stats) {
    if (webpack_stats.isMultiCompilation(stats)) {
        return stats.children.map(bundleSizeTree);
    }
    else {
        return [bundleSizeTree(stats)];
    }
}
exports.dependencySizeTree = dependencySizeTree;