/* eslint-env phantomjs */
/* eslint-disable no-console, no-var, prefer-arrow-callback, object-shorthand */
"use strict";

var webpage = require("webpage");
var system = require("system");

var HTML_PREFIX = "<!DOCTYPE html><style>html, body { margin: 0; padding: 0; position: relative; } " +
                  "svg { position: absolute; top: 0; left: 0; display: block; }</style>";

if (system.args.length !== 2) {
    console.error("Usage: converter.js options");
    phantom.exit();
} else {
    convert(system.args[1]);
}

function convert(options) {
    try {
        options = JSON.parse(options);
    } catch (e) {
        console.error("Unable to parse options.");
        console.error(e);
        phantom.exit();
        return;
    }

    var page = webpage.create();

    var source = "";
    while (!system.stdin.atEnd()) {
        source += system.stdin.readLine() + "\n";
    }

    page.onLoadFinished = function (status) {
        if (status !== "success") {
            console.error("Unable to load the source file.");
            phantom.exit();
            return;
        }

        try {
            if (options.width !== undefined || options.height !== undefined) {
                setSVGDimensions(page, options.width, options.height);
            }

            var dimensions = getSVGDimensions(options);
            if (!dimensions) {
                console.error("Width or height could not be determined from either the source file or the supplied " +
                              "dimensions");
                phantom.exit();
                return;
            }

            //setSVGDimensions(page, dimensions.width, dimensions.height);
            

            page.viewportSize = {
                width: dimensions.width,
                height: dimensions.height
            };
            page.clipRect = {
                top: 0,
                left: 0,
                width: dimensions.width,
                height: dimensions.height
            };
        } catch (e) {
            console.error("Unable to calculate or set dimensions.");
            console.error(e);
            phantom.exit();
            return;
        }

        var result = "data:image/png;base64," + page.renderBase64("PNG");
        system.stdout.write(result);
        phantom.exit();
    };

    // PhantomJS will always render things empty if you choose about:blank, so that's why the different default URL.
    // PhantomJS's setContent always assumes HTML, not SVG, so we have to massage the page into usable HTML first.
    page.setContent(HTML_PREFIX + source, options.url || "http://example.com/");
}

function setSVGDimensions(page, width, height) {
    
    if (width === undefined && height === undefined) {
        return;
    }

    page.evaluate(function (widthInside, heightInside) {
        /* global document: false */
        var el = document.querySelectorAll("svg");
        for (i = 0; i < el.length; i++) {
            el[i].style.top = i*heightInside + "px";
            el[i].setAttribute("width", widthInside + "px");
            el[i].setAttribute("height", heightInside + "px");
          }
    }, width, height);
}

function getSVGDimensions(options) {
    return {width: options.width, height: options.height * options.elements};
}
