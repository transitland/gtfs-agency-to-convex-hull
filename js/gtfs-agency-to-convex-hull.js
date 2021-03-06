_.mixin(_.str.exports());

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
  } else {
    $('#parse-errors').hide();

    var stops = turf.featurecollection(_.map(parsedCsv.data, function(row) {
      return turf.point(row.stop_lon, row.stop_lat);
    }))

    var convexHull = turf.convex(stops);

    geojsonLayer.clearLayers();
    geojsonLayer.addData(convexHull);
    geojsonLayer.addData(stops);
    map.fitBounds(geojsonLayer.getBounds());
    $('#convex-hull-geojson').html(JSON.stringify(convexHull));

    computeAndOutputGeohash(stops);
  }
}

computeAndOutputGeohash = function(stops) {
  var centroid = turf.centroid(stops);
  var geohash = Geohash.encode(centroid.geometry.coordinates[1], centroid.geometry.coordinates[0], 6)
  var stops_bbox_area = polygonArea(turf.bboxPolygon(turf.extent(stops)).geometry.coordinates);
  var geohash_bbox_area;
  do {
    geohash = geohash.substring(0, geohash.length - 1);
    geohash_bbox = Geohash.bounds(geohash);
    geohash_bbox_area = polygonArea([[
      [geohash_bbox.sw.lon, geohash_bbox.sw.lat],
      [geohash_bbox.sw.lon, geohash_bbox.ne.lat],
      [geohash_bbox.ne.lon, geohash_bbox.ne.lat],
      [geohash_bbox.ne.lon, geohash_bbox.sw.lat],
      [geohash_bbox.sw.lon, geohash_bbox.sw.lat]
    ]]);
  } while (geohash_bbox_area <= stops_bbox_area)
  $('#geohash').text(geohash);
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
  geojsonLayer = L.geoJson(null, {
    pointToLayer: function (feature, latlng) {
      return L.circleMarker(latlng, {
        radius: 2,
        fillColor: "#ff7800",
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
      });
    }
  }).addTo(map);

  /* GTFS feed zip archive upload */
  $("#gtfs-file-upload").on("change", function(event) {
    var gtfsFile = event.target.files[0];
    var fileReader = new FileReader();
    fileReader.onload = function(fileLoadedEvent) {
      var zip = new JSZip(fileLoadedEvent.target.result);
      var fileNames = _.keys(zip.files);
      var stopsTxtFullFileName = _.find(fileNames, function(fileName) { return _(fileName).endsWith("stops.txt") })
      var stopsTxt = zip.file(stopsTxtFullFileName).asText();
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
