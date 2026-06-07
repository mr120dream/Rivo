import { router } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';
import { HabitDayView } from '../../components/HabitDayView';
import { colors } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useHabits } from '../../contexts/HabitsContext';

export default function TodayScreen() {
  const { user, signOut } = useAuth();
  const {
    allHabits,
    todayHabits,
    toggleHabit,
    deleteHabit,
    completedCount,
    progress,
    loading,
    error,
    retry,
  } = useHabits();

  const handleEdit = (habit: { id: string }) => {
    router.push({ pathname: '/(tabs)/add-habit', params: { editId: habit.id } });
  };

  const emptyTitle = allHabits.length === 0 ? 'No habits yet' : 'Nothing scheduled today';
  const emptyBody =
    allHabits.length === 0
      ? 'Add your first habit to get started.'
      : 'None of your habits are scheduled for today.';

  return (
    <HabitDayView
      title="Today"
      date={new Date()}
      habits={todayHabits}
      loading={loading}
      error={error}
      onRetry={retry}
      onToggle={toggleHabit}
      onEdit={handleEdit}
      onDelete={deleteHabit}
      completedCount={completedCount}
      progress={progress}
      emptyTitle={emptyTitle}
      emptyBody={emptyBody}
      showAddButton={allHabits.length === 0}
      headerExtra={
        user?.email ? (
          <Pressable onPress={() => void signOut()} style={styles.signOutRow}>
            <Text style={styles.email}>{user.email}</Text>
            <Text style={styles.signOut}>Sign out</Text>
          </Pressable>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  signOutRow: {
    marginTop: 4,
  },
  email: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  signOut: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
