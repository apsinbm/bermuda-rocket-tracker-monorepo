import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import * as THREE from 'three';
import { colors, typography } from '../theme';

interface TrajectoryPoint {
  time: number;
  altitude: number;
  downrange: number;
  latitude?: number;
  longitude?: number;
  velocity?: number;
}

interface Trajectory3DStudioProps {
  trajectoryPoints?: TrajectoryPoint[];
  currentTime?: number; // For animating the rocket position
  isPlaying?: boolean;
}

const Trajectory3DStudio: React.FC<Trajectory3DStudioProps> = ({
  trajectoryPoints = [],
  currentTime = 0,
  isPlaying = false
}) => {
  const [currentTelemetry, setCurrentTelemetry] = useState({
    altitude: 0,
    velocity: 0,
    downrange: 0,
    status: 'Below Horizon'
  });

  if (trajectoryPoints.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.noDataText}>3D trajectory visualization not available</Text>
      </View>
    );
  }

  const onContextCreate = async (gl: any) => {
    const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;
    const renderer = new Renderer({ gl });
    renderer.setSize(width, height);
    renderer.setClearColor(0x000814);

    // Scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000814, 0.00025);

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      width / height,
      0.1,
      10000
    );
    camera.position.set(150, 100, 150);
    camera.lookAt(0, 50, 0);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 200, 100);
    scene.add(directionalLight);

    // Ground plane
    const groundGeometry = new THREE.PlaneGeometry(500, 500);
    const groundMaterial = new THREE.MeshBasicMaterial({
      color: 0x1a1a2e,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // Grid helper
    const gridHelper = new THREE.GridHelper(500, 50, 0x4a4a6a, 0x2a2a3a);
    scene.add(gridHelper);

    // Axes helper
    const axesHelper = new THREE.AxesHelper(100);
    scene.add(axesHelper);

    // Trajectory line
    const trajectoryGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(trajectoryPoints.length * 3);

    trajectoryPoints.forEach((point, i) => {
      // Convert to 3D coordinates (simplified)
      // X = downrange, Y = altitude, Z = 0 (simplified 2D in 3D space)
      positions[i * 3] = point.downrange;
      positions[i * 3 + 1] = point.altitude;
      positions[i * 3 + 2] = 0;
    });

    trajectoryGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3)
    );

    const trajectoryMaterial = new THREE.LineBasicMaterial({
      color: 0x00d9ff,
      linewidth: 2
    });

    const trajectoryLine = new THREE.Line(trajectoryGeometry, trajectoryMaterial);
    scene.add(trajectoryLine);

    // Rocket marker
    const rocketGeometry = new THREE.SphereGeometry(2, 16, 16);
    const rocketMaterial = new THREE.MeshPhongMaterial({
      color: 0xff6b6b,
      emissive: 0xff3333,
      emissiveIntensity: 0.5
    });
    const rocket = new THREE.Mesh(rocketGeometry, rocketMaterial);

    // Set initial rocket position
    if (trajectoryPoints.length > 0) {
      const firstPoint = trajectoryPoints[0];
      rocket.position.set(firstPoint.downrange, firstPoint.altitude, 0);
    }

    scene.add(rocket);

    // Launch pad marker
    const launchPadGeometry = new THREE.ConeGeometry(3, 8, 8);
    const launchPadMaterial = new THREE.MeshPhongMaterial({ color: 0x4ecdc4 });
    const launchPad = new THREE.Mesh(launchPadGeometry, launchPadMaterial);
    launchPad.position.set(0, 4, 0);
    scene.add(launchPad);

    // Animation loop
    const render = () => {
      requestAnimationFrame(render);

      // Update rocket position based on currentTime
      const currentPoint = trajectoryPoints.find(p => p.time >= currentTime) || trajectoryPoints[0];
      if (currentPoint) {
        rocket.position.set(currentPoint.downrange, currentPoint.altitude, 0);

        // Update telemetry display
        setCurrentTelemetry({
          altitude: Math.round(currentPoint.altitude),
          velocity: Math.round(currentPoint.velocity || 0),
          downrange: Math.round(currentPoint.downrange),
          status: currentPoint.altitude > 0 ? 'Above Horizon' : 'Below Horizon'
        });
      }

      // Rotate camera around trajectory
      if (isPlaying) {
        const time = Date.now() * 0.0002;
        camera.position.x = Math.cos(time) * 200;
        camera.position.z = Math.sin(time) * 200;
        camera.lookAt(0, 50, 0);
      }

      renderer.render(scene, camera);
      gl.endFrameEXP();
    };

    render();
  };

  const screenWidth = Dimensions.get('window').width;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>3D Trajectory Studio</Text>

      <GLView
        style={[styles.glView, { width: screenWidth - 32, height: 300 }]}
        onContextCreate={onContextCreate}
      />

      {/* Live Telemetry Feed */}
      <View style={styles.telemetryFeed}>
        <Text style={styles.telemetryTitle}>Live Telemetry Feed</Text>

        <View style={styles.telemetryRow}>
          <Text style={styles.telemetryLabel}>Status:</Text>
          <Text
            style={[
              styles.telemetryValue,
              {
                color:
                  currentTelemetry.status === 'Above Horizon'
                    ? colors.success
                    : colors.textSecondary
              }
            ]}
          >
            {currentTelemetry.status}
          </Text>
        </View>

        <View style={styles.telemetryRow}>
          <Text style={styles.telemetryLabel}>Altitude:</Text>
          <Text style={styles.telemetryValue}>{currentTelemetry.altitude} km</Text>
        </View>

        <View style={styles.telemetryRow}>
          <Text style={styles.telemetryLabel}>Velocity:</Text>
          <Text style={styles.telemetryValue}>{currentTelemetry.velocity} m/s</Text>
        </View>

        <View style={styles.telemetryRow}>
          <Text style={styles.telemetryLabel}>Downrange:</Text>
          <Text style={styles.telemetryValue}>{currentTelemetry.downrange} km</Text>
        </View>
      </View>

      <Text style={styles.helpText}>
        💡 Swipe or rotate device to view trajectory from different angles
      </Text>
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
  glView: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#000814',
  },
  telemetryFeed: {
    marginTop: 16,
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  telemetryTitle: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: 8,
  },
  telemetryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  telemetryLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  telemetryValue: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  helpText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
  noDataText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default Trajectory3DStudio;
