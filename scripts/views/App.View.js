define([
  "jquery",
  "underscore",
  "backbone",
  "d3",
  "mediator",
  "app/models/Country.Model",
  "app/models/Yolanda.Model",
  "app/models/Assistance.Model"
], function(
  $,
  _,
  Backbone,
  d3,
  mediator,
  CountryModel,
  YolandaModel,
  AssistanceModel
) {
  return Backbone.View.extend({
    initialize: function() {
      this.countryModel = new CountryModel();
      this.yolandaModel = new YolandaModel();
      this.assistanceModel = new AssistanceModel();

      this.svg = {};
      this.svg.country = d3.select($("g#country")[0]).datum({});
      this.svg.zoom = d3.select($("g#zoom")[0]).datum({});

      this.countryModel.on("change:projection", _.bind(this.fetchRest, this));
      this.countryModel.on("change:projection", _.bind(this.renderCountry, this));
      this.yolandaModel.on("change:data", _.bind(this.renderYolanda, this));
      this.assistanceModel.on("change:data", _.bind(this.renderAssistance, this));
    },
    fetchRest: function() {
      this.yolandaModel.fetch();
      this.assistanceModel.fetch();
    },
    render: function() {
      this.countryModel.fetch();
    },
    renderCountry: function() {
      var projection = this.countryModel.get("projection"),
        data = this.countryModel.get("data"),
        path = this.countryModel.get("path").projection(projection);
      this.svg.country.append("path")
        .classed("ph", true).datum(data)
        .attr("d", path)
        .attr("fill", "#fafafa")
        .attr("stroke", "#aaa");
      this.svg.zoom.append("path")
        .classed("ph", true).datum(data)
        .attr("d", path)
        .attr("stroke", "#aaa")
        .attr("fill", "none");
    },
    renderYolanda: function() {
      var projection = this.countryModel.get("projection"),
        data = this.yolandaModel.get("data"),
        line = d3.svg.line()
          .x(function(d) {return projection([d.attributes.LON, d.attributes.LAT])[0]})
          .y(function(d) {return projection([d.attributes.LON, d.attributes.LAT])[1]})
          .interpolate("basis"),
        that = this;
      this.svg.country.append("path")
        .datum(data).classed("typhoon", true)
        .attr("stroke", app.colors.maroon)
        .attr("fill", "none")
        .attr("d", line)
        .attr("stroke-width", 2)
        .attr("opacity", .5);
      this.svg.zoom.append("path")
        .datum(data).classed("typhoon", true)
        .attr("stroke", app.colors.maroon)
        .attr("fill", "none")
        .attr("d", line)
        .attr("stroke-width", 2)
        .attr("opacity", .5);
      this.svg.country.selectAll('circle.typhoon')
        .data(data).enter().append("circle")
        .classed("typhoon", true)
        .attr("transform", function(d) {
            var positions = projection([d.attributes.LON, d.attributes.LAT]);
            return "translate(" + positions[0] + ", " + positions[1] + ")";
        }).attr("r", 3)
        .attr("fill", app.colors.maroon)
        .attr("stroke", "none");
      this.svg.zoom.selectAll('circle.typhoon')
        .data(data).enter().append("circle")
        .classed("typhoon", true)
        .attr("transform", function(d) {
            var positions = projection([d.attributes.LON, d.attributes.LAT]);
            return "translate(" + positions[0] + ", " + positions[1] + ")";
        }).attr("r", 3)
        .attr("fill", app.colors.maroon)
        .attr("stroke", "none");
      this.scale = app.scale;
      this.typhoonIndex = app.typhoonIndex;
      this.typhoonCoordsOriginal = _.map(data, function(d) {
        return {
          x: projection([d.attributes.LON, d.attributes.LAT])[0],
          y: projection([d.attributes.LON, d.attributes.LAT])[1]
        }
      });
      this.typhoonCoords = _.map(data, function(d) {
        var x = projection([d.attributes.LON, d.attributes.LAT])[0],
          y = projection([d.attributes.LON, d.attributes.LAT])[1];
        return {
            x: (-x + (app.height / that.scale)) * (that.scale / 2),
            y: (-y + (app.height / that.scale)) * (that.scale / 2)
        }
      });

    },
    renderAssistance: function() {
      var projection = this.countryModel.get("projection"),
        data = this.assistanceModel.get("data"),
        path = d3.geo.path().projection(projection);
        max = _.chain(data.features)
          .pluck("properties").pluck("ASST_TOT").max().value(),
        scale = d3.scale.linear().domain([0, max])
          .range([0, 1]);

      this.svg.assistance = this.svg.zoom
        .insert("g", "path.ph")
        .classed("assistance", true);

      this.svg.assistance
        .selectAll("path").data(data.features)
        .enter().append("path")
        .attr("d", path)
        .attr("stroke", app.colors.green1)
        .attr("fill", app.colors.green1)
        .attr("fill-opacity", function(d) {
          return scale(d.properties.ASST_TOT);
        });

      this.renderZoom();
    },
    renderZoom: function() {
      var projection = this.countryModel.get("projection"),
        data = this.yolandaModel.get("data")[this.typhoonIndex],
        positions = projection([data.attributes.LON, data.attributes.LAT]),
        coords = this.typhoonCoords[this.typhoonIndex];

      this.svg.zoom.attr("transform", 
          "translate(" + coords.x + "," + coords.y + ")" + "scale(" + (app.scale / 2) + ")");
      this.svg.zoom.selectAll("path").style("stroke-width", 2 / app.scale + "px")
      this.svg.drop = this.svg.country.append("circle")
        .classed("drop", true)
        .attr("r", app.height / app.scale)
        .attr("transform", "translate(" + positions[0] + ", " + positions[1] + ")")
        .attr("stroke", "none")
        .attr("fill", "transparent")
        .call(this.drag())
        .call(this.zoom());
      this.svg.dropDrag = this.svg.country.append("circle")
        .classed("dropDrag", true)
        .attr("r", app.height / app.scale)
        .attr("transform", "translate(" + positions[0] + ", " + positions[1] + ")")
        .attr("fill", "none")
        .attr("stroke", "#999")
        .attr("stroke-width", 3)
        .call(this.dropDrag());
      this.svg.zoom.append("rect")
        .classed("overlay", true)
        .attr("width", app.height)
        .attr("height", app.height)
        .attr("opacity", 0);
        // .call(this.zoom(coords.x, coords.y));
      this.dropCoords = [positions[0], positions[1]];
      this.zoomCoords = [coords.x, coords.y];
    },
    // zoom: function(x, y) {
    //   var that = this,
    //     typhoonCoords = this.typhoonCoords || [],
    //     zoom = d3.behavior.zoom()
    //       .size([app.height, app.height])
    //       .scale(app.scale / 2)
    //       .translate([x, y])
    //       .center([app.height / 2, app.height / 2])
    //       .scaleExtent([1.5, 8])
    //       .on("zoomstart", function() {
    //         that.svg.zoom.attr("transform", "translate(" + that.zoomCoords[0] + "," + that.zoomCoords[1] + ")scale(" + (that.scale / 2) + ")");
    //       }).on("zoom", function() {
    //         var newX = d3.event.translate[0],
    //           newY = d3.event.translate[1],
    //           scale = d3.event.scale,
    //           slope,
    //           countryX, countryY;
    //         if ((that.scale / 2) !== scale) {
    //           typhoonCoords = that.getTyphoonCoords(scale * 2);
    //           that.scale = scale * 2;
    //         }
    //         if (newX > typhoonCoords[that.typhoonIndex].x) {
    //           that.typhoonIndex += 1;
    //         } else if (typhoonCoords[that.typhoonIndex - 1].x > newX) {
    //           that.typhoonIndex -= 1;
    //         }
    //         slope = (typhoonCoords[that.typhoonIndex].y - typhoonCoords[that.typhoonIndex - 1].y) / (typhoonCoords[that.typhoonIndex].x - typhoonCoords[that.typhoonIndex - 1].x);
    //         newY = (newX - typhoonCoords[that.typhoonIndex - 1].x) * slope + typhoonCoords[that.typhoonIndex - 1].y;
    //         radius = app.height / (scale * 2);
    //         countryX = -((newX / scale) - radius);
    //         countryY = -((newY / scale) - radius);

    //         that.zoomCoords[0] = newX;
    //         that.zoomCoords[1] = newY;
    //         that.svg.zoom.attr("transform", "translate(" + newX + "," + newY + ")scale(" + d3.event.scale + ")");
    //         that.dropCoords[0] = countryX;
    //         that.dropCoords[1] = countryY;
    //         that.svg.drop.attr("r", radius)
    //           .attr("transform", "translate(" + countryX + "," + countryY + ")");
    //         that.svg.dropDrag.attr("r", radius)
    //           .attr("transform", "translate(" + countryX + "," + countryY + ")");
    //       }).on("zoomend", function() {
    //         var scale = parseFloat(that.svg.zoom.attr("transform").split("scale(")[1].split(")")[0]);
    //         that.svg.zoom.selectAll("path").style("stroke-width", 1 / scale + "px");
    //       });

    //   return zoom;
    // },
    zoom: function() {
      var that = this,
        typhoonCoords = this.typhoonCoords || [],
        zoom = d3.behavior.zoom()
          .on("zoom", function() {
            var radius = (app.height / that.scale) * d3.event.scale,
              scale, newX, newY;

            radius = (radius > (app.width / 2) ? app.width / 2 : (radius < 20 ? 20 : radius));
            scale = app.height / radius;
            newX = (-that.dropCoords[0] + (app.height / scale)) * (scale / 2);
            newY = (-that.dropCoords[1] + (app.height / scale)) * (scale / 2);

            that.zoomCoords[0] = newX;
            that.zoomCoords[1] = newY;
            that.svg.drop.attr("r", radius);
            that.svg.dropDrag.attr("r", radius);

            that.scale = scale;
            that.svg.zoom.attr("transform", "translate(" + newX + "," + newY + ")scale(" + (that.scale / 2) + ")");
          }).on("zoomend", function() {
            var scale = parseFloat(that.svg.zoom.attr("transform").split("scale(")[1].split(")")[0]);
            that.svg.zoom.selectAll("path").style("stroke-width", 1 / scale + "px");
          });

      return zoom;
    },
    drag: function() {
      var that = this,
        typhoonCoords = this.typhoonCoordsOriginal || [],
        drag = d3.behavior.drag()
          .on("drag", function() {
            var x = (d3.event.x > app.width ? app.width : (d3.event.x < 0 ? 0 : d3.event.x)),
              y, slope, newX, newY;
            if (x < typhoonCoords[that.typhoonIndex].x) {
              that.typhoonIndex += 1;
            } else if (typhoonCoords[that.typhoonIndex - 1].x < x) {
              that.typhoonIndex -= 1;
            }
            slope = (typhoonCoords[that.typhoonIndex].y - typhoonCoords[that.typhoonIndex - 1].y) / (typhoonCoords[that.typhoonIndex].x - typhoonCoords[that.typhoonIndex - 1].x);
            y = (x - typhoonCoords[that.typhoonIndex - 1].x) * slope + typhoonCoords[that.typhoonIndex - 1].y;

            that.svg.drop.attr("transform", function() {
                  return "translate(" + x + "," + y + ")";
              });
            that.svg.dropDrag.attr("transform", function() {
                  return "translate(" + x + "," + y + ")";
              });
            that.dropCoords[0] = x;
            that.dropCoords[1] = y;

            newX = (-x + (app.height / that.scale)) * (that.scale / 2);
            newY = (-y + (app.height / that.scale)) * (that.scale / 2);
            that.zoomCoords[0] = newX;
            that.zoomCoords[1] = newY;
            that.svg.zoom.attr("transform", "translate(" + newX + "," + newY + ")scale(" + (that.scale / 2) + ")");
          });
      return drag;
    },
    dropDrag: function() {
      var that = this,
        drag = d3.behavior.drag()
          .on("drag", function() {
            var dx = Math.abs(d3.event.x - that.dropCoords[0]),
              dy = Math.abs(d3.event.y - that.dropCoords[1]),
              radius = Math.sqrt(dx*dx + dy*dy),
              scale, newX, newY;

            radius = (radius > (app.width / 2) ? app.width / 2 : (radius < 20 ? 20 : radius));
            scale = app.height / radius;
            newX = (-that.dropCoords[0] + (app.height / scale)) * (scale / 2);
            newY = (-that.dropCoords[1] + (app.height / scale)) * (scale / 2);

            that.zoomCoords[0] = newX;
            that.zoomCoords[1] = newY;
            that.svg.drop.attr("r", radius);
            that.svg.dropDrag.attr("r", radius);

            that.scale = scale;
            that.svg.zoom.attr("transform", "translate(" + newX + "," + newY + ")scale(" + (that.scale / 2) + ")");
          }).on("dragend", function() {
            var scale = parseFloat(that.svg.zoom.attr("transform").split("scale(")[1].split(")")[0]);
            that.svg.zoom.selectAll("path").style("stroke-width", 1 / scale + "px");
          })
      return drag;
    },
    getTyphoonCoords: function(scale) {
      var that = this;
      this.typhoonCoords = _.map(this.typhoonCoords, function(d) {
        return {
          x: ((d.x * 2 / that.scale - (app.height / that.scale)) + (app.height / scale)) * (scale / 2),
          y: ((d.y * 2 / that.scale - (app.height / that.scale)) + (app.height / scale)) * (scale / 2)
        }
      });
      return this.typhoonCoords;
    }
  })
});