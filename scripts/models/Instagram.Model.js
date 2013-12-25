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
  // lat & lon for philippines
  var minLat = 5,
    maxLat = 20,
    minLon = 115,
    maxLon = 130;
  return Backbone.Model.extend({
    fetch: function() {
      var that = this;
      d3.json("json/instagram.json", function(response) {
        var instagram = _.chain(response)
          .filter(function(obj) {
            return obj.location
              && (obj.location.latitude > minLat)
              && (obj.location.latitude < maxLat)
              && (obj.location.longitude > minLon)
              && (obj.location.longitude < maxLon);
          }).sortBy(function(obj) {
            return obj.like_count;
          }).last(200).value(),
          grouped = {};
          _.chain(instagram)
            .groupBy(function(obj) {
              return obj.location.latitude.toFixed(1);
            }).each(function(val, lat) {
              _.each(val, function(obj) {
                var lon = obj.location.longitude.toFixed(1);
                if (grouped[lat + "," + lon]) {
                  grouped[lat + "," + lon].push(obj);
                } else {
                  grouped[lat + "," + lon] = [obj];
                }
              });
            });
        that.set({data:instagram, grouped: grouped});
      });
    }
  });
});