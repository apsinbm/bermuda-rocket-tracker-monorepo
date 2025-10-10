import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { colors, typography } from '../theme';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary Component
 *
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing the app.
 *
 * Usage:
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error details for debugging
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Error info:', errorInfo);

    // Update state with error details
    this.setState({
      error,
      errorInfo,
    });

    // Call optional error handler prop
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI provided by parent
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <View style={styles.container}>
          <View style={styles.errorCard}>
            <Text style={styles.icon}>⚠️</Text>
            <Text style={styles.title}>Oops! Something went wrong</Text>
            <Text style={styles.message}>
              We encountered an unexpected error. Don't worry, your data is safe.
            </Text>

            {__DEV__ && this.state.error && (
              <ScrollView style={styles.debugContainer}>
                <Text style={styles.debugTitle}>Error Details (Dev Mode):</Text>
                <Text style={styles.debugText}>{this.state.error.toString()}</Text>
                {this.state.errorInfo && (
                  <Text style={styles.debugText}>{this.state.errorInfo.componentStack}</Text>
                )}
              </ScrollView>
            )}

            <TouchableOpacity style={styles.button} onPress={this.handleReset}>
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    maxWidth: 400,
    width: '100%',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.error,
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    ...typography.title,
    color: colors.textPrimary,
    fontSize: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  debugContainer: {
    width: '100%',
    maxHeight: 200,
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  debugTitle: {
    ...typography.bodySmall,
    color: colors.error,
    fontWeight: '600',
    marginBottom: 8,
  },
  debugText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontFamily: 'Courier',
    fontSize: 10,
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
  },
  buttonText: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default ErrorBoundary;
