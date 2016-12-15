"use strict";
var chai_1 = require("chai");
var fs = require("fs");
var path = require("path");
var size_tree = require("../src/size_tree");
var printSharesStat = true;
var suppressSharesStat = false;
describe('printDependencySizeTree()', function () {
    it('should print the size tree', function () {
        var output = '';
        var statsJsonStr = fs.readFileSync(path.join('tests', 'stats.json')).toString();
        var statsJson = JSON.parse(statsJsonStr);
        // convert paths in Json to WIN if necessary
        if (path.sep !== '/') {
            statsJson.modules.forEach(function (module) {
                module.identifier = module.identifier.replace(/\//g, path.sep);
            });
        }
        var depsTree = size_tree.dependencySizeTree(statsJson);
        chai_1.expect(depsTree.length).to.equal(1);
        size_tree.printDependencySizeTree(depsTree[0], printSharesStat, 0, function (line) { return output += '\n' + line; });
        chai_1.expect(output).to.equal("\nmarked: 27.53 KB (14.9%)\nlru-cache: 6.29 KB (3.40%)\nstyle-loader: 717 B (0.379%)\n<self>: 150.33 KB (81.3%)");
    });
    it('should print the size tree without shares stat', function () {
        var output = '';
        var statsJsonStr = fs.readFileSync(path.join('tests', 'stats.json')).toString();
        var statsJson = JSON.parse(statsJsonStr);
        // convert paths in Json to WIN if necessary
        if (path.sep !== '/') {
            statsJson.modules.forEach(function (module) {
                module.identifier = module.identifier.replace(/\//g, path.sep);
            });
        }
        var depsTree = size_tree.dependencySizeTree(statsJson);
        chai_1.expect(depsTree.length).to.equal(1);
        size_tree.printDependencySizeTree(depsTree[0], suppressSharesStat, 0, function (line) { return output += '\n' + line; });
        chai_1.expect(output).to.equal("\nmarked: 27.53 KB\nlru-cache: 6.29 KB\nstyle-loader: 717 B\n<self>: 150.33 KB");
    });
    it('should print the bundle name', function () {
        var output = '';
        var namedBundle = {
            bundleName: 'a-bundle',
            packageName: '<self>',
            size: 123,
            children: [],
        };
        size_tree.printDependencySizeTree(namedBundle, printSharesStat, 0, function (line) { return output += '\n' + line; });
        chai_1.expect(output).to.equal("\nBundle: a-bundle\n<self>: 123 B (100%)");
    });
    it('should print the bundle name without shares stat', function () {
        var output = '';
        var namedBundle = {
            bundleName: 'a-bundle',
            packageName: '<self>',
            size: 123,
            children: [],
        };
        size_tree.printDependencySizeTree(namedBundle, suppressSharesStat, 0, function (line) { return output += '\n' + line; });
        chai_1.expect(output).to.equal("\nBundle: a-bundle\n<self>: 123 B");
    });
});
describe('dependencySizeTree()', function () {
    it('should produce correct results where loaders are used', function () {
        var webpackOutput = {
            version: '1.2.3',
            hash: 'unused',
            time: 100,
            assetsByChunkName: {},
            assets: [],
            chunks: [],
            modules: [{
                    id: 0,
                    identifier: path.join('/', 'to', 'loader.js!', 'path', 'to', 'project', 'node_modules', 'dep', 'foo.js'),
                    size: 1234,
                    name: path.join('.', 'foo.js')
                }],
            errors: [],
            warnings: [],
        };
        var depsTree = size_tree.dependencySizeTree(webpackOutput);
        chai_1.expect(depsTree.length).to.equal(1);
        chai_1.expect(depsTree[0]).to.deep.equal({
            packageName: '<root>',
            size: 1234,
            children: [{
                    packageName: 'dep',
                    size: 1234,
                    children: []
                }]
        });
    });
    it('should return a tree for each bundle in the config', function () {
        var statsJsonStr = fs.readFileSync(path.join('tests', 'multiple-bundle-stats.json')).toString();
        var statsJson = JSON.parse(statsJsonStr);
        var depsTree = size_tree.dependencySizeTree(statsJson);
        chai_1.expect(depsTree.length).to.equal(2);
    });
});
