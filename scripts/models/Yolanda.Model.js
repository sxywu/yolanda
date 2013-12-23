define([
  "jquery",
  "underscore",
  "backbone",
  "d3",
  "mediator"
], function(
  $,
  _,
  Backbone,
  d3,
  mediator
) {
  return Backbone.Model.extend({
    fetch: function() {
      var that = this;
      d3.json("json/yolanda.json", function(json) {
        var minLat = _.chain(json.features)
            .pluck("attributes").pluck("LAT").min().value(),
          maxLat = _.chain(json.features)
            .pluck("attributes").pluck("LAT").max().value(),
          minLon = _.chain(json.features)
            .pluck("attributes").pluck("LON").min().value(),
          maxLon = _.chain(json.features)
            .pluck("attributes").pluck("LON").max().value();

        that.set({data: json.features, 
          minLat: minLat, minLon: minLon,
          maxLat: maxLat, maxLon: maxLon
        })
      });
    }
  });
});