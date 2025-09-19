import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function PrivacyPolicy() {
  const router = useRouter();
  const { colors } = useTheme();
  const { fromSettings } = useLocalSearchParams();

  const handleBack = () => {
    if (fromSettings === 'true') {
      // Navigate back to profile and programmatically open settings
      router.replace('/profile?openSettings=true');
    } else {
      router.back();
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      padding: 8,
      marginRight: 8,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
      paddingVertical: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 16,
    },
    effectiveDate: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginTop: 24,
      marginBottom: 12,
    },
    subsectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    paragraph: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.text,
      marginBottom: 12,
    },
    listItem: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.text,
      marginBottom: 6,
      marginLeft: 16,
    },
    contactInfo: {
      backgroundColor: colors.card,
      padding: 16,
      borderRadius: 12,
      marginTop: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    contactTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    contactText: {
      fontSize: 14,
      color: colors.text,
      marginBottom: 4,
    },
    table: {
      backgroundColor: colors.card,
      borderRadius: 8,
      marginTop: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tableHeader: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tableRow: {
      flexDirection: 'row',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tableCell: {
      flex: 1,
      fontSize: 12,
      color: colors.text,
    },
    tableCellHeader: {
      flex: 1,
      fontSize: 12,
      fontWeight: '600',
      color: colors.text,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Feather name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Supercharged Privacy Policy</Text>

        <Text style={styles.effectiveDate}>
          Effective: September 18, 2025{'\n'}
          Last Updated: September 18, 2025
        </Text>

        <Text style={styles.sectionTitle}>Your Privacy Matters</Text>
        <Text style={styles.paragraph}>
          Supercharged's mission is to transform how professionals learn and connect by making industry knowledge accessible and actionable. Central to this mission is our commitment to be transparent about the data we collect about you, how it is used, and with whom it is shared.
        </Text>

        <Text style={styles.paragraph}>
          This Privacy Policy applies when you use our Services. We offer our users choices about the data we collect, use, and share as described in this Privacy Policy, Settings, and our Help Center.
        </Text>

        <Text style={styles.sectionTitle}>Introduction</Text>
        <Text style={styles.paragraph}>
          We are a social learning network and platform for professionals. People use our Services to discover industry insights, share knowledge, connect with like-minded professionals, and advance their careers.
        </Text>

        <Text style={styles.paragraph}>
          Our registered users ("Members") share their professional identities, publish insights, engage with their network, exchange knowledge, track their learning progress, and find collaboration opportunities.
        </Text>

        <Text style={styles.sectionTitle}>Services</Text>
        <Text style={styles.paragraph}>
          This Privacy Policy applies to Supercharged mobile applications, websites, communications, and other related services offered by BCGH Limited ("Services").
        </Text>

        <Text style={styles.sectionTitle}>Data Controller</Text>
        <Text style={styles.paragraph}>
          BCGH Limited will be the controller of your personal data provided to, or collected by or for, or processed in connection with our Services.
        </Text>

        <Text style={styles.sectionTitle}>1. Data We Collect</Text>

        <Text style={styles.subsectionTitle}>1.1 Data You Provide To Us</Text>

        <Text style={styles.subsectionTitle}>Registration</Text>
        <Text style={styles.paragraph}>
          To create an account you need to provide data including your name, email address, and a password. If you register for premium Services, you will need to provide payment and billing information.
        </Text>

        <Text style={styles.subsectionTitle}>Profile</Text>
        <Text style={styles.paragraph}>
          You have choices about the information on your profile, such as your current position, education, work experience, skills, projects, published insights, professional interests, industry focus, and career goals.
        </Text>

        <Text style={styles.subsectionTitle}>Projects and Work</Text>
        <Text style={styles.paragraph}>
          We collect detailed information about projects you're working on, including project descriptions, objectives, outcomes, challenges faced, lessons learned, and related links or documentation.
        </Text>

        <Text style={styles.subsectionTitle}>Learning and Development</Text>
        <Text style={styles.paragraph}>
          We track your learning activities, including articles read, time spent on content, quiz responses, knowledge retention scores, and Voltz points earned.
        </Text>

        <Text style={styles.sectionTitle}>2. How We Use Your Data</Text>

        <Text style={styles.subsectionTitle}>Stay Connected</Text>
        <Text style={styles.paragraph}>
          Our Services allow you to stay connected with professionals in your industry and build meaningful relationships based on shared interests and expertise.
        </Text>

        <Text style={styles.subsectionTitle}>Stay Informed</Text>
        <Text style={styles.paragraph}>
          We use your data to deliver personalized industry insights and help you stay current with developments in your field.
        </Text>

        <Text style={styles.subsectionTitle}>Professional Development</Text>
        <Text style={styles.paragraph}>
          Our Services help you track and showcase your professional growth through monitoring your learning progress and knowledge retention.
        </Text>

        <Text style={styles.sectionTitle}>3. How We Share Information</Text>

        <Text style={styles.subsectionTitle}>Our Services</Text>
        <Text style={styles.paragraph}>
          Your profile is fully visible to all Members of our Services, including your name, headline, professional summary, projects, published insights and content, skills, interests, and career goals.
        </Text>

        <Text style={styles.subsectionTitle}>Service Providers</Text>
        <Text style={styles.paragraph}>
          We share data with carefully selected third parties who help us provide our Services, including Supabase (database, authentication, and storage), PostHog (product analytics), and communication service providers.
        </Text>

        <Text style={styles.sectionTitle}>4. Your Choices & Obligations</Text>

        <Text style={styles.subsectionTitle}>Data Retention</Text>
        <Text style={styles.paragraph}>
          We retain your personal data as long as you keep your account open or as needed to provide you Services, including profile information, content you've created, learning progress, and Voltz points.
        </Text>

        <Text style={styles.subsectionTitle}>Rights to Access and Control Your Personal Data</Text>
        <Text style={styles.paragraph}>
          You can delete data, change or correct data, object to use, restrict processing, access your data, and request data portability. Contact us at hello@learningsupercharged.com to exercise these rights.
        </Text>

        <Text style={styles.sectionTitle}>5. Data Storage and Security</Text>
        <Text style={styles.paragraph}>
          We implement security safeguards including HTTPS encryption, encryption at rest, access controls, and regular security monitoring. Your data is stored in Supabase's PostgreSQL databases with primary data centers located in the EU.
        </Text>

        <View style={styles.contactInfo}>
          <Text style={styles.contactTitle}>Contact Information</Text>
          <Text style={styles.contactText}>Email: hello@learningsupercharged.com</Text>
          <Text style={styles.contactText}>Website: www.learningsupercharged.com</Text>
          <Text style={styles.contactText}>Developer: BCGH Limited</Text>
        </View>

        <Text style={styles.paragraph}>
          For questions, concerns, or requests regarding this Privacy Policy, contact us at hello@learningsupercharged.com. For data protection specific inquiries, contact us with "Data Protection" in the subject line.
        </Text>

        <Text style={styles.paragraph}>
          We aim to respond to all inquiries within 30 days. If you're not satisfied with our response, you have the right to lodge a complaint with your local data protection authority.
        </Text>

        <Text style={styles.sectionTitle}>Additional Information</Text>
        <Text style={styles.paragraph}>
          Our Services may contain links to third-party websites. We're not responsible for their privacy practices. We implement appropriate technical and organizational measures to ensure a level of security appropriate to the risk.
        </Text>

        <Text style={styles.paragraph}>
          We incorporate privacy considerations into our development process for new features and services.
        </Text>

        <Text style={styles.effectiveDate}>
          © 2025 BCGH Limited. All rights reserved.
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}