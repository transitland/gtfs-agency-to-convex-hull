# gtfs-agency-to-convex-hull

**What**: a little one page JavaScript application that takes the `stops.txt` file from a [GTFS](https://developers.google.com/transit/gtfs/) feed, computes a [convex hull](http://en.wikipedia.org/wiki/Convex_hull) around all the stop locations, outputs that polygon as GeoJSON, and plots it on a map.

**Why**: if you don't have boundaries for a transit agencies service region, it's helpful to be able to easily approximate that based on where their stops are located.

**How**: Go to http://transit-land.github.io/gtfs-agency-to-convex-hull/ and paste in the contents of a `stops.txt` file from a GTFS feed.
