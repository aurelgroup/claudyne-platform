/**
 * Écran Mentor - Chat avec l'IA Claudine
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { THEME_CONSTANTS } from '../constants/config';

interface Message {
  id: number;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const initialMessages: Message[] = [
  {
    id: 1,
    text: "Bonjour ! Je suis Meugack, votre mentor IA camerounaise 🇨🇲 Comment puis-je vous aider aujourd'hui ?",
    isUser: false,
    timestamp: new Date(),
  },
];

const quickQuestions = [
  "Aide-moi en mathématiques",
  "Explique-moi les sciences",
  "Prépare-moi pour un examen",
  "Conseils d'étude",
];

export default function MentorScreen() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputText, setInputText] = useState('');

  const sendMessage = () => {
    if (inputText.trim()) {
      const userMessage: Message = {
        id: messages.length + 1,
        text: inputText,
        isUser: true,
        timestamp: new Date(),
      };

      // Simulate AI response
      const aiResponse: Message = {
        id: messages.length + 2,
        text: `Je comprends votre question sur "${inputText}". Laissez-moi vous expliquer cela de manière simple et adaptée au système éducatif camerounais 📚`,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages([...messages, userMessage, aiResponse]);
      setInputText('');
    }
  };

  const sendQuickQuestion = (question: string) => {
    const userMessage: Message = {
      id: messages.length + 1,
      text: question,
      isUser: true,
      timestamp: new Date(),
    };

    let response = '';
    switch (question) {
      case "Aide-moi en mathématiques":
        response = "Les mathématiques sont passionnantes ! 🧮 Que voulez-vous étudier ? Algèbre, géométrie, ou calculs ? Je peux vous expliquer avec des exemples pratiques du quotidien camerounais.";
        break;
      case "Explique-moi les sciences":
        response = "Les sciences nous entourent partout ! 🔬 Physique, chimie, biologie... Quel domaine vous intéresse ? Je peux utiliser des exemples de notre belle nature camerounaise.";
        break;
      case "Prépare-moi pour un examen":
        response = "Excellent ! 📖 Quel examen préparez-vous ? Probatoire, Baccalauréat, ou un test de classe ? Je vais créer un plan d'étude personnalisé pour vous.";
        break;
      case "Conseils d'étude":
        response = "Voici mes conseils pour bien étudier au Cameroun : 📝 1) Planifiez vos sessions d'étude, 2) Créez un environnement calme, 3) Utilisez des exemples locaux, 4) Révisez régulièrement !";
        break;
      default:
        response = "C'est une excellente question ! Laissez-moi y réfléchir et vous donner une réponse détaillée.";
    }

    const aiResponse: Message = {
      id: messages.length + 2,
      text: response,
      isUser: false,
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage, aiResponse]);
  };

  const renderMessage = (message: Message) => (
    <View
      key={message.id}
      style={[
        styles.messageContainer,
        message.isUser ? styles.userMessage : styles.aiMessage
      ]}
    >
      {!message.isUser && (
        <Text style={styles.aiAvatar}>🤖</Text>
      )}
      <View style={[
        styles.messageBubble,
        message.isUser ? styles.userBubble : styles.aiBubble
      ]}>
        <Text style={[
          styles.messageText,
          message.isUser ? styles.userText : styles.aiText
        ]}>
          {message.text}
        </Text>
        <Text style={styles.timestamp}>
          {message.timestamp.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Text>
      </View>
      {message.isUser && (
        <Text style={styles.userAvatar}>👤</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.flag}>🇨🇲</Text>
        <View style={styles.headerInfo}>
          <Text style={styles.title}>Mentor Claudine</Text>
          <Text style={styles.subtitle}>🤖 IA éducative camerounaise</Text>
        </View>
        <View style={styles.statusIndicator}>
          <View style={styles.onlineStatus} />
          <Text style={styles.statusText}>En ligne</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.messagesContainer} showsVerticalScrollIndicator={false}>
          {messages.map(renderMessage)}
        </ScrollView>

        {messages.length === 1 && (
          <View style={styles.quickQuestionsContainer}>
            <Text style={styles.quickQuestionsTitle}>💡 Questions rapides :</Text>
            <View style={styles.quickQuestions}>
              {quickQuestions.map((question, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.quickQuestionButton}
                  onPress={() => sendQuickQuestion(question)}
                >
                  <Text style={styles.quickQuestionText}>{question}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Posez votre question à Claudine..."
            placeholderTextColor={THEME_CONSTANTS.COLORS.TEXT_SECONDARY}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              { opacity: inputText.trim() ? 1 : 0.5 }
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim()}
          >
            <Text style={styles.sendButtonText}>📤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME_CONSTANTS.COLORS.BACKGROUND,
  },
  header: {
    backgroundColor: THEME_CONSTANTS.COLORS.PRIMARY,
    padding: THEME_CONSTANTS.SPACING.LG,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomLeftRadius: THEME_CONSTANTS.RADIUS.LG,
    borderBottomRightRadius: THEME_CONSTANTS.RADIUS.LG,
  },
  flag: {
    fontSize: 32,
    marginRight: THEME_CONSTANTS.SPACING.MD,
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    ...THEME_CONSTANTS.TYPOGRAPHY.H3,
    color: 'white',
  },
  subtitle: {
    ...THEME_CONSTANTS.TYPOGRAPHY.CAPTION,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: THEME_CONSTANTS.SPACING.XS,
  },
  statusIndicator: {
    alignItems: 'center',
  },
  onlineStatus: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME_CONSTANTS.COLORS.SUCCESS,
    marginBottom: THEME_CONSTANTS.SPACING.XS,
  },
  statusText: {
    ...THEME_CONSTANTS.TYPOGRAPHY.SMALL,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    padding: THEME_CONSTANTS.SPACING.MD,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: THEME_CONSTANTS.SPACING.MD,
    alignItems: 'flex-end',
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  aiMessage: {
    justifyContent: 'flex-start',
  },
  aiAvatar: {
    fontSize: 24,
    marginRight: THEME_CONSTANTS.SPACING.SM,
  },
  userAvatar: {
    fontSize: 24,
    marginLeft: THEME_CONSTANTS.SPACING.SM,
  },
  messageBubble: {
    maxWidth: '70%',
    borderRadius: THEME_CONSTANTS.RADIUS.MD,
    padding: THEME_CONSTANTS.SPACING.MD,
  },
  userBubble: {
    backgroundColor: THEME_CONSTANTS.COLORS.PRIMARY,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: THEME_CONSTANTS.COLORS.SURFACE,
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    ...THEME_CONSTANTS.TYPOGRAPHY.BODY,
    lineHeight: 20,
  },
  userText: {
    color: 'white',
  },
  aiText: {
    color: THEME_CONSTANTS.COLORS.TEXT_PRIMARY,
  },
  timestamp: {
    ...THEME_CONSTANTS.TYPOGRAPHY.SMALL,
    marginTop: THEME_CONSTANTS.SPACING.XS,
    opacity: 0.7,
  },
  quickQuestionsContainer: {
    padding: THEME_CONSTANTS.SPACING.LG,
  },
  quickQuestionsTitle: {
    ...THEME_CONSTANTS.TYPOGRAPHY.BODY,
    color: THEME_CONSTANTS.COLORS.TEXT_PRIMARY,
    fontWeight: '600',
    marginBottom: THEME_CONSTANTS.SPACING.MD,
  },
  quickQuestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME_CONSTANTS.SPACING.SM,
  },
  quickQuestionButton: {
    backgroundColor: THEME_CONSTANTS.COLORS.ACCENT,
    paddingHorizontal: THEME_CONSTANTS.SPACING.MD,
    paddingVertical: THEME_CONSTANTS.SPACING.SM,
    borderRadius: THEME_CONSTANTS.RADIUS.MD,
    marginBottom: THEME_CONSTANTS.SPACING.SM,
  },
  quickQuestionText: {
    ...THEME_CONSTANTS.TYPOGRAPHY.CAPTION,
    color: 'white',
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: THEME_CONSTANTS.SPACING.LG,
    backgroundColor: THEME_CONSTANTS.COLORS.SURFACE,
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: THEME_CONSTANTS.COLORS.DIVIDER,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: THEME_CONSTANTS.COLORS.DIVIDER,
    borderRadius: THEME_CONSTANTS.RADIUS.MD,
    padding: THEME_CONSTANTS.SPACING.MD,
    ...THEME_CONSTANTS.TYPOGRAPHY.BODY,
    color: THEME_CONSTANTS.COLORS.TEXT_PRIMARY,
    maxHeight: 100,
    backgroundColor: THEME_CONSTANTS.COLORS.BACKGROUND,
  },
  sendButton: {
    backgroundColor: THEME_CONSTANTS.COLORS.PRIMARY,
    borderRadius: THEME_CONSTANTS.RADIUS.MD,
    padding: THEME_CONSTANTS.SPACING.MD,
    marginLeft: THEME_CONSTANTS.SPACING.SM,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 50,
    minHeight: 50,
  },
  sendButtonText: {
    fontSize: 20,
  },
});