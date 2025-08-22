import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export interface QuizQuestion {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option_index: number;
  content_type: 'article' | 'paper' | 'book';
  content_id: number;
  content_title?: string;
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
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [result, setResult] = useState<null | { correct: boolean; correctAnswer: string }>(null);
  const [options, setOptions] = useState<string[]>([]);

  // Randomize options when question changes
  React.useEffect(() => {
    if (question) {
      const questionOptions = [question.option_a, question.option_b, question.option_c, question.option_d];
      const correctAnswer = questionOptions[question.correct_option_index];
      
      // Create array with indices to track original positions
      const optionsWithIndex = questionOptions.map((option, index) => ({ option, originalIndex: index }));
      
      // Shuffle the options
      for (let i = optionsWithIndex.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [optionsWithIndex[i], optionsWithIndex[j]] = [optionsWithIndex[j], optionsWithIndex[i]];
      }
      
      setOptions(optionsWithIndex.map(item => item.option));
      setSelectedOption(null);
      setResult(null);
    }
  }, [question]);

  const handleSubmit = async () => {
    if (!user || !question || selectedOption === null || submitting) return;
    setSubmitting(true);
    
    try {
      // Find the original index of the selected option
      const selectedText = options[selectedOption];
      const originalOptionIndex = [question.option_a, question.option_b, question.option_c, question.option_d].indexOf(selectedText);
      const isCorrect = originalOptionIndex === question.correct_option_index;
      
      // Record the attempt in the database
      const { error } = await supabase
        .from('quiz_attempts')
        .insert({
          user_id: user.id,
          question_id: question.id,
          selected_option_index: originalOptionIndex,
          is_correct: isCorrect
        });

      if (error) {
        console.error('Error recording quiz attempt:', error);
      }

      // XP is automatically awarded by the database trigger when quiz_attempt is inserted
      // The trigger awards 5 XP for correct answers and updates user totals

      const correctAnswer = [question.option_a, question.option_b, question.option_c, question.option_d][question.correct_option_index];
      setResult({ correct: isCorrect, correctAnswer });
      
    } catch (error) {
      console.error('Error submitting quiz:', error);
    } finally {
      setSubmitting(false);
      // Close after delay to show result
      setTimeout(onClose, 2000);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Test Your Knowledge</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          {question?.content_title && (
            <Text style={[styles.contentTitle, { color: colors.textSecondary }]}>
              From: {question.content_title}
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
              <Text style={[styles.resultText, { color: result.correct ? '#10B981' : '#EF4444' }]}>
                {result.correct ? '🎉 +5 XP • Correct!' : '❌ Incorrect'}
              </Text>
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


