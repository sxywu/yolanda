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
      d3.json("json/assistance.json", function(json) {
        var datum = topojson.feature(json, json.objects.assistance);
        that.set({data: datum});
      });
    }
  });
});