const launch = {
  id: "test",
  flightClubData: {
    trajectoryPoints: [],
    telemetry: {
      maxAltitude: 550,
      maxVelocity: 7800,
      maxDownrange: 8500
    },
    skyPosition: {
      azimuth: 45,
      elevation: 30,
      distance: 1200
    }
  }
};
console.log("Expected launch data structure:", JSON.stringify(launch, null, 2));
