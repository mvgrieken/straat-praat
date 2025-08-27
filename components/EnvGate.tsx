import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

interface EnvGateProps {
  children: React.ReactNode;
}

interface EnvGateState {
  hasError: boolean;
  error: Error | null;
}

export class EnvGate extends React.Component<EnvGateProps, EnvGateState> {
  constructor(props: EnvGateProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): EnvGateState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('EnvGate caught an error:', error, errorInfo);
  }

  override render() {
    if (this.state.hasError && this.state.error) {
      return (
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>Configuration Error</Text>
              <Text style={styles.subtitle}>
                The app is missing required environment variables
              </Text>
            </View>

            <View style={styles.errorBox}>
              <Text style={styles.errorTitle}>Error Details:</Text>
              <Text style={styles.errorMessage}>
                {this.state.error.message}
              </Text>
            </View>

            <View style={styles.instructions}>
              <Text style={styles.instructionsTitle}>For Developers:</Text>
              <Text style={styles.instructionsText}>
                1. Create a `.env.local` file in the project root{'\n'}
                2. Add the required environment variables{'\n'}
                3. Restart the development server{'\n\n'}
                For Netlify deployment:{'\n'}
                4. Set environment variables in Netlify dashboard{'\n'}
                5. Redeploy the site
              </Text>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Check the README.md for setup instructions
              </Text>
            </View>
          </ScrollView>
        </View>
      );
    }

    return <>{this.props.children}</>;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fef2f2',
  },
  content: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#7f1d1d',
    textAlign: 'center',
    lineHeight: 24,
  },
  errorBox: {
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#991b1b',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#7f1d1d',
    fontFamily: 'monospace',
    lineHeight: 20,
  },
  instructions: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});
