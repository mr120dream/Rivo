import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { openPaywall, type SubscriptionPlan } from '../lib/stripe';

type PaywallSheetProps = {
  visible: boolean;
  onClose: () => void;
};

const FEATURES = [
  'Advanced analytics & weekly trends',
  'Claude AI weekly debrief',
  'Streak freeze protection',
  'Unlimited habits & reminders',
];

const PLANS: {
  id: SubscriptionPlan;
  label: string;
  price: string;
  detail: string;
  badge?: string;
}[] = [
  { id: 'monthly', label: 'Monthly', price: '$4.99', detail: 'per month' },
  { id: 'annual', label: 'Annual', price: '$34.99', detail: 'per year', badge: 'Save 42%' },
  { id: 'lifetime', label: 'Lifetime', price: '$29.99', detail: 'one time' },
];

export function PaywallSheet({ visible, onClose }: PaywallSheetProps) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('annual');
  const [submitting, setSubmitting] = useState(false);

  const handleSubscribe = async () => {
    if (!user) {
      return;
    }

    setSubmitting(true);
    try {
      await openPaywall(selectedPlan, user.id);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close paywall" />

        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 24) }]}>
          <View style={styles.handle} />

          <ScrollView
            contentContainerStyle={styles.container}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.headerRow}>
              <View style={styles.logoWrap}>
                <Ionicons name="sparkles" size={22} color="#14B8A6" />
              </View>
              <Pressable onPress={onClose} hitSlop={12}>
                <Ionicons name="close" size={24} color="#94A3B8" />
              </Pressable>
            </View>

            <Text style={styles.title}>Rivo Pro</Text>
            <Text style={styles.subtitle}>
              Build habits that stick — with insights that help you grow.
            </Text>

            <View style={styles.features}>
              {FEATURES.map((feature) => (
                <View key={feature} style={styles.featureRow}>
                  <Ionicons name="checkmark-circle" size={18} color="#14B8A6" />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.planLabel}>Choose a plan</Text>
            {PLANS.map((plan) => {
              const selected = selectedPlan === plan.id;
              return (
                <Pressable
                  key={plan.id}
                  style={[styles.planCard, selected && styles.planCardSelected]}
                  onPress={() => setSelectedPlan(plan.id)}
                >
                  <View style={styles.planHeader}>
                    <Text style={styles.planName}>{plan.label}</Text>
                    {plan.badge ? (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{plan.badge}</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.planPrice}>
                    {plan.price} <Text style={styles.planDetail}>{plan.detail}</Text>
                  </Text>
                </Pressable>
              );
            })}

            <Pressable
              style={[styles.cta, submitting && styles.ctaDisabled]}
              onPress={() => void handleSubscribe()}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#0d0d0d" />
              ) : (
                <Text style={styles.ctaText}>
                  Continue with {PLANS.find((p) => p.id === selectedPlan)?.label}
                </Text>
              )}
            </Pressable>

            <Pressable style={styles.secondary} onPress={onClose}>
              <Text style={styles.secondaryText}>Not now</Text>
            </Pressable>

            <Text style={styles.legal}>
              Payment processed securely via Stripe. Cancel anytime in your account settings.
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  sheet: {
    backgroundColor: '#0d0d0d',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#334155',
    marginTop: 10,
    marginBottom: 8,
  },
  container: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: '#94A3B8',
    marginBottom: 24,
  },
  features: {
    marginBottom: 28,
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    color: '#E2E8F0',
    fontSize: 15,
  },
  planLabel: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  planCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#262626',
  },
  planCardSelected: {
    borderColor: '#14B8A6',
    backgroundColor: '#122020',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  planName: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  badge: {
    backgroundColor: '#14B8A6',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    color: '#0d0d0d',
    fontSize: 11,
    fontWeight: '700',
  },
  planPrice: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  planDetail: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94A3B8',
  },
  cta: {
    backgroundColor: '#14B8A6',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  ctaDisabled: {
    opacity: 0.7,
  },
  ctaText: {
    color: '#0d0d0d',
    fontSize: 16,
    fontWeight: '700',
  },
  secondary: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryText: {
    color: '#64748B',
    fontSize: 15,
    fontWeight: '600',
  },
  legal: {
    color: '#475569',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 8,
  },
});
