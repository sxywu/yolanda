require.config({
    baseUrl: "scripts/contrib/",
    paths: {
        "app": "..",
        "underscore": "underscore",
        "backbone": "backbone",
        "bootstrap": "bootstrap",
        "d3": "d3.v3",
        "d3.tip": "d3.tip",
        "topojson": "topojson.min",
        "mediator": "backbone-mediator"
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
        },
        "mediator": {
            deps: ["underscore", "backbone"],
            exports: "mediator"
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
    "app/views/App.View",
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
    AppView,
    ImageTemplate,
    ImageModalTemplate
) {
    var appView = new AppView();
    app = {};
    app.width = 350;
    app.countryHeight = 400;
    app.height = 250;
    app.scale = 8;
    app.typhoonIndex = 27;
    app.colors = {maroon: "#79504A", peach: "#B17370", brown: "#B6978C",
        green1: "#C9CF9B", green2: "#EDF7BE", instagram: "#517fa4"};
    appView.render();
});