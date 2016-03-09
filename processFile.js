var trackingParser = require('./tracking-parser'),
    mapMatching = require('./map-matching'),
    timeTravelCalculate = require('./time-travel-calculate');

trackingParser("./samples/points.txt", function(traking){
  mapMatching(traking, function(route, traking){
    timeTravelCalculate(route, traking, function(route){
      route.links.map(function(e){
        delete e.wpts;
        var geometry = JSON.parse(e.geometry)
        // console.log(JSON.stringify(e));
        console.log(e.id+';'+JSON.stringify(geometry.coordinates)+';'+e.total_time+';'+e.totalLength+';'+e.entry_time);
      })
    });
  })
})

//trackingParser -> mapMatching -> timeTravelCalculate -> write in database
