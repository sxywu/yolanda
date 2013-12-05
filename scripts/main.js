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
    "bootstrap",
    "d3",
    "d3.tip",
    "topojson",
    "text!app/templates/Image.Template.html",
    "text!app/templates/ImageModal.Template.html"
], function(
    $,
    _,
    Backbone,
    bootstrap,
    d3,
    tip,
    topojson,
    ImageTemplate,
    ImageModalTemplate
) {
    var width = 275,
        height = 400,
        imageSize = 7.5,
        imageBigger = 450,
        dropSize = 45,
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
            line = d3.svg.line()
                .x(function(d) {return projection([d.attributes.LON, d.attributes.LAT])[0]})
                .y(function(d) {return projection([d.attributes.LON, d.attributes.LAT])[1]})
                .interpolate("basis"),
            bounds  = path.bounds(datum),
            hscale  = scale*width  / (bounds[1][0] - bounds[0][0]),
            vscale  = scale*height / (bounds[1][1] - bounds[0][1]),
            scale   = (hscale < vscale) ? hscale : vscale,
            offset  = [width - (bounds[0][0] + bounds[1][0])/2,
            height - (bounds[0][1] + bounds[1][1])/2],
            tip = d3.tip().attr('class', 'd3-tip')
                .direction("e")
                .style("pointer-events", "none")
                .html(function(d) {
                    d.caption = d.caption || "";
                    return _.template(ImageTemplate, d);
                }),
            mouseover = function(e) {
                $(e.target).siblings(".instaCaption").css("opacity", 1);
                $(e.target).siblings(".instaCaption").css("height", "190px");

                return false;
            },
            mouseleave = function(e) {
                $(e.target).siblings(".instaCaption").css("height", "0px");
                $(e.target).siblings(".instaCaption").css("opacity", 0);

                return false;
            },
            clickHover = function(e) {
                var $card = $(e.target).parent(),
                    name = $card.children(".instaName").text(),
                    like_count = $card.children(".instaLike").html(),
                    date = $card.children(".instaDate").text(),
                    url = $card.children(".instaImage").attr("src"),
                    caption = $card.children(".instaCaption").text();

                console.log(name, like_count, date, url, caption);
                $(".modal").html(_.template(ImageModalTemplate, {
                    name: name,
                    like_count: like_count,
                    date: date,
                    url: url,
                    caption: caption
                }));
                $(".modal").modal("show");
            };

        projection = d3.geo.mercator().center(center)
            .scale(scale).translate(offset);
        path = path.projection(projection);
        circle = d3.geo.circle();
        svg.append("path").datum(datum)
            .attr("d", path)
            .attr("fill", "#fafafa")
            .attr("stroke", "#aaa");

        d3.json("json/yolanda.json", function(json) {
        
            var minLat = _.chain(json.features)
                .pluck("attributes").pluck("LAT").min().value(),
                maxLat = _.chain(json.features)
                .pluck("attributes").pluck("LAT").max().value(),
                minLon = _.chain(json.features)
                .pluck("attributes").pluck("LON").min().value(),
                maxLon = _.chain(json.features)
                .pluck("attributes").pluck("LON").max().value();
            d3.json("json/instagram.json", function(instadata) {
                var instagram = _.chain(instadata)
                    .filter(function(obj) {
                        return obj.location
                        && (obj.location.latitude > minLat)
                        && (obj.location.latitude < maxLat)
                        && (obj.location.longitude > minLon)
                        && (obj.location.longitude < maxLon);
                    }).sortBy(function(obj) {
                        return obj.like_count;
                    }).last(50).value();

                svg.append("clipPath")
                    .attr("id", "clipCircle")
                    .append("circle")
                    .attr("r", imageSize / 2)
                    .attr("cx", imageSize / 2)
                    .attr("cy", imageSize / 2);
                svg.selectAll('image.instagram')
                    .data(instagram).enter().append("image")
                    .classed("instagram", true)
                    .attr("transform", function(d) {
                        var positions = projection([d.location.longitude, d.location.latitude]);
                        d.x = positions[0];
                        d.y = positions[1];
                        return "translate(" + positions[0] + ", " + positions[1] + ")";
                    }).attr("height", imageSize)
                    .attr("width", imageSize)
                    .attr("xlink:href", function(d) {
                        return d.image.url;
                    })
                    .attr("clip-path", "url('#clipCircle')");
            });
            svg.selectAll('circle.typhoon')
                .data(json.features).enter().append("circle")
                .classed("typhoon", true)
                .attr("transform", function(d) {
                    var positions = projection([d.attributes.LON, d.attributes.LAT]);
                    return "translate(" + positions[0] + ", " + positions[1] + ")";
                }).attr("r", 3)
                .attr("fill", "#073642")
                .attr("stroke", "none");
            svg.append("path")
                .datum(json.features).classed("typhoon", true)
                .attr("stroke", "#073642")
                .attr("fill", "none")
                .attr("d", line)
                .attr("stroke-width", 2)
                .attr("opacity", .5);

            var typhoonCoords = _.map(json.features, function(d) {
                    return {
                        x: projection([d.attributes.LON, d.attributes.LAT])[0],
                        y: projection([d.attributes.LON, d.attributes.LAT])[1]
                    }
                }),
                drag = d3.behavior.drag()
                .on("drag", function() {
                    var selection = this,
                        y,
                        x = (d3.event.x > width ? width : (d3.event.x < 0 ? 0 : d3.event.x));
                    $("#instagram").empty();
                    _.some(typhoonCoords, function(coords, i) {
                        if (x > coords.x) {
                            var slope = (coords.y - typhoonCoords[i - 1].y) / (coords.x - typhoonCoords[i - 1].x);
                            y = (x - typhoonCoords[i - 1].x) * slope + typhoonCoords[i - 1].y;
                            return true;
                        }
                    });
                    d3.select(this)
                        .attr("transform", function() {
                            return "translate(" + x + "," + y + ")";
                        });
                    var x1 = x - dropSize,
                        x2 = x + dropSize,
                        y1 = y - dropSize,
                        y2 = y + dropSize;
                    d3.selectAll("image.instagram").each(function(d) {
                        if (d.x > x1 && d.x < x2 && d.y > y1 && d.y < y2) {
                            d.caption = d.caption || "";
                            $("#instagram").prepend(_.template(ImageTemplate, d));
                        }
                    });
                    $(".instaHover").mouseenter(mouseover);
                    $(".instaHover").mouseleave(mouseleave);
                    $(".instaHover").click(clickHover);
                });

            svg.append("circle")
                .datum(json.features[26]).classed("drop", true)
                .attr("fill", "transparent")
                .attr("stroke", "#aaa")
                .attr("transform", function(d) {
                    var positions = projection([d.attributes.LON, d.attributes.LAT]);
                    return "translate(" + positions[0] + ", " + positions[1] + ")";
                }).attr("r", dropSize)
                .call(drag);


        });

    });
});