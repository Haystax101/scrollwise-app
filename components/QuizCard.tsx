import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { QuizQuestion } from '../types';

interface QuizCardProps {
  visible: boolean;
  onClose: () => void;
  question: QuizQuestion | null;
  onAnswer?: (answerIndex: number) => void;
}

export const QuizCard: React.FC<QuizCardProps> = ({ visible, onClose, question, onAnswer }) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [result, setResult] = useState<null | { correct: boolean; correctAnswer: string }>(null);
  const [options, setOptions] = useState<string[]>([]);

  // Setup options when question changes (no shuffling to maintain correctAnswer index)
  React.useEffect(() => {
    if (question && question.options) {
      setOptions(question.options);
      setSelectedOption(null);
      setResult(null);
    }
  }, [question]);

  const handleSubmit = async () => {
    if (!user || !question || selectedOption === null || submitting) return;
    setSubmitting(true);
    
    try {
      // Double-check user is still available (race condition protection)
      if (!user || !user.id) {
        console.error('Error recording quiz attempt: user not available');
        setSubmitting(false);
        return;
      }

      const isCorrect = selectedOption === question.correctAnswer;
      const correctAnswerText = question.options[question.correctAnswer];

      // Call the onAnswer callback if provided (for integration with QuizSessionManager)
      // The QuizSessionManager will handle database insertion to avoid duplicates
      if (onAnswer) {
        onAnswer(selectedOption);
      }

      // XP is automatically awarded by the database trigger when quiz_attempt is inserted
      // The trigger awards 5 XP for correct answers and updates user totals

      setResult({ correct: isCorrect, correctAnswer: correctAnswerText });
      
    } catch (error) {
      console.error('Error submitting quiz:', error);
    } finally {
      setSubmitting(false);
      // Quiz now stays open until user manually closes it
    }
  };

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Test Your Knowledge</Text>
            {result && (
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            )}
          </View>
          {question?.sourceTitle && (
            <Text style={[styles.contentTitle, { color: colors.textSecondary }]}>
              From: {question.sourceTitle}
            </Text>
          )}
          <Text style={[styles.question, { color: colors.text }]}>{question?.question}</Text>
          
          <View style={{ marginTop: 16 }}>
            {options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.option,
                  { 
                    borderColor: selectedOption === index ? colors.primary : colors.border,
                    backgroundColor: result && selectedOption === index 
                      ? (result.correct ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)')
                      : colors.surface,
                    marginBottom: 8
                  },
                ]}
                onPress={() => setSelectedOption(index)}
                disabled={submitting || result !== null}
                accessibilityLabel={`Option ${String.fromCharCode(65 + index)}: ${option}`}
              >
                <Text style={[styles.optionLabel, { color: colors.textSecondary }]}>
                  {String.fromCharCode(65 + index)}.
                </Text>
                <Text style={[styles.optionText, { color: colors.text }]}>{option}</Text>
                {result && option === result.correctAnswer && (
                  <Text style={[styles.correctIndicator, { color: '#10B981' }]}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {!result ? (
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={selectedOption === null || submitting}
              style={[styles.submitBtn, { 
                backgroundColor: (selectedOption === null || submitting) ? colors.border : colors.primary 
              }]}
            >
              <Text style={{ color: colors.primaryText }}>
                {submitting ? 'Submitting...' : 'Submit Answer'}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.resultContainer}>
              <View style={[styles.resultTextContainer, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }]}>
                {result.correct && (
                  <Feather name="zap" size={18} color="#EAB308" style={{ marginRight: 8 }} />
                )}
                <Text style={[styles.resultText, { color: result.correct ? '#10B981' : '#EF4444' }]}>
                  {result.correct ? '+5 voltz • Correct!' : '❌ Incorrect'}
                </Text>
              </View>
              {!result.correct && (
                <Text style={[styles.correctAnswerText, { color: colors.textSecondary }]}>
                  Correct answer: {result.correctAnswer}
                </Text>
              )}
            </View>
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
    width: '92%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  closeButton: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  contentTitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  question: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'left',
    marginBottom: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 12,
    minWidth: 24,
  },
  optionText: {
    fontSize: 16,
    flex: 1,
    lineHeight: 22,
  },
  correctIndicator: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  submitBtn: {
    marginTop: 20,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
  },
  resultContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  resultText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  correctAnswerText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
});

export default QuizCard;


