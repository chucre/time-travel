var trackingParser = require('./tracking-parser'),
    mapMatching = require('./map-matching'),
    timeTravelCalculate = require('./time-travel-calculate');

trackingParser("./sample/points.txt", function(traking){
  mapMatching(traking, function(route, traking){
    timeTravelCalculate(route, traking, function(route){
      route.links.map(function(e){
        delete e.wpts;
      })
      console.log(JSON.stringify(route));
    });
  })
})

//trackingParser -> mapMatching -> timeTravelCalculate -> write in database
