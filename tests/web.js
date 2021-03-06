"use strict";

const helpers = require("yeoman-test");
const fs = require("fs-extra");
const path = require("path");
const spawnCommand = require("yeoman-generator/lib/actions/spawn-command");
const assert = require("yeoman-assert");
const deleteFolderRecursive = require("./utils").deleteFolderRecursive;
const analizeCoverage = require("./utils").analizeCoverage;

/**
 * WEB Tests
 */

describe("Generating tests for web", function() {

    const tests = [
        {
            path: "/empty/js",
            boilerPlate: "empty",
            programmingLanguage: "javascript"
        },
        {
            path: "/full/js",
            boilerPlate: "full",
            programmingLanguage: "javascript"
        },
        {
            path: "/empty/ts",
            boilerPlate: "empty",
            programmingLanguage: "typescript"
        },
        {
            path: "/full/ts",
            boilerPlate: "full",
            programmingLanguage: "typescript"
        },
    ];

    tests.forEach(test => {
        it(`generates a ${test.programmingLanguage} ${test.boilerPlate} project for web`, function() {
            this.timeout(1000000);
            const newPath = "../outputs/web" + test.path + "/my-widget";
            const correctPath = path.join(__dirname, newPath);
            const props = {
                widgetName: "MyWidget",
                description: "My widget description",
                organization: "com.mendix",
                copyright: "Mendix 2019",
                license: "Apache-2.0",
                version: "1.0.0",
                author: "Widget Generator",
                projectPath: "./dist/MxTestProject",
                programmingLanguage: test.programmingLanguage,
                platform: "web",
                boilerplate: test.boilerPlate,
                unitTests: true,
                e2eTests: true
            };
            props.packagePath = props.organization.trim().toLowerCase();
            return helpers.run(path.join(__dirname, "../generators/app"))
                .withArguments("my widget")
                .withPrompts(props)
                .then(function(dir) {
                    deleteFolderRecursive(correctPath);
                    fs.copySync(dir, correctPath);
                })
                .then(() => {
                    spawnCommand.spawnCommandSync("npm", ["install"], { cwd: correctPath + "/my-widget" });
                })
                .then(() => {
                    spawnCommand.spawnCommandSync("npm", ["run", "lint"], { cwd: correctPath + "/my-widget" });
                })
                .then(() => {
                    spawnCommand.spawnCommandSync("npm", ["run", "build"], { cwd: correctPath + "/my-widget" });
                })
                .then(() => {
                    assert.file(correctPath + "/my-widget" + `/dist/${props.version}/${props.packagePath}.${props.widgetName}.mpk`);
                })
                .then(() => {
                    spawnCommand.spawnCommandSync("npm", ["run", "test:unit", "--", "-u"], { cwd: correctPath + "/my-widget" });
                })
                .then(() => {
                    assert.file(correctPath + "/my-widget" + "/dist/coverage/clover.xml");
                    assert.equal(analizeCoverage(correctPath + "/my-widget" + "/dist/coverage/clover.xml"), true);
                });
        });
    });
});
