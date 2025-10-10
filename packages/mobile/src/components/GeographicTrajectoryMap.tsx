import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { colors, typography } from '../theme';

interface TrajectoryPoint {
  latitude: number;
  longitude: number;
  altitude?: number;
  time?: number;
}

interface LaunchSite {
  latitude: number;
  longitude: number;
  name: string;
}

interface GeographicTrajectoryMapProps {
  trajectoryPoints?: TrajectoryPoint[];
  launchSite?: LaunchSite;
  bermudaLocation?: { latitude: number; longitude: number };
}

const GeographicTrajectoryMap: React.FC<GeographicTrajectoryMapProps> = ({
  trajectoryPoints = [],
  launchSite,
  bermudaLocation = { latitude: 32.3078, longitude: -64.7505 }
}) => {
  if (trajectoryPoints.length === 0 && !launchSite) {
    return (
      <View style={styles.container}>
        <Text style={styles.noDataText}>Geographic trajectory data not available</Text>
      </View>
    );
  }

  const screenWidth = Dimensions.get('window').width;
  const mapHeight = 300;

  // Calculate map region to fit trajectory
  const calculateRegion = () => {
    const points = [
      bermudaLocation,
      launchSite ? { latitude: launchSite.latitude, longitude: launchSite.longitude } : null,
      ...trajectoryPoints
    ].filter(p => p !== null) as { latitude: number; longitude: number }[];

    if (points.length === 0) {
      return {
        latitude: bermudaLocation.latitude,
        longitude: bermudaLocation.longitude,
        latitudeDelta: 10,
        longitudeDelta: 10
      };
    }

    const lats = points.map(p => p.latitude);
    const lons = points.map(p => p.longitude);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);

    const latDelta = (maxLat - minLat) * 1.5; // Add 50% padding
    const lonDelta = (maxLon - minLon) * 1.5;

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLon + maxLon) / 2,
      latitudeDelta: Math.max(latDelta, 1),
      longitudeDelta: Math.max(lonDelta, 1)
    };
  };

  const initialRegion = calculateRegion();

  // Convert trajectory points to polyline coordinates
  const trajectoryCoordinates = trajectoryPoints.map(p => ({
    latitude: p.latitude,
    longitude: p.longitude
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Trajectory Map</Text>

      <MapView
        style={[styles.map, { width: screenWidth - 32, height: mapHeight }]}
        provider={PROVIDER_DEFAULT}
        initialRegion={initialRegion}
        showsUserLocation={false}
        showsMyLocationButton={false}
      >
        {/* Bermuda marker */}
        <Marker
          coordinate={bermudaLocation}
          title="Bermuda"
          description="Observation location"
          pinColor="#4ECDC4"
        />

        {/* Launch site marker */}
        {launchSite && (
          <Marker
            coordinate={{
              latitude: launchSite.latitude,
              longitude: launchSite.longitude
            }}
            title={launchSite.name}
            description="Launch site"
            pinColor="#FF6B6B"
          />
        )}

        {/* Trajectory path */}
        {trajectoryCoordinates.length > 0 && (
          <Polyline
            coordinates={trajectoryCoordinates}
            strokeColor={colors.primary}
            strokeWidth={3}
            lineDashPattern={[10, 5]}
          />
        )}

        {/* Final position marker */}
        {trajectoryCoordinates.length > 0 && (
          <Marker
            coordinate={trajectoryCoordinates[trajectoryCoordinates.length - 1]}
            title="Final Position"
            pinColor={colors.warning}
          />
        )}
      </MapView>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FF6B6B' }]} />
          <Text style={styles.legendText}>Launch Site</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#4ECDC4' }]} />
          <Text style={styles.legendText}>Bermuda</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendLine]} />
          <Text style={styles.legendText}>Trajectory</Text>
        </View>
      </View>

      {/* Stats */}
      {trajectoryPoints.length > 0 && (
        <View style={styles.stats}>
          <Text style={styles.statsText}>
            Trajectory points: {trajectoryPoints.length}
          </Text>
          {trajectoryPoints[0].altitude !== undefined && (
            <Text style={styles.statsText}>
              Max altitude: {Math.max(...trajectoryPoints.map(p => p.altitude || 0)).toFixed(0)} km
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    ...typography.subtitle,
    color: colors.textPrimary,
    marginBottom: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  map: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendLine: {
    width: 20,
    height: 3,
    backgroundColor: colors.primary,
    marginRight: 6,
  },
  legendText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
  },
  stats: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statsText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  noDataText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default GeographicTrajectoryMap;
