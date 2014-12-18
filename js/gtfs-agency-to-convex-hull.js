var map,
    geojsonLayer;

turnStopsTxtIntoGeoJson = function(stopsTxt) {
  stopsTxt = stopsTxt.replace(/^\s+|\s+$/g, ""); // remove blank lines at end
  var parsedCsv = Papa.parse(stopsTxt, { header: true, dynamicTyping: true });
  if (parsedCsv.errors && parsedCsv.errors.length > 0) {
    $('#parse-errors').empty();
    _.each(parsedCsv.errors, function(error) {
      $('#parse-errors').append("<li>" + error.message + "</li>");
    });
    $('#parse-errors').show();
    debugger
  } else {
    $('#parse-errors').hide();
    var convexHull = new ConvexHullGrahamScan();
    _.each(parsedCsv.data, function(row) {
      convexHull.addPoint(row.stop_lon, row.stop_lat); 
    });
    var hullPoints = convexHull.getHull();
    var geojsonPolygonCoordinates = _.map(hullPoints, function(point) {
      return [point.x, point.y];
    });
    geojsonPolygonCoordinates.push(_.first(geojsonPolygonCoordinates));
    var geojson = {
      "type": "FeatureCollection",
      "features": [
        {
          "type": "Feature",
          "properties": {},
          "geometry": {
            "type": "Polygon",
            "coordinates": [geojsonPolygonCoordinates]
          }
        }
      ]
    };
    geojsonLayer.clearLayers();
    geojsonLayer.addData(geojson);
    map.fitBounds(geojsonLayer.getBounds());
    $('#convex-hull-geojson').html(JSON.stringify(geojson));
  }
}

$(document).ready(function() {
  /* map */
  map = L.map('convex-hull-map', {
    dragging: false,
    touchZoom: false,
    doubleClickZoom: false,
    boxZoom: false,
    tap: false,
    keyboard: false,
    zoomControl: false,
    attributionControl: false
  }).setView([37.749, -122.443], 12);
  var credits = L.control.attribution().addTo(map);
  credits.addAttribution("<a href='https://www.mapbox.com/about/maps/' target='_blank'>&copy; Mapbox &copy; OpenStreetMap</a> <a class='mapbox-improve-map' href='https://www.mapbox.com/map-feedback/' target='_blank'>Improve this map</a>");
  L.tileLayer('https://{s}.tiles.mapbox.com/v3/randyme.k5036ipp/{z}/{x}/{y}.png', {
    maxZoom: 18
  }).addTo(map);
  geojsonLayer = L.geoJson().addTo(map);

  /* GTFS feed zip archive upload */
  $("#gtfs-file-upload").on("change", function(event) {
    var gtfsFile = event.target.files[0];
    var fileReader = new FileReader();
    fileReader.onload = function(fileLoadedEvent) {
      var zip = new JSZip(fileLoadedEvent.target.result);
      var stopsTxt = zip.file("stops.txt").asText();
      turnStopsTxtIntoGeoJson(stopsTxt);
    };
    fileReader.readAsArrayBuffer(gtfsFile);
  });

  /* paste in stops.txt text */
  $("#gtfs-stops-file").on("change keyup paste", function() {
    var rawCsv = $("#gtfs-stops-file").val();
    turnStopsTxtIntoGeoJson(rawCsv);
  });
});
