define([
  "jquery",
  "underscore",
  "backbone",
  "d3",
  "mediator",
  "app/models/Country.Model",
  "app/models/Yolanda.Model",
  "app/models/Assistance.Model",
  "app/models/Instagram.Model",
  "text!app/templates/Image.Template.html",
  "text!app/templates/ImageModal.Template.html"
], function(
  $,
  _,
  Backbone,
  d3,
  mediator,
  CountryModel,
  YolandaModel,
  AssistanceModel,
  InstagramModel,
  ImageTemplate,
  ImageModalTemplate
) {
  return Backbone.View.extend({
    initialize: function() {
      this.countryModel = new CountryModel();
      this.yolandaModel = new YolandaModel();
      this.assistanceModel = new AssistanceModel();
      this.instagramModel = new InstagramModel();

      this.svg = {};
      this.svg.country = d3.select($("g#country")[0]).datum({});
      this.svg.zoom = d3.select($("g#zoom")[0]).datum({});

      this.countryModel.on("change:projection", _.bind(this.fetchRest, this));
      this.countryModel.on("change:projection", _.bind(this.renderCountry, this));
      this.yolandaModel.on("change:data", _.bind(this.renderYolanda, this));
      this.assistanceModel.on("change:data", _.bind(this.renderAssistance, this));
      this.instagramModel.on("change:data", _.bind(this.renderInstagram, this));
    },
    fetchRest: function() {
      var projection = this.countryModel.get("projection");
      this.yolandaModel.fetch();
      this.assistanceModel.fetch();
      this.instagramModel.fetch(projection);
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
        .attr("fill", "#fff")
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
        .attr("stroke", app.colors.green1)
        .attr("fill", "none")
        .attr("d", line)
        .attr("stroke-width", 2)
        .attr("opacity", .5);
      this.svg.zoom.append("path")
        .datum(data).classed("typhoon", true)
        .attr("stroke", app.colors.green1)
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
        .attr("fill", app.colors.green1)
        .attr("stroke", "none");
      this.svg.zoom.selectAll('circle.typhoon')
        .data(data).enter().append("circle")
        .classed("typhoon", true)
        .attr("transform", function(d) {
            var positions = projection([d.attributes.LON, d.attributes.LAT]);
            return "translate(" + positions[0] + ", " + positions[1] + ")";
        }).attr("r", 3)
        .attr("fill", app.colors.green1)
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
        .attr("stroke-width", 2)
        .call(this.dropDrag());
      this.dropCoords = [positions[0], positions[1]];
      this.zoomCoords = [coords.x, coords.y];
    },
    renderInstagram: function() {
      var imageSize = 5,
        instagram = this.instagramModel.get("data"),
        grouped = this.instagramModel.get("grouped"),
        projection = this.countryModel.get("projection");
      this.svg.country.selectAll('circle.instagram')
          .data(_.values(grouped)).enter().insert("circle", "circle.drop")
          .classed("instagram", true)
          .attr("transform", function(d) {
              var positions = projection([d[0].location.longitude.toFixed(1), d[0].location.latitude.toFixed(1)]);
              return "translate(" + positions[0] + ", " + positions[1] + ")";
          }).attr("r", function(d) {
            return d.length;
          }).attr("fill", app.colors.instagram)
          .attr("opacity", .5);
      this.svg.zoom.append("clipPath")
          .attr("id", "clipCircle")
          .append("circle")
          .attr("r", imageSize / 2)
          .attr("cx", imageSize / 2)
          .attr("cy", imageSize / 2);
      this.svg.zoom.selectAll('image.instagram')
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
          }).attr("opacity", .25)
          .attr("clip-path", "url('#clipCircle')");

      this.filterInstagram();
    },
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

            that.getTyphoonCoords(scale);
            that.scale = scale;
            that.svg.zoom.attr("transform", "translate(" + newX + "," + newY + ")scale(" + (that.scale / 2) + ")");
            
            that.filterInstagram();
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
          
            that.filterInstagram();
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

            that.getTyphoonCoords(scale);
            that.scale = scale;
            that.svg.zoom.attr("transform", "translate(" + newX + "," + newY + ")scale(" + (that.scale / 2) + ")");

            that.filterInstagram();
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
    },
    filterInstagram: function() {
      var radius = app.height / this.scale,
        x1 = this.dropCoords[0] - radius,
        x2 = this.dropCoords[0] + radius,
        y1 = this.dropCoords[1] - radius,
        y2 = this.dropCoords[1] + radius,
        grouped = this.instagramModel.get("grouped"),
        mouseover = function(e) {
            $(e.target).siblings(".instaCaption").css("opacity", 1);
            $(e.target).siblings(".instaCaption").css("height", "195px");

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

            $(".modal").html(_.template(ImageModalTemplate, {
                name: name,
                like_count: like_count,
                date: date,
                url: url,
                caption: caption
            }));
            $(".modal").modal("show");
        };

      $("#instagram").empty();
      _.each(grouped, function(val, key) {
        var groupX = parseFloat(key.split(",")[0]),
          groupY = parseFloat(key.split(",")[1]);
        if (groupX > x1 && groupX < x2 && groupY > y1 && groupY < y2) {
          _.each(val, function(image) {
            $("#instagram").prepend(_.template(ImageTemplate, image));
          });
        }
      });

      $(".instaHover").mouseenter(mouseover);
      $(".instaHover").mouseleave(mouseleave);
      $(".instaHover").click(clickHover);
    }
  })
});