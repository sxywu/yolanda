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
    "d3.tip",
    "topojson"
], function(
    $,
    _,
    Backbone,
    d3,
    tip,
    topojson
) {
    var width = 900,
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
            path = d3.geo.path().projection(projection),
            circle,
            bounds  = path.bounds(datum),
            hscale  = scale*width  / (bounds[1][0] - bounds[0][0]),
            vscale  = scale*height / (bounds[1][1] - bounds[0][1]),
            scale   = (hscale < vscale) ? hscale : vscale,
            offset  = [width - (bounds[0][0] + bounds[1][0])/2,
            height - (bounds[0][1] + bounds[1][1])/2],
            tip = d3.tip().attr('class', 'd3-tip')
                .direction("e")
                .html(function(d) {
                    return d.attributes.MONTH + " " + d.attributes.DAY + ", " + d.attributes.HHMM; 
                });

        projection = d3.geo.mercator().center(center)
            .scale(scale).translate(offset);
        path = path.projection(projection);
        circle = d3.geo.circle();
        svg.append("path").datum(datum)
            .attr("d", path)
            .attr("fill", "#fdf6e3")
            .attr("stroke", "#eee8d5");

        d3.json("json/yolanda.json", function(json) {
            svg.selectAll('circle.typhoon')
                .data(json.features).enter().append("circle")
                .classed("typhoon", true)
                .attr("transform", function(d) {
                    console.log();
                    var positions = projection([d.attributes.LON, d.attributes.LAT]);
                    return "translate(" + positions[0] + ", " + positions[1] + ")";
                }).attr("r", function(d) {
                    return d.attributes.INTENSITY / 2;
                }).attr("fill", "#268bd2")
                .attr("opacity", 0.25)
                .attr("stroke", "#6c71c4")
                .attr("stroke-width", 3)
                .call(tip)
                .on("mouseover", tip.show)
                .on("mouseleave", tip.hide);
        });
    });

    

});