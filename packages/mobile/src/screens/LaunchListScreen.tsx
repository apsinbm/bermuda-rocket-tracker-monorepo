import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useLaunchData } from '../hooks/useLaunchData';
import { Launch } from '@bermuda/shared';
import LaunchCard from '../components/LaunchCard';
import { colors } from '../theme';
import { typography } from '../theme';

type NavigationProp = StackNavigationProp<RootStackParamList, 'MainTabs'>;

const LaunchListScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { launches, loading, error, refetch } = useLaunchData();

  const handleLaunchPress = (launch: Launch) => {
    navigation.navigate('LaunchDetail', { launch });
  };

  const renderLaunchCard = ({ item }: { item: Launch }) => (
    <LaunchCard launch={item} onPress={() => handleLaunchPress(item)} />
  );

  if (loading && launches.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading launches...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && launches.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorEmoji}>🚫</Text>
          <Text style={styles.errorText}>Failed to load launches</Text>
          <Text style={styles.errorMessage}>{error.message}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (launches.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.emptyEmoji}>🔭</Text>
          <Text style={styles.emptyText}>No upcoming launches</Text>
          <Text style={styles.emptySubtext}>Pull down to refresh</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={launches}
        renderItem={renderLaunchCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refetch}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingVertical: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    ...typography.bodyLarge,
    color: colors.textSecondary,
    marginTop: 16,
  },
  errorEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorText: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  errorMessage: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  emptySubtext: {
    ...typography.body,
    color: colors.textSecondary,
  },
});

export default LaunchListScreen;
