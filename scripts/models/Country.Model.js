define([
  "jquery",
  "underscore",
  "backbone",
  "d3",
  "mediator",
  "topojson"
], function(
  $,
  _,
  Backbone,
  d3,
  mediator,
  topojson
) {
  return Backbone.Model.extend({
    fetch: function() {
      var that = this;
      d3.json("json/ph.json", function(error, json) {
        var width = app.width,
          height = app.countryHeight,
          datum = topojson.feature(json, json.objects.places),
          center = d3.geo.centroid(datum),
          scale = 150,
          projection = d3.geo.mercator().scale(scale)
              .center(center).translate([width / 2, height / 2]),
          path = d3.geo.path().projection(projection),
          bounds  = path.bounds(datum),
          hscale  = scale*width  / (bounds[1][0] - bounds[0][0]),
          vscale  = scale*height / (bounds[1][1] - bounds[0][1]),
          scale   = (hscale < vscale) ? hscale : vscale,
          offset  = [width - (bounds[0][0] + bounds[1][0])/2,
            height - (bounds[0][1] + bounds[1][1])/2];

        projection = d3.geo.mercator().center(center)
          .scale(scale).translate(offset);

        that.set({data: datum, path: path, projection: projection});
      });
    }
  });
});