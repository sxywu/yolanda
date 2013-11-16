require.config({
    baseUrl: "scripts/contrib/",
    paths: {
        "app": "..",
        "underscore": "underscore",
        "backbone": "backbone",
        "bootstrap": "bootstrap",
        "d3": "d3.v3",
        "d3.tip": "d3.tip",
        "topojson": "topojson.min"
    },
    shim: {
        "underscore": {
            exports: "_"
        },
        "backbone": {
            deps: ["underscore", "jquery"],
            exports: "Backbone"
        },
        bootstrap: {
            deps: ["jquery"]
        },
        "d3": {
            exports: "d3"
        },
        "d3.tip": {
            deps: ["d3"],
            exports: "d3.tip"
        },
        "topojson": {
            deps: ["d3"],
            exports: "topojson"
        }
    }
});

require([
    "jquery",
    "underscore",
    "backbone",
    "d3",
    "topojson"
], function(
    $,
    _,
    Backbone,
    d3,
    topojson
) {
    var width = 400,
        height = 600,
        svg = d3.select("svg#philippines")
            .attr("width", width)
            .attr("height", height);
    d3.json("json/ph.json", function(error, ph) {
        var datum = topojson.feature(ph, ph.objects.places),
            center = d3.geo.centroid(datum),
            scale = 150,
            projection = d3.geo.mercator().scale(scale)
                .center(center).translate([width / 2, height / 2]),
            path = d3.geo.path().projection(projection);

        var bounds  = path.bounds(datum),
            hscale  = scale*width  / (bounds[1][0] - bounds[0][0]),
            vscale  = scale*height / (bounds[1][1] - bounds[0][1]),
            scale   = (hscale < vscale) ? hscale : vscale,
            offset  = [width - (bounds[0][0] + bounds[1][0])/2,
            height - (bounds[0][1] + bounds[1][1])/2];
        
        projection = d3.geo.mercator().center(center)
            .scale(scale).translate(offset);
        path = path.projection(projection);
        svg.append("path").datum(datum)
            .attr("d", path)
            .attr("fill", "#fdf6e3")
            .attr("stroke", "#eee8d5");
    });

});