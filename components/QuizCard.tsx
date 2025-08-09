import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export interface QuizQuestion {
  id: string;
  question: string;
}

interface QuizCardProps {
  visible: boolean;
  onClose: () => void;
  question: QuizQuestion | null;
}

export const QuizCard: React.FC<QuizCardProps> = ({ visible, onClose, question }) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState<boolean | null>(null);
  const [result, setResult] = useState<null | { correct: boolean }>(null);

  const handleSubmit = async () => {
    if (!user || !question || !selected || submitting) return;
    setSubmitting(true);
    try {
      // Server validates correctness and enforces one attempt; also grants XP via trigger
      const { data, error } = await supabase.rpc('submit_quiz_attempt', {
        p_user_id: user.id,
        p_question_id: question.id,
        p_selected: selected,
      });
      if (!error) {
        setResult({ correct: !!(data && (data as any).is_correct) });
      }
    } finally {
      setSubmitting(false);
      // Close after brief delay to show result
      setTimeout(onClose, 900);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={[styles.title, { color: colors.text }]}>Quick Quiz</Text>
          <Text style={[styles.question, { color: colors.text }]}>{question?.question}</Text>
          <View style={{ marginTop: 12, flexDirection: 'row', justifyContent: 'space-between' }}>
            <TouchableOpacity
              style={[
                styles.option,
                { borderColor: colors.border, flex: 1, marginRight: 6 },
                selected === true && { borderColor: colors.primary },
              ]}
              onPress={() => setSelected(true)}
              disabled={submitting}
              accessibilityLabel="Answer True"
            >
              <Text style={{ color: colors.text, textAlign: 'center' }}>True</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.option,
                { borderColor: colors.border, flex: 1, marginLeft: 6 },
                selected === false && { borderColor: colors.primary },
              ]}
              onPress={() => setSelected(false)}
              disabled={submitting}
              accessibilityLabel="Answer False"
            >
              <Text style={{ color: colors.text, textAlign: 'center' }}>False</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!selected || submitting}
            style={[styles.submitBtn, { backgroundColor: (!selected || submitting) ? colors.border : colors.primary }]}
          >
            <Text style={{ color: colors.primaryText }}>{submitting ? 'Submitting...' : 'Submit'}</Text>
          </TouchableOpacity>
          {result && (
            <Text style={{ marginTop: 8, color: result.correct ? '#10B981' : '#EF4444' }}>
              {result.correct ? '+10 XP • Correct!' : 'Incorrect'}
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '88%',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  question: {
    fontSize: 16,
    textAlign: 'center',
  },
  option: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  submitBtn: {
    marginTop: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
});

export default QuizCard;


